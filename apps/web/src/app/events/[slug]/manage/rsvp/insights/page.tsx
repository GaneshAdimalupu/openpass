"use client";

import { trpc } from "@/lib/trpc";
import {
	ArrowRight,
	BarChart3,
	CheckCircle2,
	Clock,
	PieChart,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { JSX } from "react";

export default function RsvpInsightsPage(): JSX.Element {
	const params = useParams();
	const slug = params.slug as string;

	const { data: guestHubData } = trpc.events.manageGuestsList.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	// Analytics calculations
	const analytics = useMemo(() => {
		const rawTickets = (guestHubData?.issuedTickets || []) as unknown as Array<{
			id: string;
			status: string;
			createdAt: string | Date;
			ticket?: { name: string; price: number } | null;
		}>;
		const rawRsvps = (guestHubData?.rsvpSubmissions || []) as unknown as Array<{
			id: string;
			status: string;
			createdAt: string | Date;
			checkIns?: Array<{ id: string; timestamp: string | Date }>;
		}>;

		const total = rawTickets.length + rawRsvps.length;
		const confirmedTickets = rawTickets.filter(
			(t) => t.status === "CONFIRMED" || t.status === "CHECKED_IN",
		);
		const confirmedRsvps = rawRsvps.filter(
			(r) => r.status === "Accepted" || (r.checkIns || []).length > 0,
		);
		const totalConfirmed = confirmedTickets.length + confirmedRsvps.length;

		const checkedInTickets = rawTickets.filter(
			(t) => t.status === "CHECKED_IN",
		);
		const checkedInRsvps = rawRsvps.filter(
			(r) => (r.checkIns || []).length > 0,
		);
		const totalCheckedIn = checkedInTickets.length + checkedInRsvps.length;

		const waitlistedTickets = rawTickets.filter(
			(t) => t.status === "WAITLISTED",
		);
		const pendingRsvps = rawRsvps.filter((r) => r.status === "Pending");
		const totalWaitlisted = waitlistedTickets.length + pendingRsvps.length;

		const checkInRate =
			totalConfirmed > 0
				? Math.round((totalCheckedIn / totalConfirmed) * 100)
				: 0;

		// Tier Breakdown
		const tierCounts: Record<string, { count: number; name: string }> = {};
		for (const t of rawTickets) {
			const tierName = t.ticket?.name || "General Pass";
			if (!tierCounts[tierName]) {
				tierCounts[tierName] = { count: 0, name: tierName };
			}
			tierCounts[tierName].count += 1;
		}
		if (rawRsvps.length > 0) {
			tierCounts["RSVP Form"] = { count: rawRsvps.length, name: "RSVP Form" };
		}

		// Daily Registration Timeline (Last 7 days)
		const dayMap: Record<string, number> = {};
		const allRegistrations = [
			...rawTickets.map((t) => new Date(t.createdAt)),
			...rawRsvps.map((r) => new Date(r.createdAt)),
		];

		const now = new Date();
		for (let i = 6; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			const key = d.toLocaleDateString("en-IN", {
				month: "short",
				day: "numeric",
			});
			dayMap[key] = 0;
		}

		for (const date of allRegistrations) {
			const key = date.toLocaleDateString("en-IN", {
				month: "short",
				day: "numeric",
			});
			if (dayMap[key] !== undefined) {
				dayMap[key] += 1;
			}
		}

		const maxDayCount = Math.max(...Object.values(dayMap), 1);

		return {
			total,
			totalConfirmed,
			totalCheckedIn,
			totalWaitlisted,
			checkInRate,
			tierCounts: Object.values(tierCounts),
			dailyTimeline: Object.entries(dayMap),
			maxDayCount,
		};
	}, [guestHubData]);

	return (
		<div className="w-full px-4 py-8 md:p-8 min-h-screen pb-24 text-ink bg-paper">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-perforation pb-6">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl md:text-3xl font-bold font-display text-ink">
							Event Analytics & Insights
						</h1>
						<span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stamp/10 text-stamp border border-stamp/20">
							Live Metrics
						</span>
					</div>
					<p className="text-xs text-ink/70 mt-1">
						Real-time registration conversion rates, check-in velocity, and tier
						distribution.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Link
						href={`/events/${slug}/manage/guests`}
						className="px-3.5 py-2 text-xs font-medium border border-perforation rounded-lg hover:bg-ink/5 transition-colors flex items-center gap-1.5"
					>
						<span>View Guest Roster</span>
						<ArrowRight className="w-3.5 h-3.5" />
					</Link>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
				<div className="p-5 rounded-xl border border-perforation bg-paper/60 shadow-xs flex flex-col justify-between">
					<div className="flex items-center justify-between text-ink/60 mb-2">
						<span className="text-[0.81rem] font-medium uppercase tracking-[0.04em]">
							Total Registrations
						</span>
						<Users className="w-4 h-4 text-stamp" />
					</div>
					<div className="text-3xl font-bold font-display text-ink">
						{analytics.total}
					</div>
					<p className="text-[11px] text-ink/50 mt-1">Combined all sources</p>
				</div>

				<div className="p-5 rounded-xl border border-perforation bg-paper/60 shadow-xs flex flex-col justify-between">
					<div className="flex items-center justify-between text-ink/60 mb-2">
						<span className="text-[0.81rem] font-medium uppercase tracking-[0.04em]">
							Confirmed Seats
						</span>
						<CheckCircle2 className="w-4 h-4 text-stamp" />
					</div>
					<div className="text-3xl font-bold font-display text-ink">
						{analytics.totalConfirmed}
					</div>
					<p className="text-[11px] text-ink/50 mt-1">Guaranteed admissions</p>
				</div>

				<div className="p-5 rounded-xl border border-perforation bg-paper/60 shadow-xs flex flex-col justify-between">
					<div className="flex items-center justify-between text-ink/60 mb-2">
						<span className="text-[0.81rem] font-medium uppercase tracking-[0.04em]">
							Turnout Rate
						</span>
						<TrendingUp className="w-4 h-4 text-stamp" />
					</div>
					<div className="flex items-baseline gap-2">
						<span className="text-3xl font-bold font-display text-stamp">
							{analytics.checkInRate}%
						</span>
						<span className="text-xs font-mono text-ink/60">
							({analytics.totalCheckedIn} checked in)
						</span>
					</div>
					<p className="text-[11px] text-ink/50 mt-1">
						Actual venue check-in ratio
					</p>
				</div>

				<div className="p-5 rounded-xl border border-perforation bg-paper/60 shadow-xs flex flex-col justify-between">
					<div className="flex items-center justify-between text-ink/60 mb-2">
						<span className="text-[0.81rem] font-medium uppercase tracking-[0.04em]">
							Waitlist / Pending
						</span>
						<Clock className="w-4 h-4 text-ink/50" />
					</div>
					<div className="text-3xl font-bold font-display text-ink">
						{analytics.totalWaitlisted}
					</div>
					<p className="text-[11px] text-ink/50 mt-1">Awaiting confirmation</p>
				</div>
			</div>

			{/* Charts & Breakdown Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6">
				{/* 7-Day Velocity Chart */}
				<div className="sm:col-span-2 p-6 rounded-xl border border-perforation bg-paper shadow-xs flex flex-col justify-between">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="font-display font-semibold text-base text-ink">
								Registration Velocity (Last 7 Days)
							</h2>
							<p className="text-xs text-ink/60">
								Daily attendee signups trajectory leading up to the event.
							</p>
						</div>
						<BarChart3 className="w-5 h-5 text-stamp opacity-70" />
					</div>

					<div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-perforation">
						{analytics.dailyTimeline.map(([day, count]) => {
							const heightPercent = Math.max(
								Math.round((count / analytics.maxDayCount) * 100),
								6,
							);
							return (
								<div
									key={day}
									className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
								>
									<span className="text-[10px] font-mono text-ink/60 opacity-0 group-hover:opacity-100 transition-opacity">
										{count}
									</span>
									<div
										style={{ height: `${heightPercent}%` }}
										className="w-full max-w-[36px] bg-stamp/20 group-hover:bg-stamp border border-stamp/40 rounded-t-md transition-all"
									/>
									<span className="text-[10px] font-mono text-ink/60 truncate max-w-[48px]">
										{day}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* Tier Distribution Breakdown */}
				<div className="p-6 rounded-xl border border-perforation bg-paper shadow-xs flex flex-col justify-between">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h2 className="font-display font-semibold text-base text-ink">
								Ticket Pass Breakdown
							</h2>
							<p className="text-xs text-ink/60">
								Distribution across ticket tiers & registration channels.
							</p>
						</div>
						<PieChart className="w-5 h-5 text-stamp opacity-70" />
					</div>

					<div className="space-y-4 my-2">
						{analytics.tierCounts.length === 0 ? (
							<p className="text-xs text-ink/50 py-8 text-center">
								No ticket tiers issued yet.
							</p>
						) : (
							analytics.tierCounts.map((tier) => {
								const percent =
									analytics.total > 0
										? Math.round((tier.count / analytics.total) * 100)
										: 0;
								return (
									<div key={tier.name} className="space-y-1.5">
										<div className="flex items-center justify-between text-xs">
											<span className="font-medium text-ink">{tier.name}</span>
											<span className="font-mono text-ink/60">
												{tier.count} ({percent}%)
											</span>
										</div>
										<div className="w-full h-2 bg-ink/5 rounded-full overflow-hidden">
											<div
												style={{ width: `${percent}%` }}
												className="h-full bg-stamp rounded-full transition-all"
											/>
										</div>
									</div>
								);
							})
						)}
					</div>

					<div className="pt-4 border-t border-perforation text-right">
						<Link
							href={`/events/${slug}/manage/tickets`}
							className="text-xs text-stamp font-medium hover:underline inline-flex items-center gap-1"
						>
							<span>Configure Ticket Tiers</span>
							<ArrowRight className="w-3 h-3" />
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
