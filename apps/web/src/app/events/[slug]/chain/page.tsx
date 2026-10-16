"use client";

import { CheckinScannerDialog } from "@/components/events/checkin-scanner-dialog";
import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, QrCode, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { useSession } from "next-auth/react";

type ClaimBanner = {
	tone: "success" | "warning" | "error";
	message: string;
} | null;

/** A scanned QR is a link containing ?t=<token>; a typed/pasted value may be the bare token. */
function extractToken(raw: string): string {
	try {
		const token = new URL(raw).searchParams.get("t");
		if (token) return token;
	} catch {
		// not a URL: treat as a bare token
	}
	return raw.trim();
}

function ChainCheckin(): JSX.Element {
	const params = useParams();
	const slug = params.slug as string;
	const router = useRouter();
	const searchParams = useSearchParams();
	const urlToken = searchParams.get("t");
	const { status: authStatus } = useSession();
	const isSignedIn = authStatus === "authenticated";

	const [banner, setBanner] = useState<ClaimBanner>(null);
	const [scannerOpen, setScannerOpen] = useState(false);
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const handledToken = useRef<string | null>(null);

	const utils = trpc.useUtils();
	const { data: myQr, isLoading } = trpc.checkinChain.myQr.useQuery(
		{ slug },
		{ enabled: authStatus !== "loading", refetchInterval: 8000 },
	);

	const { mutate: claim, isPending: isClaiming } =
		trpc.checkinChain.claim.useMutation({
			onSuccess: (res) => {
				if (res.ok) {
					setBanner({
						tone: "success",
						message: `Checked in${res.tierName ? ` (${res.tierName})` : ""}. Your QR is below.`,
					});
				} else {
					setBanner({
						tone:
							res.code === "ALREADY_CHECKED_IN" ||
							res.code === "ALREADY_IN_CHAIN"
								? "warning"
								: "error",
						message: res.message,
					});
				}
				utils.checkinChain.myQr.invalidate({ slug });
			},
			onError: (err) => setBanner({ tone: "error", message: err.message }),
		});

	const submitCode = useCallback(
		(raw: string) => {
			setBanner(null);
			claim({ slug, token: extractToken(raw) });
		},
		[claim, slug],
	);

	// Opened from a scanned QR link: claim once, then drop the token from the URL.
	useEffect(() => {
		if (
			authStatus === "loading" ||
			!urlToken ||
			handledToken.current === urlToken
		)
			return;
		handledToken.current = urlToken;
		submitCode(urlToken);
		router.replace(`/events/${slug}/chain`);
	}, [authStatus, urlToken, submitCode, router, slug]);

	// Draw my personal QR; the token is re-issued on every poll.
	const myToken = myQr?.state === "ready" ? myQr.token : null;
	useEffect(() => {
		if (!myToken) {
			setQrDataUrl(null);
			return;
		}
		QRCode.toDataURL(
			`${window.location.origin}/events/${slug}/chain?t=${myToken}`,
			{ width: 320, margin: 2 },
		)
			.then(setQrDataUrl)
			.catch((err) => console.error("QR Code Error:", err));
	}, [myToken, slug]);

	const bannerStyle =
		banner?.tone === "success"
			? "bg-stamp/10 border-stamp/30 text-stamp"
			: banner?.tone === "warning"
				? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
				: "bg-alert/10 border-alert/30 text-alert";

	return (
		<div className="min-h-screen bg-paper flex flex-col text-ink">
			<SiteHeader />
			<main className="flex-1 flex items-start justify-center p-6">
				<div className="w-full max-w-md space-y-5 text-center">
					<h1 className="font-display font-semibold text-2xl">
						QR Chain Check-In
					</h1>
					{myQr?.eventTitle && (
						<p className="text-sm text-ink/70">{myQr.eventTitle}</p>
					)}

					{authStatus === "loading" && (
						<p className="text-sm text-ink/60 animate-pulse">Loading...</p>
					)}

					{banner && (
						<div
							className={`rounded-lg p-4 border text-left flex items-start gap-3 ${bannerStyle}`}
						>
							{banner.tone === "success" && (
								<CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
							)}
							{banner.tone === "warning" && (
								<AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
							)}
							{banner.tone === "error" && (
								<XCircle className="h-5 w-5 shrink-0 mt-0.5" />
							)}
							<p className="text-sm font-medium">{banner.message}</p>
						</div>
					)}

					{isLoading && (
						<p className="text-sm text-ink/60 animate-pulse">Loading...</p>
					)}

					{myQr?.state === "no_session" && (
						<p className="text-sm text-ink/70">
							No QR chain check-in is running for this event right now.
						</p>
					)}

					{myQr?.state === "not_joined" && (
						<div className="space-y-4 border border-perforation rounded-xl p-6">
							<p className="text-sm">
								Scan the QR shown by the organizer or by the person checked in
								just before you.
							</p>
							<button
								type="button"
								onClick={() => setScannerOpen(true)}
								disabled={isClaiming}
								className="inline-flex items-center gap-2 rounded-lg bg-stamp px-4 py-2 text-sm font-semibold text-paper hover:bg-stamp-dark disabled:opacity-50 transition-colors"
							>
								<QrCode className="w-4 h-4" />
								{isClaiming ? "Checking in..." : "Scan a QR"}
							</button>

							{!isSignedIn && (
								<p className="text-xs text-ink/60 pt-2 border-t border-perforation">
									Checking in as a guest? Your RSVP in this browser will be
									used.{" "}
									<Link
										href={`/login?callbackUrl=${encodeURIComponent(`/events/${slug}/chain`)}`}
										className="font-medium text-stamp underline underline-offset-2 hover:opacity-80"
									>
										Sign in
									</Link>{" "}
									for cross-device access.
								</p>
							)}
						</div>
					)}

					{myQr?.state === "ready" && (
						<div className="space-y-3">
							<p className="text-sm text-ink/70">
								You are #{myQr.position} in the chain. Let the next person scan
								this QR.
							</p>
							{qrDataUrl && (
								<div className="mx-auto w-fit bg-white p-3 rounded-xl border border-perforation shadow-md">
									{/* biome-ignore lint/performance/noImgElement: Client-side generated QR data URL */}
									<img
										src={qrDataUrl}
										alt="Your QR code for the next person in the chain"
										className="w-64 h-64 object-contain"
									/>
								</div>
							)}
							<p className="text-[11px] text-ink/50">
								It refreshes by itself and works for one person only.
							</p>
						</div>
					)}

					{myQr?.state === "passed_on" && (
						<div className="rounded-lg p-4 border border-stamp/30 bg-stamp/10 text-sm">
							Your QR was scanned. You&apos;re all set.
						</div>
					)}
				</div>
			</main>

			<CheckinScannerDialog
				isOpen={scannerOpen}
				onClose={() => setScannerOpen(false)}
				eventSlug={slug}
				onCode={submitCode}
				title="Scan chain QR"
			/>
		</div>
	);
}

export default function ChainCheckinPage(): JSX.Element {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-paper flex items-center justify-center text-sm text-ink/60">
					Loading...
				</div>
			}
		>
			<ChainCheckin />
		</Suspense>
	);
}
