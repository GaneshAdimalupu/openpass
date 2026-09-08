"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { TicketPassModal } from "@/components/tickets/ticket-pass-modal";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Check, Gift, RefreshCw, Ticket } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { JSX } from "react";

export default function TicketTransferClaimPage(): JSX.Element {
	const params = useParams();
	const _router = useRouter();
	const transferToken = params.token as string;

	// Query transfer data
	const { data, isLoading, error } = trpc.events.ticketTransferGet.useQuery(
		{ transferToken },
		{ enabled: !!transferToken },
	);

	const [attendeeName, setAttendeeName] = useState("");
	const [attendeeEmail, setAttendeeEmail] = useState("");
	const [claimedTicketCode, setClaimedTicketCode] = useState<string | null>(
		null,
	);
	const [isPassModalOpen, setIsPassModalOpen] = useState<boolean>(false);
	const [claimError, setClaimError] = useState<string | null>(null);

	const { mutate: claimTransfer, isPending: isClaiming } =
		trpc.events.ticketTransferClaim.useMutation({
			onSuccess: (res) => {
				setClaimedTicketCode(res.ticketCode);
			},
			onError: (err) => {
				setClaimError(err.message);
			},
		});

	useEffect(() => {
		if (data?.transfer) {
			setAttendeeName(data.transfer.recipientName);
			setAttendeeEmail(data.transfer.recipientEmail);
		}
	}, [data]);

	const handleClaimSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setClaimError(null);
		if (!attendeeName.trim() || !attendeeEmail.trim()) {
			setClaimError("Name and email are required.");
			return;
		}

		claimTransfer({
			transferToken,
			attendeeName: attendeeName.trim(),
			attendeeEmail: attendeeEmail.trim(),
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 flex items-center justify-center p-6">
					<p className="animate-pulse opacity-60">
						Loading transfer invitation...
					</p>
				</main>
			</div>
		);
	}

	if (error || !data?.transfer) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 flex items-center justify-center p-6">
					<div className="text-center max-w-md border border-perforation p-8 rounded-lg">
						<AlertCircle className="w-12 h-12 text-alert mx-auto mb-3" />
						<h1 className="font-display font-semibold text-xl mb-2">
							Transfer Link Invalid
						</h1>
						<p className="opacity-60 text-sm mb-6">
							This transfer invitation does not exist, was already claimed, or
							has expired.
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

	const transfer = data.transfer;
	const issued = transfer.issuedTicket;
	const event = issued.event;
	const tier = issued.ticket;

	const formattedStart = event.eventStart
		? new Date(event.eventStart).toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	return (
		<div className="min-h-screen bg-paper text-ink flex flex-col">
			<SiteHeader />

			<main className="flex-1 max-w-lg mx-auto w-full p-4 md:py-12 flex flex-col items-center justify-center">
				{claimedTicketCode ? (
					/* Success State */
					<div className="w-full border border-perforation rounded-2xl p-8 bg-paper text-center space-y-6 shadow-xl animate-in fade-in slide-in-from-bottom-2">
						<div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center">
							<Check className="w-8 h-8" />
						</div>

						<div className="space-y-2">
							<h1 className="font-display font-bold text-2xl">
								Ticket Transferred to You!
							</h1>
							<p className="text-sm opacity-70">
								Your pass for <strong>{event.title}</strong> is now active and
								ready.
							</p>
						</div>

						<div className="p-4 rounded-lg bg-paper/60 border border-perforation font-mono text-xs text-center">
							<span className="opacity-60 block text-[10px] uppercase">
								New Ticket Code
							</span>
							<strong className="text-base text-stamp">
								{claimedTicketCode}
							</strong>
						</div>

						<button
							type="button"
							onClick={() => setIsPassModalOpen(true)}
							className="w-full py-3 bg-stamp text-paper rounded-md font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md cursor-pointer"
						>
							<Ticket className="w-4 h-4" />
							View My Ticket & QR Pass
						</button>
					</div>
				) : (
					/* Claim Form */
					<div className="w-full border border-perforation rounded-2xl overflow-hidden shadow-xl bg-paper">
						{/* Top Banner */}
						<div className="p-6 md:p-8 bg-stamp/5 border-b border-perforation text-center space-y-3">
							<div className="w-12 h-12 rounded-full bg-stamp/10 border border-stamp/20 text-stamp mx-auto flex items-center justify-center">
								<Gift className="w-6 h-6" />
							</div>

							<div>
								<span className="text-xs font-mono uppercase tracking-widest text-stamp font-semibold">
									Ticket Transfer Invitation
								</span>
								<h1 className="font-display font-bold text-2xl mt-1">
									{event.title}
								</h1>
								<p className="text-xs opacity-70 mt-1">
									Sent by{" "}
									<strong className="font-mono">{transfer.senderEmail}</strong>
								</p>
							</div>
						</div>

						{/* Event Summary */}
						<div className="p-6 border-b border-perforation bg-paper/40 space-y-3 text-xs opacity-80">
							<div className="flex items-center justify-between">
								<span className="opacity-60">Ticket Tier</span>
								<strong className="text-ink font-semibold">{tier.name}</strong>
							</div>
							{formattedStart && (
								<div className="flex items-center justify-between">
									<span className="opacity-60">Date</span>
									<span>{formattedStart}</span>
								</div>
							)}
							<div className="flex items-center justify-between">
								<span className="opacity-60">Location</span>
								<span>{event.location || "Venue TBA"}</span>
							</div>
						</div>

						{/* Claim Form */}
						<form onSubmit={handleClaimSubmit} className="p-6 md:p-8 space-y-4">
							<p className="text-xs opacity-70">
								Confirm your name and email to accept this pass. A fresh entry
								QR code will be generated for you.
							</p>

							{claimError && (
								<div className="bg-alert/10 text-alert p-3 rounded text-xs flex items-center gap-2">
									<AlertCircle className="w-4 h-4 shrink-0" />
									{claimError}
								</div>
							)}

							<div>
								<label
									htmlFor="claim-name-input"
									className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
								>
									Your Full Name *
								</label>
								<input
									id="claim-name-input"
									type="text"
									required
									value={attendeeName}
									onChange={(e) => setAttendeeName(e.target.value)}
									placeholder="e.g. Maya Sharma"
									className="w-full px-3 py-2 border border-perforation rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
								/>
							</div>

							<div>
								<label
									htmlFor="claim-email-input"
									className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
								>
									Your Email Address *
								</label>
								<input
									id="claim-email-input"
									type="email"
									required
									value={attendeeEmail}
									onChange={(e) => setAttendeeEmail(e.target.value)}
									placeholder="e.g. maya@example.com"
									className="w-full px-3 py-2 border border-perforation rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
								/>
							</div>

							<button
								type="submit"
								disabled={isClaiming}
								className="w-full py-3 bg-stamp text-paper rounded-md font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md mt-4"
							>
								{isClaiming ? (
									<>
										<RefreshCw className="w-4 h-4 animate-spin" />
										Accepting Pass...
									</>
								) : (
									<>
										<Check className="w-4 h-4" />
										Accept & Claim Ticket
									</>
								)}
							</button>
						</form>
					</div>
				)}
			</main>

			<TicketPassModal
				ticketCode={isPassModalOpen ? claimedTicketCode : null}
				onClose={() => setIsPassModalOpen(false)}
			/>
		</div>
	);
}
