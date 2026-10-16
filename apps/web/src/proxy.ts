import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
	const isLoggedIn = !!req.auth;
	const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding");

	if (isOnboarding && !isLoggedIn) {
		return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
