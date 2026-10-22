import { createHmac, randomUUID } from "node:crypto";
import { prisma } from "db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./app.router";
import { createContext } from "./trpc";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";
const describeWithDb = runDatabaseTests ? describe : describe.skip;

describeWithDb("QR chain and staff check-in (database)", () => {
	const suffix = randomUUID().slice(0, 8);
	let ownerId = "";
	let staffId = "";
	let attendeeIds: string[] = [];
	let organizerId = "";
	let eventId = "";
	let foreignEventId = "";
	let slug = "";
	let foreignSlug = "";
	let ticketId = "";
	let ticketCodes: string[] = [];

	const owner = () => appRouter.createCaller(createContext(ownerId, null));
	const staff = () => appRouter.createCaller(createContext(staffId, null));
	const attendee = (userId: string) =>
		appRouter.createCaller(createContext(userId, null));
	const claimCode = async (
		userId: string,
		eventSlug: string,
		token: string,
	) => {
		const result = await attendee(userId).checkinChain.claim({
			slug: eventSlug,
			token,
		});
		return result.ok ? null : result.code;
	};

	beforeAll(async () => {
		if (!runDatabaseTests) return;

		const ownerUser = await prisma.user.create({
			data: { email: `chain-owner-${suffix}@example.com`, name: "Owner" },
		});
		ownerId = ownerUser.id;
		const staffUser = await prisma.user.create({
			data: { email: `chain-staff-${suffix}@example.com`, name: "Staff" },
		});
		staffId = staffUser.id;
		attendeeIds = [];
		for (let i = 0; i < 3; i++) {
			const user = await prisma.user.create({
				data: {
					email: `chain-attendee-${i}-${suffix}@example.com`,
					name: `Attendee ${i}`,
				},
			});
			attendeeIds.push(user.id);
		}
		const organizer = await prisma.organizer.create({
			data: {
				type: "community",
				name: `Chain Org ${suffix}`,
				slug: `chain-org-${suffix}`,
				ownerId,
			},
		});
		organizerId = organizer.id;
		const start = new Date(Date.now() + 7 * 24 * 3600 * 1000);
		const end = new Date(start.getTime() + 3 * 3600 * 1000);
		slug = `chain-${suffix}`;
		foreignSlug = `chain-other-${suffix}`;
		const event = await prisma.event.create({
			data: {
				title: "Chain Event",
				slug,
				status: "published",
				eventStart: start,
				eventEnd: end,
				organizerId,
				volunteers: {
					create: {
						userId: staffId,
						name: "Staff",
						email: `chain-staff-${suffix}@example.com`,
						role: "Registration Desk",
					},
				},
			},
		});
		eventId = event.id;
		const foreign = await prisma.event.create({
			data: {
				title: "Foreign Event",
				slug: foreignSlug,
				status: "published",
				eventStart: start,
				eventEnd: end,
				organizerId,
			},
		});
		foreignEventId = foreign.id;
		const ticket = await prisma.ticket.create({
			data: { eventId, name: "General", price: 0 },
		});
		ticketId = ticket.id;
	});

	beforeEach(async () => {
		await prisma.checkinChainSession.deleteMany({
			where: { eventId: { in: [eventId, foreignEventId] } },
		});
		await prisma.issuedTicket.deleteMany({
			where: { eventId: { in: [eventId, foreignEventId] } },
		});
		ticketCodes = [];
		for (let i = 0; i < attendeeIds.length; i++) {
			const code = `CHAIN-${suffix}-${i}`;
			ticketCodes.push(code);
			await prisma.issuedTicket.create({
				data: {
					eventId,
					ticketId,
					userId: attendeeIds[i],
					ticketCode: code,
					qrToken: `chain-token-${suffix}-${i}`,
					attendeeName: `Attendee ${i}`,
					attendeeEmail: `chain-attendee-${i}-${suffix}@example.com`,
				},
			});
		}
	});

	afterAll(async () => {
		if (!runDatabaseTests) return;

		const eventIds = [eventId, foreignEventId].filter(Boolean);
		if (eventIds.length > 0) {
			await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
		}
		if (organizerId) {
			await prisma.organizer.deleteMany({ where: { id: organizerId } });
		}
		const userIds = [ownerId, staffId, ...attendeeIds].filter(Boolean);
		if (userIds.length > 0) {
			await prisma.user.deleteMany({ where: { id: { in: userIds } } });
		}
		await prisma.$disconnect();
	});

	it("lets assigned staff scan tickets but rejects access to another event", async () => {
		await expect(
			staff().checkinChain.staffAccess({ slug }),
		).resolves.toMatchObject({
			title: "Chain Event",
		});
		const result = await staff().events.ticketVerifyCheckIn({
			slug,
			codeOrToken: ticketCodes[0],
		});
		expect(result.valid).toBe(true);
		await expect(
			attendee(attendeeIds[1]).events.ticketVerifyCheckIn({
				slug: foreignSlug,
				codeOrToken: ticketCodes[0],
			}),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("updates the ordered chain and analytics, and rejects invalid or replayed tokens", async () => {
		await owner().checkinChain.start({ slug });
		const initial = await owner().checkinChain.status({ slug });
		if (!initial.active || !initial.rootToken)
			throw new Error("Chain did not start");
		const session = await prisma.checkinChainSession.findUniqueOrThrow({
			where: { id: initial.sessionId },
		});
		const expired = Math.floor(Date.now() / 1000) - 1;
		const signature = createHmac("sha256", session.secret)
			.update(`${session.id}.expired-node.${expired}`)
			.digest("base64url");
		const expiredToken = `qrc1.${session.id}.expired-node.${expired}.${signature}`;

		expect(await claimCode(attendeeIds[0], slug, "bad")).toBe("INVALID");
		expect(
			await claimCode(attendeeIds[0], foreignSlug, initial.rootToken),
		).toBe("WRONG_EVENT");
		expect(await claimCode(attendeeIds[0], slug, expiredToken)).toBe("EXPIRED");

		expect(
			(
				await attendee(attendeeIds[0]).checkinChain.claim({
					slug,
					token: initial.rootToken,
				})
			).ok,
		).toBe(true);
		expect(await claimCode(attendeeIds[1], slug, initial.rootToken)).toBe(
			"ALREADY_USED",
		);
		const firstQr = await attendee(attendeeIds[0]).checkinChain.myQr({ slug });
		if (firstQr.state !== "ready") throw new Error("First attendee has no QR");
		expect(
			(
				await attendee(attendeeIds[1]).checkinChain.claim({
					slug,
					token: firstQr.token,
				})
			).ok,
		).toBe(true);

		const current = await owner().checkinChain.status({ slug });
		if (!current.active) throw new Error("Chain ended unexpectedly");
		expect(current.chain.map((node) => node.position)).toEqual([0, 1, 2]);
		expect(current.chain.map((node) => node.name)).toEqual([
			null,
			"Attendee 0",
			"Attendee 1",
		]);
		expect(current.checkedInCount).toBe(2);
		expect(current.eligibleAttendeeCount).toBe(3);
		expect(current.participationPercent).toBeCloseTo(66.67, 1);
		expect(current.checkinsOverTime).toHaveLength(2);
		expect(current.latestCheckin).not.toBeNull();

		await staff().events.ticketVerifyCheckIn({
			slug,
			codeOrToken: ticketCodes[2],
		});
		const thirdQr = await attendee(attendeeIds[1]).checkinChain.myQr({ slug });
		if (thirdQr.state !== "ready")
			throw new Error("Current chain end has no QR");
		expect(await claimCode(attendeeIds[2], slug, thirdQr.token)).toBe(
			"ALREADY_CHECKED_IN",
		);
	});
});
