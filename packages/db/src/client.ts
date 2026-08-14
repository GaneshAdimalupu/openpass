import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
	pgPool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL ?? "";

const isLocal =
	!connectionString ||
	connectionString.includes("localhost") ||
	connectionString.includes("127.0.0.1");

const pool =
	globalForPrisma.pgPool ??
	new Pool({
		connectionString,
		ssl: isLocal ? false : { rejectUnauthorized: false },
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client";
