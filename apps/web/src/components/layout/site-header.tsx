"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

export interface SiteHeaderProps {
	activeNav?: "events" | "communities";
}

export function SiteHeader({ activeNav }: SiteHeaderProps): JSX.Element {
	const { data: session, status } = useSession();
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const user = session?.user;
	const initials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: (user?.email?.[0]?.toUpperCase() ?? "U");

	return (
		<header className="border-b border-perforation">
			<div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
				<div className="flex items-center gap-8">
					<Link
						href="/"
						className="font-display font-semibold text-h3 tracking-tight flex items-center gap-2"
					>
						<span className="w-4 h-4 rounded-sm bg-stamp inline-block" />
						openevents
					</Link>

					<nav className="hidden md:flex items-center gap-6">
						<Link
							href="/events"
							className={`label text-xs tracking-wider transition-colors ${
								activeNav === "events"
									? "text-ink font-semibold opacity-100"
									: "text-ink opacity-60 hover:opacity-100"
							}`}
						>
							Events
						</Link>
						<Link
							href="/onboarding"
							className={`label text-xs tracking-wider transition-colors ${
								activeNav === "communities"
									? "text-ink font-semibold opacity-100"
									: "text-ink opacity-60 hover:opacity-100"
							}`}
						>
							Communities
						</Link>
					</nav>
				</div>

				<div className="flex items-center gap-3 sm:gap-4">
					{/* Host an Event Button */}
					<Link
						href={status === "authenticated" ? "/events/new" : "/login"}
						className="group inline-flex items-center gap-2 pl-4 pr-1 py-1 bg-stamp text-paper rounded-full font-medium text-xs sm:text-sm hover:opacity-95 transition-all shadow-xs"
					>
						<span>Host an event</span>
						<span className="w-6 h-6 rounded-full bg-ink flex items-center justify-center text-paper transition-transform duration-200 group-hover:translate-x-0.5">
							<svg
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								width="13"
								height="13"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M5 12h14" />
								<path d="m12 5 7 7-7 7" />
							</svg>
						</span>
					</Link>

					{/* Theme Switcher Button */}
					<ThemeToggle />

					{/* User Profile Menu or Sign In */}
					{status === "loading" ? (
						<div className="w-8 h-8 bg-perforation/40 rounded-full animate-pulse" />
					) : status === "authenticated" && user ? (
						<div className="relative" ref={menuRef}>
							<button
								type="button"
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								aria-expanded={isMenuOpen}
								aria-haspopup="menu"
								className="flex items-center gap-2.5 p-1 rounded-full hover:ring-2 hover:ring-perforation transition-all focus:outline-none cursor-pointer"
							>
								{user.image ? (
									<Image
										src={user.image}
										alt={user.name || "User Avatar"}
										width={32}
										height={32}
										unoptimized
										className="w-8 h-8 rounded-full border border-perforation object-cover"
									/>
								) : (
									<div className="w-8 h-8 rounded-full bg-stamp text-paper flex items-center justify-center font-mono text-xs font-semibold shadow-xs">
										{initials}
									</div>
								)}
								<span className="hidden sm:inline-block font-medium text-xs max-w-36 truncate text-ink">
									{user.name || user.email?.split("@")[0]}
								</span>
								<svg
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className={`text-ink opacity-60 transition-transform duration-200 ${
										isMenuOpen ? "rotate-180" : ""
									}`}
								>
									<path d="m6 9 6 6 6-6" />
								</svg>
							</button>

							{isMenuOpen && (
								<div
									role="menu"
									className="absolute right-0 top-full mt-2 w-60 bg-paper border border-perforation rounded-lg py-2 shadow-lg z-50 text-xs animate-in fade-in duration-150"
								>
									<div className="px-4 py-2 border-b border-perforation mb-1">
										<p className="font-display font-medium text-ink truncate">
											{user.name || "Signed in"}
										</p>
										<p className="font-mono text-xs opacity-60 truncate">
											{user.email}
										</p>
									</div>

									<Link
										href="/profile"
										role="menuitem"
										onClick={() => setIsMenuOpen(false)}
										className="block px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
									>
										Profile & Account
									</Link>

									<Link
										href="/dashboard"
										role="menuitem"
										onClick={() => setIsMenuOpen(false)}
										className="block px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
									>
										Organizer Dashboard
									</Link>

									<Link
										href="/onboarding"
										role="menuitem"
										onClick={() => setIsMenuOpen(false)}
										className="block px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
									>
										Create Another Organizer
									</Link>

									<button
										type="button"
										role="menuitem"
										onClick={() => {
											setIsMenuOpen(false);
											signOut({ callbackUrl: "/" });
										}}
										className="w-full text-left px-4 py-2 text-alert hover:bg-alert/10 transition-colors border-t border-perforation mt-1 font-medium"
									>
										Sign Out
									</button>
								</div>
							)}
						</div>
					) : (
						<Link
							href="/login"
							className="bg-stamp text-paper label px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
						>
							Sign In
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
