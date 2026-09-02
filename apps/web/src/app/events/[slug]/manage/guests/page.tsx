"use client";

import { CheckinScannerDialog } from "@/components/events/checkin-scanner-dialog";
import { trpc } from "@/lib/trpc";
import {
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Copy,
	Download,
	QrCode,
	RefreshCw,
	Search,
	UserCheck,
	Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { JSX } from "react";

type ChannelFilter = "all" | "ticket" | "rsvp";
type StatusFilter =
	| "all"
	| "confirmed"
	| "checked_in"
	| "waitlisted"
	| "dropped";

interface UnifiedGuest {
	id: string;
	guestType: "ticket" | "rsvp";
	name: string;
	email: string;
	phone?: string | null;
	tierName: string;
	ticketCode?: string | null;
	status: "CONFIRMED" | "CHECKED_IN" | "WAITLISTED" | "DROPPED" | "PENDING";
	createdAt: Date | string;
	checkedInAt?: Date | string | null;
	answers?: Record<string, unknown> | null;
	user?: {
		id: string;
		name?: string | null;
		image?: string | null;
	} | null;
}

export function GuestsPage(): JSX.Element {
	const params = useParams();
	const slug = params.slug as string;

	const [searchTerm, setSearchTerm] = useState("");
	const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [isScannerOpen, setIsScannerOpen] = useState(false);

	const utils = trpc.useUtils();

	// Primary Unified Query
	const {
		data: guestHubData,
		isLoading,
		isRefetching,
		refetch,
	} = trpc.events.manageGuestsList.useQuery({ slug }, { enabled: !!slug });

	// Toggle Check In Mutation
	const { mutate: toggleCheckIn, isPending: isTogglingCheckIn } =
		trpc.events.manageGuestToggleCheckIn.useMutation({
			onSuccess: () => {
				utils.events.manageGuestsList.invalidate({ slug });
			},
			onError: (err) => {
				alert(err.message);
			},
		});

	// Normalize guests into a unified list
	const unifiedGuests = useMemo<UnifiedGuest[]>(() => {
		if (!guestHubData) return [];

		const rawTickets = (guestHubData.issuedTickets || []) as unknown as Array<{
			id: string;
			attendeeName: string | null;
			attendeeEmail: string;
			attendeePhone?: string | null;
			ticketCode?: string | null;
			status: string;
			createdAt: string | Date;
			checkedInAt?: string | Date | null;
			ticket?: { name: string; price: number } | null;
			user?: { id: string; name?: string | null; image?: string | null } | null;
		}>;

		const rawRsvps = (guestHubData.rsvpSubmissions || []) as unknown as Array<{
			id: string;
			status: string;
			createdAt: string | Date;
			user?: {
				id: string;
				name?: string | null;
				email?: string | null;
				image?: string | null;
			} | null;
			checkIns?: Array<{ id: string; timestamp: string | Date }>;
			answers?: unknown;
		}>;

		const ticketList: UnifiedGuest[] = rawTickets.map((t) => ({
			id: t.id,
			guestType: "ticket",
			name: t.attendeeName || "Attendee",
			email: t.attendeeEmail,
			phone: t.attendeePhone,
			tierName: t.ticket?.name || "General Pass",
			ticketCode: t.ticketCode,
			status:
				t.status === "CHECKED_IN"
					? "CHECKED_IN"
					: t.status === "WAITLISTED"
						? "WAITLISTED"
						: t.status === "DROPPED" || t.status === "CANCELLED"
							? "DROPPED"
							: "CONFIRMED",
			createdAt: t.createdAt,
			checkedInAt: t.checkedInAt,
			answers: null,
			user: t.user,
		}));

		const rsvpList: UnifiedGuest[] = rawRsvps.map((r) => {
			const isCheckedIn = (r.checkIns || []).length > 0;
			const isDropped = r.status === "Rejected";
			const isPending = r.status === "Pending";

			let parsedAnswers: Record<string, unknown> | null = null;
			if (r.answers && typeof r.answers === "object") {
				parsedAnswers = r.answers as Record<string, unknown>;
			}

			return {
				id: r.id,
				guestType: "rsvp",
				name: r.user?.name || "RSVP Guest",
				email: r.user?.email || "—",
				tierName: "RSVP Registration",
				ticketCode: null,
				status: isCheckedIn
					? "CHECKED_IN"
					: isDropped
						? "DROPPED"
						: isPending
							? "PENDING"
							: "CONFIRMED",
				createdAt: r.createdAt,
				checkedInAt: r.checkIns?.[0]?.timestamp || null,
				answers: parsedAnswers,
				user: r.user,
			};
		});

		// Sort by creation date descending
		return [...ticketList, ...rsvpList].sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);
	}, [guestHubData]);

	// Filtered Guests
	const filteredGuests = useMemo(() => {
		return unifiedGuests.filter((guest) => {
			// Channel filter
			if (channelFilter !== "all" && guest.guestType !== channelFilter) {
				return false;
			}

			// Status filter
			if (statusFilter === "confirmed" && guest.status !== "CONFIRMED")
				return false;
			if (statusFilter === "checked_in" && guest.status !== "CHECKED_IN")
				return false;
			if (
				statusFilter === "waitlisted" &&
				guest.status !== "WAITLISTED" &&
				guest.status !== "PENDING"
			)
				return false;
			if (statusFilter === "dropped" && guest.status !== "DROPPED")
				return false;

			// Search Term
			if (searchTerm.trim()) {
				const term = searchTerm.toLowerCase();
				const matchName = guest.name.toLowerCase().includes(term);
				const matchEmail = guest.email.toLowerCase().includes(term);
				const matchCode =
					guest.ticketCode?.toLowerCase().includes(term) ?? false;
				const matchTier = guest.tierName.toLowerCase().includes(term);
				if (!matchName && !matchEmail && !matchCode && !matchTier) return false;
			}

			return true;
		});
	}, [unifiedGuests, channelFilter, statusFilter, searchTerm]);

	// Aggregate Statistics
	const stats = useMemo(() => {
		const total = unifiedGuests.length;
		const confirmed = unifiedGuests.filter(
			(g) => g.status === "CONFIRMED" || g.status === "CHECKED_IN",
		).length;
		const checkedIn = unifiedGuests.filter(
			(g) => g.status === "CHECKED_IN",
		).length;
		const waitlisted = unifiedGuests.filter(
			(g) => g.status === "WAITLISTED" || g.status === "PENDING",
		).length;
		const checkInRate =
			confirmed > 0 ? Math.round((checkedIn / confirmed) * 100) : 0;

		return { total, confirmed, checkedIn, waitlisted, checkInRate };
	}, [unifiedGuests]);

	// Copy ticket code
	const handleCopyCode = (code: string) => {
		navigator.clipboard.writeText(code);
		setCopiedCode(code);
		setTimeout(() => setCopiedCode(null), 2000);
	};

	// Export CSV
	const handleExportCSV = () => {
		if (filteredGuests.length === 0) return;

		const headers = [
			"Name",
			"Email",
			"Phone",
			"Channel",
			"Tier/Form",
			"Ticket Code",
			"Status",
			"Registered At",
			"Checked In At",
		];
		const rows = filteredGuests.map((g) => [
			`"${g.name.replace(/"/g, '""')}"`,
			`"${g.email.replace(/"/g, '""')}"`,
			`"${g.phone || ""}"`,
			`"${g.guestType === "ticket" ? "Ticket Pass" : "RSVP Form"}"`,
			`"${g.tierName.replace(/"/g, '""')}"`,
			`"${g.ticketCode || ""}"`,
			`"${g.status}"`,
			`"${new Date(g.createdAt).toISOString()}"`,
			`"${g.checkedInAt ? new Date(g.checkedInAt).toISOString() : ""}"`,
		]);

		const csvContent = [
			headers.join(","),
			...rows.map((r) => r.join(",")),
		].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`${slug}-attendees-${new Date().toISOString().slice(0, 10)}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="w-full px-4 py-8 md:p-8 min-h-screen pb-24 text-ink bg-paper">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-perforation pb-6">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl md:text-3xl font-bold font-display text-ink">
							Guest Management
						</h1>
						<span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stamp/10 text-stamp border border-stamp/20">
							{stats.total} Total
						</span>
					</div>
					<p className="text-xs text-ink/70 mt-1">
						Live attendee roster across Ticket Passes and RSVP registrations.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<button
						type="button"
						onClick={() => setIsScannerOpen(true)}
						className="px-3.5 py-2 text-xs font-semibold bg-stamp text-paper rounded-lg hover:opacity-90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
					>
						<QrCode className="w-4 h-4" />
						<span>Scan Ticket QR</span>
					</button>

					<button
						type="button"
						onClick={() => refetch()}
						disabled={isLoading || isRefetching}
						className="px-3 py-2 text-xs font-medium border border-perforation rounded-lg hover:bg-ink/5 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
						title="Refresh Roster"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
						/>
						<span>Refresh</span>
					</button>

					<button
						type="button"
						onClick={handleExportCSV}
						disabled={filteredGuests.length === 0}
						className="px-3.5 py-2 text-xs font-medium bg-stamp text-paper rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
					>
						<Download className="w-3.5 h-3.5" />
						<span>Export CSV</span>
					</button>
				</div>
			</div>

			{/* Metric Stat Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
				<div className="p-4 rounded-xl border border-perforation bg-paper/50 flex flex-col justify-between">
					<div className="flex items-center justify-between text-ink/60 mb-2">
						<span className="text-[0.81rem] font-medium uppercase tracking-[0.04em]">
							Total Registered
						</span>
						<Users className="w-4 h-4 text-stamp" />
					</div>
					<div className="text-2xl font-bold font-display text-ink">
						{stats.total}
					</div>
				</div>

				<div className="p-4 rounded-xl border border-perforation bg-paper/50 flex flex-col justify-between">
					<div className="flex items-center justify-between text-ink/60 mb-2">
						<span className="text-[0.81rem] font-medium uppercase tracking-[0.04em]">
							Confirmed
						</span>
						<CheckCircle2 className="w-4 h-4 text-stamp" />
					</div>
					<div className="text-2xl font-bold font-display text-ink">
						{stats.confirmed}
					</div>
				</div>

				<div className="p-4 rounded-xl border border-perforation bg-paper/50 flex flex-col justify-between">
					<div className="flex items-center justify-between text-ink/60 mb-2">
						<span className="text-[0.81rem] font-medium uppercase tracking-[0.04em]">
							Checked In
						</span>
						<UserCheck className="w-4 h-4 text-stamp" />
					</div>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-bold font-display text-stamp">
							{stats.checkedIn}
						</span>
						<span className="text-xs font-mono text-ink/50">
							({stats.checkInRate}%)
						</span>
					</div>
				</div>

				<div className="p-4 rounded-xl border border-perforation bg-paper/50 flex flex-col justify-between">
					<div className="flex items-center justify-between text-ink/60 mb-2">
						<span className="text-[0.81rem] font-medium uppercase tracking-[0.04em]">
							Waitlist / Pending
						</span>
						<Clock className="w-4 h-4 text-ink/50" />
					</div>
					<div className="text-2xl font-bold font-display text-ink">
						{stats.waitlisted}
					</div>
				</div>
			</div>

			{/* Filters and Search Bar */}
			<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
				{/* Search Input */}
				<div className="relative flex-1 max-w-md">
					<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search by name, email, ticket code..."
						className="w-full bg-paper border border-perforation rounded-lg pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-stamp"
					/>
				</div>

				{/* Filter Tabs */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Channel Segment */}
					<div className="inline-flex rounded-lg border border-perforation p-0.5 bg-ink/5 text-xs">
						{(["all", "ticket", "rsvp"] as const).map((ch) => (
							<button
								key={ch}
								type="button"
								onClick={() => setChannelFilter(ch)}
								className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all cursor-pointer ${
									channelFilter === ch
										? "bg-paper text-ink shadow-xs"
										: "text-ink/60 hover:text-ink"
								}`}
							>
								{ch === "all"
									? "All Sources"
									: ch === "ticket"
										? "Tickets"
										: "RSVPs"}
							</button>
						))}
					</div>

					{/* Status Segment */}
					<div className="inline-flex rounded-lg border border-perforation p-0.5 bg-ink/5 text-xs">
						{(
							[
								"all",
								"confirmed",
								"checked_in",
								"waitlisted",
								"dropped",
							] as const
						).map((st) => (
							<button
								key={st}
								type="button"
								onClick={() => setStatusFilter(st)}
								className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all cursor-pointer ${
									statusFilter === st
										? "bg-paper text-ink shadow-xs"
										: "text-ink/60 hover:text-ink"
								}`}
							>
								{st.replace("_", " ")}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Attendee Roster Table */}
			<div className="border border-perforation rounded-xl overflow-hidden bg-paper shadow-xs">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="bg-ink/5 border-b border-perforation font-medium text-ink/70 uppercase tracking-[0.04em]">
							<tr>
								<th className="px-4 py-3">Guest</th>
								<th className="px-4 py-3">Source & Tier</th>
								<th className="px-4 py-3">Pass Code</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3">Registered</th>
								<th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-perforation">
							{isLoading ? (
								<tr>
									<td colSpan={6} className="text-center py-12 text-ink/50">
										<RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stamp" />
										Loading attendee records...
									</td>
								</tr>
							) : filteredGuests.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-16 text-ink/60">
										<Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
										<p className="font-medium">No attendees found.</p>
										<p className="text-[11px] opacity-70 mt-1">
											{searchTerm ||
											channelFilter !== "all" ||
											statusFilter !== "all"
												? "Try changing your search or filter criteria."
												: "Share your event link with attendees to start collecting registrations."}
										</p>
									</td>
								</tr>
							) : (
								filteredGuests.map((guest) => {
									const isExpanded = expandedGuestId === guest.id;
									const isCheckedIn = guest.status === "CHECKED_IN";
									const hasCustomAnswers =
										guest.answers && Object.keys(guest.answers).length > 0;

									return (
										<tr
											key={`${guest.guestType}-${guest.id}`}
											className="hover:bg-ink/[0.02] transition-colors group"
										>
											{/* Guest Details */}
											<td className="px-4 py-3.5">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-full bg-stamp/10 border border-stamp/20 flex items-center justify-center font-display font-semibold text-stamp shrink-0">
														{guest.name.charAt(0).toUpperCase()}
													</div>
													<div className="min-w-0">
														<div className="font-medium text-ink truncate">
															{guest.name}
														</div>
														<div className="text-[11px] text-ink/60 font-mono truncate">
															{guest.email}
														</div>
													</div>
												</div>
											</td>

											{/* Source & Tier */}
											<td className="px-4 py-3.5">
												<div className="flex flex-col gap-0.5">
													<span className="font-medium text-ink">
														{guest.tierName}
													</span>
													<span className="text-[10px] uppercase tracking-wider text-ink/50 font-mono">
														{guest.guestType === "ticket"
															? "Ticket Pass"
															: "RSVP Form"}
													</span>
												</div>
											</td>

											{/* Ticket Code */}
											<td className="px-4 py-3.5 font-mono text-[11px]">
												{guest.ticketCode ? (
													<button
														type="button"
														onClick={() =>
															guest.ticketCode &&
															handleCopyCode(guest.ticketCode)
														}
														className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink/5 hover:bg-ink/10 transition-colors text-ink/80 cursor-pointer"
														title="Click to copy ticket code"
													>
														<span>{guest.ticketCode}</span>
														{copiedCode === guest.ticketCode ? (
															<Check className="w-3 h-3 text-stamp" />
														) : (
															<Copy className="w-3 h-3 text-ink/40" />
														)}
													</button>
												) : (
													<span className="text-ink/40">—</span>
												)}
											</td>

											{/* Status */}
											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
														isCheckedIn
															? "bg-stamp/15 text-stamp border-stamp/30"
															: guest.status === "CONFIRMED"
																? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
																: guest.status === "WAITLISTED" ||
																		guest.status === "PENDING"
																	? "bg-amber-500/15 text-amber-700 border-amber-500/30"
																	: "bg-alert/15 text-alert border-alert/30"
													}`}
												>
													<span
														className={`w-1.5 h-1.5 rounded-full ${
															isCheckedIn
																? "bg-stamp"
																: guest.status === "CONFIRMED"
																	? "bg-emerald-600"
																	: guest.status === "WAITLISTED" ||
																			guest.status === "PENDING"
																		? "bg-amber-600"
																		: "bg-alert"
														}`}
													/>
													<span>
														{isCheckedIn
															? "Checked In"
															: guest.status === "CONFIRMED"
																? "Confirmed"
																: guest.status === "WAITLISTED"
																	? "Waitlist"
																	: guest.status === "PENDING"
																		? "Pending"
																		: "Dropped"}
													</span>
												</span>
											</td>

											{/* Registered Date */}
											<td className="px-4 py-3.5 text-ink/60 text-[11px] whitespace-nowrap">
												{new Date(guest.createdAt).toLocaleDateString("en-IN", {
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</td>

											{/* Actions */}
											<td className="px-4 py-3.5 text-right">
												<div className="inline-flex items-center gap-2">
													{isCheckedIn ? (
														<button
															type="button"
															onClick={() =>
																toggleCheckIn({
																	slug,
																	guestType: guest.guestType,
																	id: guest.id,
																	action: "undo",
																})
															}
															disabled={isTogglingCheckIn}
															className="px-2.5 py-1 text-[11px] font-medium rounded border border-stamp/30 bg-stamp/10 text-stamp hover:bg-stamp/20 transition-colors cursor-pointer"
														>
															Undo Check In
														</button>
													) : (
														<button
															type="button"
															onClick={() =>
																toggleCheckIn({
																	slug,
																	guestType: guest.guestType,
																	id: guest.id,
																	action: "checkin",
																})
															}
															disabled={
																isTogglingCheckIn || guest.status === "DROPPED"
															}
															className="px-2.5 py-1 text-[11px] font-medium rounded bg-stamp text-paper hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
														>
															Check In
														</button>
													)}

													{hasCustomAnswers && (
														<button
															type="button"
															onClick={() =>
																setExpandedGuestId(isExpanded ? null : guest.id)
															}
															className="p-1 rounded hover:bg-ink/10 text-ink/60 hover:text-ink transition-colors cursor-pointer"
															title="View Answers"
														>
															{isExpanded ? (
																<ChevronUp className="w-4 h-4" />
															) : (
																<ChevronDown className="w-4 h-4" />
															)}
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			<CheckinScannerDialog
				isOpen={isScannerOpen}
				onClose={() => setIsScannerOpen(false)}
				eventSlug={slug}
				onSuccessCheckIn={() => refetch()}
			/>
		</div>
	);
}

export default GuestsPage;
