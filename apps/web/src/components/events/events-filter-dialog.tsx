"use client";

import type { JSX } from "react";

export interface FilterState {
	format: string;
	location: string;
	pricing: string; // "all" | "free" | "paid"
}

export interface EventsFilterDialogProps {
	isOpen: boolean;
	onClose: () => void;
	filters: FilterState;
	onFilterChange: (filters: FilterState) => void;
	onReset: () => void;
	availableFormats: string[];
	availableLocations: string[];
}

export function EventsFilterDialog({
	isOpen,
	onClose,
	filters,
	onFilterChange,
	onReset,
	availableFormats,
	availableLocations,
}: EventsFilterDialogProps): JSX.Element | null {
	if (!isOpen) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="filter-title"
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200"
		>
			{/* Backdrop button for keyboard / click dismissal */}
			<button
				type="button"
				aria-label="Close filter overlay"
				onClick={onClose}
				className="fixed inset-0 w-full h-full cursor-default -z-10 focus:outline-none bg-transparent"
				tabIndex={-1}
			/>

			<div className="w-full max-w-md bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-6 relative z-10">
				<div className="flex items-center justify-between border-b border-perforation pb-4">
					<h2
						id="filter-title"
						className="font-display font-semibold text-h3 text-ink"
					>
						Filter Events
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close filters"
						className="p-2 rounded-md hover:bg-perforation/20 text-ink opacity-70 hover:opacity-100 transition-colors"
					>
						<svg
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				</div>

				<div className="space-y-4">
					{/* Format */}
					<div>
						<label htmlFor="format-select" className="block label mb-2">
							Event Format
						</label>
						<select
							id="format-select"
							value={filters.format}
							onChange={(e) =>
								onFilterChange({ ...filters, format: e.target.value })
							}
							className="w-full bg-paper border border-perforation rounded-md px-4 py-2 text-body focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp"
						>
							<option value="All">All Formats</option>
							{availableFormats.map((fmt) => (
								<option key={fmt} value={fmt}>
									{fmt}
								</option>
							))}
						</select>
					</div>

					{/* Location */}
					<div>
						<label htmlFor="location-select" className="block label mb-2">
							Location
						</label>
						<select
							id="location-select"
							value={filters.location}
							onChange={(e) =>
								onFilterChange({ ...filters, location: e.target.value })
							}
							className="w-full bg-paper border border-perforation rounded-md px-4 py-2 text-body focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp"
						>
							<option value="All">All Locations</option>
							{availableLocations.map((loc) => (
								<option key={loc} value={loc}>
									{loc}
								</option>
							))}
						</select>
					</div>

					{/* Ticket Pricing */}
					<div>
						<label htmlFor="pricing-select" className="block label mb-2">
							Pricing
						</label>
						<select
							id="pricing-select"
							value={filters.pricing}
							onChange={(e) =>
								onFilterChange({ ...filters, pricing: e.target.value })
							}
							className="w-full bg-paper border border-perforation rounded-md px-4 py-2 text-body focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp"
						>
							<option value="all">All Events (Free & Paid)</option>
							<option value="free">Free Only</option>
							<option value="paid">Paid Only</option>
						</select>
					</div>
				</div>

				<div className="flex items-center justify-between border-t border-perforation pt-4">
					<button
						type="button"
						onClick={onReset}
						className="label text-ink opacity-60 hover:opacity-100 transition-opacity"
					>
						Reset All
					</button>
					<button
						type="button"
						onClick={onClose}
						className="bg-stamp text-paper label px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
					>
						Apply Filters
					</button>
				</div>
			</div>
		</div>
	);
}
