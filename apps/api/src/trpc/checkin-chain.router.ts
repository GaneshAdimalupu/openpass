import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "db";
import { z } from "zod";
import { assertEventAccess, checkInIssuedTicket } from "./events.router";
import type { CheckInOutcome } from "./events.router";
import { authedProcedure, router } from "./trpc";

/**
 * QR chain check-in: ROOT -> A -> B -> C ...
 *
 * - The organizer starts a session for one event; the session gets a ROOT node.
 * - Whoever scans a node's QR is checked in (via the shared checkInIssuedTicket rules)
 *   and becomes a new node whose own QR can be scanned by the next person.
 * - A node's QR can be consumed exactly once: CheckinChainNode.parentNodeId is UNIQUE.
 *
 * QR token: `qrc1.<sessionId>.<nodeId>.<expiresAtEpochSeconds>.<signature>`
 * signature = base64url(HMAC-SHA256(session.secret, "<sessionId>.<nodeId>.<exp>"))
 * The secret lives only in CheckinChainSession.secret and is never sent to a client.
 */

const TOKEN_PREFIX = "qrc1";
const TOKEN_TTL_SECONDS = 20; // QR is re-issued by the client every few seconds
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ORGANIZER_ROLES = ["OWNER", "ADMIN", "EDITOR", "COORDINATOR"] as const;

type ClaimFailureCode =
	| "INVALID"
	| "EXPIRED"
	| "WRONG_EVENT"
	| "INACTIVE"
	| "ALREADY_USED"
	| "NOT_REGISTERED"
	| "ALREADY_IN_CHAIN"
	| "ALREADY_CHECKED_IN"
	| "NOT_ELIGIBLE";

function sign(
	secret: string,
	sessionId: string,
	nodeId: string,
	exp: number,
): string {
	return createHmac("sha256", secret)
		.update(`${sessionId}.${nodeId}.${exp}`)
		.digest("base64url");
}

function issueToken(secret: string, sessionId: string, nodeId: string) {
	const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
	return {
		token: `${TOKEN_PREFIX}.${sessionId}.${nodeId}.${exp}.${sign(secret, sessionId, nodeId, exp)}`,
		expiresAt: new Date(exp * 1000),
	};
}

function parseToken(raw: string) {
	const parts = raw.trim().split(".");
	if (parts.length !== 5 || parts[0] !== TOKEN_PREFIX) return null;
	const exp = Number(parts[3]);
	if (!Number.isInteger(exp)) return null;
	return { sessionId: parts[1], nodeId: parts[2], exp, signature: parts[4] };
}

function signatureMatches(expected: string, actual: string): boolean {
	const a = Buffer.from(expected);
	const b = Buffer.from(actual);
	return a.length === b.length && timingSafeEqual(a, b);
}

/** Active = not ended and not past its expiry. */
function findActiveSession(client: PrismaClient, eventId: string) {
	return client.checkinChainSession.findFirst({
		where: { eventId, endedAt: null, expiresAt: { gt: new Date() } },
		orderBy: { createdAt: "desc" },
	});
}

/**
 * The signed-in user's ticket for this event. Tickets can be booked while signed out,
 * so match either IssuedTicket.userId or the account email (bookings store it lowercased).
 * Prefers a CONFIRMED ticket, so the outcome message is meaningful for other states.
 */
async function findMyTicket(
	client: PrismaClient,
	eventId: string,
	userId: string,
) {
	const user = await client.user.findUnique({
		where: { id: userId },
		select: { email: true },
	});
	const tickets = await client.issuedTicket.findMany({
		where: {
			eventId,
			OR: [
				{ userId },
				...(user?.email
					? [
							{
								attendeeEmail: {
									equals: user.email,
									mode: "insensitive" as const,
								},
							},
						]
					: []),
			],
		},
		include: { ticket: { select: { name: true } } },
		orderBy: { createdAt: "asc" },
	});
	return (
		tickets.find((t) => t.status === "CONFIRMED") ??
		tickets.find((t) => t.status === "CHECKED_IN") ??
		tickets[0] ??
		null
	);
}

class ChainRollback extends Error {
	constructor(readonly outcome: CheckInOutcome) {
		super(outcome.message);
	}
}

function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: string }).code === "P2002"
	);
}

function fail(code: ClaimFailureCode, message: string) {
	return { ok: false as const, code, message };
}

export const checkinChainRouter = router({
	/** Organizer: start a chain for the event (returns the running one if there already is one). */
	start: authedProcedure
		.input(z.object({ slug: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const event = await assertEventAccess(
				ctx.prisma,
				input.slug,
				ctx.userId,
				[...ORGANIZER_ROLES],
			);

			const running = await findActiveSession(ctx.prisma, event.id);
			if (running) return { sessionId: running.id };

			const session = await ctx.prisma.checkinChainSession.create({
				data: {
					eventId: event.id,
					startedById: ctx.userId,
					secret: randomBytes(32).toString("base64url"),
					expiresAt: new Date(Date.now() + SESSION_TTL_MS),
					nodes: { create: { depth: 0 } }, // ROOT node
				},
				select: { id: true },
			});
			return { sessionId: session.id };
		}),

	/** Organizer: live state of the running chain, including a freshly signed ROOT QR token. */
	status: authedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await assertEventAccess(
				ctx.prisma,
				input.slug,
				ctx.userId,
				[...ORGANIZER_ROLES],
			);

			const session = await findActiveSession(ctx.prisma, event.id);
			if (!session) return { active: false as const };

			const [root, checkedInCount, recent] = await Promise.all([
				ctx.prisma.checkinChainNode.findFirst({
					where: { sessionId: session.id, parentNodeId: null },
					select: { id: true, child: { select: { id: true } } },
				}),
				ctx.prisma.checkinChainNode.count({
					where: { sessionId: session.id, issuedTicketId: { not: null } },
				}),
				ctx.prisma.checkinChainNode.findMany({
					where: { sessionId: session.id, issuedTicketId: { not: null } },
					orderBy: { createdAt: "desc" },
					take: 5,
					select: {
						depth: true,
						createdAt: true,
						issuedTicket: { select: { attendeeName: true } },
					},
				}),
			]);

			const rootQr =
				root && !root.child
					? issueToken(session.secret, session.id, root.id)
					: null;

			return {
				active: true as const,
				sessionId: session.id,
				startedAt: session.createdAt,
				expiresAt: session.expiresAt,
				checkedInCount,
				rootToken: rootQr?.token ?? null,
				rootTokenExpiresAt: rootQr?.expiresAt ?? null,
				recent: recent.map((n) => ({
					position: n.depth,
					name: n.issuedTicket?.attendeeName ?? "",
					at: n.createdAt,
				})),
			};
		}),

	/** Organizer: end the running chain. Its QR codes stop working immediately. */
	end: authedProcedure
		.input(z.object({ slug: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const event = await assertEventAccess(
				ctx.prisma,
				input.slug,
				ctx.userId,
				[...ORGANIZER_ROLES],
			);
			const result = await ctx.prisma.checkinChainSession.updateMany({
				where: { eventId: event.id, endedAt: null },
				data: { endedAt: new Date() },
			});
			return { ended: result.count };
		}),

	/** Participant: my personal QR for the running chain of this event. */
	myQr: authedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				select: { id: true, title: true },
			});
			if (!event) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
			}

			const session = await findActiveSession(ctx.prisma, event.id);
			if (!session) {
				return { state: "no_session" as const, eventTitle: event.title };
			}

			const ticket = await findMyTicket(ctx.prisma, event.id, ctx.userId);
			const node = ticket
				? await ctx.prisma.checkinChainNode.findFirst({
						where: { sessionId: session.id, issuedTicketId: ticket.id },
						select: { id: true, depth: true, child: { select: { id: true } } },
					})
				: null;
			if (!node) {
				return { state: "not_joined" as const, eventTitle: event.title };
			}
			if (node.child) {
				return {
					state: "passed_on" as const,
					eventTitle: event.title,
					position: node.depth,
				};
			}

			const qr = issueToken(session.secret, session.id, node.id);
			return {
				state: "ready" as const,
				eventTitle: event.title,
				position: node.depth,
				token: qr.token,
				expiresAt: qr.expiresAt,
			};
		}),

	/** Participant: scan a chain QR -> get checked in -> become the next node. */
	claim: authedProcedure
		.input(z.object({ slug: z.string(), token: z.string().max(400) }))
		.mutation(async ({ ctx, input }) => {
			const parsed = parseToken(input.token);
			if (!parsed) return fail("INVALID", "This is not a valid chain QR code.");

			const session = await ctx.prisma.checkinChainSession.findUnique({
				where: { id: parsed.sessionId },
				include: { event: { select: { id: true, slug: true } } },
			});
			if (
				!session ||
				!signatureMatches(
					sign(session.secret, session.id, parsed.nodeId, parsed.exp),
					parsed.signature,
				)
			) {
				return fail("INVALID", "This is not a valid chain QR code.");
			}
			if (session.event.slug !== input.slug) {
				return fail(
					"WRONG_EVENT",
					"This QR code belongs to a different event.",
				);
			}
			if (session.endedAt || session.expiresAt <= new Date()) {
				return fail("INACTIVE", "This QR chain check-in has ended.");
			}
			if (parsed.exp * 1000 <= Date.now()) {
				return fail(
					"EXPIRED",
					"This QR code has expired. Scan the current one.",
				);
			}

			const issuer = await ctx.prisma.checkinChainNode.findFirst({
				where: { id: parsed.nodeId, sessionId: session.id },
				select: { id: true, depth: true, child: { select: { id: true } } },
			});
			if (!issuer) {
				return fail("INVALID", "This is not a valid chain QR code.");
			}
			if (issuer.child) {
				return fail("ALREADY_USED", "This QR code has already been used.");
			}

			const ticket = await findMyTicket(
				ctx.prisma,
				session.eventId,
				ctx.userId,
			);
			if (!ticket) {
				return fail(
					"NOT_REGISTERED",
					"You don't have a ticket for this event with this account.",
				);
			}
			const alreadyInChain = () =>
				ctx.prisma.checkinChainNode.findFirst({
					where: { sessionId: session.id, issuedTicketId: ticket.id },
					select: { id: true },
				});
			if (await alreadyInChain()) {
				return fail("ALREADY_IN_CHAIN", "You are already part of this chain.");
			}

			try {
				// One transaction: consume the QR (unique parentNodeId) and check in together.
				// If two people scan the same QR at once, the unique index lets exactly one commit;
				// the other gets P2002 and nothing about their ticket changes.
				const outcome = await ctx.prisma.$transaction(async (tx) => {
					await tx.checkinChainNode.create({
						data: {
							sessionId: session.id,
							parentNodeId: issuer.id,
							issuedTicketId: ticket.id,
							depth: issuer.depth + 1,
						},
					});
					const result = await checkInIssuedTicket(tx, ticket);
					if (!result.valid) throw new ChainRollback(result);
					return result;
				});

				return {
					ok: true as const,
					attendeeName: ticket.attendeeName,
					tierName: ticket.ticket.name,
					checkedInAt: outcome.checkedInAt,
					message: outcome.message,
				};
			} catch (error) {
				if (error instanceof ChainRollback) {
					return fail(
						error.outcome.alreadyCheckedIn
							? "ALREADY_CHECKED_IN"
							: "NOT_ELIGIBLE",
						error.outcome.message,
					);
				}
				if (isUniqueViolation(error)) {
					return (await alreadyInChain())
						? fail("ALREADY_IN_CHAIN", "You are already part of this chain.")
						: fail("ALREADY_USED", "This QR code has already been used.");
				}
				throw error;
			}
		}),
});
