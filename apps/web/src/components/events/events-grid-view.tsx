"use client";

import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";

export interface EventItem {
	id: string;
	title: string;
	slug: string;
	description?: string | null;
	format: string;
	bannerUrl?: string | null;
	topic: string;
	tags: string[];
	eventStart: string | Date;
	eventEnd: string | Date;
	location: string;
	isOnline: boolean;
	tickets: Array<{
		id: string;
		name: string;
		price: number;
		quantity: number;
	}>;
	organizer: {
		id: string;
		name: string;
		slug: string;
		type: string;
	};
}

export interface EventsGridViewProps {
	events: EventItem[];
}

export function EventsGridView({ events }: EventsGridViewProps): JSX.Element {
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

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
			{events.map((event) => {
				const ticket = event.tickets[0];
				const eventDate = new Date(event.eventStart);

				return (
					<article
						key={event.id}
						className="flex flex-col justify-between border border-perforation rounded-lg overflow-hidden bg-paper hover:border-ink/20 transition-all shadow-sm hover:shadow-md"
					>
						<div>
							{/* Ticket Header Graphic / Banner */}
							<div className="h-32 bg-perforation/40 relative flex items-end p-4 border-b border-perforation overflow-hidden">
								{event.bannerUrl && (
									<Image
										src={event.bannerUrl}
										alt={`Banner for ${event.title}`}
										fill
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
										className="object-cover"
									/>
								)}
								<span className="label relative z-10 bg-paper/90 backdrop-blur-xs text-ink px-2.5 py-1 rounded shadow-sm border border-perforation">
									{event.organizer.name}
								</span>
							</div>

							<div className="p-5">
								<div className="flex items-center justify-between gap-2 mb-2">
									<span className="label text-stamp">{event.format}</span>
									{event.isOnline && (
										<span className="label text-xs opacity-60">Online</span>
									)}
								</div>

								<h3 className="font-display font-medium text-h3 mb-2 text-ink line-clamp-2">
									<Link
										href={`/events/${event.slug}`}
										className="hover:underline"
									>
										{event.title}
									</Link>
								</h3>

								{event.description && (
									<p className="text-body text-sm opacity-70 mb-4 line-clamp-2">
										{event.description}
									</p>
								)}

								<div className="font-mono text-ticket opacity-60 flex items-center gap-2">
									<svg
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
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
									<span>
										{eventDate.toLocaleDateString("en-IN", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}{" "}
										· {event.location}
									</span>
								</div>
							</div>
						</div>

						{/* Signature Ticket Stub Tear-Line */}
						<div className="p-5 pt-0">
							<div className="tear-line pt-4 flex justify-between items-center">
								<div className="flex flex-col">
									<span className="label text-xs opacity-50">TICKET</span>
									<span className="font-mono text-ticket font-medium text-ink">
										{ticket?.price ? `₹${ticket.price}` : "Free"}
									</span>
								</div>
								<Link
									href={`/events/${event.slug}`}
									className="label bg-stamp text-paper px-4 py-2 rounded text-xs hover:opacity-90 transition-opacity"
								>
									View Event
								</Link>
							</div>
						</div>
					</article>
				);
			})}
		</div>
	);
}
