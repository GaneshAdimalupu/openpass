"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastState = {
	id: number;
	message: string;
	type: ToastType;
} | null;

/**
 * One toast at a time. Showing a new toast cancels the previous timer, so an
 * old timeout can never dismiss a newer message. Errors stay longer.
 */
export function useToast() {
	const [toast, setToast] = useState<ToastState>(null);
	const timer = useRef<number | null>(null);
	const counter = useRef(0);

	const clearTimer = useCallback(() => {
		if (timer.current !== null) {
			window.clearTimeout(timer.current);
			timer.current = null;
		}
	}, []);

	const dismissToast = useCallback(() => {
		clearTimer();
		setToast(null);
	}, [clearTimer]);

	const showToast = useCallback(
		(message: string, type: ToastType = "success", duration?: number) => {
			clearTimer();
			counter.current += 1;
			setToast({ id: counter.current, message, type });
			timer.current = window.setTimeout(
				() => {
					timer.current = null;
					setToast(null);
				},
				duration ?? (type === "error" ? 6000 : 3000),
			);
		},
		[clearTimer],
	);

	// Clear any pending timer when the component using the hook unmounts.
	useEffect(() => clearTimer, [clearTimer]);

	return { toast, showToast, dismissToast };
}

const STYLES: Record<ToastType, string> = {
	success: "bg-stamp text-paper",
	error: "bg-alert text-paper",
	info: "bg-ink text-paper",
};

const ICONS = {
	success: CheckCircle2,
	error: AlertCircle,
	info: Info,
} as const;

export function Toast({
	toast,
	onDismiss,
}: {
	toast: ToastState;
	onDismiss: () => void;
}) {
	const Icon = toast ? ICONS[toast.type] : null;

	// The live region is always mounted so screen readers announce changes.
	return (
		<div
			aria-live="polite"
			className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4"
		>
			{toast && Icon && (
				<div
					key={toast.id}
					role={toast.type === "error" ? "alert" : "status"}
					className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-md px-4 py-2.5 shadow-lg ${STYLES[toast.type]}`}
				>
					<Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
					<span className="text-sm font-medium">{toast.message}</span>
					<button
						type="button"
						onClick={onDismiss}
						aria-label="Dismiss notification"
						className="-mr-1 ml-1 shrink-0 cursor-pointer rounded p-0.5 opacity-80 hover:opacity-100"
					>
						<X size={16} />
					</button>
				</div>
			)}
		</div>
	);
}
