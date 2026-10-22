"use client";

import { CheckinScannerDialog } from "@/components/events/checkin-scanner-dialog";
import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import type { JSX } from "react";

/** Minimal event-scoped scanner page for assigned check-in staff. */
export function CheckInStaffPage(): JSX.Element {
	const params = useParams();
	const router = useRouter();
	const slug = params.slug as string;
	const { data, isLoading, error } = trpc.checkinChain.staffAccess.useQuery({
		slug,
	});

	return (
		<div className="min-h-screen bg-paper text-ink">
			<SiteHeader />
			<main className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
				<h1 className="font-display text-2xl font-semibold">Check-in staff</h1>
				{isLoading && (
					<p className="text-sm text-ink/60">Checking event access…</p>
				)}
				{error && (
					<p
						role="alert"
						className="rounded-lg border border-alert/30 bg-alert/10 p-4 text-sm text-alert"
					>
						{error.message}
					</p>
				)}
				{data && (
					<>
						<p className="text-sm text-ink/70">
							Scan tickets for {data.title}. This page does not provide event
							management or attendee roster access.
						</p>
						<CheckinScannerDialog
							isOpen
							onClose={() => router.push(`/events/${slug}`)}
							eventSlug={slug}
							title="Staff Check-In Scanner"
						/>
					</>
				)}
			</main>
		</div>
	);
}

export default function CheckInPage(): JSX.Element {
	return <CheckInStaffPage />;
}
