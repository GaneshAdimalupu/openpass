import Link from "next/link";
import type { JSX } from "react";

export function SiteFooter(): JSX.Element {
	return (
		<footer className="border-t border-perforation bg-paper py-10 text-ink">
			<div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 space-y-8">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
					{/* Left: Brand Identity */}
					<div className="space-y-2 max-w-md">
						<Link
							href="/"
							className="font-display font-semibold text-h3 tracking-tight flex items-center gap-2"
						>
							<span className="w-4 h-4 rounded-sm bg-stamp inline-block" />
							<span>makemyevent</span>
						</Link>
						<p className="text-xs text-ink opacity-70 leading-relaxed font-sans">
							Open-source event ticketing and community management platform.
							Built for organizers, meetups, and conferences.
						</p>
					</div>

					{/* Right: Quick Links + GitHub Button */}
					<div className="flex flex-wrap items-center gap-6 text-xs font-medium">
						<Link
							href="/events"
							className="opacity-70 hover:opacity-100 transition-opacity"
						>
							Explore Events
						</Link>
						<Link
							href="/onboarding"
							className="opacity-70 hover:opacity-100 transition-opacity"
						>
							Communities
						</Link>
						<Link
							href="/dashboard"
							className="opacity-70 hover:opacity-100 transition-opacity"
						>
							Dashboard
						</Link>
						<a
							href="mailto:contact@makemyevent.org"
							className="opacity-70 hover:opacity-100 transition-opacity"
						>
							Contact
						</a>

						{/* GitHub Link */}
						<a
							href="https://github.com/GaneshAdimalupu/openpass"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-perforation hover:border-ink/40 bg-paper/60 text-ink font-mono text-xs hover:bg-perforation/20 transition-all cursor-pointer shadow-xs"
						>
							<svg
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
								<path d="M9 18c-4.51 2-5-2-7-2" />
							</svg>
							<span>GitHub Repository</span>
						</a>
					</div>
				</div>

				{/* Bottom copyright line */}
				<div className="border-t border-perforation/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono opacity-60">
					<p>© {new Date().getFullYear()} openevents. Open Source.</p>
					<a
						href="https://github.com/GaneshAdimalupu/openpass"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:underline hover:opacity-100 transition-opacity"
					>
						github.com/GaneshAdimalupu/openpass
					</a>
				</div>
			</div>
		</footer>
	);
}
