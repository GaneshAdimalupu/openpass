import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api/src/trpc/app.router";

export const trpc = createTRPCReact<AppRouter>();
