"use client";

import { trpc } from "@/lib/trpc";
import {
	AlertCircle,
	Calendar,
	Check,
	Clock,
	Copy,
	MapPin,
	Printer,
	Share2,
	Ticket as TicketIcon,
	Trash2,
	UserCheck,
	X,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { JSX } from "react";

export interface TicketPassModalProps {
	ticketCode: string | null;
	onClose: () => void;
}

export function TicketPassModal({
	ticketCode,
	onClose,
}: TicketPassModalProps): JSX.Element | null {
	const {
		data: ticket,
		isLoading,
		error,
		refetch,
	} = trpc.events.ticketGetByCode.useQuery(
		{ ticketCode: ticketCode ?? "" },
		{ enabled: !!ticketCode },
	);

	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

	// Modals & Action States
	const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
	const [recipientName, setRecipientName] = useState<string>("");
	const [recipientEmail, setRecipientEmail] = useState<string>("");
	const [transferSuccessUrl, setTransferSuccessUrl] = useState<string | null>(
		null,
	);
	const [transferError, setTransferError] = useState<string | null>(null);
	const [copiedTransferLink, setCopiedTransferLink] = useState<boolean>(false);

	const [isDropOpen, setIsDropOpen] = useState<boolean>(false);
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

	if (!ticketCode) return null;

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

	const event = ticket?.event;
	const tier = ticket?.ticket;
	const isExpired = event?.eventEnd
		? new Date(event.eventEnd) < new Date()
		: false;

	const formattedStart = event?.eventStart
		? new Date(event.eventStart).toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const formattedTime = event?.eventStart
		? new Date(event.eventStart).toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
			})
		: null;

	return (
		<div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
			<div className="relative w-full max-w-lg bg-paper border border-perforation rounded-2xl shadow-2xl overflow-hidden my-8">
				{/* Top Modal Navigation / Close Button */}
				<div className="flex items-center justify-between p-4 border-b border-perforation bg-paper">
					<div className="flex items-center gap-2 text-xs font-mono font-semibold text-ink/70">
						<TicketIcon className="w-4 h-4 text-stamp" />
						<span>Ticket Digital Pass</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-perforation/30 transition-colors text-ink/70 hover:text-ink cursor-pointer"
						aria-label="Close ticket pass modal"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-4 md:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
					{isLoading && (
						<div className="py-16 text-center space-y-3">
							<TicketIcon className="w-8 h-8 text-stamp animate-bounce mx-auto" />
							<p className="font-mono text-xs opacity-60">
								Loading ticket pass...
							</p>
						</div>
					)}

					{error && (
						<div className="text-center p-8 border border-perforation rounded-xl space-y-3">
							<AlertCircle className="w-10 h-10 text-alert mx-auto" />
							<h3 className="font-display font-semibold text-base">
								Failed to Load Pass
							</h3>
							<p className="text-xs text-ink/70">{error.message}</p>
						</div>
					)}

					{ticket && event && tier && (
						<>
							{/* Status Alert Banners */}
							{dropSuccessMessage && (
								<div className="bg-stamp/10 border border-stamp/30 text-stamp p-4 rounded-lg flex items-center gap-3 text-xs">
									<Check className="w-4 h-4 shrink-0 text-stamp" />
									{dropSuccessMessage}
								</div>
							)}

							{isExpired && ticket.status !== "DROPPED" && (
								<div className="bg-perforation/40 border border-perforation text-ink/80 p-3 rounded-lg flex items-center gap-2 text-xs font-medium">
									<Clock className="w-4 h-4 shrink-0 opacity-60 text-ink" />
									This event has ended. Ticket pass is expired.
								</div>
							)}

							{ticket.status === "WAITLISTED" && !isExpired && (
								<div className="bg-perforation/40 border border-perforation text-ink p-4 rounded-lg space-y-1">
									<div className="flex items-center gap-2 font-semibold text-xs">
										<Clock className="w-4 h-4 text-stamp" />
										You are #{ticket.waitlistOrder} on the Waitlist
									</div>
									<p className="text-[11px] opacity-80">
										Entry QR code will be generated as soon as your pass is
										confirmed.
									</p>
								</div>
							)}

							{ticket.status === "CHECKED_IN" && (
								<div className="bg-stamp/10 border border-stamp/30 text-stamp p-3 rounded-lg flex items-center gap-2 text-xs font-medium">
									<UserCheck className="w-4 h-4 shrink-0" />
									Checked in at venue desk
								</div>
							)}

							{ticket.status === "DROPPED" && (
								<div className="bg-alert/10 border border-alert/30 text-alert p-3 rounded-lg flex items-center gap-2 text-xs font-medium">
									<AlertCircle className="w-4 h-4 shrink-0" />
									Ticket dropped and no longer valid.
								</div>
							)}

							{/* Ticket Stub Card */}
							<div
								className={`border border-perforation rounded-xl overflow-hidden bg-paper shadow-sm ${
									isExpired ? "opacity-90" : ""
								}`}
							>
								{/* Header */}
								<div className="p-6 bg-paper border-b border-perforation space-y-3">
									<div className="flex items-center justify-between gap-2">
										<span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-stamp bg-stamp/10 px-2 py-0.5 rounded-full border border-stamp/20">
											{tier.name}
										</span>
										<span
											className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
												isExpired
													? "bg-perforation/40 text-ink/60 border border-perforation"
													: ticket.status === "CONFIRMED"
														? "bg-stamp/10 text-stamp border border-stamp/30"
														: ticket.status === "WAITLISTED"
															? "bg-perforation/40 text-ink border border-perforation"
															: "bg-perforation/40 text-ink/60"
											}`}
										>
											{isExpired ? "EXPIRED" : ticket.status}
										</span>
									</div>

									<div>
										<h2 className="font-display font-bold text-xl leading-tight">
											{event.title}
										</h2>
										<p className="text-xs opacity-60 mt-0.5 font-mono">
											Hosted by {event.organizer.name}
										</p>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs opacity-80">
										{formattedStart && (
											<div className="flex items-center gap-1.5">
												<Calendar className="w-3.5 h-3.5 text-stamp shrink-0" />
												<span className="truncate">
													{formattedStart}{" "}
													{formattedTime ? `• ${formattedTime}` : ""}
												</span>
											</div>
										)}
										<div className="flex items-center gap-1.5">
											<MapPin className="w-3.5 h-3.5 text-stamp shrink-0" />
											<span className="truncate">
												{event.isOnline
													? "Online Event"
													: event.location || "Venue TBA"}
											</span>
										</div>
									</div>
								</div>

								{/* Tear Line Perforation Divider */}
								<div className="relative flex items-center justify-between px-4 -my-3 z-10">
									<div className="w-5 h-5 rounded-full bg-paper border-r border-perforation -ml-6" />
									<div className="flex-1 border-t-2 border-dashed border-perforation mx-2" />
									<div className="w-5 h-5 rounded-full bg-paper border-l border-perforation -mr-6" />
								</div>

								{/* QR & Attendee Details */}
								<div className="p-6 bg-paper/60 space-y-4 flex flex-col items-center text-center">
									<div className="space-y-0.5">
										<span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
											Pass Holder
										</span>
										<h3 className="font-display font-semibold text-lg">
											{ticket.attendeeName}
										</h3>
										<p className="text-xs font-mono opacity-70">
											{ticket.attendeeEmail}
										</p>
									</div>

									{ticket.status === "CONFIRMED" && qrDataUrl ? (
										<div className="bg-paper p-3 rounded-xl border border-perforation shadow-xs space-y-1.5 flex flex-col items-center relative">
											{/* biome-ignore lint/performance/noImgElement: Client-side QR code preview */}
											<img
												src={qrDataUrl}
												alt="Ticket QR Code"
												className="w-48 h-48 md:w-56 md:h-56 object-contain"
											/>
											<span className="text-[10px] font-mono font-bold tracking-widest text-ink/70 uppercase">
												{ticket.ticketCode}
											</span>
										</div>
									) : ticket.status === "WAITLISTED" ? (
										<div className="p-6 border border-dashed border-perforation rounded-xl bg-paper/40 max-w-xs space-y-2">
											<Clock className="w-8 h-8 text-ink/60 mx-auto" />
											<h4 className="font-display font-semibold text-xs text-ink">
												Waitlist Queue Active
											</h4>
										</div>
									) : (
										<div className="p-6 border border-dashed border-perforation rounded-xl max-w-xs space-y-2 opacity-50">
											<TicketIcon className="w-8 h-8 mx-auto" />
											<p className="text-xs font-mono uppercase">
												{ticket.status}
											</p>
										</div>
									)}
								</div>

								{/* Action Buttons */}
								{ticket.status === "CONFIRMED" && (
									<div className="p-3 bg-paper border-t border-perforation grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-medium">
										<button
											type="button"
											onClick={() => window.print()}
											className="p-2 rounded border border-perforation hover:bg-perforation/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
										>
											<Printer className="w-4 h-4 opacity-70" />
											Print Pass
										</button>

										{!isExpired && tier.allowTransfer && (
											<button
												type="button"
												onClick={() => {
													setTransferSuccessUrl(null);
													setIsTransferOpen(true);
												}}
												className="p-2 rounded border border-perforation hover:bg-perforation/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
											>
												<Share2 className="w-4 h-4 text-stamp" />
												Transfer
											</button>
										)}

										{!isExpired && tier.allowDrop && (
											<button
												type="button"
												onClick={() => setIsDropOpen(true)}
												className="p-2 rounded border border-alert/30 text-alert hover:bg-alert/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
											>
												<Trash2 className="w-4 h-4" />
												Drop Ticket
											</button>
										)}
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{/* Sub-Modal: Transfer Ticket */}
			{isTransferOpen && (
				<div className="fixed inset-0 z-60 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-paper border border-perforation rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h4 className="font-display font-semibold text-base flex items-center gap-2">
								<Share2 className="w-4 h-4 text-stamp" />
								Transfer Ticket
							</h4>
							<button
								type="button"
								onClick={() => setIsTransferOpen(false)}
								className="p-1 hover:bg-perforation/20 rounded cursor-pointer"
							>
								<X className="w-4 h-4 opacity-70" />
							</button>
						</div>

						{transferSuccessUrl ? (
							<div className="space-y-3">
								<div className="bg-stamp/10 border border-stamp/30 text-stamp p-3 rounded-md space-y-1">
									<div className="flex items-center gap-2 font-semibold text-xs">
										<Check className="w-4 h-4" />
										Transfer Claim Link Created!
									</div>
									<p className="text-[11px] opacity-90">
										Share this link with {recipientName}. Once accepted, their
										pass will be activated and your old pass will be
										invalidated.
									</p>
								</div>

								<div className="flex items-center gap-2 border border-perforation rounded-md p-2 bg-paper/60 font-mono text-xs">
									<input
										type="text"
										readOnly
										value={transferSuccessUrl}
										className="w-full bg-transparent outline-none truncate"
									/>
									<button
										type="button"
										onClick={handleCopyTransferLink}
										className="px-2.5 py-1 bg-stamp text-paper rounded text-[11px] font-medium shrink-0 flex items-center gap-1 cursor-pointer"
									>
										{copiedTransferLink ? (
											<Check className="w-3.5 h-3.5" />
										) : (
											<Copy className="w-3.5 h-3.5" />
										)}
										{copiedTransferLink ? "Copied" : "Copy"}
									</button>
								</div>
							</div>
						) : (
							<form onSubmit={handleTransferSubmit} className="space-y-3">
								{transferError && (
									<div className="bg-alert/10 border border-alert/30 text-alert p-2.5 rounded text-xs">
										{transferError}
									</div>
								)}

								<div className="space-y-1">
									<label
										htmlFor="modal-transfer-recipient-name"
										className="block text-xs font-mono uppercase tracking-wider text-ink/70"
									>
										Recipient Name
									</label>
									<input
										id="modal-transfer-recipient-name"
										type="text"
										required
										value={recipientName}
										onChange={(e) => setRecipientName(e.target.value)}
										placeholder="e.g. Jane Doe"
										className="w-full px-3 py-2 rounded border border-perforation bg-paper text-ink text-xs focus:outline-none focus:border-stamp"
									/>
								</div>

								<div className="space-y-1">
									<label
										htmlFor="modal-transfer-recipient-email"
										className="block text-xs font-mono uppercase tracking-wider text-ink/70"
									>
										Recipient Email
									</label>
									<input
										id="modal-transfer-recipient-email"
										type="email"
										required
										value={recipientEmail}
										onChange={(e) => setRecipientEmail(e.target.value)}
										placeholder="jane@example.com"
										className="w-full px-3 py-2 rounded border border-perforation bg-paper text-ink text-xs focus:outline-none focus:border-stamp"
									/>
								</div>

								<div className="flex items-center justify-end gap-2 pt-2">
									<button
										type="button"
										onClick={() => setIsTransferOpen(false)}
										className="px-3 py-1.5 border border-perforation rounded text-xs cursor-pointer hover:bg-perforation/20"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isTransferring}
										className="px-4 py-1.5 bg-stamp text-paper rounded text-xs font-medium cursor-pointer hover:opacity-90 disabled:opacity-50"
									>
										{isTransferring ? "Generating Link..." : "Create Link"}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}

			{/* Sub-Modal: Drop Ticket Confirmation */}
			{isDropOpen && (
				<div className="fixed inset-0 z-60 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-paper border border-perforation rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
						<h4 className="font-display font-semibold text-base text-alert flex items-center gap-2">
							<AlertCircle className="w-5 h-5" />
							Drop Ticket Pass?
						</h4>
						<p className="text-xs text-ink/80 leading-relaxed">
							Are you sure you want to drop this ticket? This will cancel your
							registration and transfer your pass spot to the next person on the
							waitlist.
						</p>
						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setIsDropOpen(false)}
								className="px-3 py-1.5 border border-perforation rounded text-xs cursor-pointer hover:bg-perforation/20"
							>
								Cancel
							</button>
							<button
								type="button"
								disabled={isDropping}
								onClick={() => dropTicket({ ticketCode })}
								className="px-4 py-1.5 bg-alert text-paper rounded text-xs font-medium cursor-pointer hover:opacity-90 disabled:opacity-50"
							>
								{isDropping ? "Dropping..." : "Confirm Drop"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
