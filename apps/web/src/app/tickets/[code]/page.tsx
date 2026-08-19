"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import {
	AlertCircle,
	Calendar,
	Check,
	Clock,
	Copy,
	MapPin,
	Printer,
	RefreshCw,
	Send,
	Share2,
	Ticket as TicketIcon,
	Trash2,
	UserCheck,
	X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { JSX } from "react";

export default function AttendeeTicketPage(): JSX.Element {
	const params = useParams();
	const ticketCode = params.code as string;

	// Query ticket details
	const {
		data: ticket,
		isLoading,
		error,
		refetch,
	} = trpc.events.ticketGetByCode.useQuery(
		{ ticketCode },
		{ enabled: !!ticketCode },
	);

	// QR Code data URL state
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

	// Modals & Action States
	const [isTransferOpen, setIsTransferOpen] = useState(false);
	const [recipientName, setRecipientName] = useState("");
	const [recipientEmail, setRecipientEmail] = useState("");
	const [transferSuccessUrl, setTransferSuccessUrl] = useState<string | null>(
		null,
	);
	const [transferError, setTransferError] = useState<string | null>(null);
	const [copiedTransferLink, setCopiedTransferLink] = useState(false);

	const [isDropOpen, setIsDropOpen] = useState(false);
	const [dropSuccessMessage, setDropSuccessMessage] = useState<string | null>(
		null,
	);

	// Mutations
	const { mutate: dropTicket, isPending: isDropping } =
		trpc.events.ticketDrop.useMutation({
			onSuccess: (res) => {
				setDropSuccessMessage(res.message);
				refetch();
				setIsDropOpen(false);
			},
			onError: (err) => {
				alert(err.message);
			},
		});

	const { mutate: initiateTransfer, isPending: isTransferring } =
		trpc.events.ticketTransferInitiate.useMutation({
			onSuccess: (res) => {
				const origin =
					typeof window !== "undefined" ? window.location.origin : "";
				setTransferSuccessUrl(
					`${origin}/tickets/transfer/${res.transferToken}`,
				);
				refetch();
			},
			onError: (err) => {
				setTransferError(err.message);
			},
		});

	// Generate QR Code image when qrToken is loaded
	useEffect(() => {
		if (ticket?.qrToken && ticket.status === "CONFIRMED") {
			QRCode.toDataURL(ticket.qrToken, {
				width: 320,
				margin: 2,
				color: {
					dark: "#000000",
					light: "#ffffff",
				},
			})
				.then((url) => setQrDataUrl(url))
				.catch((err) => console.error("QR Code Error:", err));
		}
	}, [ticket]);

	const handleTransferSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setTransferError(null);
		if (!recipientName.trim() || !recipientEmail.trim()) {
			setTransferError("Recipient name and email are required.");
			return;
		}

		initiateTransfer({
			ticketCode,
			recipientName: recipientName.trim(),
			recipientEmail: recipientEmail.trim(),
		});
	};

	const handleCopyTransferLink = () => {
		if (transferSuccessUrl) {
			navigator.clipboard.writeText(transferSuccessUrl);
			setCopiedTransferLink(true);
			setTimeout(() => setCopiedTransferLink(false), 2000);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 flex items-center justify-center p-6">
					<p className="animate-pulse opacity-60">Loading ticket pass...</p>
				</main>
			</div>
		);
	}

	if (error || !ticket) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 flex items-center justify-center p-6">
					<div className="text-center max-w-md border border-perforation p-8 rounded-lg">
						<TicketIcon className="w-12 h-12 text-alert mx-auto mb-3" />
						<h1 className="font-display font-semibold text-xl mb-2">
							Ticket Not Found
						</h1>
						<p className="opacity-60 text-sm mb-6">
							We could not find an active ticket with code{" "}
							<code className="font-mono">{ticketCode}</code>.
						</p>
						<Link
							href="/"
							className="px-4 py-2 bg-stamp text-paper rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
						>
							Return to Home
						</Link>
					</div>
				</main>
			</div>
		);
	}

	const event = ticket.event;
	const tier = ticket.ticket;
	const formattedStart = event.eventStart
		? new Date(event.eventStart).toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
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

			<main className="flex-1 max-w-xl mx-auto w-full p-4 md:py-12">
				{/* Status Alert Banner */}
				{dropSuccessMessage && (
					<div className="mb-6 bg-stamp/10 border border-stamp/30 text-stamp p-4 rounded-lg flex items-center gap-3 text-sm">
						<Check className="w-5 h-5 shrink-0 text-stamp" />
						{dropSuccessMessage}
					</div>
				)}

				{ticket.status === "WAITLISTED" && (
					<div className="mb-6 bg-perforation/40 border border-perforation text-ink p-4 rounded-lg space-y-1">
						<div className="flex items-center gap-2 font-semibold text-sm">
							<Clock className="w-4 h-4 text-stamp" />
							You are #{ticket.waitlistOrder} in line on the Waitlist
						</div>
						<p className="text-xs opacity-90">
							As soon as another attendee drops their ticket or capacity
							increases, you will be automatically promoted to Confirmed and
							issued your entry QR code.
						</p>
					</div>
				)}

				{ticket.status === "CHECKED_IN" && (
					<div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center gap-3 text-sm font-medium">
						<UserCheck className="w-5 h-5 shrink-0" />
						Checked in at venue desk on{" "}
						{ticket.checkedInAt
							? new Date(ticket.checkedInAt).toLocaleTimeString()
							: "Today"}
					</div>
				)}

				{ticket.status === "DROPPED" && (
					<div className="mb-6 bg-alert/10 border border-alert/30 text-alert p-4 rounded-lg flex items-center gap-3 text-sm font-medium">
						<AlertCircle className="w-5 h-5 shrink-0" />
						This ticket was dropped and is no longer valid for venue entry.
					</div>
				)}

				{/* ──────────────── Boarding Pass Card ──────────────── */}
				<div className="border border-perforation rounded-2xl overflow-hidden shadow-xl bg-paper transition-all">
					{/* Top Event Banner */}
					<div className="p-6 md:p-8 bg-paper border-b border-perforation space-y-4">
						<div className="flex items-center justify-between gap-4">
							<span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-stamp bg-stamp/10 px-2.5 py-1 rounded-full border border-stamp/20">
								{tier.name}
							</span>

							<div className="text-right">
								<span
									className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
										ticket.status === "CONFIRMED"
											? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
											: ticket.status === "WAITLISTED"
												? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
												: "bg-perforation/40 text-ink/60"
									}`}
								>
									{ticket.status}
								</span>
							</div>
						</div>

						<div>
							<h1 className="font-display font-bold text-2xl md:text-3xl leading-tight">
								{event.title}
							</h1>
							<p className="text-xs opacity-60 mt-1 font-mono">
								Hosted by {event.organizer.name}
							</p>
						</div>

						{/* Event Time & Location */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs opacity-80">
							{formattedStart && (
								<div className="flex items-center gap-2">
									<Calendar className="w-4 h-4 text-stamp shrink-0" />
									<span>
										{formattedStart} {formattedTime ? `• ${formattedTime}` : ""}
									</span>
								</div>
							)}

							<div className="flex items-center gap-2">
								<MapPin className="w-4 h-4 text-stamp shrink-0" />
								<span className="truncate">
									{event.isOnline
										? "Online Event"
										: event.location || "Venue TBA"}
								</span>
							</div>
						</div>
					</div>

					{/* Perforation Cutouts Divider */}
					<div className="relative flex items-center justify-between px-4 -my-3 z-10">
						<div className="w-6 h-6 rounded-full bg-paper border-r border-perforation -ml-7 shadow-inner" />
						<div className="flex-1 border-t-2 border-dashed border-perforation mx-2" />
						<div className="w-6 h-6 rounded-full bg-paper border-l border-perforation -mr-7 shadow-inner" />
					</div>

					{/* Attendee Details & QR Code Section */}
					<div className="p-6 md:p-8 bg-paper/60 space-y-6 flex flex-col items-center text-center">
						{/* Attendee Info */}
						<div className="space-y-1">
							<span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
								Ticket Holder
							</span>
							<h2 className="font-display font-semibold text-xl">
								{ticket.attendeeName}
							</h2>
							<p className="text-xs font-mono opacity-70">
								{ticket.attendeeEmail}
							</p>
						</div>

						{/* QR Code Container */}
						{ticket.status === "CONFIRMED" && qrDataUrl ? (
							<div className="bg-white p-4 rounded-xl border border-perforation shadow-md space-y-2 flex flex-col items-center">
								{/* biome-ignore lint/performance/noImgElement: Client-side generated QR data URL */}
								<img
									src={qrDataUrl}
									alt="Ticket Verification QR Code"
									className="w-56 h-56 md:w-64 md:h-64 object-contain"
								/>
								<span className="text-[10px] font-mono font-bold tracking-widest text-black/60 uppercase">
									{ticket.ticketCode}
								</span>
							</div>
						) : ticket.status === "WAITLISTED" ? (
							<div className="p-8 border border-dashed border-amber-500/40 rounded-xl bg-amber-500/5 max-w-xs space-y-2">
								<Clock className="w-12 h-12 text-amber-500 mx-auto" />
								<h3 className="font-display font-semibold text-sm text-amber-700 dark:text-amber-300">
									Waitlist Queue Active
								</h3>
								<p className="text-[11px] opacity-75">
									Entry QR code will be revealed as soon as your pass is
									promoted to confirmed.
								</p>
							</div>
						) : (
							<div className="p-8 border border-dashed border-perforation rounded-xl max-w-xs space-y-2 opacity-50">
								<TicketIcon className="w-12 h-12 mx-auto" />
								<p className="text-xs font-mono uppercase">{ticket.status}</p>
							</div>
						)}

						{/* Instructions */}
						<p className="text-xs opacity-60 max-w-xs">
							Show this QR code at the event check-in desk for entry.
						</p>
					</div>

					{/* Bottom Action Footer */}
					{ticket.status === "CONFIRMED" && (
						<div className="p-4 bg-paper border-t border-perforation grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-medium">
							<button
								type="button"
								onClick={() => window.print()}
								className="p-2.5 rounded-md border border-perforation hover:bg-perforation/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
							>
								<Printer className="w-4 h-4 opacity-70" />
								Print Pass
							</button>

							{tier.allowTransfer && (
								<button
									type="button"
									onClick={() => {
										setTransferSuccessUrl(null);
										setIsTransferOpen(true);
									}}
									className="p-2.5 rounded-md border border-perforation hover:bg-perforation/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
								>
									<Share2 className="w-4 h-4 text-stamp" />
									Transfer
								</button>
							)}

							{tier.allowDrop && (
								<button
									type="button"
									onClick={() => setIsDropOpen(true)}
									className="p-2.5 rounded-md border border-alert/30 text-alert hover:bg-alert/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
								>
									<Trash2 className="w-4 h-4" />
									Drop Ticket
								</button>
							)}
						</div>
					)}
				</div>
			</main>

			{/* ──────────────── Transfer Ticket Modal ──────────────── */}
			{isTransferOpen && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-paper border border-perforation rounded-lg max-w-md w-full p-6 shadow-2xl space-y-6">
						<div className="flex items-center justify-between border-b border-perforation pb-4">
							<h3 className="font-display font-semibold text-lg flex items-center gap-2">
								<Share2 className="w-5 h-5 text-stamp" />
								Transfer Ticket
							</h3>
							<button
								type="button"
								onClick={() => setIsTransferOpen(false)}
								className="p-1 hover:bg-perforation/20 rounded"
							>
								<X className="w-4 h-4 opacity-70" />
							</button>
						</div>

						{transferSuccessUrl ? (
							<div className="space-y-4">
								<div className="bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 p-4 rounded-md space-y-1">
									<div className="flex items-center gap-2 font-semibold text-sm">
										<Check className="w-4 h-4" />
										Transfer Claim Link Created!
									</div>
									<p className="text-xs opacity-90">
										Share this link with {recipientName}. Once accepted, their
										pass will be activated and your old QR will be safely
										invalidated.
									</p>
								</div>

								<div className="flex items-center gap-2 border border-perforation rounded-md p-2 bg-paper/60 font-mono text-xs">
									<input
										type="text"
										readOnly
										value={transferSuccessUrl}
										className="flex-1 bg-transparent border-none outline-none truncate"
									/>
									<button
										type="button"
										onClick={handleCopyTransferLink}
										className="px-3 py-1 bg-stamp text-paper rounded text-xs hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0"
									>
										{copiedTransferLink ? (
											<>
												<Check className="w-3.5 h-3.5" /> Copied
											</>
										) : (
											<>
												<Copy className="w-3.5 h-3.5" /> Copy Link
											</>
										)}
									</button>
								</div>

								<button
									type="button"
									onClick={() => setIsTransferOpen(false)}
									className="w-full py-2 bg-perforation/30 hover:bg-perforation/50 rounded text-xs font-medium transition-colors"
								>
									Done
								</button>
							</div>
						) : (
							<form onSubmit={handleTransferSubmit} className="space-y-4">
								<p className="text-xs opacity-70">
									Enter the details of the person you want to transfer this
									ticket to. A secure claim link will be created for them.
								</p>

								{transferError && (
									<div className="bg-alert/10 text-alert p-3 rounded text-xs flex items-center gap-2">
										<AlertCircle className="w-4 h-4 shrink-0" />
										{transferError}
									</div>
								)}

								<div>
									<label
										htmlFor="recipient-name-input"
										className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
									>
										Recipient Name *
									</label>
									<input
										id="recipient-name-input"
										type="text"
										required
										value={recipientName}
										onChange={(e) => setRecipientName(e.target.value)}
										placeholder="e.g. Maya Sharma"
										className="w-full px-3 py-2 border border-perforation rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
									/>
								</div>

								<div>
									<label
										htmlFor="recipient-email-input"
										className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
									>
										Recipient Email *
									</label>
									<input
										id="recipient-email-input"
										type="email"
										required
										value={recipientEmail}
										onChange={(e) => setRecipientEmail(e.target.value)}
										placeholder="e.g. maya@example.com"
										className="w-full px-3 py-2 border border-perforation rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
									/>
								</div>

								<div className="flex items-center justify-end gap-3 pt-4 border-t border-perforation">
									<button
										type="button"
										onClick={() => setIsTransferOpen(false)}
										className="px-4 py-2 border border-perforation rounded-md text-sm hover:bg-perforation/20 transition-colors"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isTransferring}
										className="px-4 py-2 bg-stamp text-paper rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
									>
										{isTransferring ? (
											<>
												<RefreshCw className="w-4 h-4 animate-spin" />
												Generating...
											</>
										) : (
											<>
												<Send className="w-4 h-4" />
												Generate Claim Link
											</>
										)}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}

			{/* ──────────────── Drop Ticket Confirmation Modal ──────────────── */}
			{isDropOpen && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-paper border border-perforation rounded-lg max-w-md w-full p-6 shadow-2xl space-y-6">
						<div className="flex items-center justify-between border-b border-perforation pb-4">
							<h3 className="font-display font-semibold text-lg text-alert flex items-center gap-2">
								<Trash2 className="w-5 h-5" />
								Drop Your Ticket?
							</h3>
							<button
								type="button"
								onClick={() => setIsDropOpen(false)}
								className="p-1 hover:bg-perforation/20 rounded"
							>
								<X className="w-4 h-4 opacity-70" />
							</button>
						</div>

						<div className="space-y-3 text-sm opacity-80">
							<p>
								If you can no longer attend <strong>{event.title}</strong>,
								dropping your ticket allows someone on the{" "}
								<strong>Waitlist</strong> to automatically take your seat!
							</p>
							<p className="text-xs text-alert font-medium">
								Note: This action is permanent. Your entry QR code will be
								deactivated immediately.
							</p>
						</div>

						<div className="flex items-center justify-end gap-3 pt-4 border-t border-perforation">
							<button
								type="button"
								onClick={() => setIsDropOpen(false)}
								className="px-4 py-2 border border-perforation rounded-md text-sm hover:bg-perforation/20 transition-colors"
							>
								Keep My Ticket
							</button>
							<button
								type="button"
								onClick={() => dropTicket({ ticketCode })}
								disabled={isDropping}
								className="px-4 py-2 bg-alert text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
							>
								{isDropping ? (
									<>
										<RefreshCw className="w-4 h-4 animate-spin" />
										Dropping...
									</>
								) : (
									<>
										<Trash2 className="w-4 h-4" />
										Yes, Drop Ticket
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
