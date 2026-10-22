import { createHash } from "node:crypto";
import { appRouter } from "@/../../api/src/trpc/app.router";
import { createContext } from "@/../../api/src/trpc/trpc";
import { auth } from "@/lib/auth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { cookies } from "next/headers";

const GUEST_COOKIE_NAME = "op-guest-rsvp";

const handler = async (req: Request) => {
	const session = await auth();
	const userId = session?.user?.id ?? null;
	const sessionToken =
		(session as unknown as { sessionToken?: string })?.sessionToken ?? null;

	// Derive the guest token hash from the HttpOnly cookie so the API layer
	// can validate it without ever seeing the raw UUID.
	let rawUuid: string | null = null;
	try {
		const cookieStore = await cookies();
		rawUuid = cookieStore.get(GUEST_COOKIE_NAME)?.value ?? null;
	} catch {
		// cookies() is unavailable in some environments — safe to ignore.
	}

	if (!rawUuid) {
		const cookieHeader = req.headers.get("cookie");
		if (cookieHeader) {
			const match = cookieHeader.match(
				new RegExp(`(?:^|;\\s*)${GUEST_COOKIE_NAME}=([^;]*)`),
			);
			if (match) {
				rawUuid = decodeURIComponent(match[1]);
			}
		}
	}

	const guestTokenHash = rawUuid
		? createHash("sha256").update(rawUuid).digest("hex")
		: null;

	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(userId, sessionToken, guestTokenHash),
	});
};

export { handler as GET, handler as POST };
