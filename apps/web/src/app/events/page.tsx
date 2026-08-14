"use client";

import {
	EventsFilterDialog,
	type FilterState,
} from "@/components/events/events-filter-dialog";
import {
	type EventItem,
	EventsGridView,
} from "@/components/events/events-grid-view";
import { EventsTimelineView } from "@/components/events/events-timeline-view";
import {
	EventsToolbar,
	type ViewMode,
} from "@/components/events/events-toolbar";
import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import type { JSX } from "react";

export default function EventsPage(): JSX.Element {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
	const [filters, setFilters] = useState<FilterState>({
		format: "All",
		location: "All",
		pricing: "all",
	});

	const { data: rawEvents, isLoading, isError } = trpc.events.list.useQuery();

	const events: EventItem[] = useMemo(() => {
		if (!rawEvents) return [];
		return rawEvents as unknown as EventItem[];
	}, [rawEvents]);

	// Extract unique categories & locations
	const availableFormats = useMemo(() => {
		const fmts = new Set<string>();
		for (const ev of events) {
			if (ev.format) fmts.add(ev.format);
		}
		return Array.from(fmts);
	}, [events]);

	const availableLocations = useMemo(() => {
		const locs = new Set<string>();
		for (const ev of events) {
			if (ev.location) locs.add(ev.location);
		}
		return Array.from(locs);
	}, [events]);

	// Filter and search parsing logic
	const filteredEvents = useMemo(() => {
		return events.filter((event) => {
			// Parse search query tokens
			const query = searchQuery.trim().toLowerCase();
			let matchesSearch = true;

			if (query) {
				const tokens = query.split(/\s+/);
				for (const token of tokens) {
					if (token.startsWith("event:")) {
						const catVal = token.replace("event:", "");
						if (!event.format.toLowerCase().includes(catVal)) {
							matchesSearch = false;
						}
					} else if (token.startsWith("location:")) {
						const locVal = token.replace("location:", "");
						if (!event.location.toLowerCase().includes(locVal)) {
							matchesSearch = false;
						}
					} else if (token.startsWith("date:")) {
						const dateVal = token.replace("date:", "");
						const evDate = new Date(event.eventStart).toISOString().slice(0, 7); // YYYY-MM
						if (!evDate.startsWith(dateVal)) {
							matchesSearch = false;
						}
					} else {
						// Free-text query across title, description, location, organizer
						const text =
							`${event.title} ${event.description ?? ""} ${event.location} ${event.organizer.name} ${event.format} ${event.topic}`.toLowerCase();
						if (!text.includes(token)) {
							matchesSearch = false;
						}
					}
				}
			}

			if (!matchesSearch) return false;

			// Dialog Filters
			if (filters.format !== "All" && event.format !== filters.format) {
				return false;
			}
			if (filters.location !== "All" && event.location !== filters.location) {
				return false;
			}
			if (filters.pricing !== "all") {
				const ticket = event.tickets[0];
				const isFree = !ticket?.price || ticket.price === 0;
				if (filters.pricing === "free" && !isFree) return false;
				if (filters.pricing === "paid" && isFree) return false;
			}

			return true;
		});
	}, [events, searchQuery, filters]);

	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.format !== "All") count++;
		if (filters.location !== "All") count++;
		if (filters.pricing !== "all") count++;
		return count;
	}, [filters]);

	return (
		<div className="min-h-screen bg-paper flex flex-col">
			<SiteHeader activeNav="events" />

			{/* Main Content Area */}
			<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h1 className="font-display font-semibold text-h1 text-ink mb-2">
						Events Directory
					</h1>
					<p className="text-body opacity-70 max-w-xl">
						Explore upcoming conferences, hackathons, workshops, and community
						meetups happening near you.
					</p>
				</div>

				{/* FOSS United Inspired Events Toolbar */}
				<EventsToolbar
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					onOpenFilter={() => setIsFilterOpen(true)}
					activeFilterCount={activeFilterCount}
				/>

				{/* Active Filters Tag Bar */}
				{(activeFilterCount > 0 || searchQuery.trim()) && (
					<div className="flex flex-wrap items-center gap-2 pt-4 pb-2">
						<span className="label text-xs opacity-50">ACTIVE FILTERS:</span>
						{searchQuery.trim() && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-perforation/30 text-xs font-mono">
								query: &quot;{searchQuery}&quot;
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="hover:text-alert"
								>
									×
								</button>
							</span>
						)}
						{filters.format !== "All" && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-perforation/30 text-xs font-mono">
								format: {filters.format}
								<button
									type="button"
									onClick={() => setFilters({ ...filters, format: "All" })}
									className="hover:text-alert"
								>
									×
								</button>
							</span>
						)}
						{filters.location !== "All" && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-perforation/30 text-xs font-mono">
								location: {filters.location}
								<button
									type="button"
									onClick={() => setFilters({ ...filters, location: "All" })}
									className="hover:text-alert"
								>
									×
								</button>
							</span>
						)}
						{filters.pricing !== "all" && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-perforation/30 text-xs font-mono">
								pricing: {filters.pricing}
								<button
									type="button"
									onClick={() => setFilters({ ...filters, pricing: "all" })}
									className="hover:text-alert"
								>
									×
								</button>
							</span>
						)}
						<button
							type="button"
							onClick={() => {
								setSearchQuery("");
								setFilters({
									format: "All",
									location: "All",
									pricing: "all",
								});
							}}
							className="label text-xs text-alert hover:underline ml-2"
						>
							Clear all
						</button>
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div
								key={i}
								className="border border-perforation rounded-lg overflow-hidden animate-pulse bg-paper h-64"
							>
								<div className="h-28 bg-perforation/40" />
								<div className="p-4 space-y-3">
									<div className="h-3 w-16 bg-perforation/60 rounded" />
									<div className="h-5 w-3/4 bg-perforation/60 rounded" />
									<div className="h-3 w-24 bg-perforation/60 rounded" />
								</div>
							</div>
						))}
					</div>
				)}

				{/* Error State */}
				{isError && (
					<div className="py-24 text-center border border-perforation rounded-lg bg-paper my-8">
						<h3 className="font-display font-medium text-h3 mb-2 text-alert">
							Unable to load events
						</h3>
						<p className="opacity-60 text-body">
							The API server might not be running or reachable.
						</p>
					</div>
				)}

				{/* Loaded Views */}
				{!isLoading &&
					!isError &&
					(viewMode === "grid" ? (
						<EventsGridView events={filteredEvents} />
					) : (
						<EventsTimelineView events={filteredEvents} />
					))}
			</main>

			{/* Filter Dialog */}
			<EventsFilterDialog
				isOpen={isFilterOpen}
				onClose={() => setIsFilterOpen(false)}
				filters={filters}
				onFilterChange={setFilters}
				onReset={() =>
					setFilters({ format: "All", location: "All", pricing: "all" })
				}
				availableFormats={availableFormats}
				availableLocations={availableLocations}
			/>
		</div>
	);
}
