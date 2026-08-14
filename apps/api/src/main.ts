import { NestFactory } from "@nestjs/core";
import * as trpcExpress from "@trpc/server/adapters/express";
import { AppModule } from "./app.module";
import { appRouter } from "./trpc/app.router";
import { createContext } from "./trpc/trpc";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	app.use(
		"/trpc",
		trpcExpress.createExpressMiddleware({ router: appRouter, createContext }),
	);
	await app.listen(3001);
}
bootstrap();
