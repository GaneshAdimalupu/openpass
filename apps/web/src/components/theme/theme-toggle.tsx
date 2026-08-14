"use client";

import { useTheme } from "./theme-provider";
import { useEffect, useState } from "react";
import type { JSX } from "react";

export function ThemeToggle(): JSX.Element {
	const { resolvedTheme, toggleTheme } = useTheme();
	const [mounted, setMounted] = useState<boolean>(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div
				className="w-8 h-8 rounded-full border border-perforation/40 bg-paper/50"
				aria-hidden="true"
			/>
		);
	}

	const isDark = resolvedTheme === "dark";

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="p-2 rounded-full border border-perforation text-ink opacity-70 hover:opacity-100 hover:bg-perforation/20 transition-all focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp flex items-center justify-center cursor-pointer"
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			title={isDark ? "Switch to light mode" : "Switch to dark mode"}
		>
			{isDark ? (
				<svg
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-ink"
				>
					<circle cx="12" cy="12" r="4" />
					<path d="M12 2v2" />
					<path d="M12 20v2" />
					<path d="m4.93 4.93 1.41 1.41" />
					<path d="m17.66 17.66 1.41 1.41" />
					<path d="M2 12h2" />
					<path d="M20 12h2" />
					<path d="m6.34 17.66-1.41 1.41" />
					<path d="m19.07 4.93-1.41 1.41" />
				</svg>
			) : (
				<svg
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-ink"
				>
					<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
				</svg>
			)}
		</button>
	);
}
