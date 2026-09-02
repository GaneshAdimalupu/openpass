import * as path from "node:path";
import { NestFactory } from "@nestjs/core";
import * as trpcExpress from "@trpc/server/adapters/express";
import { config } from "dotenv";

// Load root workspace .env file
config({ path: path.resolve(__dirname, "../../../.env") });

import { AppModule } from "./app.module";
import { appRouter } from "./trpc/app.router";
import { createContext } from "./trpc/trpc";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	app.use(
		"/trpc",
		trpcExpress.createExpressMiddleware({
			router: appRouter,
			createContext: () => createContext(),
		}),
	);
	await app.listen(3001);
}
bootstrap();
