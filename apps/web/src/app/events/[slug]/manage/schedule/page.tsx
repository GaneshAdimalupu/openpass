"use client";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { trpc } from "@/lib/trpc";
import {
	Calendar,
	Check,
	Clock,
	Coffee,
	Copy,
	Edit3,
	Layers,
	MapPin,
	Mic,
	Plus,
	Sparkles,
	Trash2,
	Upload,
	User,
	Users,
	Wrench,
	X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export interface LocalScheduleItem {
	id: string;
	title: string;
	description?: string | null;
	scheduledDate: string; // YYYY-MM-DD
	startTime: string; // HH:mm
	endTime: string; // HH:mm
	stage?: string | null;
	type: string; // "keynote" | "talk" | "workshop" | "break" | "lunch" | "networking"
	speakerName?: string | null;
	linkedCfpSubmissionId?: string | null;
}

interface AcceptedProposal {
	id: string;
	title: string;
	sessionType: string;
	abstract: string;
	speaker: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	};
}

export default function ManageSchedulePage() {
	const params = useParams();
	const slug = params.slug as string;

	// Query schedule data & accepted proposals
	const { data, isLoading } = trpc.events.scheduleGet.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	const acceptedProposals = useMemo(() => {
		return (
			(data?.acceptedProposals as unknown as AcceptedProposal[] | undefined) ??
			[]
		);
	}, [data?.acceptedProposals]);

	const utils = trpc.useUtils();
	const { mutate: saveSchedule, isPending: isSaving } =
		trpc.events.scheduleSave.useMutation({
			onSuccess: () => {
				utils.events.scheduleGet.invalidate({ slug });
				setHasChanges(false);
			},
		});

	// UI States
	const [showSchedule, setShowSchedule] = useState(true);
	const [items, setItems] = useState<LocalScheduleItem[]>([]);
	const [customDates, setCustomDates] = useState<string[]>([]);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [editingItem, setEditingItem] = useState<LocalScheduleItem | null>(
		null,
	);
	const [hasChanges, setHasChanges] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showAddDateModal, setShowAddDateModal] = useState(false);
	const [newDateInput, setNewDateInput] = useState("");

	// Derive default dates from event start/end
	const eventDates = useMemo(() => {
		if (!data?.event?.eventStart) return [];
		const start = new Date(data.event.eventStart);
		const end = data.event.eventEnd
			? new Date(data.event.eventEnd)
			: new Date(data.event.eventStart);

		const dateList: string[] = [];
		const curr = new Date(start);
		while (curr <= end && dateList.length < 30) {
			dateList.push(curr.toISOString().split("T")[0]);
			curr.setDate(curr.getDate() + 1);
		}

		// Also merge any dates from existing schedule items or custom dates
		const existingItemDates = items.map((i) => i.scheduledDate);
		const allDates = Array.from(
			new Set([...dateList, ...existingItemDates, ...customDates]),
		).sort();
		return allDates.length > 0
			? allDates
			: [new Date().toISOString().split("T")[0]];
	}, [data?.event, items, customDates]);

	// Initialize on data load
	useEffect(() => {
		if (data) {
			setShowSchedule(data.event.showSchedule ?? true);
			const formattedItems: LocalScheduleItem[] = data.items.map((i) => ({
				id: i.id,
				title: i.title,
				description: i.description,
				scheduledDate: i.scheduledDate,
				startTime: i.startTime,
				endTime: i.endTime,
				stage: i.stage,
				type: i.type,
				speakerName:
					i.speakerName || i.linkedCfpSubmission?.speaker?.name || "",
				linkedCfpSubmissionId: i.linkedCfpSubmissionId,
			}));
			setItems(formattedItems);
		}
	}, [data]);

	// Auto-select first date if none selected
	useEffect(() => {
		if (
			eventDates.length > 0 &&
			(!selectedDate || !eventDates.includes(selectedDate))
		) {
			setSelectedDate(eventDates[0]);
		}
	}, [eventDates, selectedDate]);

	const currentDayItems = useMemo(() => {
		return items
			.filter((i) => i.scheduledDate === selectedDate)
			.sort((a, b) => a.startTime.localeCompare(b.startTime));
	}, [items, selectedDate]);

	const handleCopy = () => {
		navigator.clipboard.writeText(`https://openevents.local/${slug}/schedule`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleAddItem = () => {
		// Calculate next start time based on last item
		let nextStart = "10:00";
		let nextEnd = "10:45";

		if (currentDayItems.length > 0) {
			const lastItem = currentDayItems[currentDayItems.length - 1];
			if (lastItem.endTime) {
				nextStart = lastItem.endTime;
				const [h, m] = nextStart.split(":").map(Number);
				const endMinutes = (m + 45) % 60;
				const endHours = h + Math.floor((m + 45) / 60);
				nextEnd = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
			}
		}

		const newItem: LocalScheduleItem = {
			id: `temp_${Date.now()}`,
			title: "New Session",
			description: "",
			scheduledDate: selectedDate,
			startTime: nextStart,
			endTime: nextEnd,
			stage: "Main Auditorium",
			type: "talk",
			speakerName: "",
			linkedCfpSubmissionId: null,
		};

		setItems((prev) => [...prev, newItem]);
		setEditingItem(newItem);
		setHasChanges(true);
	};

	const handleDeleteItem = (id: string) => {
		setItems((prev) => prev.filter((i) => i.id !== id));
		if (editingItem?.id === id) {
			setEditingItem(null);
		}
		setHasChanges(true);
	};

	const handleSaveItemChanges = (updated: LocalScheduleItem) => {
		setItems((prev) =>
			prev.map((item) => (item.id === updated.id ? updated : item)),
		);
		setEditingItem(updated);
		setHasChanges(true);
	};

	const handleLinkCfpProposal = (proposalId: string) => {
		if (!editingItem) return;
		if (!proposalId) {
			handleSaveItemChanges({
				...editingItem,
				linkedCfpSubmissionId: null,
			});
			return;
		}

		const proposal = acceptedProposals.find((p) => p.id === proposalId);
		if (proposal) {
			handleSaveItemChanges({
				...editingItem,
				title: proposal.title,
				description: proposal.abstract || editingItem.description,
				type: proposal.sessionType || "talk",
				speakerName: proposal.speaker.name || "",
				linkedCfpSubmissionId: proposal.id,
			});
		}
	};

	const handleSaveAll = () => {
		saveSchedule({
			slug,
			showSchedule,
			items: items.map((i) => ({
				title: i.title,
				description: i.description,
				scheduledDate: i.scheduledDate,
				startTime: i.startTime,
				endTime: i.endTime,
				stage: i.stage || null,
				type: i.type,
				speakerName: i.speakerName || null,
				linkedCfpSubmissionId: i.linkedCfpSubmissionId || null,
			})),
		});
	};

	const handleAddCustomDate = () => {
		if (!newDateInput) return;
		if (!customDates.includes(newDateInput)) {
			setCustomDates([...customDates, newDateInput]);
			setSelectedDate(newDateInput);
		}
		setShowAddDateModal(false);
		setNewDateInput("");
	};

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "keynote":
				return <Sparkles className="w-3.5 h-3.5 text-stamp" />;
			case "workshop":
				return <Wrench className="w-3.5 h-3.5 text-ink/70" />;
			case "break":
				return <Coffee className="w-3.5 h-3.5 text-ink/60" />;
			case "lunch":
				return <Coffee className="w-3.5 h-3.5 text-ink/60" />;
			case "networking":
				return <Users className="w-3.5 h-3.5 text-ink/70" />;
			default:
				return <Mic className="w-3.5 h-3.5 text-ink/80" />;
		}
	};

	if (isLoading) {
		return (
			<div className="p-8 flex items-center justify-center min-h-[400px] text-ink/60 font-mono text-sm animate-pulse">
				Loading Schedule...
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-perforation pb-6">
				<div>
					<div className="flex items-center gap-2 text-xs font-mono text-ink/60 uppercase tracking-wider mb-1">
						<span>Event Management</span>
						<span>/</span>
						<span>Program & Schedule</span>
					</div>
					<h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
						Schedule & Lineup
					</h1>
					<p className="text-sm text-ink/60 mt-1">
						Organize multi-day tracks, connect accepted talks, and build your
						agenda.
					</p>
				</div>

				<button
					type="button"
					onClick={handleSaveAll}
					disabled={isSaving}
					className="px-5 py-2 bg-ink text-paper text-sm font-medium rounded-md hover:bg-ink/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2 self-start sm:self-auto shadow-sm"
				>
					<Upload className="w-4 h-4" />
					{isSaving ? "Saving..." : "Save Schedule"}
				</button>
			</div>

			{/* Hero Feature Switch Card */}
			<div className="border border-perforation rounded-xl bg-paper p-6 space-y-4 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div
							className={`w-10 h-10 rounded-lg flex items-center justify-center ${
								showSchedule
									? "bg-stamp/10 text-stamp"
									: "bg-perforation/40 text-ink/50"
							}`}
						>
							<Calendar className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="font-display font-semibold text-base text-ink">
									Show Schedule on Event Page
								</h2>
								{showSchedule ? (
									<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-stamp/10 text-stamp border border-stamp/20 font-mono">
										<span className="w-1.5 h-1.5 rounded-full bg-stamp animate-pulse" />
										Schedule Live
									</span>
								) : (
									<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-perforation/40 text-ink/60 border border-perforation font-mono">
										<span className="w-1.5 h-1.5 rounded-full bg-ink/40" />
										Hidden (Draft / Lineup TBD)
									</span>
								)}
							</div>
							<p className="text-xs text-ink/60 mt-0.5">
								{showSchedule
									? "The schedule is publicly visible on your event landing page and dedicated schedule view."
									: "The schedule is hidden from attendees. Ideal while finalizing talk times and confirming speakers."}
							</p>
						</div>
					</div>

					{/* Switch Toggle */}
					<label className="relative inline-flex items-center cursor-pointer shrink-0">
						<input
							type="checkbox"
							checked={showSchedule}
							onChange={(e) => {
								setShowSchedule(e.target.checked);
								setHasChanges(true);
							}}
							className="sr-only peer"
						/>
						<div className="w-12 h-6 bg-perforation peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-paper after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-paper after:border-perforation after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stamp" />
					</label>
				</div>

				{/* Public Route (When Enabled) */}
				{showSchedule && (
					<div className="pt-4 border-t border-perforation flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
						<span className="text-ink/70 font-medium">Public Schedule:</span>
						<div className="flex items-center gap-2 flex-1 sm:max-w-md">
							<code className="px-3 py-1.5 bg-perforation/20 rounded font-mono text-xs border border-perforation text-ink flex-1 truncate">
								https://openevents.local/{slug}/schedule
							</code>
							<button
								type="button"
								onClick={handleCopy}
								className="p-1.5 border border-perforation rounded hover:bg-perforation/20 text-ink/70 hover:text-ink transition-colors inline-flex items-center gap-1 font-medium"
								title="Copy to clipboard"
							>
								{copied ? (
									<Check className="w-3.5 h-3.5 text-stamp" />
								) : (
									<Copy className="w-3.5 h-3.5" />
								)}
								{copied ? "Copied" : "Copy"}
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Inactive Notice when Disabled */}
			{!showSchedule && (
				<div className="bg-perforation/20 border border-dashed border-perforation rounded-lg p-5 flex items-start gap-3 text-sm text-ink/80">
					<Sparkles className="w-5 h-5 text-ink/50 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-ink">Schedule is currently hidden</p>
						<p className="text-xs text-ink/60 mt-0.5">
							Attendees won&apos;t see the agenda or session times until you
							turn on the schedule switch above.
						</p>
					</div>
				</div>
			)}

			{/* Day Selection Tabs & Grid */}
			<div
				className={`flex flex-col gap-6 transition-opacity duration-200 ${
					!showSchedule ? "opacity-60 pointer-events-auto" : "opacity-100"
				}`}
			>
				{/* Day Tabs */}
				<div className="flex flex-wrap items-center gap-2 border-b border-perforation pb-3">
					{eventDates.map((dateStr, idx) => {
						const dateObj = new Date(`${dateStr}T00:00:00`);
						const dayLabel = dateObj.toLocaleDateString("en-US", {
							weekday: "short",
							month: "short",
							day: "numeric",
						});
						const isSelected = selectedDate === dateStr;
						const count = items.filter(
							(i) => i.scheduledDate === dateStr,
						).length;

						return (
							<button
								key={dateStr}
								type="button"
								onClick={() => {
									setSelectedDate(dateStr);
									setEditingItem(null);
								}}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
									isSelected
										? "bg-ink text-paper shadow-sm"
										: "bg-perforation/30 text-ink/80 hover:bg-perforation/60 hover:text-ink"
								}`}
							>
								<span>
									Day {idx + 1}: {dayLabel}
								</span>
								<span
									className={`px-1.5 py-0.2 rounded text-xs font-mono ${
										isSelected
											? "bg-paper/20 text-paper"
											: "bg-perforation/60 text-ink/70"
									}`}
								>
									{count}
								</span>
							</button>
						);
					})}

					<button
						type="button"
						onClick={() => setShowAddDateModal(true)}
						className="px-3 py-2 rounded-lg text-sm font-medium text-ink/70 hover:text-ink hover:bg-perforation/30 border border-dashed border-perforation transition-colors inline-flex items-center gap-1.5"
					>
						<Plus className="w-4 h-4" /> Add Date
					</button>
				</div>

				{/* Schedule Layout: 2 Columns */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Left: Schedule Slots Timeline */}
					<div className="lg:col-span-6 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="font-display font-semibold text-lg text-ink">
								Sessions for{" "}
								{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
									"en-US",
									{
										month: "short",
										day: "numeric",
										year: "numeric",
									},
								)}
							</h3>
							<button
								type="button"
								onClick={handleAddItem}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-paper rounded-md font-medium text-xs hover:bg-ink/90 transition-colors shadow-sm"
							>
								<Plus className="w-3.5 h-3.5" /> Add Session
							</button>
						</div>

						{currentDayItems.length === 0 ? (
							<div className="p-8 border border-dashed border-perforation rounded-xl text-center bg-perforation/10 space-y-3">
								<Clock className="w-8 h-8 text-ink/30 mx-auto" />
								<p className="font-medium text-sm text-ink">
									No sessions scheduled for this day
								</p>
								<p className="text-xs text-ink/50 max-w-xs mx-auto">
									Add talks, keynotes, or breaks to build your event timeline.
								</p>
								<button
									type="button"
									onClick={handleAddItem}
									className="px-3.5 py-1.5 bg-ink text-paper rounded text-xs font-medium hover:bg-ink/90 inline-flex items-center gap-1.5"
								>
									<Plus className="w-3.5 h-3.5" /> Add First Session
								</button>
							</div>
						) : (
							<div className="space-y-3">
								{currentDayItems.map((item) => {
									const isEditing = editingItem?.id === item.id;
									return (
										<div
											key={item.id}
											className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-all relative group ${
												isEditing
													? "border-ink bg-paper shadow-md ring-1 ring-ink"
													: "border-perforation bg-paper hover:border-ink/50 hover:shadow-sm"
											}`}
										>
											<button
												type="button"
												onClick={() => setEditingItem(item)}
												className="space-y-1.5 flex-1 text-left"
											>
												<div className="flex flex-wrap items-center gap-2">
													<span className="px-2 py-0.5 bg-perforation/30 border border-perforation rounded text-xs font-mono font-medium text-ink flex items-center gap-1">
														<Clock className="w-3 h-3 text-ink/60" />
														{item.startTime} - {item.endTime}
													</span>
													<span className="px-2 py-0.5 bg-perforation/20 rounded text-[11px] font-mono text-ink/70 capitalize inline-flex items-center gap-1">
														{getTypeIcon(item.type)}
														{item.type}
													</span>
													{item.stage && (
														<span className="px-2 py-0.5 bg-perforation/20 rounded text-[11px] font-mono text-ink/60 flex items-center gap-1">
															<MapPin className="w-2.5 h-2.5" />
															{item.stage}
														</span>
													)}
												</div>

												<h4 className="font-display font-semibold text-base text-ink">
													{item.title}
												</h4>

												{item.speakerName && (
													<p className="text-xs text-ink/70 flex items-center gap-1.5">
														<User className="w-3.5 h-3.5 text-ink/50" />
														{item.speakerName}
													</p>
												)}
											</button>

											<button
												type="button"
												onClick={() => handleDeleteItem(item.id)}
												className="p-1.5 text-alert/60 hover:text-alert hover:bg-alert/10 rounded transition-colors opacity-80 group-hover:opacity-100"
												title="Delete session"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Right: Session Detail Editor */}
					<div className="lg:col-span-6 border border-perforation rounded-xl bg-paper p-6 shadow-sm">
						{editingItem ? (
							<div className="space-y-6">
								<div className="flex items-center justify-between border-b border-perforation pb-3">
									<h3 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
										<Edit3 className="w-4 h-4 text-stamp" /> Edit Session
										Details
									</h3>
									<button
										type="button"
										onClick={() => setEditingItem(null)}
										className="text-ink/40 hover:text-ink p-1 rounded"
									>
										<X className="w-4 h-4" />
									</button>
								</div>

								{/* Quick CFP Linker */}
								{acceptedProposals.length > 0 && (
									<div className="p-3 bg-stamp/5 border border-stamp/20 rounded-lg space-y-1.5">
										<label
											htmlFor="link-cfp-select"
											className="text-xs font-semibold text-stamp uppercase tracking-wider flex items-center gap-1.5"
										>
											<Sparkles className="w-3.5 h-3.5" /> Auto-fill from
											Accepted CFP Proposal
										</label>
										<select
											id="link-cfp-select"
											value={editingItem.linkedCfpSubmissionId || ""}
											onChange={(e) => handleLinkCfpProposal(e.target.value)}
											className="w-full px-3 py-2 bg-paper border border-stamp/30 rounded-md text-xs text-ink focus:outline-none focus:ring-1 focus:ring-stamp"
										>
											<option value="">
												-- Choose an accepted proposal --
											</option>
											{acceptedProposals.map((p) => (
												<option key={p.id} value={p.id}>
													{p.title} (by {p.speaker.name || p.speaker.email})
												</option>
											))}
										</select>
									</div>
								)}

								<div className="space-y-4">
									{/* Session Title */}
									<div className="space-y-1.5">
										<label
											htmlFor="session-title"
											className="text-xs font-medium text-ink"
										>
											Session Title *
										</label>
										<input
											id="session-title"
											type="text"
											value={editingItem.title}
											onChange={(e) =>
												handleSaveItemChanges({
													...editingItem,
													title: e.target.value,
												})
											}
											placeholder="e.g. Keynote Address, Panel Discussion, Rust in Production"
											className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
										/>
									</div>

									{/* Session Type & Stage */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1.5">
											<label
												htmlFor="session-type"
												className="text-xs font-medium text-ink"
											>
												Session Type
											</label>
											<select
												id="session-type"
												value={editingItem.type}
												onChange={(e) =>
													handleSaveItemChanges({
														...editingItem,
														type: e.target.value,
													})
												}
												className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
											>
												<option value="talk">Talk / Presentation</option>
												<option value="keynote">Keynote Address</option>
												<option value="workshop">Hands-on Workshop</option>
												<option value="break">Tea / Coffee Break</option>
												<option value="lunch">Lunch Break</option>
												<option value="networking">Networking & Social</option>
											</select>
										</div>

										<div className="space-y-1.5">
											<label
												htmlFor="session-stage"
												className="text-xs font-medium text-ink"
											>
												Stage / Track / Room
											</label>
											<input
												id="session-stage"
												type="text"
												value={editingItem.stage || ""}
												onChange={(e) =>
													handleSaveItemChanges({
														...editingItem,
														stage: e.target.value,
													})
												}
												placeholder="e.g. Main Hall, Track 2, Workshop Lab"
												className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
											/>
										</div>
									</div>

									{/* Start Time & End Time */}
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-1.5">
											<label
												htmlFor="session-start"
												className="text-xs font-medium text-ink"
											>
												Start Time
											</label>
											<input
												id="session-start"
												type="time"
												value={editingItem.startTime}
												onChange={(e) =>
													handleSaveItemChanges({
														...editingItem,
														startTime: e.target.value,
													})
												}
												className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-ink"
											/>
										</div>

										<div className="space-y-1.5">
											<label
												htmlFor="session-end"
												className="text-xs font-medium text-ink"
											>
												End Time
											</label>
											<input
												id="session-end"
												type="time"
												value={editingItem.endTime}
												onChange={(e) =>
													handleSaveItemChanges({
														...editingItem,
														endTime: e.target.value,
													})
												}
												className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-ink"
											/>
										</div>
									</div>

									{/* Speaker Name */}
									<div className="space-y-1.5">
										<label
											htmlFor="session-speaker"
											className="text-xs font-medium text-ink"
										>
											Speaker(s) / Host
										</label>
										<input
											id="session-speaker"
											type="text"
											value={editingItem.speakerName || ""}
											onChange={(e) =>
												handleSaveItemChanges({
													...editingItem,
													speakerName: e.target.value,
												})
											}
											placeholder="e.g. Linus Torvalds, Jane Doe"
											className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
										/>
									</div>

									{/* Description Editor */}
									<div className="space-y-1.5">
										<label
											htmlFor="session-description"
											className="text-xs font-medium text-ink"
										>
											Description & Notes
										</label>
										<RichTextEditor
											id="session-description"
											value={editingItem.description || ""}
											onChange={(val) =>
												handleSaveItemChanges({
													...editingItem,
													description: val,
												})
											}
											placeholder="Session abstract, prerequisites, slide links, or agenda breakdown..."
										/>
									</div>

									<div className="pt-2 flex justify-end">
										<button
											type="button"
											onClick={() => setEditingItem(null)}
											className="px-4 py-2 bg-ink text-paper rounded-md text-xs font-medium hover:bg-ink/90 transition-colors"
										>
											Done Editing
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="py-16 flex flex-col items-center justify-center text-center space-y-3 text-ink/40">
								<Layers className="w-10 h-10 stroke-1 text-ink/30" />
								<div className="space-y-1">
									<p className="font-medium text-sm text-ink/70">
										No Session Selected
									</p>
									<p className="text-xs text-ink/40 max-w-xs">
										Click on any session card on the left to edit its timings,
										speakers, stage, and description.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Add Custom Date Modal */}
			{showAddDateModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
					<div className="bg-paper border border-perforation rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Add Schedule Date
							</h3>
							<button
								type="button"
								onClick={() => setShowAddDateModal(false)}
								className="text-ink/40 hover:text-ink p-1 rounded"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="new-date-input"
								className="text-xs font-medium text-ink"
							>
								Select Date
							</label>
							<input
								id="new-date-input"
								type="date"
								value={newDateInput}
								onChange={(e) => setNewDateInput(e.target.value)}
								className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink font-mono"
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setShowAddDateModal(false)}
								className="px-3.5 py-1.5 border border-perforation hover:bg-perforation/20 rounded text-xs font-medium text-ink"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleAddCustomDate}
								disabled={!newDateInput}
								className="px-4 py-1.5 bg-ink text-paper rounded text-xs font-medium hover:bg-ink/90 disabled:opacity-50"
							>
								Add Date
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Floating Action Bar */}
			{hasChanges && (
				<div className="fixed bottom-0 right-0 left-0 md:left-64 bg-paper border-t border-perforation px-6 py-4 flex justify-between items-center z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
					<div className="text-sm text-ink/70 font-medium flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-alert" />
						You have unsaved changes
					</div>
					<button
						type="button"
						onClick={handleSaveAll}
						disabled={isSaving}
						className="px-5 py-2 text-sm bg-ink text-paper rounded-md hover:bg-ink/90 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50"
					>
						<Upload className="w-4 h-4" />
						{isSaving ? "Saving Changes..." : "Save Schedule"}
					</button>
				</div>
			)}
		</div>
	);
}
