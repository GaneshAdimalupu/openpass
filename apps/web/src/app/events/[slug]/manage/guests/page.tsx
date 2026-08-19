"use client";

import { trpc } from "@/lib/trpc";
import {
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Download,
	FileQuestion,
	Mail,
	RefreshCw,
	Search,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type FilterTab = "all" | "pending" | "accepted" | "checked_in" | "rejected";

interface SubmissionItem {
	id: string;
	userId: string;
	name: string | null;
	email: string;
	status: string;
	confirmAttendance: boolean;
	answers: unknown;
	hasCheckedInToday: boolean;
	checkIns: Array<{ id: string; timestamp: Date | string }>;
}

export function GuestsPage() {
	const params = useParams();
	const slug = params.slug as string;

	const [searchTerm, setSearchTerm] = useState("");
	const [activeTab, setActiveTab] = useState<FilterTab>("all");
	const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

	// Queries
	const { data: event, isLoading: eventLoading } =
		trpc.events.manageGetBySlug.useQuery({ slug }, { enabled: !!slug });

	const { data: rsvpForm, isLoading: rsvpFormLoading } =
		trpc.events.rsvpGetForm.useQuery({ slug }, { enabled: !!slug });

	const {
		data: submissions,
		isLoading: submissionsLoading,
		refetch: refetchSubmissions,
		isRefetching,
	} = trpc.events.rsvpGetSubmissions.useQuery({ slug }, { enabled: !!slug });

	const { refetch: refetchStats } = trpc.events.rsvpGetStats.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	// Mutations
	const { mutate: updateStatus, isPending: isUpdatingStatus } =
		trpc.events.rsvpUpdateSubmissionStatus.useMutation({
			onSuccess: () => {
				refetchSubmissions();
				refetchStats();
			},
		});

	const { mutate: toggleCheckIn, isPending: isTogglingCheckIn } =
		trpc.events.rsvpToggleCheckIn.useMutation({
			onSuccess: () => {
				refetchSubmissions();
				refetchStats();
			},
		});

	const isLoading = eventLoading || rsvpFormLoading || submissionsLoading;

	// Categorized Submissions
	const requiresApproval = rsvpForm?.requiresApproval ?? false;
	const customQuestions = rsvpForm?.customQuestions ?? [];

	const typedSubmissions =
		(submissions as unknown as SubmissionItem[] | undefined) ?? [];

	const pendingCount = typedSubmissions.filter(
		(s) => s.status === "Pending",
	).length;
	const acceptedCount = typedSubmissions.filter(
		(s) => s.status === "Accepted" || s.confirmAttendance,
	).length;
	const checkedInCount = typedSubmissions.filter(
		(s) => s.hasCheckedInToday,
	).length;
	const rejectedCount = typedSubmissions.filter(
		(s) => s.status === "Rejected",
	).length;
	const totalCount = typedSubmissions.length;

	// Filtered Submissions based on search and active tab
	const filteredSubmissions = useMemo(() => {
		return typedSubmissions.filter((sub) => {
			// Tab filtering
			if (activeTab === "pending" && sub.status !== "Pending") return false;
			if (
				activeTab === "accepted" &&
				sub.status !== "Accepted" &&
				!sub.confirmAttendance
			)
				return false;
			if (activeTab === "checked_in" && !sub.hasCheckedInToday) return false;
			if (activeTab === "rejected" && sub.status !== "Rejected") return false;

			// Search filtering
			if (!searchTerm.trim()) return true;
			const query = searchTerm.toLowerCase();
			const nameMatch = sub.name?.toLowerCase().includes(query);
			const emailMatch = sub.email.toLowerCase().includes(query);

			// Search in answers if present
			let answerMatch = false;
			if (sub.answers && typeof sub.answers === "object") {
				answerMatch = Object.values(
					sub.answers as Record<string, unknown>,
				).some((val) => String(val).toLowerCase().includes(query));
			}

			return nameMatch || emailMatch || answerMatch;
		});
	}, [typedSubmissions, activeTab, searchTerm]);

	const handleStatusUpdate = (submissionId: string, status: string) => {
		updateStatus({ slug, submissionId, status });
	};

	const handleCheckInToggle = (
		submissionId: string,
		action: "checkin" | "undo",
	) => {
		toggleCheckIn({ slug, submissionId, action });
	};

	// Export CSV Handler
	const exportToCSV = () => {
		if (typedSubmissions.length === 0) return;

		const headers = [
			"Name",
			"Email",
			"Status",
			"Confirmed Attendance",
			"Checked In Today",
			"Latest Check-In Time",
			...customQuestions.map((q) => q.question),
		];

		const rows = typedSubmissions.map((sub) => {
			let answersMap: Record<string, unknown> = {};
			if (typeof sub.answers === "string") {
				try {
					answersMap = JSON.parse(sub.answers);
				} catch {
					answersMap = {};
				}
			} else if (sub.answers && typeof sub.answers === "object") {
				answersMap = sub.answers as Record<string, unknown>;
			}

			const latestCheckIn =
				sub.checkIns && sub.checkIns.length > 0
					? new Date(
							sub.checkIns[sub.checkIns.length - 1].timestamp,
						).toISOString()
					: "N/A";

			return [
				`"${(sub.name || "Unknown").replace(/"/g, '""')}"`,
				`"${sub.email.replace(/"/g, '""')}"`,
				`"${sub.status}"`,
				`"${sub.confirmAttendance ? "Yes" : "No"}"`,
				`"${sub.hasCheckedInToday ? "Yes" : "No"}"`,
				`"${latestCheckIn}"`,
				...customQuestions.map((q) => {
					const val = answersMap[q.question] ?? "";
					return `"${String(val).replace(/"/g, '""')}"`;
				}),
			].join(",");
		});

		const csvContent = `data:text/csv;charset=utf-8,${[
			headers.join(","),
			...rows,
		].join("\n")}`;
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", `${slug}-guests.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	if (isLoading) {
		return (
			<div className="p-8 space-y-6 max-w-6xl">
				<div className="h-8 w-48 bg-perforation/30 animate-pulse rounded" />
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{["sk-1", "sk-2", "sk-3", "sk-4"].map((skKey) => (
						<div
							key={skKey}
							className="h-24 bg-perforation/20 rounded-lg animate-pulse"
						/>
					))}
				</div>
				<div className="h-64 bg-perforation/10 rounded-lg animate-pulse" />
			</div>
		);
	}

	if (!event) {
		return (
			<div className="p-8 text-ink/60">
				<p>Event not found.</p>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-8 space-y-8 max-w-6xl">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-perforation pb-6">
				<div>
					<h1 className="font-display font-semibold text-2xl text-ink">
						Guests & Attendees
					</h1>
					<p className="text-ink/60 text-sm mt-1">
						Manage registration requests, monitor attendance, and conduct
						check-ins.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => {
							refetchSubmissions();
							refetchStats();
						}}
						disabled={isRefetching}
						className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-perforation rounded-md bg-paper hover:bg-perforation/20 text-ink transition-colors disabled:opacity-50"
					>
						<RefreshCw
							className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Refresh
					</button>

					<button
						type="button"
						onClick={exportToCSV}
						disabled={typedSubmissions.length === 0}
						className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink text-paper rounded-md hover:bg-ink/90 transition-colors disabled:opacity-50"
					>
						<Download className="w-4 h-4" />
						Export CSV
					</button>
				</div>
			</div>

			{/* Host Approval Alert Banner */}
			{requiresApproval && (
				<div className="bg-perforation/20 border border-perforation rounded-lg p-4 flex items-start gap-3 text-sm text-ink">
					<Users className="w-5 h-5 text-ink/60 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium">Host approval is required</p>
						<p className="text-ink/70 text-xs mt-0.5">
							New registrations will remain in the Pending queue until you
							approve or decline them.
						</p>
					</div>
				</div>
			)}

			{/* Metric Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="border border-perforation bg-paper p-4 rounded-lg">
					<p className="text-xs uppercase tracking-wider font-medium text-ink/60">
						Total Registered
					</p>
					<div className="flex items-baseline justify-between mt-2">
						<p className="font-mono text-2xl font-semibold text-ink">
							{totalCount}
						</p>
						<Users className="w-4 h-4 text-ink/40" />
					</div>
				</div>

				<div className="border border-perforation bg-paper p-4 rounded-lg">
					<p className="text-xs uppercase tracking-wider font-medium text-ink/60">
						Accepted Guests
					</p>
					<div className="flex items-baseline justify-between mt-2">
						<p className="font-mono text-2xl font-semibold text-stamp">
							{acceptedCount}
						</p>
						<span className="text-xs font-mono text-ink/60">
							{totalCount > 0
								? `${Math.round((acceptedCount / totalCount) * 100)}%`
								: "0%"}
						</span>
					</div>
				</div>

				<div className="border border-perforation bg-paper p-4 rounded-lg">
					<p className="text-xs uppercase tracking-wider font-medium text-ink/60">
						Checked In Today
					</p>
					<div className="flex items-baseline justify-between mt-2">
						<p className="font-mono text-2xl font-semibold text-ink">
							{checkedInCount}
						</p>
						<span className="text-xs font-mono text-ink/60">
							{acceptedCount > 0
								? `${Math.round((checkedInCount / acceptedCount) * 100)}%`
								: "0%"}
						</span>
					</div>
				</div>

				<div className="border border-perforation bg-paper p-4 rounded-lg">
					<p className="text-xs uppercase tracking-wider font-medium text-ink/60">
						Pending Approval
					</p>
					<div className="flex items-baseline justify-between mt-2">
						<p
							className={`font-mono text-2xl font-semibold ${
								pendingCount > 0 ? "text-alert" : "text-ink"
							}`}
						>
							{pendingCount}
						</p>
						<UserCheck className="w-4 h-4 text-ink/40" />
					</div>
				</div>
			</div>

			{/* Filter Tabs & Search Control */}
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					{/* Segmented Filter Control */}
					<div className="flex items-center gap-1 bg-perforation/30 p-1 rounded-lg overflow-x-auto">
						<button
							type="button"
							onClick={() => setActiveTab("all")}
							className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors whitespace-nowrap ${
								activeTab === "all"
									? "bg-paper text-ink font-medium shadow-sm border border-perforation"
									: "text-ink/60 hover:text-ink"
							}`}
						>
							All ({totalCount})
						</button>

						{requiresApproval && (
							<button
								type="button"
								onClick={() => setActiveTab("pending")}
								className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
									activeTab === "pending"
										? "bg-paper text-ink font-medium shadow-sm border border-perforation"
										: "text-ink/60 hover:text-ink"
								}`}
							>
								Pending
								{pendingCount > 0 && (
									<span className="px-1.5 py-0.2 bg-alert text-paper text-[10px] font-mono rounded-full font-bold">
										{pendingCount}
									</span>
								)}
							</button>
						)}

						<button
							type="button"
							onClick={() => setActiveTab("accepted")}
							className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors whitespace-nowrap ${
								activeTab === "accepted"
									? "bg-paper text-ink font-medium shadow-sm border border-perforation"
									: "text-ink/60 hover:text-ink"
							}`}
						>
							Accepted ({acceptedCount})
						</button>

						<button
							type="button"
							onClick={() => setActiveTab("checked_in")}
							className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors whitespace-nowrap ${
								activeTab === "checked_in"
									? "bg-paper text-ink font-medium shadow-sm border border-perforation"
									: "text-ink/60 hover:text-ink"
							}`}
						>
							Checked In ({checkedInCount})
						</button>

						{requiresApproval && (
							<button
								type="button"
								onClick={() => setActiveTab("rejected")}
								className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors whitespace-nowrap ${
									activeTab === "rejected"
										? "bg-paper text-ink font-medium shadow-sm border border-perforation"
										: "text-ink/60 hover:text-ink"
								}`}
							>
								Declined ({rejectedCount})
							</button>
						)}
					</div>

					{/* Search Box */}
					<div className="relative w-full sm:w-72">
						<Search className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search guests..."
							className="w-full pl-9 pr-8 py-1.5 text-sm bg-paper border border-perforation rounded-md focus:outline-none focus:ring-1 focus:ring-ink"
						/>
						{searchTerm && (
							<button
								type="button"
								onClick={() => setSearchTerm("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>
				</div>

				{/* Guest Table */}
				<div className="border border-perforation rounded-lg overflow-hidden bg-paper shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm text-ink">
							<thead className="bg-perforation/20 border-b border-perforation text-xs uppercase tracking-wider text-ink/70 font-medium">
								<tr>
									<th className="px-4 py-3">Guest</th>
									<th className="px-4 py-3">Status</th>
									{customQuestions.length > 0 && (
										<th className="px-4 py-3">Custom Answers</th>
									)}
									<th className="px-4 py-3">Check-In</th>
									{requiresApproval && (
										<th className="px-4 py-3 text-right">Approval</th>
									)}
								</tr>
							</thead>

							<tbody className="divide-y divide-perforation">
								{filteredSubmissions.map((row) => {
									let answersMap: Record<string, unknown> = {};
									if (typeof row.answers === "string") {
										try {
											answersMap = JSON.parse(row.answers);
										} catch {
											answersMap = {};
										}
									} else if (row.answers && typeof row.answers === "object") {
										answersMap = row.answers as Record<string, unknown>;
									}

									const isExpanded = expandedRowId === row.id;

									return (
										<tr
											key={row.id}
											className="hover:bg-perforation/10 transition-colors"
										>
											{/* Guest Info */}
											<td className="px-4 py-3">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-full bg-perforation/40 flex items-center justify-center font-display font-medium text-xs text-ink uppercase">
														{(row.name || row.email).slice(0, 2)}
													</div>
													<div>
														<div className="font-medium text-ink">
															{row.name || "Anonymous Guest"}
														</div>
														<div className="text-xs text-ink/60 flex items-center gap-1 font-mono">
															<Mail className="w-3 h-3 text-ink/40" />
															{row.email}
														</div>
													</div>
												</div>
											</td>

											{/* Status Badge */}
											<td className="px-4 py-3">
												{row.status === "Pending" ? (
													<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ink/10 text-ink">
														Pending Review
													</span>
												) : row.status === "Rejected" ? (
													<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-alert/10 text-alert">
														Declined
													</span>
												) : (
													<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stamp/10 text-stamp">
														Confirmed
													</span>
												)}
											</td>

											{/* Custom Questions Viewer */}
											{customQuestions.length > 0 && (
												<td className="px-4 py-3">
													<button
														type="button"
														onClick={() =>
															setExpandedRowId(isExpanded ? null : row.id)
														}
														className="text-xs text-ink/70 hover:text-ink inline-flex items-center gap-1 border border-perforation px-2 py-1 rounded bg-paper"
													>
														<FileQuestion className="w-3 h-3" />
														{Object.keys(answersMap).length} Answers
														{isExpanded ? (
															<ChevronUp className="w-3 h-3" />
														) : (
															<ChevronDown className="w-3 h-3" />
														)}
													</button>

													{/* Expandable Answers Panel */}
													{isExpanded && (
														<div className="mt-2 p-3 bg-perforation/20 rounded border border-perforation text-xs space-y-2 max-w-sm">
															{customQuestions.map((q) => (
																<div key={q.id}>
																	<span className="font-medium text-ink block">
																		{q.question}:
																	</span>
																	<span className="text-ink/80">
																		{answersMap[q.question] !== undefined &&
																		answersMap[q.question] !== ""
																			? String(answersMap[q.question])
																			: "—"}
																	</span>
																</div>
															))}
														</div>
													)}
												</td>
											)}

											{/* Check-In Column */}
											<td className="px-4 py-3">
												{row.hasCheckedInToday ? (
													<button
														type="button"
														onClick={() => handleCheckInToggle(row.id, "undo")}
														disabled={isTogglingCheckIn}
														className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-stamp/40 bg-stamp/10 text-stamp hover:bg-stamp/20 transition-colors"
													>
														<CheckCircle2 className="w-3.5 h-3.5" />
														Checked In
													</button>
												) : (
													<button
														type="button"
														onClick={() =>
															handleCheckInToggle(row.id, "checkin")
														}
														disabled={
															isTogglingCheckIn ||
															(row.status === "Pending" && requiresApproval) ||
															row.status === "Rejected"
														}
														className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-ink text-paper hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
													>
														Check In
													</button>
												)}
											</td>

											{/* Host Approval Column */}
											{requiresApproval && (
												<td className="px-4 py-3 text-right">
													{row.status === "Pending" ? (
														<div className="inline-flex items-center gap-1.5">
															<button
																type="button"
																onClick={() =>
																	handleStatusUpdate(row.id, "Accepted")
																}
																disabled={isUpdatingStatus}
																className="p-1 rounded bg-stamp text-paper hover:bg-stamp/90 transition-colors"
																title="Approve Guest"
															>
																<Check className="w-4 h-4" />
															</button>
															<button
																type="button"
																onClick={() =>
																	handleStatusUpdate(row.id, "Rejected")
																}
																disabled={isUpdatingStatus}
																className="p-1 rounded bg-alert/10 text-alert hover:bg-alert/20 transition-colors"
																title="Decline Guest"
															>
																<X className="w-4 h-4" />
															</button>
														</div>
													) : row.status === "Accepted" ? (
														<button
															type="button"
															onClick={() =>
																handleStatusUpdate(row.id, "Rejected")
															}
															disabled={isUpdatingStatus}
															className="text-xs text-alert hover:underline"
														>
															Revoke
														</button>
													) : (
														<button
															type="button"
															onClick={() =>
																handleStatusUpdate(row.id, "Accepted")
															}
															disabled={isUpdatingStatus}
															className="text-xs text-ink/70 hover:text-ink hover:underline"
														>
															Re-approve
														</button>
													)}
												</td>
											)}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Empty State */}
					{filteredSubmissions.length === 0 && (
						<div className="text-center py-12 px-4 space-y-3">
							<Users className="w-8 h-8 text-ink/30 mx-auto" />
							<p className="text-sm text-ink/70 font-medium">
								{searchTerm
									? "No guests match your search criteria."
									: activeTab !== "all"
										? `No guests found in "${activeTab.replace("_", " ")}" status.`
										: "No guests have registered for this event yet."}
							</p>
							{!searchTerm && activeTab === "all" && (
								<p className="text-xs text-ink/50 max-w-sm mx-auto">
									Share your event URL with attendees to start collecting
									registrations.
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default GuestsPage;
