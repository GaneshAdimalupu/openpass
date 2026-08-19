import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.AUTH_SECRET });
	const isLoggedIn = !!token;
	const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding");

	if (isOnboarding && !isLoggedIn) {
		const newUrl = new URL("/login", req.nextUrl.origin);
		return NextResponse.redirect(newUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
