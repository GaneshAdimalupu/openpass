"use client";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import type { JSX } from "react";

function CardSkeleton(): JSX.Element {
	return (
		<div className="border border-perforation rounded-lg overflow-hidden animate-pulse bg-paper">
			<div className="h-32 bg-perforation/40" />
			<div className="p-4 space-y-2">
				<div className="h-3 w-16 bg-perforation/60 rounded" />
				<div className="h-5 w-3/4 bg-perforation/60 rounded" />
				<div className="h-3 w-24 bg-perforation/60 rounded" />
			</div>
		</div>
	);
}

export default function Home(): JSX.Element {
	const { data: events, isLoading, isError } = trpc.events.list.useQuery();

	return (
		<div className="min-h-screen">
			<SiteHeader />

			<section className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-12 border-b border-perforation flex flex-col items-center text-center">
				<h1 className="font-display font-semibold text-h1 mb-4 max-w-2xl">
					Find and host events, all in one place
				</h1>
				<p className="opacity-80 text-body max-w-xl mb-6">
					openevents is an open, self-hostable platform for running conferences,
					workshops, fests, and meetups — from a college club night to a
					city-wide summit.
				</p>
				<div className="flex justify-center gap-4">
					<Link
						href="#events"
						className="bg-stamp text-paper label px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
					>
						Explore Events
					</Link>
				</div>
			</section>

			<main
				id="events"
				className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6"
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-display font-semibold text-h2">
						Happening near you
					</h2>
					<Link
						href="/events"
						className="label text-stamp hover:opacity-80 transition-opacity text-xs"
					>
						View all Events ↗
					</Link>
				</div>

				{isLoading && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<CardSkeleton />
						<CardSkeleton />
						<CardSkeleton />
					</div>
				)}

				{isError && (
					<div className="py-24 text-center border border-perforation rounded-lg bg-paper">
						<h3 className="font-display font-medium text-h3 mb-2 text-alert">
							Unable to load events
						</h3>
						<p className="opacity-60 text-body">
							The API server might not be running.
						</p>
					</div>
				)}

				{!isLoading && !isError && events?.length === 0 && (
					<div className="py-24 text-center border border-perforation rounded-lg bg-paper">
						<h3 className="font-display font-medium text-h3 mb-2">
							Host your first event
						</h3>
						<p className="opacity-60 mb-6 text-body">
							There are no events happening near you right now.
						</p>
						<Link
							href="/dashboard?action=create"
							className="bg-stamp text-paper label px-4 py-2 rounded-md hover:opacity-90 inline-block transition-opacity"
						>
							Host an event
						</Link>
					</div>
				)}

				{!isLoading && !isError && events && events.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{events.map((event) => {
							const ticket = event.tickets[0];
							return (
								<div
									key={event.id}
									className="group border border-perforation rounded-lg overflow-hidden bg-paper hover:border-ink/30 transition-all flex flex-col justify-between"
								>
									<Link
										href={`/events/${event.slug}`}
										className="block"
										aria-label={`View ${event.title}`}
									>
										<div className="h-32 bg-perforation/40 group-hover:bg-perforation/60 transition-colors" />
									</Link>
									<div className="p-4 flex-1 flex flex-col justify-between">
										<div>
											<div className="flex items-center justify-between gap-2 mb-1">
												<span className="label text-xs text-stamp uppercase">
													{event.format}
												</span>
												<span className="label text-xs opacity-50 font-mono">
													{event.organizer.name}
												</span>
											</div>
											<Link
												href={`/events/${event.slug}`}
												className="block hover:underline"
											>
												<h3 className="font-display font-medium text-h3 my-1">
													{event.title}
												</h3>
											</Link>
											<div className="font-mono text-ticket opacity-60">
												{new Date(event.eventStart).toLocaleDateString(
													"en-IN",
													{
														month: "short",
														day: "numeric",
													},
												)}{" "}
												· {event.isOnline ? "Online" : event.location || "TBA"}
											</div>
										</div>
										<div className="tear-line mt-4 pt-4 flex justify-between items-center">
											<span className="font-mono text-ticket">
												{ticket?.price ? `₹${ticket.price}` : "Free"}
											</span>
											<Link
												href={`/events/${event.slug}`}
												className="label px-3 py-1 rounded text-xs transition-opacity bg-stamp text-paper hover:opacity-90"
											>
												Register
											</Link>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</main>
			<SiteFooter />
		</div>
	);
}
