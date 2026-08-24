"use client";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import {
	AlertCircle,
	Calendar,
	Clock,
	Info,
	Mail,
	MapPin,
	Sparkles,
	Ticket as TicketIcon,
	Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { JSX } from "react";

export default function PublicEventPage(): JSX.Element {
	const params = useParams();
	const slug = params.slug as string;
	const { data: session } = useSession();

	// Query Event data and ticket tiers
	const { data: ticketData, isLoading: ticketsLoading } =
		trpc.events.ticketsGet.useQuery({ slug }, { enabled: !!slug });

	const { data: scheduleData } = trpc.events.scheduleGet.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	const { data: partnerData } = trpc.events.partnersGet.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	if (ticketsLoading) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 flex items-center justify-center p-6">
					<p className="animate-pulse opacity-60">Loading event details...</p>
				</main>
			</div>
		);
	}

	if (!ticketData?.event) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 flex items-center justify-center p-6">
					<div className="text-center max-w-md border border-perforation p-8 rounded-lg">
						<TicketIcon className="w-12 h-12 text-alert mx-auto mb-3" />
						<h1 className="font-display font-semibold text-xl mb-2">
							Event Not Found
						</h1>
						<p className="opacity-60 text-sm mb-6">
							The event you are looking for does not exist or has been removed.
						</p>
						<Link
							href="/"
							className="px-4 py-2 bg-stamp text-paper rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
						>
							Explore Other Events
						</Link>
					</div>
				</main>
			</div>
		);
	}

	const event = ticketData.event;

	const formattedStart = event.eventStart
		? new Date(event.eventStart).toLocaleDateString("en-US", {
				weekday: "long",
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const formattedTime = event.eventStart
		? new Date(event.eventStart).toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
			})
		: null;

	return (
		<div className="min-h-screen bg-paper text-ink flex flex-col">
			<SiteHeader />

			{/* Draft Preview Banner */}
			{event.status !== "published" && (
				<div className="bg-alert/10 border-b border-alert/20 px-4 py-3 text-center text-xs font-mono text-alert flex flex-wrap items-center justify-center gap-2">
					<AlertCircle className="w-4 h-4 shrink-0" />
					<span>
						<strong>DRAFT PREVIEW:</strong> This event is unpublished.
						Registrations are disabled until the organizer publishes it.
					</span>
					{session?.user?.id === event.organizer.ownerId && (
						<Link
							href={`/events/${event.slug}/manage`}
							className="underline font-semibold hover:opacity-80 ml-2"
						>
							Manage & Publish Event →
						</Link>
					)}
				</div>
			)}

			<div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex-1 w-full space-y-6">
				{/* Breadcrumb Navigation Bar */}
				<div className="flex items-center justify-between text-xs font-mono text-ink/60">
					<div className="flex items-center gap-2 truncate">
						<Link href="/" className="hover:text-stamp transition-colors">
							Home
						</Link>
						<span>/</span>
						<Link href="/events" className="hover:text-stamp transition-colors">
							Events
						</Link>
						<span>/</span>
						<span className="text-ink font-medium truncate">{event.title}</span>
					</div>
					{session?.user?.id === event.organizer.ownerId && (
						<Link
							href={`/events/${event.slug}/manage`}
							className="px-3 py-1 bg-perforation/40 hover:bg-perforation/70 text-ink rounded-md text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
						>
							Edit Event ↗
						</Link>
					)}
				</div>

				{/* Dynamic Title and JSON-LD Structured Data for Rich Search Snippets & SEO */}
				<title>{`${event.title} | makemyevent`}</title>
				<script
					type="application/ld+json"
					/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data */
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "Event",
							name: event.title,
							startDate: event.eventStart,
							endDate: event.eventEnd || event.eventStart,
							eventAttendanceMode:
								event.isOnline || event.format === "online"
									? "https://schema.org/OnlineEventAttendanceMode"
									: "https://schema.org/OfflineEventAttendanceMode",
							eventStatus: "https://schema.org/EventScheduled",
							location: {
								"@type": "Place",
								name: event.location || "Venue TBA",
								address: {
									"@type": "PostalAddress",
									name: event.location || "Venue TBA",
								},
							},
							image: event.bannerUrl ? [event.bannerUrl] : [],
							description: event.description || event.title,
							organizer: {
								"@type": "Organization",
								name: event.organizer.name,
							},
							offers: {
								"@type": "Offer",
								url: `https://makemyevent.org/events/${event.slug}/rsvp`,
								price: "0",
								priceCurrency: "INR",
								availability: "https://schema.org/InStock",
							},
						}),
					}}
				/>

				{/* Main Event Hero Card (FOSS United Style) */}
				<div className="border border-perforation rounded-2xl p-5 sm:p-7 md:p-8 bg-paper shadow-sm">
					<div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 items-start">
						{/* Info Column */}
						<div
							className={`space-y-5 ${
								event.bannerUrl ? "sm:col-span-7" : "sm:col-span-12"
							}`}
						>
							{/* Organization Branding Chip */}
							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stamp/10 text-stamp border border-stamp/20 text-xs font-semibold uppercase tracking-wider font-mono">
									<span className="w-2 h-2 rounded-full bg-stamp animate-pulse" />
									{event.organizer.name}
								</span>
								{event.format && (
									<span className="text-[11px] font-mono opacity-70 bg-perforation/30 px-2.5 py-1 rounded-md capitalize">
										{event.format}
									</span>
								)}
							</div>

							{/* Title */}
							<h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl leading-tight text-ink">
								{event.title}
							</h1>

							{/* Event Meta Rows with Icon Boxes (FOSS United Style) */}
							<div className="space-y-3 pt-1 text-sm font-mono text-ink/80">
								{formattedStart && (
									<div className="flex items-center gap-3">
										<button
											type="button"
											onClick={() => {
												const formatIcsDate = (dateStr: string) => {
													return new Date(dateStr)
														.toISOString()
														.replace(/-|:|\.\d+/g, "");
												};
												const start = formatIcsDate(event.eventStart);
												const end = formatIcsDate(
													event.eventEnd || event.eventStart,
												);
												const now = formatIcsDate(new Date().toISOString());
												const icsContent = [
													"BEGIN:VCALENDAR",
													"VERSION:2.0",
													"PRODID:-//MakeMyEvent//EN",
													"BEGIN:VEVENT",
													`UID:${event.title.replace(/\s+/g, "_")}-${start}@makemyevent.org`,
													`DTSTAMP:${now}`,
													`DTSTART:${start}`,
													`DTEND:${end}`,
													`SUMMARY:${event.title}`,
													`DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
													`LOCATION:${event.location || "Location TBA"}`,
													"END:VEVENT",
													"END:VCALENDAR",
												].join("\r\n");

												const blob = new Blob([icsContent], {
													type: "text/calendar;charset=utf-8",
												});
												const url = URL.createObjectURL(blob);
												const link = document.createElement("a");
												link.href = url;
												link.download = `${event.title.replace(/\s+/g, "_")}.ics`;
												document.body.appendChild(link);
												link.click();
												document.body.removeChild(link);
												URL.revokeObjectURL(url);
											}}
											title="Download calendar file (.ics)"
											className="w-11 h-11 rounded-lg border border-perforation bg-paper/60 hover:bg-perforation/40 flex items-center justify-center text-stamp shrink-0 shadow-xs cursor-pointer transition-colors"
										>
											<Calendar className="w-5 h-5" />
										</button>
										<div>
											<div className="font-semibold text-ink">
												{formattedStart}
											</div>
											{formattedTime && (
												<div className="text-xs opacity-70 mt-0.5">
													{formattedTime}
												</div>
											)}
										</div>
									</div>
								)}

								<div className="flex items-center gap-3">
									{event.location ? (
										<a
											href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
											target="_blank"
											rel="noopener noreferrer"
											title={`View ${event.location} on Google Maps`}
											className="w-11 h-11 rounded-lg border border-perforation bg-paper/60 hover:bg-perforation/40 flex items-center justify-center text-stamp shrink-0 shadow-xs transition-colors"
										>
											<MapPin className="w-5 h-5" />
										</a>
									) : (
										<div className="w-11 h-11 rounded-lg border border-perforation bg-paper/60 flex items-center justify-center text-stamp shrink-0 shadow-xs">
											<MapPin className="w-5 h-5" />
										</div>
									)}
									<div>
										{event.location ? (
											<a
												href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="font-semibold text-ink hover:text-stamp transition-colors"
											>
												{event.location}
											</a>
										) : (
											<div className="font-semibold text-ink">Location TBA</div>
										)}
									</div>
								</div>
							</div>

							{/* Primary CTA Buttons */}
							<div className="pt-2 flex flex-wrap items-center gap-3">
								<Link
									href={`/events/${event.slug}/rsvp`}
									className="px-7 py-3 bg-stamp hover:opacity-90 text-paper font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-2"
								>
									REGISTER
								</Link>
								{session?.user?.id === event.organizer.ownerId && (
									<Link
										href={`/events/${event.slug}/manage`}
										className="px-4 py-3 border border-perforation hover:bg-ink/5 text-ink rounded-xl font-display font-medium text-xs uppercase tracking-wider font-mono transition-colors"
									>
										Manage Event
									</Link>
								)}
							</div>
						</div>

						{/* Banner Poster Column (FOSS United Square Aspect Ratio Style) */}
						{event.bannerUrl && (
							<div className="sm:col-span-5 flex justify-center sm:justify-end">
								<div className="relative w-full max-w-[220px] sm:max-w-[260px] aspect-square rounded-xl overflow-hidden border border-perforation shadow-md">
									<Image
										src={event.bannerUrl}
										alt={`Poster banner for ${event.title}`}
										fill
										priority
										sizes="(max-width: 640px) 280px, 320px"
										className="object-cover"
									/>
									{ticketData?.stats?.totalConfirmed !== undefined && (
										<div className="absolute bottom-3 right-3 bg-paper/90 backdrop-blur-xs text-ink px-3 py-1 rounded-lg text-xs font-mono font-semibold border border-perforation shadow-xs flex items-center gap-1.5">
											<span className="w-2 h-2 rounded-full bg-stamp" />
											<span>
												{ticketData.stats.totalConfirmed}{" "}
												{ticketData.stats.totalConfirmed === 1
													? "Attending"
													: "Attending"}
											</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Main Content Layout */}
				<main className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8">
					{/* Left Column: About Event, Schedule, Sponsors */}
					<div className="sm:col-span-7 space-y-6 sm:space-y-8">
						{/* About Card */}
						<div className="border border-perforation rounded-2xl p-6 md:p-8 bg-paper space-y-4 shadow-xs">
							<h2 className="font-display font-semibold text-xl border-b border-perforation pb-3 flex items-center gap-2">
								<Info className="w-5 h-5 text-stamp" /> About Event
							</h2>
							{event.description ? (
								<div className="prose prose-sm max-w-none text-ink/90 leading-relaxed font-sans whitespace-pre-wrap">
									{event.description}
								</div>
							) : (
								<p className="opacity-60 text-sm">
									No detailed description provided by the host yet.
								</p>
							)}
						</div>

						{/* Schedule Items */}
						{scheduleData?.items && scheduleData.items.length > 0 && (
							<div className="space-y-4">
								<div className="flex items-center gap-2 border-b border-perforation pb-3">
									<Clock className="w-5 h-5 text-stamp" />
									<h2 className="font-display font-semibold text-xl">
										Schedule & Sessions
									</h2>
								</div>

								<div className="space-y-3">
									{scheduleData.items.map((item) => (
										<div
											key={item.id}
											className="p-4 border border-perforation rounded-xl bg-paper/60 space-y-1 hover:border-ink/20 transition-colors"
										>
											<div className="flex items-center justify-between gap-2 text-xs font-mono text-stamp">
												<span>
													{item.startTime} - {item.endTime}
												</span>
												{item.stage && (
													<span className="px-2 py-0.5 rounded bg-perforation/40 text-ink text-[10px]">
														{item.stage}
													</span>
												)}
											</div>
											<h3 className="font-display font-semibold text-base">
												{item.title}
											</h3>
											{item.speakerName && (
												<p className="text-xs text-stamp font-medium">
													By {item.speakerName}
												</p>
											)}
											{item.description && (
												<p className="text-xs opacity-75 pt-1">
													{item.description}
												</p>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Sponsors & Partners */}
						{partnerData?.sponsors && partnerData.sponsors.length > 0 && (
							<div className="space-y-4">
								<div className="flex items-center gap-2 border-b border-perforation pb-3">
									<Sparkles className="w-5 h-5 text-stamp" />
									<h2 className="font-display font-semibold text-xl">
										Event Partners & Sponsors
									</h2>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
									{partnerData.sponsors.map((sponsor) => (
										<div
											key={sponsor.id}
											className="p-4 border border-perforation rounded-lg bg-paper text-center space-y-2 flex flex-col items-center justify-center"
										>
											{sponsor.logoUrl ? (
												/* biome-ignore lint/performance/noImgElement: Dynamic sponsor logo */
												<img
													src={sponsor.logoUrl}
													alt={sponsor.name}
													className="h-10 object-contain max-w-full"
												/>
											) : (
												<span className="font-display font-semibold text-sm">
													{sponsor.name}
												</span>
											)}
											<span className="text-[10px] font-mono opacity-60 uppercase">
												{sponsor.tier || "Partner"}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Right Column: Volunteers & Contact Info Cards (FOSS United Style) */}
					<div className="sm:col-span-5 space-y-6">
						{/* Volunteers Card (FOSS United Style) */}
						{event.volunteers && event.volunteers.length > 0 && (
							<div className="border border-perforation rounded-2xl p-6 bg-paper space-y-4 shadow-xs">
								<h2 className="font-display font-semibold text-lg border-b border-perforation pb-3 flex items-center gap-2">
									<Users className="w-5 h-5 text-stamp" /> Volunteers
								</h2>
								<div className="space-y-3">
									{event.volunteers.map((vol) => {
										const volInitial = vol.name.charAt(0).toUpperCase();
										return (
											<div
												key={vol.id}
												className="flex items-center gap-3 p-2 rounded-lg hover:bg-perforation/20 transition-colors"
											>
												{vol.user?.image ? (
													/* biome-ignore lint/performance/noImgElement: User avatar */
													<img
														src={vol.user.image}
														alt={vol.name}
														className="w-9 h-9 rounded-full object-cover border border-perforation"
													/>
												) : (
													<div className="w-9 h-9 rounded-full bg-stamp/15 text-stamp flex items-center justify-center font-display font-semibold text-sm shrink-0 border border-stamp/20">
														{volInitial}
													</div>
												)}
												<div className="min-w-0">
													<div className="font-display font-semibold text-sm text-ink truncate">
														{vol.name}
													</div>
													{vol.role && (
														<div className="text-[11px] font-mono opacity-60 truncate">
															{vol.role}
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Contact Card (FOSS United Style) */}
						<div className="border border-perforation rounded-2xl p-6 bg-paper space-y-4 shadow-xs">
							<h2 className="font-display font-semibold text-lg border-b border-perforation pb-3 flex items-center gap-2">
								<Mail className="w-5 h-5 text-stamp" /> Contact Information
							</h2>
							<div className="space-y-2 text-xs font-mono">
								<p className="text-ink/70">
									Have questions about this event? Contact the organizing team:
								</p>
								<div className="pt-1 font-semibold text-stamp">
									{event.organizer.name}
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
			<SiteFooter />
		</div>
	);
}
