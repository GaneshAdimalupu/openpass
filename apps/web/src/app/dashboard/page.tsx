"use client";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { TicketPassModal } from "@/components/tickets/ticket-pass-modal";
import { trpc } from "@/lib/trpc";
import {
	CopyPlus,
	Moon,
	Sparkles,
	Sun,
	Ticket,
	Trash2,
	X,
	MapPin,
	Users,
	ChevronRight,
	Link2,
	Search,
	Settings,
	ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

type DashboardMode = "hosted" | "my_tickets";

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
	const tabParam = searchParams.get("tab");

	const [mode, setMode] = useState<DashboardMode>(
		tabParam === "tickets" || tabParam === "my_tickets"
			? "my_tickets"
			: "hosted",
	);

	useEffect(() => {
		if (tabParam === "tickets" || tabParam === "my_tickets") {
			setMode("my_tickets");
		} else if (tabParam === "hosted" || tabParam === "organized") {
			setMode("hosted");
		}
	}, [tabParam]);
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
	const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
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

	const [selectedTicketCode, setSelectedTicketCode] = useState<string | null>(
		null,
	);
	const [duplicatingEventId, setDuplicatingEventId] = useState<string | null>(
		null,
	);

	const handleDuplicateEvent = async (
		evt: (typeof publishedEvents)[number],
	) => {
		setDuplicatingEventId(evt.id);
		try {
			const detectedTimezone =
				typeof Intl !== "undefined"
					? Intl.DateTimeFormat().resolvedOptions().timeZone
					: "UTC";
			const autoSlug = `${evt.slug}-copy-${Math.random().toString(36).substring(2, 6)}`;
			await createEvent.mutateAsync({
				title: `${evt.title} (Copy)`,
				organizerId: currentOrgId as string,
				communityId: selectedCommunityId || undefined,
				slug: autoSlug,
				format:
					(evt.format as
						| "meetup"
						| "conference"
						| "workshop"
						| "hackathon"
						| "fest"
						| "webinar"
						| "networking"
						| "other") || "meetup",
				topic:
					(evt.topic as
						| "technology"
						| "business"
						| "opensource"
						| "design"
						| "science"
						| "arts"
						| "social"
						| "campus"
						| "other") || "technology",
				eventStart:
					typeof evt.eventStart === "string"
						? evt.eventStart
						: new Date(evt.eventStart).toISOString(),
				eventEnd:
					typeof evt.eventEnd === "string"
						? evt.eventEnd
						: new Date(evt.eventEnd).toISOString(),
				timezone: detectedTimezone || "UTC",
				location: evt.location || undefined,
				isOnline: evt.isOnline ?? false,
				capacity: evt.capacity || 300,
				tickets: evt.tickets?.length
					? evt.tickets.map((t) => ({
							name: t.name,
							price: t.price,
							quantity: t.quantity ?? 300,
						}))
					: [{ name: "General Pass", price: 0, quantity: 300 }],
			});
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : "Failed to duplicate event");
		} finally {
			setDuplicatingEventId(null);
		}
	};

	// Auto-open create modal if navigated with ?action=create and clean URL param
	useEffect(() => {
		if (actionParam === "create") {
			setIsCreateModalOpen(true);
			router.replace("/dashboard", { scroll: false });
		}
	}, [actionParam, router]);

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
				communityId: selectedCommunityId || undefined,
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

	const { data: currentOrgCommunities } =
		trpc.communities.listByOrganizer.useQuery(
			{ organizerId: currentOrgId as string },
			{ enabled: !!currentOrgId },
		);

	const { data: rawEvents, isLoading: eventsLoading } =
		trpc.events.byOrganizer.useQuery(
			{ organizerId: currentOrgId as string },
			{ enabled: !!currentOrgId },
		);

	const { data: participatedTickets, isLoading: participatedLoading } =
		trpc.events.participatedList.useQuery(undefined, {
			enabled: status === "authenticated",
		});

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

	const getGreeting = () => {
		const hour = new Date().getHours();
		const name = session?.user?.name
			? session.user.name.split(" ")[0]
			: "there";

		if (hour < 12) {
			return {
				text: `Good morning, ${name}`,
				icon: <Sun className="w-6 h-6 text-stamp" />,
			};
		} else if (hour < 17) {
			return {
				text: `Good afternoon, ${name}`,
				icon: <Sun className="w-6 h-6 text-stamp opacity-80" />,
			};
		} else {
			return {
				text: `Good evening, ${name}`,
				icon: <Moon className="w-6 h-6 text-ink/70" />,
			};
		}
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

			<main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 py-8">
				{orgsLoading ? (
					<div className="space-y-6 animate-pulse">
						<div className="h-16 bg-perforation/30 rounded-lg" />
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
							<div className="h-36 bg-perforation/30 rounded-lg" />
							<div className="h-36 bg-perforation/30 rounded-lg" />
							<div className="h-36 bg-perforation/30 rounded-lg" />
							<div className="h-36 bg-perforation/30 rounded-lg" />
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
						{/* ──────────────── COMMAND CENTER ──────────────── */}
						<div className="flex flex-col gap-6 border-b border-perforation pb-6">
							{/* Top Row: Greeting & Stats */}
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div className="flex items-center gap-4">
									{getGreeting().icon}
									<h1 className="font-display font-semibold text-xl text-ink">
										{getGreeting().text}
									</h1>
								</div>

								{/* Stats Pill Badges */}
								{mode === "hosted" ? (
									<div className="flex flex-wrap items-center gap-2">
										<div className="px-4 py-2 rounded-full bg-stamp/10 text-stamp text-xs font-medium border border-stamp/20 flex items-center gap-2">
											<span className="w-1.5 h-1.5 rounded-full bg-stamp" />
											{publishedEvents.length} Published
										</div>
										<div className="px-4 py-2 rounded-full bg-ink/5 text-ink/70 text-xs font-medium border border-ink/10 flex items-center gap-2">
											<span className="w-1.5 h-1.5 rounded-full bg-ink/40" />
											{draftEvents.length} Drafts
										</div>
										<div className="px-4 py-2 rounded-full bg-perforation/30 text-ink/60 text-xs font-medium border border-perforation flex items-center gap-2">
											<span className="w-1.5 h-1.5 rounded-full bg-ink/20" />
											{completedEvents.length} Completed
										</div>
									</div>
								) : (
									<div className="flex items-center gap-2">
										<div className="px-4 py-2 rounded-full bg-stamp/10 text-stamp text-xs font-medium border border-stamp/20 flex items-center gap-2">
											<Ticket className="w-4 h-4" />
											{participatedTickets?.length || 0} Tickets
										</div>
									</div>
								)}
							</div>

							{/* Bottom Row: Controls */}
							<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
								{/* Left: Search Bar & Segmented Toggle */}
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
									{/* Search Input */}
									<div className="relative w-full sm:w-64">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 pointer-events-none" />
										<input
											type="text"
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											placeholder="Search events..."
											className="w-full bg-paper border border-perforation rounded-md pl-8 pr-4 py-2 text-xs text-body focus:outline-none focus:border-stamp"
										/>
									</div>

									{/* Mode Switcher */}
									<div className="flex items-center p-1 bg-perforation/20 rounded-md border border-perforation/50">
										<button
											type="button"
											onClick={() => setMode("my_tickets")}
											className={`flex-1 sm:flex-initial px-4 py-2 rounded text-xs label transition-all inline-flex items-center gap-2 ${
												mode === "my_tickets"
													? "bg-paper text-stamp shadow-sm border border-perforation/50"
													: "text-ink/60 hover:text-ink hover:bg-perforation/30 border border-transparent"
											}`}
										>
											<Ticket className="w-4 h-4 text-stamp" />
											MY TICKETS
										</button>
										<button
											type="button"
											onClick={() => setMode("hosted")}
											className={`flex-1 sm:flex-initial px-4 py-2 rounded text-xs label transition-all ${
												mode === "hosted"
													? "bg-paper text-ink shadow-sm border border-perforation/50"
													: "text-ink/60 hover:text-ink hover:bg-perforation/30 border border-transparent"
											}`}
										>
											HOSTED EVENTS
										</button>
									</div>
								</div>

								{/* Right: Organizer Switcher & Create Event */}
								<div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-4 w-full lg:w-auto">
									{/* Active Organizer Selector */}
									{mode === "hosted" && (
										<>
											<div className="relative flex-1 sm:flex-initial min-w-0 sm:min-w-[200px]">
												{organizers.length > 1 ? (
													<>
														<select
															value={currentOrgId}
															onChange={(e) => setSelectedOrgId(e.target.value)}
															className="w-full sm:w-auto bg-paper border border-perforation text-xs rounded-md pl-8 pr-8 py-2 text-ink font-medium focus:outline-none focus:border-stamp appearance-none cursor-pointer"
														>
															{organizers.map((org) => (
																<option key={org.id} value={org.id}>
																	{org.name}
																</option>
															))}
														</select>
														<div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
															<div className="w-4 h-4 rounded-full bg-stamp/20 text-stamp flex items-center justify-center text-[8px] font-bold">
																{organizers
																	.find((o) => o.id === currentOrgId)
																	?.name.charAt(0)
																	.toUpperCase()}
															</div>
														</div>
														<ChevronDown className="w-4 h-4 absolute right-2 text-ink opacity-50 pointer-events-none top-1/2 -translate-y-1/2" />
													</>
												) : (
													<div className="px-3 py-2 bg-paper border border-perforation rounded-md text-xs text-ink font-medium flex items-center gap-2">
														<div className="w-4 h-4 rounded-full bg-stamp/20 text-stamp flex items-center justify-center text-[8px] font-bold">
															{organizers[0].name.charAt(0).toUpperCase()}
														</div>
														{organizers[0].name}
													</div>
												)}
											</div>

											{/* Organization Settings Gear Icon Button */}
											{activeOrg && (
												<Link
													href={`/organization/${activeOrg.slug}/settings`}
													className="w-8 h-8 rounded-md border border-perforation flex items-center justify-center text-ink/60 hover:text-ink hover:bg-perforation/20 transition-all shrink-0 group relative overflow-hidden"
													title="Organization Settings"
												>
													<Settings className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-45" />
													<span className="absolute inset-0 bg-perforation/20 opacity-0 group-hover:opacity-100 transition-opacity" />
												</Link>
											)}
										</>
									)}

									{/* Create Event Button */}
									<button
										type="button"
										onClick={() => {
											setNewEventTitle("");
											setCreateEventError(null);
											setIsCreateModalOpen(true);
										}}
										className="bg-stamp text-paper px-4 py-2 rounded-full text-xs font-semibold hover:opacity-90 transition-all shadow-sm shrink-0 flex items-center gap-2 group"
									>
										Create Event
										<span className="w-4 h-4 rounded-full bg-ink flex items-center justify-center text-paper transition-transform duration-200 group-hover:translate-x-1">
											<ChevronRight className="w-3 h-3" />
										</span>
									</button>
								</div>
							</div>
						</div>

						{/* ──────────────── MODE: MY TICKETS ──────────────── */}
						{mode === "my_tickets" && (
							<div className="space-y-6">
								{participatedLoading ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 animate-pulse">
										<div className="h-36 bg-perforation/30 rounded-lg" />
										<div className="h-36 bg-perforation/30 rounded-lg" />
										<div className="h-36 bg-perforation/30 rounded-lg" />
										<div className="h-36 bg-perforation/30 rounded-lg" />
									</div>
								) : !participatedTickets || participatedTickets.length === 0 ? (
									<div className="border border-perforation rounded-lg p-12 text-center bg-paper/40">
										<div className="w-14 h-14 rounded-full bg-perforation/30 text-ink flex items-center justify-center mx-auto mb-4">
											<Ticket className="w-6 h-6 opacity-70 text-stamp" />
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
											className="bg-stamp text-paper label px-6 py-2.5 rounded-md hover:opacity-90 inline-block transition-opacity text-xs font-medium"
										>
											Explore Events Directory →
										</Link>
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
										{participatedTickets.map((t) => {
											const isPast = t.event.eventEnd
												? new Date(t.event.eventEnd) < new Date()
												: false;

											return (
												<div
													key={t.id}
													className={`border border-perforation rounded-lg bg-paper overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col justify-between ${
														isPast ? "opacity-80" : ""
													}`}
												>
													{/* Banner */}
													<div className="relative h-16 sm:h-20 w-full bg-perforation/20 overflow-hidden">
														{t.event.bannerUrl ? (
															<Image
																src={t.event.bannerUrl}
																alt={t.event.title}
																fill
																priority
																sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
																className={`object-cover ${
																	isPast ? "grayscale-30" : ""
																}`}
															/>
														) : (
															<div className="absolute inset-0 bg-gradient-to-br from-stamp/10 to-paper flex items-center justify-center">
																<span className="font-display font-semibold text-xl text-ink/30">
																	{t.event.title.charAt(0)}
																</span>
															</div>
														)}
														{isPast && (
															<div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-paper/90 backdrop-blur-xs rounded font-mono text-[9px] font-bold text-ink/60 border border-perforation uppercase">
																EXPIRED
															</div>
														)}
														<div
															className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-paper/90 backdrop-blur-xs rounded font-mono text-[9px] font-bold border border-perforation ${
																isPast ? "text-ink/60" : "text-stamp"
															}`}
														>
															{t.ticket.name}
														</div>
													</div>

													{/* Content */}
													<div className="p-3 flex-1 flex flex-col justify-between space-y-2">
														<div>
															<div
																className={`text-[11px] font-mono uppercase mb-1 ${
																	isPast ? "text-ink/60" : "text-stamp"
																}`}
															>
																{t.event.organizer.name}
															</div>
															<h3 className="font-display font-medium text-base text-ink line-clamp-1">
																{t.event.title}
															</h3>
															<p className="text-xs text-ink/60 font-mono mt-1">
																{new Date(
																	t.event.eventStart,
																).toLocaleDateString("en-US", {
																	weekday: "short",
																	month: "short",
																	day: "numeric",
																})}{" "}
																• {t.event.location || "Online"}
															</p>
														</div>

														<div className="pt-3 border-t border-perforation flex items-center justify-between gap-2">
															<span className="font-mono text-xs text-ink/70 truncate">
																Code:{" "}
																<strong className="text-ink truncate">
																	{t.ticketCode}
																</strong>
															</span>
															<button
																type="button"
																onClick={() =>
																	setSelectedTicketCode(t.ticketCode)
																}
																className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-opacity inline-flex items-center gap-1 shrink-0 cursor-pointer ${
																	isPast
																		? "bg-perforation/40 text-ink/80 hover:bg-perforation/60"
																		: "bg-stamp text-paper hover:opacity-90"
																}`}
															>
																<Ticket className="w-3.5 h-3.5" />
																View Pass
															</button>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}

						{/* ──────────────── MODE: HOSTED EVENTS ──────────────── */}
						{mode === "hosted" && (
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
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
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
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
											{publishedEvents.map((evt) => (
												<EventCard
													key={evt.id}
													event={evt}
													onCopyLink={() => handleCopyLink(evt.slug, evt.id)}
													isCopied={copiedEventId === evt.id}
													onDuplicate={() => handleDuplicateEvent(evt)}
													isDuplicating={duplicatingEventId === evt.id}
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
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
											{draftEvents.map((evt) => (
												<EventCard
													key={evt.id}
													event={evt}
													onCopyLink={() => handleCopyLink(evt.slug, evt.id)}
													isCopied={copiedEventId === evt.id}
													onDuplicate={() => handleDuplicateEvent(evt)}
													isDuplicating={duplicatingEventId === evt.id}
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
												<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
													{completedEvents.map((evt) => (
														<EventCard
															key={evt.id}
															event={evt}
															onCopyLink={() =>
																handleCopyLink(evt.slug, evt.id)
															}
															isCopied={copiedEventId === evt.id}
															onDuplicate={() => handleDuplicateEvent(evt)}
															isDuplicating={duplicatingEventId === evt.id}
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

							{currentOrgCommunities && currentOrgCommunities.length > 0 && (
								<div className="space-y-2 relative">
									<label
										htmlFor="modalCommunity"
										className="block text-xs label text-ink/70 mb-1"
									>
										Sub-Community / Chapter (Optional)
										<span className="block font-normal text-[10px] opacity-60">
											Assign this event to a specific sub-community under{" "}
											{activeOrg?.name}
										</span>
									</label>
									<select
										id="modalCommunity"
										value={selectedCommunityId}
										onChange={(e) => setSelectedCommunityId(e.target.value)}
										className="w-full bg-perforation/10 border border-perforation rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stamp transition-colors appearance-none"
									>
										<option value="">
											-- Main Organization Event (Org Wide) --
										</option>
										{currentOrgCommunities.map((comm) => (
											<option key={comm.id} value={comm.id}>
												{comm.name} ({comm.category || "Chapter"})
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
							)}

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

			{/* Ticket Pass Modal */}
			<TicketPassModal
				ticketCode={selectedTicketCode}
				onClose={() => setSelectedTicketCode(null)}
			/>
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
		bannerUrl?: string | null;
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
		_count?: {
			issuedTickets: number;
		};
	};
	onCopyLink: () => void;
	isCopied: boolean;
	onDelete?: () => void;
	onDuplicate?: () => void;
	isDuplicating?: boolean;
}

/**
 * Topic-based gradient backgrounds for events without a banner image.
 * Uses design system tokens mixed with opacity for subtle variety.
 */
const TOPIC_GRADIENTS: Record<string, string> = {
	technology: "from-stamp/20 to-ink/10",
	business: "from-ink/15 to-perforation/40",
	opensource: "from-stamp/25 to-stamp/5",
	design: "from-perforation/30 to-stamp/10",
	science: "from-ink/10 to-stamp/15",
	arts: "from-perforation/40 to-ink/8",
	social: "from-stamp/10 to-perforation/30",
	campus: "from-ink/8 to-stamp/20",
	other: "from-perforation/30 to-ink/10",
};

function EventCard({
	event,
	onCopyLink,
	isCopied,
	onDelete,
	onDuplicate,
	isDuplicating,
}: EventCardProps): JSX.Element {
	const startDate = new Date(event.eventStart);
	const formattedDate =
		startDate.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		}) +
		" · " +
		startDate.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});

	// Initial letter for fallback thumbnail
	const initial = event.title.charAt(0).toUpperCase();

	// Calculate total registrations based on issued tickets
	const totalRegistrations = event._count?.issuedTickets || 0;

	const gradientClass = TOPIC_GRADIENTS[event.topic] || TOPIC_GRADIENTS.other;

	return (
		<div className="group relative border border-perforation rounded-xl bg-paper hover:border-ink/30 transition-all shadow-xs hover:shadow-md p-4">
			{/* Clickable Overlay */}
			<Link
				href={`/events/${event.slug}/manage`}
				className="absolute inset-0 z-0"
				aria-label={`Manage ${event.title}`}
			/>

			<div className="flex flex-row gap-4 pointer-events-none h-full">
				{/* Left side: Thumbnail */}
				<div className="relative w-24 shrink-0 rounded-lg border border-perforation/30 bg-ink/5 flex flex-col justify-center overflow-hidden">
					<div className="relative w-full aspect-[4/5]">
						{event.bannerUrl ? (
							<Image
								src={event.bannerUrl}
								alt={`Banner for ${event.title}`}
								fill
								sizes="96px"
								className="object-cover group-hover:scale-105 transition-transform duration-500"
							/>
						) : (
							<div
								className={`absolute inset-0 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
							>
								<span className="font-display font-semibold text-3xl text-ink/60 select-none">
									{initial}
								</span>
							</div>
						)}
					</div>
					{/* Status badge overlay */}
					{event.status === "draft" && (
						<span className="absolute bottom-1 right-1 label text-[10px] px-1.5 py-0.5 rounded bg-ink/70 text-paper font-medium backdrop-blur-sm z-10">
							Draft
						</span>
					)}
				</div>

				{/* Right side: Content */}
				<div className="flex-1 flex flex-col justify-between min-w-0">
					{/* Top: Date & Title */}
					<div>
						<div className="flex items-start justify-between gap-2">
							<p className="font-mono text-xs text-ink/60 leading-tight mb-1 group-hover:text-stamp transition-colors">
								{formattedDate}
							</p>
							{onDuplicate && (
								<button
									type="button"
									onClick={onDuplicate}
									disabled={isDuplicating}
									title="Duplicate Event"
									className="relative z-10 p-1 -mt-1 -mr-1 rounded text-ink/40 hover:text-ink hover:bg-perforation/30 transition-colors cursor-pointer disabled:opacity-40 shrink-0 pointer-events-auto"
									aria-label="Duplicate event"
								>
									<CopyPlus
										className={`w-4 h-4 ${
											isDuplicating ? "animate-pulse text-stamp" : ""
										}`}
									/>
								</button>
							)}
						</div>
						<h3
							className="font-display font-semibold text-base text-ink truncate leading-snug group-hover:text-stamp transition-colors"
							title={event.title}
						>
							{event.title}
						</h3>
					</div>

					{/* Bottom: Location, Users & Actions */}
					<div className="flex items-end justify-between gap-2">
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center gap-2 text-xs text-ink/60">
								<MapPin className="w-4 h-4 shrink-0" />
								<span className="truncate max-w-[160px]">
									{event.location || "TBA"}
								</span>
							</div>
							<div className="flex items-center gap-2 text-xs text-ink/60">
								<Users className="w-4 h-4 shrink-0" />
								<span>{totalRegistrations}</span>
							</div>
						</div>

						{/* Actions */}
						<div className="relative z-10 flex items-center gap-1 shrink-0 pointer-events-auto">
							{/* Attendees */}
							<Link
								href={`/events/${event.slug}/manage?tab=attendees`}
								className="w-8 h-8 rounded-full bg-transparent hover:bg-perforation/20 flex items-center justify-center text-ink/60 hover:text-ink transition-colors"
								title="Attendees"
							>
								<Users className="w-4 h-4" />
							</Link>

							{/* Copy Link */}
							<button
								type="button"
								onClick={onCopyLink}
								title="Copy Event URL"
								className="w-8 h-8 rounded-full bg-transparent hover:bg-perforation/20 flex items-center justify-center text-ink/60 hover:text-ink transition-colors"
								aria-label="Copy event link"
							>
								{isCopied ? (
									<span className="text-[10px] font-mono text-stamp font-semibold">
										Copied
									</span>
								) : (
									<Link2 className="w-4 h-4" />
								)}
							</button>

							{/* Delete */}
							{onDelete && (
								<button
									type="button"
									onClick={onDelete}
									title="Delete Event"
									className="w-8 h-8 rounded-full bg-transparent hover:bg-alert/10 flex items-center justify-center text-ink/60 hover:text-alert transition-colors"
									aria-label="Delete event"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
