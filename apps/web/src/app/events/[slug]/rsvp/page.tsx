"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { trpc } from "@/lib/trpc";
import {
	AlertCircle,
	Calendar,
	Check,
	CheckCircle2,
	MapPin,
	Ticket as TicketIcon,
	ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { JSX } from "react";

export default function EventRsvpPage(): JSX.Element {
	const params = useParams();
	const _router = useRouter();
	const searchParams = useSearchParams();
	const { data: session } = useSession();

	const slug = params?.slug as string;
	const ticketParam = searchParams.get("ticket");

	const [selectedTierId, setSelectedTierId] = useState<string>("");
	const [attendeeName, setAttendeeName] = useState<string>("");
	const [attendeeEmail, setAttendeeEmail] = useState<string>("");
	const [attendeePhone, setAttendeePhone] = useState<string>("");
	const [bookingError, setBookingError] = useState<string | null>(null);

	const [completedTicketCode, setCompletedTicketCode] = useState<string | null>(
		null,
	);

	// Query Event data and ticket tiers
	const { data: ticketData, isLoading: ticketsLoading } =
		trpc.events.ticketsGet.useQuery({ slug }, { enabled: !!slug });

	// Auto-fill user name and email from session if logged in
	useEffect(() => {
		if (session?.user) {
			if (!attendeeName && session.user.name) {
				setAttendeeName(session.user.name);
			}
			if (!attendeeEmail && session.user.email) {
				setAttendeeEmail(session.user.email);
			}
		}
	}, [session, attendeeName, attendeeEmail]);

	// Auto-select tier
	useEffect(() => {
		if (ticketData?.tiers && ticketData.tiers.length > 0) {
			if (ticketParam) {
				const matching = ticketData.tiers.find(
					(t) =>
						t.id === ticketParam ||
						t.id?.toLowerCase() === ticketParam.toLowerCase(),
				);
				if (matching) {
					setSelectedTierId(matching.id);
					return;
				}
			}

			if (!selectedTierId) {
				const firstPublished = ticketData.tiers.find((t) => t.isPublished);
				if (firstPublished) {
					setSelectedTierId(firstPublished.id);
				}
			}
		}
	}, [ticketData, selectedTierId, ticketParam]);

	// Mutation to book ticket
	const { mutate: bookTicket, isPending: isBooking } =
		trpc.events.ticketBook.useMutation({
			onSuccess: (res) => {
				setCompletedTicketCode(res.ticketCode);
			},
			onError: (err) => {
				setBookingError(err.message);
			},
		});

	const handleBookingSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setBookingError(null);

		if (!selectedTierId) {
			setBookingError("Please select a ticket tier.");
			return;
		}

		if (!attendeeName.trim() || !attendeeEmail.trim()) {
			setBookingError("Full name and email are required.");
			return;
		}

		bookTicket({
			slug,
			tierId: selectedTierId,
			attendeeName: attendeeName.trim(),
			attendeeEmail: attendeeEmail.trim(),
			attendeePhone: attendeePhone.trim() || undefined,
		});
	};

	if (ticketsLoading) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 flex items-center justify-center p-6">
					<p className="animate-pulse opacity-60">Loading RSVP details...</p>
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
	const tiers = ticketData.tiers.filter((t) => t.isPublished);

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

			<div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
				{/* Breadcrumb Bar */}
				<div className="flex items-center gap-2 text-xs font-mono text-ink/60 truncate">
					<Link href="/" className="hover:text-stamp transition-colors">
						Home
					</Link>
					<span>/</span>
					<Link
						href={`/events/${event.slug}`}
						className="hover:text-stamp transition-colors truncate"
					>
						{event.title}
					</Link>
					<span>/</span>
					<span className="text-ink font-medium">RSVP</span>
				</div>

				{/* Dedicated RSVP Card (FOSS United Style) */}
				{completedTicketCode ? (
					<div className="border border-perforation rounded-2xl p-8 md:p-10 bg-paper shadow-md text-center space-y-6">
						<div className="w-16 h-16 rounded-full bg-stamp/10 text-stamp flex items-center justify-center mx-auto border border-stamp/20">
							<CheckCircle2 className="w-8 h-8 text-stamp" />
						</div>
						<div className="space-y-2">
							<h2 className="font-display font-bold text-2xl sm:text-3xl text-ink">
								You have successfully RSVP'd for this event!
							</h2>
							<p className="text-xs font-mono opacity-70 max-w-md mx-auto leading-relaxed">
								Your registration pass has been generated. If you need to make
								any changes or view your QR entry pass, click below.
							</p>
						</div>
						<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
							<Link
								href={`/tickets/${completedTicketCode}`}
								className="px-6 py-3 bg-stamp text-paper rounded-xl font-display font-semibold text-xs uppercase tracking-wider font-mono shadow-xs hover:opacity-90 transition-opacity"
							>
								View Digital Ticket Pass ↗
							</Link>
							<Link
								href={`/events/${event.slug}`}
								className="px-6 py-3 border border-perforation text-ink rounded-xl font-display font-semibold text-xs uppercase tracking-wider font-mono hover:bg-ink/5 transition-colors"
							>
								Go to Event Page
							</Link>
						</div>
					</div>
				) : (
					<div className="border border-perforation rounded-2xl p-6 sm:p-8 bg-paper shadow-md space-y-6">
						<div className="space-y-3">
							<Link
								href={`/events/${event.slug}`}
								className="inline-flex items-center gap-1.5 text-xs font-mono text-stamp hover:underline"
							>
								<ArrowLeft size={14} /> Back to Event Details
							</Link>

							<h1 className="font-display font-bold text-2xl sm:text-3xl text-ink leading-snug">
								RSVP for {event.title}
							</h1>

							<div className="flex items-center gap-2 pt-1">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-stamp/10 text-stamp border border-stamp/20 text-xs font-semibold uppercase tracking-wider font-mono">
									<span className="w-2 h-2 rounded-full bg-stamp animate-pulse" />
									{event.organizer.name}
								</span>
							</div>

							{/* Timing & Venue */}
							<div className="space-y-1.5 pt-2 text-xs font-mono text-ink/75">
								{formattedStart && (
									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-stamp shrink-0" />
										<span>
											{formattedStart}{" "}
											{formattedTime ? `at ${formattedTime}` : ""}
										</span>
									</div>
								)}
								<div className="flex items-center gap-2">
									<MapPin className="w-4 h-4 text-stamp shrink-0" />
									<span>{event.location || "Venue TBA"}</span>
								</div>
							</div>
						</div>

						<hr className="border-perforation" />

						{event.status !== "published" ? (
							<div className="border border-alert/30 bg-alert/5 p-6 rounded-xl text-center space-y-3">
								<AlertCircle className="w-8 h-8 text-alert mx-auto" />
								<h3 className="font-display font-semibold text-sm text-ink">
									RSVP Form is Not Active
								</h3>
								<p className="text-xs text-ink/70 leading-relaxed">
									This event is currently in draft mode. RSVPs are open only
									when the host publishes the event.
								</p>
							</div>
						) : (
							<>
								{bookingError && (
									<div className="bg-alert/10 text-alert p-3 rounded-lg text-xs flex items-center gap-2">
										<AlertCircle className="w-4 h-4 shrink-0" />
										{bookingError}
									</div>
								)}

								{tiers.length === 0 ? (
									<div className="text-center py-6 opacity-60 text-sm">
										No ticket tiers are currently available for registration.
									</div>
								) : (
									<form onSubmit={handleBookingSubmit} className="space-y-6">
										{/* Tier Selection */}
										{tiers.length > 1 && (
											<div className="space-y-2">
												<span className="block text-xs font-semibold uppercase tracking-wider opacity-80">
													Select Ticket Type
												</span>
												<div className="space-y-2">
													{tiers.map((t) => (
														<button
															type="button"
															key={t.id}
															onClick={() => setSelectedTierId(t.id)}
															className={`w-full p-3.5 border rounded-xl text-left cursor-pointer transition-all flex items-center justify-between gap-4 ${
																selectedTierId === t.id
																	? "border-stamp bg-stamp/5 ring-1 ring-stamp"
																	: "border-perforation bg-paper/60 hover:border-perforation/80"
															}`}
														>
															<span className="font-display font-semibold text-sm">
																{t.name}
															</span>
															<span className="font-mono text-xs font-semibold text-stamp">
																{t.price === 0 ? "FREE" : `₹${t.price}`}
															</span>
														</button>
													))}
												</div>
											</div>
										)}

										{/* Contact Inputs */}
										<div className="space-y-4">
											<div>
												<label
													htmlFor="rsvp-name"
													className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
												>
													Full Name *
												</label>
												<input
													id="rsvp-name"
													type="text"
													required
													value={attendeeName}
													onChange={(e) => setAttendeeName(e.target.value)}
													placeholder="Enter your full name"
													className="w-full px-3.5 py-2.5 border border-perforation rounded-lg bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
												/>
											</div>

											<div>
												<label
													htmlFor="rsvp-email"
													className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
												>
													Email Address *
												</label>
												<input
													id="rsvp-email"
													type="email"
													required
													value={attendeeEmail}
													onChange={(e) => setAttendeeEmail(e.target.value)}
													placeholder="your.email@example.com"
													className="w-full px-3.5 py-2.5 border border-perforation rounded-lg bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
												/>
											</div>

											<div>
												<label
													htmlFor="rsvp-phone"
													className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
												>
													Phone Number (Optional)
												</label>
												<input
													id="rsvp-phone"
													type="tel"
													value={attendeePhone}
													onChange={(e) => setAttendeePhone(e.target.value)}
													placeholder="+91 98765 43210"
													className="w-full px-3.5 py-2.5 border border-perforation rounded-lg bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp font-mono"
												/>
											</div>
										</div>

										{/* Submit CTA */}
										<button
											type="submit"
											disabled={isBooking}
											className="w-full py-3.5 bg-stamp text-paper rounded-xl font-display font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
										>
											{isBooking ? (
												<span className="animate-pulse">Registering...</span>
											) : (
												<>
													<Check className="w-4 h-4" />
													Confirm Registration
												</>
											)}
										</button>

										<p className="text-[11px] opacity-60 text-center font-mono">
											Instant digital ticket pass issued upon RSVP submission.
										</p>
									</form>
								)}
							</>
						)}
					</div>
				)}
			</div>

			<SiteFooter />
		</div>
	);
}
