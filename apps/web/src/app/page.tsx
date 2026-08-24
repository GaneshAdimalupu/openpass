"use client";
import { OrbitalDiagram } from "@/components/landing/orbital-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";

function CardSkeleton(): JSX.Element {
	return (
		<div className="border border-perforation rounded-lg overflow-hidden animate-pulse bg-paper">
			<div className="h-28 bg-perforation/40" />
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

			{/* ── Unified Hero (Text + Orbital Diagram) ── */}
			<section className="border-b border-perforation py-12 md:py-20 overflow-hidden">
				<div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row items-center gap-12 md:gap-16 lg:gap-20 min-h-[calc(100vh-140px)]">
						{/* ── Left Column: Pitch & Action ── */}
						<div className="flex-1 max-w-xl text-center md:text-left">
							<p className="label text-stamp mb-4 tracking-widest text-xs">
								Open Source · Free Forever
							</p>
							<h1 className="font-display font-semibold text-h1 mb-5 leading-tight">
								Find and host events,{" "}
								<span className="text-stamp">all in one place</span>
							</h1>
							<p className="opacity-70 text-body mb-8 leading-relaxed">
								makemyevent is an open, self-hostable platform for running
								conferences, workshops, fests, and meetups — from a college club
								night to a city-wide summit.
							</p>
							<div className="flex flex-wrap justify-center md:justify-start gap-3">
								<Link
									href="#events"
									className="bg-stamp text-paper font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity text-sm"
								>
									Explore Events
								</Link>
								<Link
									href="/dashboard?action=create"
									className="bg-paper text-ink font-medium px-5 py-2.5 rounded-full border border-perforation hover:border-ink/40 transition-colors text-sm"
								>
									Host an event →
								</Link>
							</div>
						</div>

						{/* ── Right Column: Orbital Architecture Diagram ── */}
						<div className="shrink-0 w-full max-w-[540px] mx-auto">
							<OrbitalDiagram />
						</div>
					</div>
				</div>
			</section>

			{/* ── Events listing ── */}
			<main
				id="events"
				className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-12 border-b border-perforation"
			>
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-display font-semibold text-h2">
						Happening near you
					</h2>
					<Link
						href="/events"
						className="label text-stamp hover:opacity-80 transition-opacity text-xs"
					>
						View all ↗
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
							There are no events happening right now. Be the first to host one.
						</p>
						<Link
							href="/dashboard?action=create"
							className="bg-stamp text-paper label px-5 py-2.5 rounded-full hover:opacity-90 inline-block transition-opacity text-sm"
						>
							Host an event
						</Link>
					</div>
				)}

				{!isLoading && !isError && events && events.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{events.map((event) => {
							const ticket = event.tickets[0];
							return (
								<div
									key={event.id}
									className="group border border-perforation rounded-xl overflow-hidden bg-paper hover:border-stamp/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative"
								>
									{/* Banner Header with Format Tag */}
									<Link
										href={`/events/${event.slug}`}
										className="relative block h-36 w-full overflow-hidden bg-perforation/20 group"
										aria-label={`View details for ${event.title}`}
									>
										{event.bannerUrl ? (
											<Image
												src={event.bannerUrl}
												alt={`Banner for ${event.title}`}
												fill
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
												className="object-cover group-hover:scale-105 transition-transform duration-300"
											/>
										) : (
											<div className="absolute inset-0 bg-gradient-to-br from-stamp/10 via-perforation/20 to-paper flex items-center justify-center">
												<span className="font-display font-semibold text-2xl text-ink/30 select-none">
													{event.title.charAt(0).toUpperCase()}
												</span>
											</div>
										)}
										<div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-paper/90 backdrop-blur-xs rounded-md font-mono text-[10px] font-semibold text-stamp uppercase border border-perforation shadow-xs">
											{event.format}
										</div>
									</Link>

									{/* Card Content Body */}
									<div className="p-4 flex-1 flex flex-col justify-between relative">
										<div>
											<div className="flex items-center justify-between gap-2 mb-1.5">
												<span className="label text-[11px] text-stamp font-semibold uppercase tracking-wider font-mono">
													{event.organizer.name}
												</span>
												<span className="text-[11px] font-mono text-ink/60">
													{new Date(event.eventStart).toLocaleDateString(
														"en-IN",
														{
															month: "short",
															day: "numeric",
														},
													)}
												</span>
											</div>
											<Link
												href={`/events/${event.slug}`}
												className="block hover:underline"
											>
												<h3 className="font-display font-semibold text-base text-ink my-1 line-clamp-1">
													{event.title}
												</h3>
											</Link>
											<p className="font-mono text-xs text-ink/60 truncate mt-1">
												{event.isOnline
													? "Online Event"
													: event.location || "Location TBA"}
											</p>
										</div>

										{/* Perforated Tear Line Stub Cutouts */}
										<div className="relative mt-4 pt-3 border-t border-dashed border-perforation flex justify-between items-center">
											<span className="font-mono text-xs font-semibold text-ink">
												{ticket?.price ? `₹${ticket.price}` : "Free Pass"}
											</span>
											<Link
												href={`/events/${event.slug}`}
												className="px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-opacity bg-stamp text-paper hover:opacity-90 shadow-xs"
											>
												Register →
											</Link>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</main>

			{/* ── Host CTA Banner (Framed Glassmorphic Card) ── */}
			<section className="py-16 md:py-20 border-b border-perforation">
				<div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
					<div className="border border-perforation rounded-2xl bg-paper/80 p-8 md:p-12 text-center shadow-xs relative overflow-hidden">
						<div className="max-w-xl mx-auto space-y-4">
							<span className="inline-block px-3 py-1 rounded-full bg-stamp/10 text-stamp text-xs font-mono font-semibold uppercase tracking-wider border border-stamp/20">
								Organizer Platform
							</span>
							<h2 className="font-display font-semibold text-2xl md:text-3xl text-ink">
								Ready to host your next event?
							</h2>
							<p className="opacity-70 text-body text-sm md:text-base leading-relaxed">
								Set up tickets, collect registrations, manage guests, and check
								in attendees — all in one place, for free.
							</p>
							<div className="pt-2">
								<Link
									href="/dashboard?action=create"
									className="inline-flex items-center gap-2 bg-stamp text-paper font-medium px-6 py-3 rounded-full hover:opacity-95 transition-opacity text-sm shadow-xs"
								>
									<span>Host your first event</span>
									<span>→</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			<SiteFooter />
		</div>
	);
}
