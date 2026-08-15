"use client";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SessionProvider } from "next-auth/react";
import { type ReactNode, useState } from "react";
import type { JSX } from "react";

function getBaseUrl(): string {
	if (typeof window !== "undefined") {
		return "";
	}
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	return "http://localhost:3000";
}

export interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
	const [queryClient] = useState<QueryClient>(() => new QueryClient());
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: `${getBaseUrl()}/api/trpc`,
				}),
			],
		}),
	);

	return (
		<ThemeProvider defaultTheme="light">
			<SessionProvider refetchInterval={60} refetchOnWindowFocus={true}>
				<trpc.Provider client={trpcClient} queryClient={queryClient}>
					<QueryClientProvider client={queryClient}>
						{children}
					</QueryClientProvider>
				</trpc.Provider>
			</SessionProvider>
		</ThemeProvider>
	);
}
