"use client";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { trpc } from "@/lib/trpc";
import { Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

type DashboardMode = "organized" | "participated";

export default function DashboardPage(): JSX.Element {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-paper flex flex-col">
					<DashboardHeader />
					<main className="flex-1 w-full px-4 lg:px-6 py-8">
						<div className="space-y-6 animate-pulse">
							<div className="h-16 bg-perforation/30 rounded-lg" />
						</div>
					</main>
				</div>
			}
		>
			<DashboardContent />
		</Suspense>
	);
}

function DashboardContent(): JSX.Element {
	const { data: session, status } = useSession();
	const searchParams = useSearchParams();
	const actionParam = searchParams.get("action");

	const [mode, setMode] = useState<DashboardMode>("organized");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
	const [isCompletedExpanded, setIsCompletedExpanded] =
		useState<boolean>(false);
	const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
	const [deletingEvent, setDeletingEvent] = useState<{
		id: string;
		title: string;
	} | null>(null);

	const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
	const [newEventTitle, setNewEventTitle] = useState<string>("");
	const [createEventError, setCreateEventError] = useState<string | null>(null);
	const router = useRouter();
	const utils = trpc.useUtils();
	const createEvent = trpc.events.create.useMutation({
		onSuccess: () => {
			utils.events.byOrganizer.invalidate();
			utils.organizers.myOrganizers.invalidate();
		},
	});

	const deleteEvent = trpc.events.delete.useMutation({
		onSuccess: () => {
			utils.events.byOrganizer.invalidate();
			utils.organizers.myOrganizers.invalidate();
			setDeletingEvent(null);
		},
		onError: (err) => {
			alert(err.message);
		},
	});

	// Auto-open create modal if navigated with ?action=create
	useEffect(() => {
		if (actionParam === "create") {
			setIsCreateModalOpen(true);
		}
	}, [actionParam]);

	const handleCreateEventSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setCreateEventError(null);

		if (!currentOrgId) {
			setCreateEventError("Please select an organization.");
			return;
		}

		if (!newEventTitle.trim()) {
			setCreateEventError("Event name is required.");
			return;
		}

		try {
			const now = new Date();
			const later = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
			const detectedTimezone =
				typeof Intl !== "undefined"
					? Intl.DateTimeFormat().resolvedOptions().timeZone
					: "UTC";

			const autoSlug = newEventTitle
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");

			const result = await createEvent.mutateAsync({
				title: newEventTitle.trim(),
				organizerId: currentOrgId as string,
				slug: autoSlug || `event-${Math.random().toString(36).substring(2, 6)}`,
				eventStart: now.toISOString(),
				eventEnd: later.toISOString(),
				timezone: detectedTimezone || "UTC",
				capacity: 300,
				tickets: [
					{
						name: "General Pass",
						price: 0,
						quantity: 300,
					},
				],
			});

			router.push(`/events/${result.slug}/manage`);
		} catch (err: unknown) {
			setCreateEventError(
				err instanceof Error ? err.message : "Failed to create event",
			);
		}
	};

	const userId = session?.user?.id;

	const { data: organizers, isLoading: orgsLoading } =
		trpc.organizers.myOrganizers.useQuery(undefined, { enabled: !!userId });

	// Automatically select the first organizer if not chosen
	const currentOrgId = selectedOrgId || organizers?.[0]?.id;
	const activeOrg = organizers?.find((o) => o.id === currentOrgId);

	const { data: rawEvents, isLoading: eventsLoading } =
		trpc.events.byOrganizer.useQuery(
			{ organizerId: currentOrgId as string },
			{ enabled: !!currentOrgId },
		);

	// Filter events by search query
	const allOrganizerEvents = useMemo(() => {
		if (!rawEvents) return [];
		const q = searchQuery.trim().toLowerCase();
		if (!q) return rawEvents;
		return rawEvents.filter(
			(e) =>
				e.title.toLowerCase().includes(q) ||
				e.format.toLowerCase().includes(q) ||
				Boolean(e.location?.toLowerCase().includes(q)),
		);
	}, [rawEvents, searchQuery]);

	// Categorize by status and lifecycle
	const { publishedEvents, draftEvents, completedEvents } = useMemo(() => {
		const published: typeof allOrganizerEvents = [];
		const draft: typeof allOrganizerEvents = [];
		const completed: typeof allOrganizerEvents = [];

		const now = new Date();

		for (const ev of allOrganizerEvents) {
			const isPast = new Date(ev.eventEnd) < now;
			if (ev.status === "draft") {
				draft.push(ev);
			} else if (
				ev.status === "completed" ||
				(ev.status === "published" && isPast)
			) {
				completed.push(ev);
			} else {
				published.push(ev);
			}
		}

		return {
			publishedEvents: published,
			draftEvents: draft,
			completedEvents: completed,
		};
	}, [allOrganizerEvents]);

	const handleCopyLink = (slug: string, eventId: string) => {
		const url = `${window.location.origin}/events/${slug}`;
		navigator.clipboard.writeText(url);
		setCopiedEventId(eventId);
		setTimeout(() => setCopiedEventId(null), 2000);
	};

	if (status === "unauthenticated") {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<DashboardHeader />
				<main className="flex-1 w-full px-4 lg:px-6 py-16 flex flex-col items-center justify-center text-center">
					<h1 className="font-display font-semibold text-h2 mb-4">
						Access Restricted
					</h1>
					<p className="text-body opacity-80 max-w-md mb-8">
						Please sign in to access your organizer dashboard and manage your
						events.
					</p>
					<Link
						href="/login"
						className="bg-stamp text-paper label px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
					>
						Sign In
					</Link>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-paper flex flex-col">
			<DashboardHeader />

			<main className="flex-1 w-full px-4 lg:px-6 py-8">
				{orgsLoading ? (
					<div className="space-y-6 animate-pulse">
						<div className="h-16 bg-perforation/30 rounded-lg" />
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="h-32 bg-perforation/30 rounded-lg" />
							<div className="h-32 bg-perforation/30 rounded-lg" />
							<div className="h-32 bg-perforation/30 rounded-lg" />
						</div>
					</div>
				) : !organizers || organizers.length === 0 ? (
					<div className="border border-perforation rounded-lg p-12 text-center bg-paper/60 my-8">
						<div className="w-16 h-16 rounded-full bg-stamp/10 text-stamp flex items-center justify-center mx-auto mb-4">
							<Sparkles className="w-8 h-8 text-stamp" />
						</div>
						<h1 className="font-display font-semibold text-h2 mb-2">
							Create your Organizer Profile
						</h1>
						<p className="text-body opacity-70 max-w-md mx-auto mb-8">
							You haven&apos;t set up an organizer profile yet. Complete the
							quick 2-step onboarding to start creating events.
						</p>
						<Link
							href="/onboarding"
							className="bg-stamp text-paper label px-8 py-3 rounded-md hover:opacity-90 inline-block transition-opacity"
						>
							Start Organizer Setup →
						</Link>
					</div>
				) : (
					<div className="space-y-8">
						{/* Top Control Bar: Search + Participated/Organized Pill + Switcher + Create Event */}
						<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-perforation pb-6">
							{/* Left: Search Bar & Segmented Toggle */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
								{/* Search Input */}
								<div className="relative flex-1 sm:min-w-56">
									<svg
										aria-hidden="true"
										className="absolute left-3 top-1/2 -translate-y-1/2 text-ink opacity-40"
										xmlns="http://www.w3.org/2000/svg"
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<circle cx="11" cy="11" r="8" />
										<path d="m21 21-4.3-4.3" />
									</svg>
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search events..."
										className="w-full bg-paper border border-perforation rounded-md pl-9 pr-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
									/>
								</div>

								{/* Segmented Pill: Participated / Organized */}
								<div className="inline-flex justify-center rounded-md border border-perforation p-0.5 bg-paper/50 shrink-0">
									<button
										type="button"
										onClick={() => setMode("participated")}
										className={`flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs label transition-all ${
											mode === "participated"
												? "bg-ink text-paper font-semibold shadow-xs"
												: "text-ink opacity-60 hover:opacity-100"
										}`}
									>
										Participated
									</button>
									<button
										type="button"
										onClick={() => setMode("organized")}
										className={`flex-1 sm:flex-initial px-3 py-1.5 rounded text-xs label transition-all ${
											mode === "organized"
												? "bg-ink text-paper font-semibold shadow-xs"
												: "text-ink opacity-60 hover:opacity-100"
										}`}
									>
										Organized
									</button>
								</div>
							</div>

							{/* Right: Organizer Switcher & Create Event */}
							<div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 w-full lg:w-auto">
								{/* Active Organizer Selector */}
								<div className="relative flex-1 sm:flex-initial flex items-center">
									<select
										value={currentOrgId}
										onChange={(e) => {
											if (e.target.value === "__new__") {
												router.push("/onboarding");
											} else {
												setSelectedOrgId(e.target.value);
											}
										}}
										className="w-full sm:w-auto bg-paper border border-perforation text-xs rounded-md pl-7 pr-8 py-2 text-ink font-medium focus:outline-none focus:border-stamp appearance-none cursor-pointer"
										aria-label="Select active organizer profile"
									>
										{organizers.map((org) => (
											<option key={org.id} value={org.id}>
												{org.name}
											</option>
										))}
										<option value="__new__">+ New Organizer Profile...</option>
									</select>
									<span
										className="w-2 h-2 rounded-full bg-stamp absolute left-3 pointer-events-none"
										aria-hidden="true"
									/>
									<svg
										aria-hidden="true"
										className="w-3.5 h-3.5 absolute right-2.5 text-ink opacity-50 pointer-events-none"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="m6 9 6 6 6-6" />
									</svg>
								</div>

								{/* Create Event Pill Button */}
								<button
									type="button"
									onClick={() => {
										setNewEventTitle("");
										setCreateEventError(null);
										setIsCreateModalOpen(true);
									}}
									className="group inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-stamp text-paper rounded-full font-medium text-xs sm:text-sm hover:opacity-95 transition-all shadow-xs shrink-0"
								>
									<span>Create Event</span>
									<span className="w-5 h-5 rounded-full bg-ink flex items-center justify-center text-paper transition-transform duration-200 group-hover:translate-x-0.5">
										<svg
											aria-hidden="true"
											xmlns="http://www.w3.org/2000/svg"
											width="10"
											height="10"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M5 12h14" />
											<path d="m12 5 7 7-7 7" />
										</svg>
									</span>
								</button>

								{/* Organization Settings Gear Icon Button at the end */}
								{activeOrg && (
									<Link
										href={`/organization/${activeOrg.slug}`}
										className="p-2 border border-perforation rounded-md bg-paper hover:border-ink/50 text-ink opacity-80 hover:opacity-100 transition-all flex items-center justify-center cursor-pointer shadow-xs"
										aria-label="Organization settings"
										title="Organization settings"
									>
										<svg
											aria-hidden="true"
											xmlns="http://www.w3.org/2000/svg"
											width="15"
											height="15"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
											<circle cx="12" cy="12" r="3" />
										</svg>
									</Link>
								)}
							</div>
						</div>

						{/* ──────────────── MODE: PARTICIPATED ──────────────── */}
						{mode === "participated" && (
							<div className="space-y-6">
								<div className="border border-perforation rounded-lg p-12 text-center bg-paper/40">
									<div className="w-14 h-14 rounded-full bg-perforation/30 text-ink flex items-center justify-center mx-auto mb-4">
										<svg
											aria-hidden="true"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="opacity-70"
										>
											<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
											<path d="M13 5v2" />
											<path d="M13 17v2" />
											<path d="M13 11v2" />
										</svg>
									</div>
									<h2 className="font-display font-semibold text-xl mb-2 text-ink">
										No Registered Events Yet
									</h2>
									<p className="text-body opacity-70 max-w-md mx-auto mb-6 text-sm">
										When you register for workshops, fests, or meetups, your
										tickets and entry passes will appear here.
									</p>
									<Link
										href="/events"
										className="bg-stamp text-paper label px-6 py-2.5 rounded-md hover:opacity-90 inline-block transition-opacity text-xs"
									>
										Explore Events Directory →
									</Link>
								</div>
							</div>
						)}

						{/* ──────────────── MODE: ORGANIZED ──────────────── */}
						{mode === "organized" && (
							<div className="space-y-10">
								{/* Active Profile Info Strip */}
								<div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-perforation/15 border border-perforation text-xs font-mono">
									<div className="flex items-center gap-2">
										<span className="font-semibold text-ink">
											{activeOrg?.name}
										</span>
										<span className="opacity-50">•</span>
										<span className="text-stamp uppercase font-medium">
											{activeOrg?.category.replace(/_/g, " ")}
										</span>
										<span className="opacity-50">•</span>
										<Link
											href={`/organization/${activeOrg?.slug}`}
											className="opacity-60 hover:opacity-100 hover:underline transition-opacity text-stamp font-medium"
										>
											/{activeOrg?.slug} ↗
										</Link>
									</div>
									<div className="flex items-center gap-4 text-ink opacity-70">
										<span>{publishedEvents.length} published</span>
										<span>{draftEvents.length} drafts</span>
										<span>{completedEvents.length} completed</span>
									</div>
								</div>

								{/* SECTION 1: Published Events */}
								<div className="space-y-4">
									<div className="flex items-center justify-between border-b border-perforation pb-2">
										<h2 className="font-display font-semibold text-base text-ink flex items-center gap-2">
											<span>Published Events</span>
											<span className="text-xs font-mono font-normal opacity-50 px-2 py-0.5 rounded bg-perforation/30">
												{publishedEvents.length}
											</span>
										</h2>
									</div>

									{eventsLoading ? (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
											<div className="h-32 bg-perforation/30 rounded-lg" />
											<div className="h-32 bg-perforation/30 rounded-lg" />
										</div>
									) : publishedEvents.length === 0 ? (
										<div className="border border-perforation rounded-lg p-8 text-center bg-paper/20">
											<p className="text-sm opacity-60 mb-3">
												{searchQuery
													? "No published events match your search."
													: "No live published events right now."}
											</p>
											<button
												type="button"
												onClick={() => {
													setNewEventTitle("");
													setCreateEventError(null);
													setIsCreateModalOpen(true);
												}}
												className="label text-xs text-stamp hover:underline cursor-pointer"
											>
												+ Create your first event
											</button>
										</div>
									) : (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{publishedEvents.map((evt) => (
												<EventCard
													key={evt.id}
													event={evt}
													onCopyLink={() => handleCopyLink(evt.slug, evt.id)}
													isCopied={copiedEventId === evt.id}
													onDelete={() =>
														setDeletingEvent({ id: evt.id, title: evt.title })
													}
												/>
											))}
										</div>
									)}
								</div>

								{/* SECTION 2: Draft Events */}
								<div className="space-y-4">
									<div className="flex items-center justify-between border-b border-perforation pb-2">
										<h2 className="font-display font-semibold text-base text-ink flex items-center gap-2">
											<span>Draft Events</span>
											<span className="text-xs font-mono font-normal opacity-50 px-2 py-0.5 rounded bg-perforation/30">
												{draftEvents.length}
											</span>
										</h2>
									</div>

									{draftEvents.length === 0 ? (
										<div className="border border-perforation rounded-lg p-6 text-center bg-paper/20 text-xs opacity-60">
											No draft events in progress.
										</div>
									) : (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{draftEvents.map((evt) => (
												<EventCard
													key={evt.id}
													event={evt}
													onCopyLink={() => handleCopyLink(evt.slug, evt.id)}
													isCopied={copiedEventId === evt.id}
													onDelete={() =>
														setDeletingEvent({ id: evt.id, title: evt.title })
													}
												/>
											))}
										</div>
									)}
								</div>

								{/* SECTION 3: Completed Events (Collapsible) */}
								<div className="space-y-4">
									<button
										type="button"
										onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
										className="w-full flex items-center justify-between border-b border-perforation pb-2 text-left group"
									>
										<h2 className="font-display font-semibold text-base text-ink flex items-center gap-2">
											<span>Completed Events</span>
											<span className="text-xs font-mono font-normal opacity-50 px-2 py-0.5 rounded bg-perforation/30">
												{completedEvents.length}
											</span>
										</h2>
										<span className="text-xs label opacity-60 group-hover:opacity-100 transition-opacity">
											{isCompletedExpanded ? "Hide ▲" : "Show ▼"}
										</span>
									</button>

									{isCompletedExpanded && (
										<div>
											{completedEvents.length === 0 ? (
												<div className="border border-perforation rounded-lg p-6 text-center bg-paper/20 text-xs opacity-60">
													No past completed events yet.
												</div>
											) : (
												<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
													{completedEvents.map((evt) => (
														<EventCard
															key={evt.id}
															event={evt}
															onCopyLink={() =>
																handleCopyLink(evt.slug, evt.id)
															}
															isCopied={copiedEventId === evt.id}
															onDelete={() =>
																setDeletingEvent({
																	id: evt.id,
																	title: evt.title,
																})
															}
														/>
													))}
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</main>

			{/* Create Event Modal */}
			{isCreateModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-paper border border-perforation rounded-xl shadow-lg max-w-md w-full animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between p-4 border-b border-perforation">
							<h2 className="font-display font-semibold text-h3 text-ink">
								Create New Event
							</h2>
							<button
								type="button"
								onClick={() => setIsCreateModalOpen(false)}
								className="text-ink/50 hover:text-ink transition-colors"
								aria-label="Close modal"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<form onSubmit={handleCreateEventSubmit} className="p-5 space-y-6">
							{createEventError && (
								<div className="text-sm text-alert bg-alert/10 p-3 rounded-md">
									{createEventError}
								</div>
							)}
							<div className="space-y-2">
								<label
									htmlFor="modalEventTitle"
									className="block text-xs label text-ink/70"
								>
									Event Name*
								</label>
								<input
									id="modalEventTitle"
									type="text"
									required
									value={newEventTitle}
									onChange={(e) => setNewEventTitle(e.target.value)}
									placeholder="Enter the new event name"
									className="w-full bg-perforation/10 border border-perforation rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stamp transition-colors"
								/>
							</div>

							<div className="space-y-2 relative">
								<label
									htmlFor="modalOrg"
									className="block text-xs label text-ink/70 mb-1"
								>
									Organization*
									<span className="block font-normal text-[10px] opacity-60">
										Select Personal if you do not want any organization
									</span>
								</label>
								<select
									id="modalOrg"
									value={currentOrgId}
									onChange={(e) => setSelectedOrgId(e.target.value)}
									className="w-full bg-perforation/10 border border-perforation rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stamp transition-colors appearance-none"
								>
									{organizers?.map((org) => (
										<option key={org.id} value={org.id}>
											{org.name}
										</option>
									))}
								</select>
								<svg
									aria-hidden="true"
									className="w-4 h-4 absolute right-3 bottom-3 text-ink opacity-50 pointer-events-none"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="m6 9 6 6 6-6" />
								</svg>
							</div>

							<button
								type="submit"
								disabled={createEvent.isPending}
								className="w-full py-2.5 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
							>
								{createEvent.isPending ? "Creating..." : "Create Event"}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Delete Event Confirmation Modal */}
			{deletingEvent && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
					<div className="bg-paper border border-perforation rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
						<div className="flex items-center gap-3 text-alert">
							<div className="w-10 h-10 rounded-full bg-alert/10 flex items-center justify-center shrink-0">
								<Trash2 className="w-5 h-5 text-alert" />
							</div>
							<div>
								<h3 className="font-display font-semibold text-base text-ink">
									Delete Event
								</h3>
								<p className="text-xs text-ink/60">
									This action cannot be undone.
								</p>
							</div>
						</div>

						<p className="text-xs text-ink/80 leading-relaxed">
							Are you sure you want to permanently delete{" "}
							<strong className="text-ink font-semibold">
								"{deletingEvent.title}"
							</strong>
							? All tickets, RSVPs, and check-in records will be permanently
							removed.
						</p>

						<div className="flex items-center justify-end gap-3 pt-2">
							<button
								type="button"
								onClick={() => setDeletingEvent(null)}
								disabled={deleteEvent.isPending}
								className="px-4 py-2 text-xs font-medium text-ink bg-perforation/30 hover:bg-perforation/50 rounded-lg transition-colors cursor-pointer"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => deleteEvent.mutate({ id: deletingEvent.id })}
								disabled={deleteEvent.isPending}
								className="px-4 py-2 text-xs font-semibold text-paper bg-alert hover:bg-alert/90 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
							>
								{deleteEvent.isPending ? "Deleting..." : "Yes, Delete Event"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

interface EventCardProps {
	event: {
		id: string;
		title: string;
		slug: string;
		format: string;
		topic: string;
		status: string;
		eventStart: string | Date;
		eventEnd: string | Date;
		isOnline: boolean;
		location?: string | null;
		capacity?: number | null;
		tickets: Array<{
			id: string;
			name: string;
			price: number;
			quantity: number | null;
		}>;
	};
	onCopyLink: () => void;
	isCopied: boolean;
	onDelete?: () => void;
}

function EventCard({
	event,
	onCopyLink,
	isCopied,
	onDelete,
}: EventCardProps): JSX.Element {
	const startDate = new Date(event.eventStart);
	const formattedDate = startDate.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	// Initial letter for square thumbnail
	const initial = event.title.charAt(0).toUpperCase();

	// Calculate total guest count across tiers
	const totalCapacity =
		event.capacity ||
		event.tickets.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

	return (
		<div className="border border-perforation rounded-lg p-5 bg-paper hover:border-ink/20 transition-all flex flex-col justify-between space-y-4 shadow-xs">
			<div className="flex items-start gap-3.5">
				{/* Square Thumbnail with Initial */}
				<div className="w-12 h-12 rounded-md bg-perforation/30 text-ink flex items-center justify-center font-display font-semibold text-lg shrink-0 border border-perforation/40">
					{initial}
				</div>

				{/* Title and Date */}
				<div className="flex-1 min-w-0">
					<p className="font-mono text-xs opacity-60 mb-0.5 truncate">
						{formattedDate}
					</p>
					<h3
						className="font-display font-semibold text-sm text-ink truncate"
						title={event.title}
					>
						{event.title}
					</h3>
					<div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
						<span className="label text-xs px-2 py-0.5 rounded bg-stamp/10 text-stamp uppercase">
							{event.format}
						</span>
						{event.isOnline && (
							<span className="label text-xs px-2 py-0.5 rounded bg-perforation/40 text-ink opacity-70">
								Online
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Footer: Manage Button, Guests Count, Context Actions */}
			<div className="border-t border-perforation pt-3 flex items-center justify-between">
				<Link
					href={`/events/${event.slug}/manage`}
					className="label inline-flex items-center gap-1 text-xs text-ink hover:text-stamp transition-colors font-medium"
				>
					<span>Manage</span>
					<span aria-hidden="true">→</span>
				</Link>

				<div className="flex items-center gap-2">
					<span className="text-xs font-mono opacity-60 flex items-center gap-1 mr-1">
						<svg
							aria-hidden="true"
							className="w-3.5 h-3.5"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
						{totalCapacity > 0 ? `${totalCapacity} cap` : "Open"}
					</span>

					{/* Copy Link Button */}
					<button
						type="button"
						onClick={onCopyLink}
						title="Copy Event URL"
						className="p-1 rounded text-ink opacity-60 hover:opacity-100 hover:bg-perforation/30 transition-colors"
						aria-label="Copy event link"
					>
						{isCopied ? (
							<span className="text-xs font-mono text-stamp font-semibold">
								Copied!
							</span>
						) : (
							<svg
								aria-hidden="true"
								className="w-3.5 h-3.5"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
								<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
							</svg>
						)}
					</button>

					{/* Delete Event Button */}
					{onDelete && (
						<button
							type="button"
							onClick={onDelete}
							title="Delete Event"
							className="p-1 rounded text-ink opacity-40 hover:opacity-100 hover:text-alert hover:bg-alert/10 transition-colors cursor-pointer"
							aria-label="Delete event"
						>
							<Trash2 className="w-3.5 h-3.5" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
