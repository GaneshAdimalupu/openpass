"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Logo } from "@/components/ui/logo";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

export interface DashboardHeaderProps {
	title?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps): JSX.Element {
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
		<header className="border-b border-perforation bg-paper">
			<div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3 sm:gap-4">
					{/* Logo linking to Home */}
					<Link
						href="/"
						className="font-display font-semibold text-h3 tracking-tight flex items-center gap-2.5 hover:opacity-85 transition-opacity"
						title="MakeMyEvent Home"
					>
						<Logo
							width={24}
							height={24}
							className="w-6 h-6 object-contain"
							priority
						/>
						<span className="hidden sm:inline">makemyevent</span>
						<span className="sm:hidden">mme</span>
					</Link>

					<span className="text-perforation">/</span>

					{/* Dashboard Breadcrumb */}
					<Link
						href="/dashboard"
						className="font-medium text-xs sm:text-sm text-ink opacity-80 hover:opacity-100 hover:text-stamp transition-colors"
					>
						Dashboard
					</Link>

					{title && (
						<>
							<span className="text-perforation">/</span>
							<h1 className="font-medium text-xs sm:text-sm text-ink opacity-80 truncate max-w-[90px] sm:max-w-[160px] md:max-w-xs">
								{title}
							</h1>
						</>
					)}
				</div>

				<div className="flex items-center gap-3 sm:gap-5">
					{/* Navigation Links to Home and Explore */}
					<nav className="hidden md:flex items-center gap-4 text-xs font-medium">
						<Link
							href="/"
							className="text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
						>
							Home
						</Link>
						<Link
							href="/events"
							className="text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
						>
							Explore Events
						</Link>
					</nav>

					{/* Theme Switcher */}
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
									className={`hidden sm:block text-ink opacity-60 transition-transform duration-200 ${
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
										href="/"
										role="menuitem"
										onClick={() => setIsMenuOpen(false)}
										className="block px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
									>
										Home Page
									</Link>

									<Link
										href="/events"
										role="menuitem"
										onClick={() => setIsMenuOpen(false)}
										className="block px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
									>
										Explore Events
									</Link>

									<Link
										href="/dashboard?tab=tickets"
										role="menuitem"
										onClick={() => setIsMenuOpen(false)}
										className="px-4 py-2 text-ink hover:bg-perforation/20 transition-colors font-medium text-stamp flex items-center justify-between"
									>
										<span>My Tickets</span>
										<span className="text-[10px] font-mono border border-stamp/30 px-1.5 py-0.5 rounded bg-stamp/10">
											Passes
										</span>
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
										href="/profile"
										role="menuitem"
										onClick={() => setIsMenuOpen(false)}
										className="block px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
									>
										Profile & Account
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
										className="w-full text-left px-4 py-2 text-alert hover:bg-alert/10 transition-colors border-t border-perforation mt-1 font-medium cursor-pointer"
									>
										Sign Out
									</button>
								</div>
							)}
						</div>
					) : (
						<Link
							href="/login"
							className="bg-stamp text-paper label px-3 sm:px-4 py-2 rounded-md hover:opacity-90 transition-opacity text-xs"
						>
							Sign In
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
