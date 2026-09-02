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
	alternates: {
		canonical: "./",
	},
	title: {
		default: "makemyevent | Find and host community events",
		template: "%s | makemyevent",
	},
	description:
		"makemyevent is an open-source event management and ticketing platform for tech communities, meetups, hackathons, and open-source clubs.",
	keywords: [
		"makemyevent",
		"events",
		"ticketing",
		"conferences",
		"meetups",
		"hackathons",
		"open source",
		"foss united",
		"community events",
		"rsvp platform",
		"event management",
	],
	openGraph: {
		type: "website",
		locale: "en_US",
		url: baseUrl,
		title: "makemyevent | Find and host community events",
		description:
			"Open-source event ticketing and management platform for running conferences, workshops, fests, and meetups.",
		siteName: "makemyevent",
	},
	twitter: {
		card: "summary_large_image",
		title: "makemyevent | Find and host community events",
		description: "Open-source event ticketing and management platform.",
	},
	verification: {
		google: "EO9SG-z--GhL_8DQ1ywwXUUHJPIIGJiLKhQITqxbdOQ",
	},
	robots: {
		index: true,
		follow: true,
	},
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "32x32" },
			{ url: "/makemyevent-light.svg", media: "(prefers-color-scheme: light)" },
			{ url: "/makemyevent-dark.svg", media: "(prefers-color-scheme: dark)" },
			{ url: "/makemyevent.svg" },
		],
		shortcut: "/favicon.ico",
		apple: "/makemyevent.svg",
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
