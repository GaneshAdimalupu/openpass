import { initTRPC } from "@trpc/server";
import { type PrismaClient, prisma } from "db";

export interface Context {
	prisma: PrismaClient;
}

export const createContext = (): Context => ({ prisma });

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
