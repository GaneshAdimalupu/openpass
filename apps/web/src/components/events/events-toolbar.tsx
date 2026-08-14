"use client";

import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

export type ViewMode = "grid" | "timeline";

export interface EventsToolbarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	onOpenFilter: () => void;
	activeFilterCount: number;
}

export function EventsToolbar({
	searchQuery,
	onSearchChange,
	viewMode,
	onViewModeChange,
	onOpenFilter,
	activeFilterCount,
}: EventsToolbarProps): JSX.Element {
	const [isSubscribeOpen, setIsSubscribeOpen] = useState<boolean>(false);
	const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
	const subscribeRef = useRef<HTMLDivElement>(null);
	const helpRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				subscribeRef.current &&
				!subscribeRef.current.contains(event.target as Node)
			) {
				setIsSubscribeOpen(false);
			}
			if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
				setIsHelpOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 py-4 border-b border-perforation">
			{/* Left: Search input with syntax support & Help button */}
			<div className="flex-1 flex items-center gap-2 max-w-xl">
				<div className="relative flex-1 flex items-center">
					<input
						type="search"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Search... event:workshop, location:kochi, date:2026-09"
						className="w-full bg-paper border border-perforation rounded-md pl-4 pr-10 py-2.5 text-body text-ink placeholder:text-ink/40 focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp transition-shadow text-sm"
					/>
					<div className="absolute right-3 pointer-events-none text-ink opacity-40">
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
						>
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.3-4.3" />
						</svg>
					</div>
				</div>

				{/* Query Syntax Help Tooltip Toggle */}
				<div className="relative" ref={helpRef}>
					<button
						type="button"
						onClick={() => setIsHelpOpen(!isHelpOpen)}
						aria-label="Search syntax help"
						className="p-2.5 border border-perforation rounded-md hover:bg-perforation/20 text-ink opacity-60 hover:opacity-100 transition-colors"
					>
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
						>
							<circle cx="12" cy="12" r="10" />
							<path d="9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
							<path d="M12 17h.01" />
						</svg>
					</button>

					{isHelpOpen && (
						<div className="absolute left-0 top-full mt-2 w-72 bg-paper border border-perforation rounded-lg p-4 shadow-lg z-30 space-y-2 text-xs">
							<div className="font-display font-medium text-sm text-ink mb-1">
								Search Syntax Guide
							</div>
							<p className="opacity-80">You can use filter tags in search:</p>
							<ul className="space-y-1.5 font-mono text-xs opacity-90">
								<li>
									<span className="text-stamp">event:workshop</span> or{" "}
									<span className="text-stamp">event:fest</span>
								</li>
								<li>
									<span className="text-stamp">location:kochi</span>
								</li>
								<li>
									<span className="text-stamp">date:2026-09</span> (YYYY-MM)
								</li>
							</ul>
						</div>
					)}
				</div>
			</div>

			{/* Right: Actions (RSS, Subscribe, View Toggle, Filter) */}
			<div className="flex flex-wrap items-center gap-2 sm:gap-3">
				{/* RSS Feed Button */}
				<a
					href="/api/events/feed"
					title="RSS Feed"
					className="p-2.5 border border-perforation rounded-md hover:bg-perforation/20 text-ink opacity-70 hover:opacity-100 transition-colors inline-flex items-center"
				>
					<span className="sr-only">RSS Feed</span>
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
					>
						<path d="M4 11a9 9 0 0 1 9 9" />
						<path d="M4 4a16 16 0 0 1 16 16" />
						<circle cx="5" cy="19" r="1" />
					</svg>
				</a>

				{/* Subscribe Dropdown */}
				<div className="relative" ref={subscribeRef}>
					<button
						type="button"
						onClick={() => setIsSubscribeOpen(!isSubscribeOpen)}
						className="flex items-center gap-2 px-3 py-2 border border-perforation rounded-md hover:bg-perforation/20 label text-ink transition-colors"
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
							<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
							<line x1="16" x2="16" y1="2" y2="6" />
							<line x1="8" x2="8" y1="2" y2="6" />
							<line x1="3" x2="21" y1="10" y2="10" />
						</svg>
						<span>SUBSCRIBE</span>
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
							className={`transition-transform duration-200 ${
								isSubscribeOpen ? "rotate-180" : ""
							}`}
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>

					{isSubscribeOpen && (
						<div className="absolute right-0 top-full mt-2 w-48 bg-paper border border-perforation rounded-lg py-2 shadow-lg z-30 text-xs">
							<a
								href="https://calendar.google.com"
								target="_blank"
								rel="noreferrer"
								className="block px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
							>
								Google Calendar
							</a>
							<a
								href="/api/events/calendar.ics"
								className="block px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
							>
								iCalendar (.ics)
							</a>
							<button
								type="button"
								onClick={() => {
									if (typeof window !== "undefined") {
										navigator.clipboard.writeText(
											`${window.location.origin}/api/events/feed`,
										);
										setIsSubscribeOpen(false);
									}
								}}
								className="w-full text-left px-4 py-2 text-ink hover:bg-perforation/20 transition-colors"
							>
								Copy Webcal URL
							</button>
						</div>
					)}
				</div>

				{/* Segmented View Toggle: Grid vs Timeline */}
				<div className="flex items-center p-1 bg-perforation/30 border border-perforation rounded-md">
					<button
						type="button"
						onClick={() => onViewModeChange("grid")}
						aria-pressed={viewMode === "grid"}
						aria-label="Grid view"
						className={`p-1.5 rounded transition-all ${
							viewMode === "grid"
								? "bg-paper text-ink shadow-sm"
								: "text-ink opacity-50 hover:opacity-100"
						}`}
					>
						{/* Grid Icon */}
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
						>
							<rect width="7" height="7" x="3" y="3" rx="1" />
							<rect width="7" height="7" x="14" y="3" rx="1" />
							<rect width="7" height="7" x="14" y="14" rx="1" />
							<rect width="7" height="7" x="3" y="14" rx="1" />
						</svg>
					</button>

					<button
						type="button"
						onClick={() => onViewModeChange("timeline")}
						aria-pressed={viewMode === "timeline"}
						aria-label="Timeline view"
						className={`p-1.5 rounded transition-all ${
							viewMode === "timeline"
								? "bg-paper text-ink shadow-sm"
								: "text-ink opacity-50 hover:opacity-100"
						}`}
					>
						{/* Timeline / List Icon */}
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
						>
							<line x1="8" x2="21" y1="6" y2="6" />
							<line x1="8" x2="21" y1="12" y2="12" />
							<line x1="8" x2="21" y1="18" y2="18" />
							<line x1="3" x2="3.01" y1="6" y2="6" />
							<line x1="3" x2="3.01" y1="12" y2="12" />
							<line x1="3" x2="3.01" y1="18" y2="18" />
						</svg>
					</button>
				</div>

				{/* Filter Button */}
				<button
					type="button"
					onClick={onOpenFilter}
					className={`flex items-center gap-2 px-3 py-2 border rounded-md label transition-colors ${
						activeFilterCount > 0
							? "border-stamp text-stamp bg-stamp/5"
							: "border-perforation text-ink hover:bg-perforation/20"
					}`}
				>
					<span>FILTER</span>
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
						<line x1="4" x2="4" y1="21" y2="14" />
						<line x1="4" x2="4" y1="10" y2="3" />
						<line x1="12" x2="12" y1="21" y2="12" />
						<line x1="12" x2="12" y1="8" y2="3" />
						<line x1="20" x2="20" y1="21" y2="16" />
						<line x1="20" x2="20" y1="12" y2="3" />
						<line x1="1" x2="7" y1="14" y2="14" />
						<line x1="9" x2="15" y1="8" y2="8" />
						<line x1="17" x2="23" y1="16" y2="16" />
					</svg>
					{activeFilterCount > 0 && (
						<span className="w-5 h-5 rounded-full bg-stamp text-paper text-xs flex items-center justify-center font-mono">
							{activeFilterCount}
						</span>
					)}
				</button>
			</div>
		</div>
	);
}
