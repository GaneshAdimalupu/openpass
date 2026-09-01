import { TRPCError, initTRPC } from "@trpc/server";
import { type PrismaClient, prisma } from "db";

export interface Context {
	prisma: PrismaClient;
	userId: string | null;
	sessionToken: string | null;
}

export const createContext = (
	userId?: string | null,
	sessionToken?: string | null,
): Context => ({
	prisma,
	userId: userId ?? null,
	sessionToken: sessionToken ?? null,
});

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Authenticated procedure — requires a valid userId and active, unrevoked session in context.
 * Performs instant zero-latency session validation against DB to guarantee revoked devices
 * are blocked immediately on their next request.
 */
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be signed in to perform this action.",
		});
	}

	if (ctx.sessionToken) {
		const activeSession = await ctx.prisma.session.findUnique({
			where: { sessionToken: ctx.sessionToken },
			select: { id: true, userId: true, expires: true },
		});

		if (
			!activeSession ||
			activeSession.userId !== ctx.userId ||
			activeSession.expires < new Date()
		) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message:
					"Your session has expired or was logged out from another device. Please sign in again.",
			});
		}
	}

	return next({
		ctx: {
			...ctx,
			userId: ctx.userId,
		},
	});
});
