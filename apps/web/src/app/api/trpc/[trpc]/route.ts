import { appRouter } from "@/../../api/src/trpc/app.router";
import { createContext } from "@/../../api/src/trpc/trpc";
import { auth } from "@/lib/auth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = async (req: Request) => {
	const session = await auth();
	const userId = session?.user?.id ?? null;
	const sessionToken =
		(session as unknown as { sessionToken?: string })?.sessionToken ?? null;

	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(userId, sessionToken),
	});
};

export { handler as GET, handler as POST };
// force reload
