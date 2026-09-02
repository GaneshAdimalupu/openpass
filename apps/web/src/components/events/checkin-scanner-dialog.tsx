"use client";

import { trpc } from "@/lib/trpc";
import jsQR from "jsqr";
import {
	AlertTriangle,
	Camera,
	CheckCircle2,
	QrCode,
	RefreshCw,
	X,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";

interface CheckinScannerDialogProps {
	isOpen: boolean;
	onClose: () => void;
	eventSlug: string;
	onSuccessCheckIn?: () => void;
}

type ScanResultState = {
	type: "success" | "already_checked_in" | "invalid";
	message: string;
	attendeeName?: string;
	ticketCode?: string;
	tierName?: string;
	checkedInAt?: string;
} | null;

export function CheckinScannerDialog({
	isOpen,
	onClose,
	eventSlug,
	onSuccessCheckIn,
}: CheckinScannerDialogProps): JSX.Element | null {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animFrameIdRef = useRef<number | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const [manualCode, setManualCode] = useState("");
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [isCameraActive, setIsCameraActive] = useState(false);
	const [scanResult, setScanResult] = useState<ScanResultState>(null);
	const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(false);

	const { mutate: verifyCheckIn, isPending: isVerifying } =
		trpc.events.ticketVerifyCheckIn.useMutation({
			onSuccess: (data) => {
				if (data.valid) {
					setScanResult({
						type: "success",
						message: data.message || "Check-in successful!",
						attendeeName: data.attendeeName || undefined,
						ticketCode: data.ticketCode || undefined,
						tierName: data.tierName || undefined,
					});
					if (onSuccessCheckIn) onSuccessCheckIn();
				} else if (data.alreadyCheckedIn) {
					setScanResult({
						type: "already_checked_in",
						message: data.message || "Ticket already checked in!",
						attendeeName: data.attendeeName || undefined,
						checkedInAt: data.checkedInAt
							? new Date(data.checkedInAt).toLocaleTimeString()
							: undefined,
					});
				} else {
					setScanResult({
						type: "invalid",
						message: data.message || "Invalid ticket for this event.",
					});
				}
			},
			onError: (err) => {
				setScanResult({
					type: "invalid",
					message: err.message || "Verification failed.",
				});
			},
		});

	const processCode = useCallback(
		(rawCode: string) => {
			const cleaned = rawCode.trim();
			if (!cleaned || cooldown || isVerifying) return;

			setLastScannedCode(cleaned);
			setCooldown(true);
			verifyCheckIn({ slug: eventSlug, codeOrToken: cleaned });

			// 3 second cooldown before auto-scanning the exact same code
			setTimeout(() => {
				setCooldown(false);
			}, 2500);
		},
		[cooldown, isVerifying, verifyCheckIn, eventSlug],
	);

	// Start Camera Stream
	useEffect(() => {
		if (!isOpen) {
			if (animFrameIdRef.current) {
				cancelAnimationFrame(animFrameIdRef.current);
				animFrameIdRef.current = null;
			}
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop();
				}
				streamRef.current = null;
			}
			setIsCameraActive(false);
			return;
		}

		let isMounted = true;

		const tick = () => {
			const video = videoRef.current;
			const canvas = canvasRef.current;

			if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				if (ctx) {
					canvas.height = video.videoHeight;
					canvas.width = video.videoWidth;
					ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					const code = jsQR(imageData.data, imageData.width, imageData.height, {
						inversionAttempts: "dontInvert",
					});

					if (code?.data && code.data !== lastScannedCode && !cooldown) {
						processCode(code.data);
					}
				}
			}

			animFrameIdRef.current = requestAnimationFrame(tick);
		};

		async function startCamera() {
			try {
				setCameraError(null);
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: "environment" } },
				});

				if (!isMounted) {
					for (const track of stream.getTracks()) {
						track.stop();
					}
					return;
				}

				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.setAttribute("playsinline", "true");
					await videoRef.current.play();
					setIsCameraActive(true);
					requestAnimationFrame(tick);
				}
			} catch (err) {
				if (isMounted) {
					console.warn("Camera access failed or unavailable:", err);
					setCameraError(
						"Camera access unavailable. You can enter or scan ticket codes manually.",
					);
					setIsCameraActive(false);
				}
			}
		}

		startCamera();

		return () => {
			isMounted = false;
			if (animFrameIdRef.current) {
				cancelAnimationFrame(animFrameIdRef.current);
				animFrameIdRef.current = null;
			}
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop();
				}
				streamRef.current = null;
			}
			setIsCameraActive(false);
		};
	}, [isOpen, cooldown, lastScannedCode, processCode]);

	const handleManualSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!manualCode.trim()) return;
		processCode(manualCode);
		setManualCode("");
	};

	const resetScan = () => {
		setScanResult(null);
		setLastScannedCode(null);
		setCooldown(false);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
			<div className="relative w-full max-w-lg rounded-xl border border-perforation bg-paper shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-perforation bg-stamp/30">
					<div className="flex items-center space-x-2">
						<QrCode className="h-5 w-5 text-stamp-dark dark:text-stamp-light" />
						<h2 className="font-heading text-lg font-bold text-ink">
							Ticket Check-In Scanner
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-ink/70 hover:bg-perforation/40 transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Body Content */}
				<div className="p-6 space-y-6 overflow-y-auto">
					{/* Result Banner Overlay if Scanned */}
					{scanResult && (
						<div
							className={`rounded-lg p-4 border transition-all animate-in zoom-in-95 duration-150 ${
								scanResult.type === "success"
									? "bg-stamp/10 border-stamp/30 text-stamp"
									: scanResult.type === "already_checked_in"
										? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
										: "bg-alert/10 border-alert/30 text-alert"
							}`}
						>
							<div className="flex items-start space-x-3">
								{scanResult.type === "success" && (
									<CheckCircle2 className="h-6 w-6 text-stamp shrink-0 mt-0.5" />
								)}
								{scanResult.type === "already_checked_in" && (
									<AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
								)}
								{scanResult.type === "invalid" && (
									<XCircle className="h-6 w-6 text-alert shrink-0 mt-0.5" />
								)}
								<div className="flex-1 min-w-0">
									<h4 className="font-bold text-base">{scanResult.message}</h4>
									{scanResult.attendeeName && (
										<p className="text-sm font-medium mt-1">
											Attendee:{" "}
											<span className="font-semibold">
												{scanResult.attendeeName}
											</span>
										</p>
									)}
									{scanResult.tierName && (
										<span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-mono bg-stamp/20 text-stamp">
											{scanResult.tierName}
										</span>
									)}
									{scanResult.ticketCode && (
										<p className="text-xs font-mono opacity-80 mt-1">
											Code: {scanResult.ticketCode}
										</p>
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={resetScan}
								className="mt-3 w-full py-1.5 rounded-md bg-paper border border-perforation text-xs font-semibold hover:bg-perforation/20 transition-colors flex items-center justify-center space-x-1"
							>
								<RefreshCw className="h-3.5 w-3.5" />
								<span>Scan Next Ticket</span>
							</button>
						</div>
					)}

					{/* Camera Feed Container */}
					<div className="relative aspect-video w-full rounded-lg bg-black overflow-hidden border border-perforation flex items-center justify-center">
						<video
							ref={videoRef}
							muted
							aria-label="Ticket QR camera preview"
							className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
						/>
						<canvas ref={canvasRef} className="hidden" />

						{/* Scan Frame Target Box */}
						{isCameraActive && (
							<div className="absolute inset-0 border-2 border-stamp/40 rounded-lg pointer-events-none flex items-center justify-center">
								<div className="w-48 h-48 border-2 border-stamp rounded-lg animate-pulse bg-stamp/5 flex items-center justify-center">
									<div className="w-full h-0.5 bg-stamp/80 animate-bounce" />
								</div>
							</div>
						)}

						{/* Fallback / Camera Inactive State */}
						{!isCameraActive && (
							<div className="text-center p-6 text-white/80 space-y-2">
								<Camera className="h-10 w-10 mx-auto opacity-50" />
								<p className="text-xs max-w-xs mx-auto">
									{cameraError ||
										"Click below or allow camera access to start scanning."}
								</p>
							</div>
						)}
					</div>

					{/* Manual Entry Form Backup */}
					<form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
						<label
							htmlFor="manual-ticket-code"
							className="block text-xs font-bold font-mono uppercase tracking-wider text-ink/70"
						>
							Or Enter Ticket Code Manually
						</label>
						<div className="flex space-x-2">
							<input
								id="manual-ticket-code"
								type="text"
								value={manualCode}
								onChange={(e) => setManualCode(e.target.value)}
								placeholder="e.g. OPT-F2AX-TE3Y or qrv1_..."
								className="flex-1 rounded-lg border border-perforation bg-paper px-3 py-2 text-sm font-mono text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-stamp"
							/>
							<button
								type="submit"
								disabled={!manualCode.trim() || isVerifying}
								className="rounded-lg bg-stamp px-4 py-2 text-sm font-semibold text-paper hover:bg-stamp-dark disabled:opacity-50 transition-colors shrink-0"
							>
								{isVerifying ? "Verifying..." : "Verify & Check-In"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
