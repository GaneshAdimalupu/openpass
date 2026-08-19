"use client";

import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import type { EventItem } from "./events-grid-view";

export interface EventsTimelineViewProps {
	events: EventItem[];
}

export function EventsTimelineView({
	events,
}: EventsTimelineViewProps): JSX.Element {
	if (events.length === 0) {
		return (
			<div className="py-24 text-center border border-perforation rounded-lg bg-paper my-8">
				<h3 className="font-display font-medium text-h3 mb-2 text-ink">
					No events found
				</h3>
				<p className="opacity-60 text-body max-w-md mx-auto">
					Try changing your search terms or adjusting active filters to discover
					more events.
				</p>
			</div>
		);
	}

	// Group events by Month and Year
	const groupedEvents: Record<string, EventItem[]> = {};

	for (const event of events) {
		const date = new Date(event.eventStart);
		const monthYear = date.toLocaleDateString("en-IN", {
			month: "long",
			year: "numeric",
		});
		if (!groupedEvents[monthYear]) {
			groupedEvents[monthYear] = [];
		}
		groupedEvents[monthYear].push(event);
	}

	return (
		<div className="space-y-12 my-8">
			{Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
				<section key={monthYear} className="space-y-6">
					{/* Month Heading */}
					<div className="flex items-center gap-4">
						<h2 className="font-display font-semibold text-h2 text-ink">
							{monthYear}
						</h2>
						<div className="flex-1 border-b border-perforation" />
						<span className="label text-xs opacity-50 font-mono">
							{monthEvents.length}{" "}
							{monthEvents.length === 1 ? "EVENT" : "EVENTS"}
						</span>
					</div>

					{/* Timeline Rail & List */}
					<div className="relative pl-6 md:pl-8 border-l border-perforation space-y-8 ml-3 md:ml-4">
						{monthEvents.map((event) => {
							const ticket = event.tickets[0];
							const eventDate = new Date(event.eventStart);
							const dayOfMonth = eventDate.getDate();
							const dayOfWeek = eventDate.toLocaleDateString("en-IN", {
								weekday: "short",
							});
							const timeStr = eventDate.toLocaleTimeString("en-IN", {
								hour: "numeric",
								minute: "2-digit",
								hour12: true,
							});

							return (
								<div key={event.id} className="relative group">
									{/* Timeline Bullet Node */}
									<div className="absolute -left-6 md:-left-8 -translate-x-1/2 top-6 w-3 h-3 rounded-full bg-paper border-2 border-stamp group-hover:scale-125 transition-transform" />

									{/* Event Item Container */}
									<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 border border-perforation rounded-lg bg-paper hover:border-ink/20 transition-all shadow-sm">
										<div className="flex items-start gap-4">
											{/* Date Box */}
											<div className="flex flex-col items-center justify-center p-3 rounded-md bg-perforation/20 min-w-16 text-center border border-perforation/40">
												<span className="label text-xs text-stamp">
													{dayOfWeek}
												</span>
												<span className="font-display font-semibold text-2xl text-ink leading-tight">
													{dayOfMonth}
												</span>
											</div>

											{/* Event Info */}
											<div className="space-y-1.5">
												<div className="flex flex-wrap items-center gap-2">
													<span className="label text-xs bg-paper border border-perforation px-2 py-0.5 rounded">
														{event.organizer.name}
													</span>
													<span className="label text-xs text-stamp">
														{event.format}
													</span>
													{event.isOnline && (
														<span className="label text-xs opacity-60">
															Online
														</span>
													)}
												</div>

												<h3 className="font-display font-medium text-h3 text-ink">
													<Link
														href={`/events/${event.slug}`}
														className="hover:underline"
													>
														{event.title}
													</Link>
												</h3>

												{event.description && (
													<p className="text-body text-sm opacity-70 max-w-2xl line-clamp-2">
														{event.description}
													</p>
												)}

												<div className="font-mono text-ticket opacity-60 flex flex-wrap items-center gap-3 pt-1 text-xs">
													<span className="flex items-center gap-1">
														<Clock className="w-3.5 h-3.5 text-stamp" />
														{timeStr}
													</span>
													<span>·</span>
													<span className="flex items-center gap-1">
														<MapPin className="w-3.5 h-3.5 text-stamp" />
														{event.location}
													</span>
												</div>
											</div>
										</div>

										{/* Action & Ticket info */}
										<div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-perforation pt-4 md:pt-0">
											<div className="text-right">
												<div className="label text-xs opacity-50">PRICE</div>
												<div className="font-mono text-ticket font-medium text-ink">
													{ticket?.price ? `₹${ticket.price}` : "Free"}
												</div>
											</div>

											<Link
												href={`/events/${event.slug}`}
												className="label px-4 py-2 rounded-md transition-all whitespace-nowrap bg-stamp text-paper hover:opacity-90"
											>
												Register
											</Link>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			))}
		</div>
	);
}
