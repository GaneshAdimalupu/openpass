import { checkinChainRouter } from "./checkin-chain.router";
import { communitiesRouter } from "./communities.router";
import { eventsRouter } from "./events.router";
import { organizersRouter } from "./organizers.router";
import { usersRouter } from "./users.router";
import { router } from "./trpc";

export const appRouter = router({
	checkinChain: checkinChainRouter,
	events: eventsRouter,
	organizers: organizersRouter,
	users: usersRouter,
	communities: communitiesRouter,
});

export type AppRouter = typeof appRouter;
