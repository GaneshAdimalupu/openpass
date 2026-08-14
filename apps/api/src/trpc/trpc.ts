import { TRPCError, initTRPC } from "@trpc/server";
import { type PrismaClient, prisma } from "db";

export interface Context {
	prisma: PrismaClient;
	userId: string | null;
}

export const createContext = (userId?: string | null): Context => ({
	prisma,
	userId: userId ?? null,
});

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Authenticated procedure — requires a valid userId in context.
 * Use for any mutation that modifies user-owned resources.
 */
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be signed in to perform this action.",
		});
	}
	return next({
		ctx: {
			...ctx,
			userId: ctx.userId,
		},
	});
});
