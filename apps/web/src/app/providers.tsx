"use client";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SessionProvider } from "next-auth/react";
import { type ReactNode, useState } from "react";
import type { JSX } from "react";

export interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
	const [queryClient] = useState<QueryClient>(() => new QueryClient());
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/trpc",
				}),
			],
		}),
	);

	return (
		<ThemeProvider defaultTheme="system">
			<SessionProvider>
				<trpc.Provider client={trpcClient} queryClient={queryClient}>
					<QueryClientProvider client={queryClient}>
						{children}
					</QueryClientProvider>
				</trpc.Provider>
			</SessionProvider>
		</ThemeProvider>
	);
}
