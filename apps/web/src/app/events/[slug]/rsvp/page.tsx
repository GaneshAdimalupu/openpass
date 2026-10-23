"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { TicketPassModal } from "@/components/tickets/ticket-pass-modal";
import { trpc } from "@/lib/trpc";
import {
	AlertCircle,
	Calendar,
	Check,
	CheckCircle2,
	Info,
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
	// Map of custom question id -> answer string
	const [customAnswers, setCustomAnswers] = useState<Record<string, string>>(
		{},
	);

	const [completedTicketCode, setCompletedTicketCode] = useState<string | null>(
		null,
	);
	const [isPassModalOpen, setIsPassModalOpen] = useState<boolean>(false);

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
			onSuccess: async (res) => {
				setCompletedTicketCode(res.ticketCode);
				// Best-effort: set the guest RSVP cookie so this browser can
				// participate in QR chain check-in without needing an account.
				// Signed-in users benefit from their account instead; the cookie
				// is a fallback and works only in this browser.
				try {
					await fetch("/api/guest-rsvp-init", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ticketCode: res.ticketCode }),
					});
				} catch {
					// Non-critical — guest check-in is optional.
				}
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

		// Validate mandatory custom questions
		const customQuestions = ticketData?.rsvpForm?.customQuestions ?? [];
		for (const q of customQuestions) {
			if (q.isMandatory && !customAnswers[q.id]?.trim()) {
				setBookingError(`"${q.question}" is required.`);
				return;
			}
		}

		// Serialize custom answers only when there are questions
		const answersPayload =
			customQuestions.length > 0
				? JSON.stringify(
						customQuestions.map((q) => ({
							questionId: q.id,
							question: q.question,
							answer: customAnswers[q.id]?.trim() ?? "",
						})),
					)
				: undefined;

		bookTicket({
			slug,
			tierId: selectedTierId,
			attendeeName: attendeeName.trim(),
			attendeeEmail: attendeeEmail.trim(),
			attendeePhone: attendeePhone.trim() || undefined,
			answers: answersPayload,
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

				{/* Dynamic SEO Title */}
				<title>{`RSVP for ${event.title} | makemyevent`}</title>

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
							<button
								type="button"
								onClick={() => setIsPassModalOpen(true)}
								className="px-6 py-3 bg-stamp text-paper rounded-xl font-display font-semibold text-xs uppercase tracking-wider font-mono shadow-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
							>
								<TicketIcon className="w-4 h-4" />
								View Digital Ticket Pass
							</button>
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

						{/* Guest disclaimer — sign-in recommended for cross-device access */}
						{!session && (
							<div className="flex items-start gap-3 rounded-xl border border-perforation bg-stamp/5 p-4 text-xs font-mono text-ink/70">
								<Info className="mt-0.5 h-4 w-4 shrink-0 text-stamp" />
								<p>
									You are registering as a guest. Your QR chain check-in will
									work in this browser only.{" "}
									<Link
										href={`/login?callbackUrl=${encodeURIComponent(`/events/${event.slug}/rsvp`)}`}
										className="font-semibold text-stamp underline underline-offset-2 hover:opacity-80"
									>
										Sign in
									</Link>{" "}
									if you want to access your registration from any device.
								</p>
							</div>
						)}

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

										{/* Custom Questions from RSVP form */}
										{(ticketData?.rsvpForm?.customQuestions ?? []).map((q) => (
											<div key={q.id}>
												<label
													htmlFor={`custom-q-${q.id}`}
													className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
												>
													{q.question}
													{q.isMandatory ? (
														<span className="text-alert ml-1">*</span>
													) : (
														<span className="text-ink/40 ml-1 normal-case tracking-normal font-normal">
															(Optional)
														</span>
													)}
												</label>
												{q.description && (
													<p className="text-xs text-ink/60 mb-1.5 font-normal normal-case tracking-normal">
														{q.description}
													</p>
												)}
												{q.type === "Select" ? (
													<select
														id={`custom-q-${q.id}`}
														required={q.isMandatory}
														value={customAnswers[q.id] ?? ""}
														onChange={(e) =>
															setCustomAnswers((prev) => ({
																...prev,
																[q.id]: e.target.value,
															}))
														}
														className="w-full px-3.5 py-2.5 border border-perforation rounded-lg bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
													>
														<option value="">— Select an option —</option>
														{(q.options ?? "")
															.split("\n")
															.map((opt) => opt.trim())
															.filter(Boolean)
															.map((opt) => (
																<option key={opt} value={opt}>
																	{opt}
																</option>
															))}
													</select>
												) : q.type === "Long Text" ||
													q.type === "Text Editor" ? (
													<textarea
														id={`custom-q-${q.id}`}
														required={q.isMandatory}
														rows={3}
														value={customAnswers[q.id] ?? ""}
														onChange={(e) =>
															setCustomAnswers((prev) => ({
																...prev,
																[q.id]: e.target.value,
															}))
														}
														className="w-full px-3.5 py-2.5 border border-perforation rounded-lg bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp resize-none"
													/>
												) : q.type === "Check" ? (
													<label className="flex items-center gap-2 cursor-pointer mt-1">
														<input
															id={`custom-q-${q.id}`}
															type="checkbox"
															checked={customAnswers[q.id] === "true"}
															onChange={(e) =>
																setCustomAnswers((prev) => ({
																	...prev,
																	[q.id]: e.target.checked ? "true" : "false",
																}))
															}
															className="w-4 h-4 rounded border-perforation text-stamp focus:ring-stamp"
														/>
														<span className="text-sm text-ink">Yes</span>
													</label>
												) : (
													<input
														id={`custom-q-${q.id}`}
														type="text"
														required={q.isMandatory}
														value={customAnswers[q.id] ?? ""}
														onChange={(e) =>
															setCustomAnswers((prev) => ({
																...prev,
																[q.id]: e.target.value,
															}))
														}
														className="w-full px-3.5 py-2.5 border border-perforation rounded-lg bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
													/>
												)}
											</div>
										))}

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

			<TicketPassModal
				ticketCode={isPassModalOpen ? completedTicketCode : null}
				onClose={() => setIsPassModalOpen(false)}
			/>
		</div>
	);
}
