import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
	pgPool: Pool | undefined;
};

function createPool(): Pool {
	const connectionString = process.env.DATABASE_URL ?? "";

	if (!connectionString) {
		return new Pool();
	}

	const isLocal =
		connectionString.includes("localhost") ||
		connectionString.includes("127.0.0.1");

	if (isLocal) {
		return new Pool({ connectionString });
	}

	try {
		const parsed = new URL(connectionString);
		const config: PoolConfig = {
			host: parsed.hostname,
			port: parsed.port ? parseInt(parsed.port, 10) : 5432,
			database: parsed.pathname.replace(/^\//, "") || "postgres",
			user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
			password: parsed.password
				? decodeURIComponent(parsed.password)
				: undefined,
			ssl: {
				rejectUnauthorized: false,
			},
		};
		return new Pool(config);
	} catch {
		return new Pool({
			connectionString,
			ssl: { rejectUnauthorized: false },
		});
	}
}

const pool = globalForPrisma.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client";
