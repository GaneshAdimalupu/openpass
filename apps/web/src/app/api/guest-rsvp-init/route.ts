import { createHash, randomUUID } from "node:crypto";
import { prisma } from "db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const COOKIE_NAME = "op-guest-rsvp";
// 90 days — persistent cookie for guest RSVP authorization
const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

const bodySchema = z.object({
	ticketCode: z.string().min(1),
});

/**
 * POST /api/guest-rsvp-init
 *
 * Called after a guest RSVP is completed.
 *
 * 1. Validates ticketCode belongs to an existing IssuedTicket.
 * 2. Generates a cryptographically secure UUID v4 (the raw secret — never stored in DB).
 * 3. Stores only the SHA-256 hash in PostgreSQL (GuestTicketToken).
 * 4. Sets the raw UUID as a persistent, HttpOnly, SameSite=Lax cookie.
 *
 * Security properties:
 * - Only the hash is stored in PostgreSQL.
 * - HttpOnly prevents client-side JavaScript access.
 * - SameSite=Lax prevents cross-site request forgery.
 * - Secure in production.
 * - Browser-scoped: guest access is tied to this browser session.
 */
export async function POST(req: Request): Promise<NextResponse> {
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "ticketCode is required." },
			{ status: 400 },
		);
	}

	const { ticketCode } = parsed.data;

	const ticket = await prisma.issuedTicket.findUnique({
		where: { ticketCode },
		select: { id: true },
	});

	if (!ticket) {
		return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
	}

	const rawUuid = randomUUID();
	const tokenHash = createHash("sha256").update(rawUuid).digest("hex");

	await prisma.guestTicketToken.upsert({
		where: { issuedTicketId: ticket.id },
		update: { tokenHash },
		create: {
			tokenHash,
			issuedTicketId: ticket.id,
		},
	});

	const response = NextResponse.json({ issued: true });
	response.cookies.set({
		name: COOKIE_NAME,
		value: rawUuid,
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: COOKIE_MAX_AGE_SECONDS,
		path: "/",
	});

	try {
		const cookieStore = await cookies();
		cookieStore.set(COOKIE_NAME, rawUuid, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: COOKIE_MAX_AGE_SECONDS,
			path: "/",
		});
	} catch {
		// safe ignore if cookies() is readonly in some contexts
	}

	return response;
}
