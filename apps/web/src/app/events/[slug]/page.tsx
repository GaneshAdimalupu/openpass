"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import {
	AlertCircle,
	Calendar,
	Check,
	Clock,
	CreditCard,
	MapPin,
	RefreshCw,
	Sparkles,
	Ticket as TicketIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { JSX } from "react";

export default function PublicEventPage(): JSX.Element {
	const params = useParams();
	const router = useRouter();
	const slug = params.slug as string;
	const { data: session } = useSession();
	const searchParams = useSearchParams();
	const ticketParam = searchParams.get("ticket");

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

	// Booking form state
	const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
	const [attendeeName, setAttendeeName] = useState("");
	const [attendeeEmail, setAttendeeEmail] = useState("");
	const [attendeePhone, setAttendeePhone] = useState("");
	const [bookingError, setBookingError] = useState<string | null>(null);

	// Pre-fill user details if logged in
	useEffect(() => {
		if (session?.user) {
			if (session.user.name && !attendeeName) {
				setAttendeeName(session.user.name);
			}
			if (session.user.email && !attendeeEmail) {
				setAttendeeEmail(session.user.email);
			}
		}
	}, [session, attendeeName, attendeeEmail]);

	// Auto-select tier (match ?ticket= query param or default to first available General Pass)
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
				router.push(`/tickets/${res.ticketCode}`);
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
	const tiers = ticketData.tiers.filter((t) => t.isPublished);
	const selectedTier = tiers.find((t) => t.id === selectedTierId);

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

			{/* Hero & Overview Section */}
			<section className="border-b border-perforation bg-paper/50 py-10 md:py-16">
				<div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
					{/* Badges */}
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-[11px] font-mono uppercase tracking-wider bg-stamp/10 text-stamp font-semibold px-2.5 py-1 rounded-full border border-stamp/20">
							{event.organizer.name}
						</span>
						{event.location && (
							<span className="text-[11px] font-mono opacity-70 bg-perforation/30 px-2.5 py-1 rounded-full">
								{event.location}
							</span>
						)}
					</div>

					{/* Title */}
					<h1 className="font-display font-bold text-3xl md:text-5xl leading-tight max-w-4xl">
						{event.title}
					</h1>

					{/* Meta Grid */}
					<div className="flex flex-wrap items-center gap-6 text-sm opacity-80 pt-2 font-mono">
						{formattedStart && (
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-stamp" />
								<span>
									{formattedStart} {formattedTime ? `at ${formattedTime}` : ""}
								</span>
							</div>
						)}
						<div className="flex items-center gap-2">
							<MapPin className="w-4 h-4 text-stamp" />
							<span>{event.location || "Venue TBA"}</span>
						</div>
					</div>
				</div>
			</section>

			{/* Main Content Layout */}
			<main className="max-w-6xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
				{/* Left Column: Event Details, Schedule, Sponsors */}
				<div className="lg:col-span-7 space-y-10">
					{/* Schedule Items */}
					{scheduleData?.items && scheduleData.items.length > 0 && (
						<div className="space-y-4">
							<div className="flex items-center gap-2 border-b border-perforation pb-3">
								<Clock className="w-5 h-5 text-stamp" />
								<h2 className="font-display font-semibold text-xl">
									Event Schedule
								</h2>
							</div>

							<div className="space-y-3">
								{scheduleData.items.map((item) => (
									<div
										key={item.id}
										className="p-4 border border-perforation rounded-lg bg-paper/60 space-y-1 hover:border-stamp/40 transition-colors"
									>
										<div className="flex items-center justify-between gap-2 text-xs font-mono opacity-70">
											<span>
												{item.startTime} – {item.endTime}
											</span>
											{item.stage && (
												<span className="bg-perforation/40 px-2 py-0.5 rounded text-[10px]">
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

				{/* Right Column: Ticketing & Registration Box */}
				<div className="lg:col-span-5">
					<div className="sticky top-20 border border-perforation rounded-2xl p-6 md:p-8 bg-paper shadow-xl space-y-6">
						<div className="border-b border-perforation pb-4">
							<div className="flex items-center gap-2 text-stamp mb-1">
								<TicketIcon className="w-5 h-5" />
								<span className="text-xs font-mono font-semibold uppercase tracking-wider">
									Get Your Pass
								</span>
							</div>
							<h2 className="font-display font-bold text-2xl">
								Register for Event
							</h2>
						</div>

						{bookingError && (
							<div className="bg-alert/10 text-alert p-3 rounded text-xs flex items-center gap-2">
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
								{/* Tier Selector */}
								<div className="space-y-3">
									<span className="block text-xs font-semibold uppercase tracking-wider opacity-80">
										Select Ticket Type
									</span>

									<div className="space-y-2">
										{tiers.map((t) => {
											const isSelected = selectedTierId === t.id;
											const isSoldOut = t.isSoldOut;

											return (
												<button
													type="button"
													key={t.id}
													onClick={() => setSelectedTierId(t.id)}
													className={`w-full p-4 border rounded-xl text-left cursor-pointer transition-all flex items-center justify-between gap-4 ${
														isSelected
															? "border-stamp bg-stamp/5 shadow-xs ring-1 ring-stamp"
															: "border-perforation hover:border-perforation/80 bg-paper/60"
													}`}
												>
													<div className="space-y-1 min-w-0">
														<div className="flex items-center gap-2">
															<span className="font-display font-semibold text-sm">
																{t.name}
															</span>
															{isSoldOut && (
																<span className="text-[10px] font-mono uppercase bg-alert/10 text-alert px-1.5 py-0.5 rounded font-semibold">
																	Sold Out
																</span>
															)}
														</div>
														{t.description && (
															<p className="text-xs opacity-70 truncate max-w-xs">
																{t.description}
															</p>
														)}
														{isSoldOut && t.allowWaitlist && (
															<p className="text-[11px] text-ink/70 font-mono">
																Waitlist queue active
															</p>
														)}
													</div>

													<div className="text-right shrink-0">
														<span className="font-display font-bold text-base">
															{t.price === 0 ? "FREE" : `₹${t.price}`}
														</span>
													</div>
												</button>
											);
										})}
									</div>
								</div>

								{/* Attendee Input Fields */}
								<div className="space-y-3 pt-2">
									<div>
										<label
											htmlFor="public-booking-name-input"
											className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
										>
											Full Name *
										</label>
										<input
											id="public-booking-name-input"
											type="text"
											required
											value={attendeeName}
											onChange={(e) => setAttendeeName(e.target.value)}
											placeholder="e.g. Alex Morgan"
											className="w-full px-3 py-2 border border-perforation rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
										/>
									</div>

									<div>
										<label
											htmlFor="public-booking-email-input"
											className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
										>
											Email Address *
										</label>
										<input
											id="public-booking-email-input"
											type="email"
											required
											value={attendeeEmail}
											onChange={(e) => setAttendeeEmail(e.target.value)}
											placeholder="e.g. alex@example.com"
											className="w-full px-3 py-2 border border-perforation rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
										/>
									</div>

									<div>
										<label
											htmlFor="public-booking-phone-input"
											className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
										>
											Phone Number (Optional)
										</label>
										<input
											id="public-booking-phone-input"
											type="tel"
											value={attendeePhone}
											onChange={(e) => setAttendeePhone(e.target.value)}
											placeholder="+91 98765 43210"
											className="w-full px-3 py-2 border border-perforation rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp font-mono"
										/>
									</div>
								</div>

								{/* Attendee Pricing Summary for Paid Pass */}
								{selectedTier &&
									selectedTier.price > 0 &&
									!selectedTier.isSoldOut && (
										<div className="p-3.5 rounded-xl border border-perforation bg-paper/80 space-y-1.5 font-mono text-xs">
											<div className="flex items-center justify-between text-ink/70">
												<span>Pass Price:</span>
												<span>₹{selectedTier.price.toFixed(2)}</span>
											</div>
											<div className="flex items-center justify-between text-ink/70">
												<span>Taxes & Gateway Fees:</span>
												<span className="text-stamp font-semibold">
													Included
												</span>
											</div>
											<div className="border-t border-perforation pt-1.5 flex items-center justify-between font-bold text-sm text-ink">
												<span className="font-sans">Total Payable:</span>
												<span className="text-stamp">
													₹{selectedTier.price.toFixed(2)}
												</span>
											</div>
										</div>
									)}

								{/* Submit Action */}
								<button
									type="submit"
									disabled={isBooking}
									className="w-full py-3.5 bg-stamp text-paper rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg cursor-pointer"
								>
									{isBooking ? (
										<>
											<RefreshCw className="w-4 h-4 animate-spin" />
											Processing Registration...
										</>
									) : selectedTier?.isSoldOut ? (
										<>
											<Clock className="w-4 h-4" />
											Join Waitlist Queue
										</>
									) : selectedTier && selectedTier.price > 0 ? (
										<>
											<CreditCard className="w-4 h-4" />
											Proceed to Pay ₹{selectedTier.price.toFixed(2)} & Get Pass
										</>
									) : (
										<>
											<Check className="w-4 h-4" />
											Confirm Free Pass
										</>
									)}
								</button>

								<p className="text-[11px] opacity-60 text-center font-mono">
									Instant QR code pass issued upon registration.
								</p>
							</form>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
