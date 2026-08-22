import type { Metadata, Viewport } from "next";
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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://makemyevent.org";

export const metadata: Metadata = {
	metadataBase: new URL(baseUrl),
	title: {
		default: "openevents | Find and host events",
		template: "%s | openevents",
	},
	description:
		"Open-source event ticketing and management platform for running conferences, workshops, fests, and meetups.",
	keywords: [
		"events",
		"ticketing",
		"conferences",
		"meetups",
		"open source",
		"management",
		"openevents",
	],
	openGraph: {
		type: "website",
		locale: "en_US",
		url: baseUrl,
		title: "openevents | Find and host events",
		description:
			"Open-source event ticketing and management platform for running conferences, workshops, fests, and meetups.",
		siteName: "openevents",
	},
	twitter: {
		card: "summary_large_image",
		title: "openevents | Find and host events",
		description: "Open-source event ticketing and management platform.",
	},
	verification: {
		google: "EO9SG-z--GhL_8DQ1ywwXUUHJPIIGJiLKhQITqxbdOQ",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
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
