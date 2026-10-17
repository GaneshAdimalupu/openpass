/**
 * Integration tests for ticket capacity, RSVP capacity and public registration
 * limits. They run against a real Postgres database, so they are skipped unless
 * RUN_DB_TESTS=1 and DATABASE_URL points at a disposable database that already
 * has the schema applied. Every row the tests create is removed afterwards.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./app.router";
import { createContext } from "./trpc";

const describeWithDb =
	process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

const BASE_TIER = {
	name: "General Pass",
	price: 0,
	maxPerOrder: 1,
	isPublished: true,
	allowWaitlist: true,
	allowTransfer: true,
	allowDrop: true,
	order: 0,
} as const;

describeWithDb("events capacity (database)", () => {
	const suffix = randomUUID().slice(0, 8);
	let ownerId: string;
	let organizerId: string;
	let slug: string;
	let otherSlug: string;
	let eventId: string;
	let otherEventId: string;

	const organizer = () => appRouter.createCaller(createContext(ownerId, null));
	const visitor = () => appRouter.createCaller(createContext(null, null));

	const getTiers = async () =>
		(await visitor().events.ticketsGet({ slug })).tiers;
	const book = (tierId: string, n: number) =>
		visitor().events.ticketBook({
			slug,
			tierId,
			attendeeName: `Attendee ${n}`,
			attendeeEmail: `attendee-${n}-${suffix}@example.com`,
		});

	beforeAll(async () => {
		const owner = await prisma.user.create({
			data: { email: `owner-${suffix}@example.com`, name: "Owner" },
		});
		ownerId = owner.id;
		const org = await prisma.organizer.create({
			data: {
				type: "community",
				name: `Org ${suffix}`,
				slug: `org-${suffix}`,
				ownerId,
			},
		});
		organizerId = org.id;

		const start = new Date(Date.now() + 7 * 24 * 3600 * 1000);
		const end = new Date(start.getTime() + 3 * 3600 * 1000);
		slug = `capacity-${suffix}`;
		otherSlug = `capacity-other-${suffix}`;
		const event = await prisma.event.create({
			data: {
				title: "Capacity test",
				slug,
				status: "published",
				eventStart: start,
				eventEnd: end,
				capacity: 300,
				organizerId,
			},
		});
		eventId = event.id;
		const other = await prisma.event.create({
			data: {
				title: "Other event",
				slug: otherSlug,
				status: "published",
				eventStart: start,
				eventEnd: end,
				capacity: 300,
				organizerId,
			},
		});
		otherEventId = other.id;
	});

	afterAll(async () => {
		await prisma.event.deleteMany({
			where: { id: { in: [eventId, otherEventId] } },
		});
		await prisma.organizer.deleteMany({ where: { id: organizerId } });
		await prisma.user.deleteMany({ where: { id: ownerId } });
		await prisma.$disconnect();
	});

	beforeEach(async () => {
		await prisma.ticket.deleteMany({
			where: { eventId: { in: [eventId, otherEventId] } },
		});
	});

	it("persists a ticket capacity different from 300 and returns it on reload", async () => {
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, quantity: 100 }],
		});

		const [tier] = await getTiers();
		expect(tier.quantity).toBe(100);
		const row = await prisma.ticket.findUniqueOrThrow({
			where: { id: tier.id },
		});
		expect(row.quantity).toBe(100);

		// Reopen the editor (reload), change 100 -> 250, save again.
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, id: tier.id, quantity: 250 }],
		});
		const tiers = await getTiers();
		expect(tiers).toHaveLength(1);
		expect(tiers[0].id).toBe(tier.id);
		expect(tiers[0].quantity).toBe(250);
	});

	it("keeps unlimited capacity as null across saves", async () => {
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, quantity: null }],
		});
		const [tier] = await getTiers();
		expect(tier.quantity).toBeNull();

		// Save the tier exactly as the page would send it back after loading it.
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, id: tier.id, quantity: tier.quantity }],
		});
		const [after] = await getTiers();
		expect(after.quantity).toBeNull();
		expect(after.isSoldOut).toBe(false);
	});

	it("enforces the saved ticket capacity on public registration", async () => {
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, quantity: 2 }],
		});
		const [tier] = await getTiers();

		expect((await book(tier.id, 1)).status).toBe("CONFIRMED");
		expect((await book(tier.id, 2)).status).toBe("CONFIRMED");
		expect((await book(tier.id, 3)).status).toBe("WAITLISTED");

		// Raising the capacity from 2 to 3 lets the next attendee in.
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, id: tier.id, quantity: 3 }],
		});
		expect((await book(tier.id, 4)).status).toBe("CONFIRMED");
		expect((await book(tier.id, 5)).status).toBe("WAITLISTED");

		const [after] = await getTiers();
		expect(after.confirmedCount).toBe(3);
		expect(after.isSoldOut).toBe(true);
	});

	it("rejects registration at capacity when the waitlist is disabled", async () => {
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, quantity: 1, allowWaitlist: false }],
		});
		const [tier] = await getTiers();
		await book(tier.id, 1);
		await expect(book(tier.id, 2)).rejects.toMatchObject({
			code: "BAD_REQUEST",
		});
	});

	it("does not limit registration for an unlimited pass", async () => {
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, quantity: null }],
		});
		const [tier] = await getTiers();
		for (let n = 1; n <= 4; n++) {
			expect((await book(tier.id, n)).status).toBe("CONFIRMED");
		}
	});

	it("keeps event capacity separate from ticket quantity", async () => {
		await organizer().events.ticketsManageTiers({
			slug,
			tiers: [{ ...BASE_TIER, quantity: 100 }],
		});
		const result = await visitor().events.ticketsGet({ slug });
		expect(result.stats.eventCapacity).toBe(300);
		expect(result.tiers[0].quantity).toBe(100);
	});

	it("refuses to update a tier that belongs to another event", async () => {
		const foreign = await prisma.ticket.create({
			data: { eventId: otherEventId, name: "Foreign", price: 0, quantity: 50 },
		});

		await expect(
			organizer().events.ticketsManageTiers({
				slug,
				tiers: [{ ...BASE_TIER, id: foreign.id, quantity: 1 }],
			}),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		const unchanged = await prisma.ticket.findUniqueOrThrow({
			where: { id: foreign.id },
		});
		expect(unchanged.quantity).toBe(50);
		expect(unchanged.eventId).toBe(otherEventId);
		expect(await prisma.ticket.count({ where: { eventId } })).toBe(0);
	});

	it("validates ticket quantity input", async () => {
		await expect(
			organizer().events.ticketsManageTiers({
				slug,
				tiers: [{ ...BASE_TIER, quantity: 0 }],
			}),
		).rejects.toBeDefined();
		await expect(
			organizer().events.ticketsManageTiers({
				slug,
				tiers: [{ ...BASE_TIER, quantity: 1.5 }],
			}),
		).rejects.toBeDefined();
	});

	it("persists and returns an RSVP capacity different from 300", async () => {
		const form = {
			slug,
			isPublished: true,
			allowEdit: false,
			requiresApproval: false,
			description: null,
			customQuestions: [],
		};

		await organizer().events.rsvpUpdateForm({ ...form, maxRsvpCount: 100 });
		expect((await organizer().events.rsvpGetForm({ slug })).maxRsvpCount).toBe(
			100,
		);

		await organizer().events.rsvpUpdateForm({ ...form, maxRsvpCount: 250 });
		expect((await organizer().events.rsvpGetForm({ slug })).maxRsvpCount).toBe(
			250,
		);
		const row = await prisma.rsvpForm.findUniqueOrThrow({ where: { eventId } });
		expect(row.maxRsvpCount).toBe(250);

		await expect(
			organizer().events.rsvpUpdateForm({ ...form, maxRsvpCount: 0 }),
		).rejects.toBeDefined();
		expect((await organizer().events.rsvpGetForm({ slug })).maxRsvpCount).toBe(
			250,
		);
	});
});
