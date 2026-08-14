import { auth } from "@/lib/auth";

export default auth((req): Response | undefined => {
	const isLoggedIn = !!req.auth;
	const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding");

	if (isOnboarding && !isLoggedIn) {
		const newUrl = new URL("/login", req.nextUrl.origin);
		return Response.redirect(newUrl);
	}
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
