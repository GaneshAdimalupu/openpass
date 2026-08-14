import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { JSX, ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

const archivo = Archivo({
	subsets: ["latin"],
	weight: ["500", "600"],
	variable: "--font-display",
});
const plexSans = IBM_Plex_Sans({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-body",
});
const plexMono = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["500"],
	variable: "--font-mono",
});

export const metadata: Metadata = {
	title: "openevents",
	description: "Open-source event ticketing and management",
};

export interface RootLayoutProps {
	children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
	return (
		<html lang="en">
			<body
				className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
