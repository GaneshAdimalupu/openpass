import { appRouter } from "@/../../api/src/trpc/app.router";
import { createContext } from "@/../../api/src/trpc/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(),
	});

export { handler as GET, handler as POST };
