"use client";

import { trpc } from "@/lib/trpc";
import { Check, Copy, Link2, Square, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

interface CheckinChainDialogProps {
	isOpen: boolean;
	onClose: () => void;
	eventSlug: string;
	onRosterChange?: () => void;
}

/** Organizer view of QR chain check-in: start, show the ROOT QR, watch progress, end. */
export function CheckinChainDialog({
	isOpen,
	onClose,
	eventSlug,
	onRosterChange,
}: CheckinChainDialogProps): JSX.Element | null {
	const utils = trpc.useUtils();
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const lastCount = useRef<number | null>(null);

	const {
		data: status,
		isLoading,
		error,
	} = trpc.checkinChain.status.useQuery(
		{ slug: eventSlug },
		{ enabled: isOpen, refetchInterval: isOpen ? 5000 : false },
	);

	const { mutate: startChain, isPending: isStarting } =
		trpc.checkinChain.start.useMutation({
			onSuccess: () =>
				utils.checkinChain.status.invalidate({ slug: eventSlug }),
			onError: (err) => alert(err.message),
		});

	const { mutate: endChain, isPending: isEnding } =
		trpc.checkinChain.end.useMutation({
			onSuccess: () => {
				utils.checkinChain.status.invalidate({ slug: eventSlug });
				onRosterChange?.();
			},
			onError: (err) => alert(err.message),
		});

	const rootToken = status?.active ? status.rootToken : null;
	const rootUrl = rootToken
		? `${window.location.origin}/events/${eventSlug}/chain?t=${rootToken}`
		: null;

	// The token is re-signed on every poll, so re-draw the QR whenever it changes.
	useEffect(() => {
		if (!rootUrl) {
			setQrDataUrl(null);
			return;
		}
		QRCode.toDataURL(rootUrl, { width: 320, margin: 2 })
			.then(setQrDataUrl)
			.catch((err) => console.error("QR Code Error:", err));
	}, [rootUrl]);

	// Keep the guest roster in step as people check in through the chain.
	const checkedInCount = status?.active ? status.checkedInCount : null;
	useEffect(() => {
		if (checkedInCount === null) return;
		if (lastCount.current !== null && lastCount.current !== checkedInCount) {
			onRosterChange?.();
		}
		lastCount.current = checkedInCount;
	}, [checkedInCount, onRosterChange]);

	const handleCopy = () => {
		if (!rootUrl) return;
		navigator.clipboard.writeText(rootUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
			<div className="relative w-full max-w-lg rounded-xl border border-perforation bg-paper shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between px-6 py-4 border-b border-perforation bg-stamp/30">
					<div className="flex items-center space-x-2">
						<Link2 className="h-5 w-5 text-stamp-dark dark:text-stamp-light" />
						<h2 className="font-heading text-lg font-bold text-ink">
							QR Chain Check-In
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="rounded-lg p-1.5 text-ink/70 hover:bg-perforation/40 transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6 space-y-5 overflow-y-auto">
					{isLoading && (
						<p className="text-sm text-ink/60 animate-pulse">Loading...</p>
					)}

					{error && (
						<div className="rounded-lg p-4 border bg-alert/10 border-alert/30 text-alert text-sm">
							{error.message}
						</div>
					)}

					{status && !status.active && (
						<div className="space-y-4">
							<p className="text-sm text-ink/70">
								Attendees check in by scanning a QR code from the person before
								them: ROOT → first attendee → next attendee → … Each QR works
								once and refreshes every few seconds.
							</p>
							<button
								type="button"
								onClick={() => startChain({ slug: eventSlug })}
								disabled={isStarting}
								className="w-full rounded-lg bg-stamp px-4 py-2.5 text-sm font-semibold text-paper hover:bg-stamp-dark disabled:opacity-50 transition-colors"
							>
								{isStarting ? "Starting..." : "Start QR Chain Check-In"}
							</button>
						</div>
					)}

					{status?.active && (
						<>
							<div className="flex items-center justify-between text-xs">
								<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono font-medium bg-stamp/10 text-stamp border border-stamp/20">
									<span className="w-1.5 h-1.5 rounded-full bg-stamp animate-pulse" />
									Chain active
								</span>
								<span className="font-mono text-ink/60">
									Started {new Date(status.startedAt).toLocaleTimeString()} ·
									ends {new Date(status.expiresAt).toLocaleTimeString()}
								</span>
							</div>

							{rootToken ? (
								<div className="space-y-3 text-center">
									<p className="text-sm text-ink/70">
										Root QR. The first attendee scans this to start the chain.
									</p>
									{qrDataUrl ? (
										<div className="mx-auto w-fit bg-white p-3 rounded-xl border border-perforation shadow-md">
											{/* biome-ignore lint/performance/noImgElement: Client-side generated QR data URL */}
											<img
												src={qrDataUrl}
												alt="Root QR code for QR chain check-in"
												className="w-56 h-56 object-contain"
											/>
										</div>
									) : (
										<div className="mx-auto w-56 h-56 rounded-xl border border-dashed border-perforation" />
									)}
									<p className="text-[11px] text-ink/50">
										Refreshes automatically; each scan is valid for about 20
										seconds.
									</p>
									<button
										type="button"
										onClick={handleCopy}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-perforation rounded-lg hover:bg-ink/5 transition-colors cursor-pointer"
									>
										{copied ? (
											<Check className="w-3.5 h-3.5 text-stamp" />
										) : (
											<Copy className="w-3.5 h-3.5" />
										)}
										{copied ? "Link copied" : "Copy current link"}
									</button>
								</div>
							) : (
								<div className="rounded-lg p-4 border border-stamp/30 bg-stamp/10 text-sm text-ink">
									The root QR has been scanned. The chain is running: each
									attendee now shows their own QR for the next person.
								</div>
							)}

							<div className="rounded-lg border border-perforation p-4 space-y-2">
								<div className="flex items-baseline justify-between">
									<span className="text-xs font-mono uppercase tracking-wider text-ink/60">
										Checked in via chain
									</span>
									<span className="text-2xl font-bold font-display text-stamp">
										{status.checkedInCount}
									</span>
								</div>
								{status.recent.length > 0 && (
									<ul className="text-xs text-ink/70 divide-y divide-perforation">
										{status.recent.map((r) => (
											<li
												key={`${r.position}-${r.name}`}
												className="flex justify-between py-1.5"
											>
												<span>
													#{r.position} {r.name}
												</span>
												<span className="font-mono text-ink/50">
													{new Date(r.at).toLocaleTimeString()}
												</span>
											</li>
										))}
									</ul>
								)}
							</div>

							<button
								type="button"
								onClick={() => {
									if (
										window.confirm(
											"End QR chain check-in? All chain QR codes stop working. People already checked in stay checked in.",
										)
									) {
										endChain({ slug: eventSlug });
									}
								}}
								disabled={isEnding}
								className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-alert/40 px-4 py-2 text-sm font-semibold text-alert hover:bg-alert/10 disabled:opacity-50 transition-colors"
							>
								<Square className="w-4 h-4" />
								{isEnding ? "Ending..." : "End session"}
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
