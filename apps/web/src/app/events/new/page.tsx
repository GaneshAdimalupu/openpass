"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { JSX } from "react";

interface TicketTier {
	id: string;
	name: string;
	price: number;
	quantity: string;
}

const EVENT_FORMATS = [
	{ value: "meetup", label: "Meetup / Casual Gathering" },
	{ value: "conference", label: "Conference / Summit" },
	{ value: "workshop", label: "Workshop / Masterclass" },
	{ value: "hackathon", label: "Hackathon / Competition" },
	{ value: "fest", label: "College Fest / Cultural" },
	{ value: "webinar", label: "Webinar / Online Stream" },
	{ value: "networking", label: "Networking / Mixer" },
	{ value: "other", label: "Other" },
];

const EVENT_TOPICS = [
	{ value: "technology", label: "Technology & AI" },
	{ value: "business", label: "Business & Startups" },
	{ value: "opensource", label: "Open Source & DevTools" },
	{ value: "design", label: "Design & Product" },
	{ value: "science", label: "Science & Education" },
	{ value: "arts", label: "Arts & Entertainment" },
	{ value: "social", label: "Social & Community" },
	{ value: "campus", label: "Campus & College" },
	{ value: "other", label: "Other" },
];

export default function NewEventPage(): JSX.Element {
	const { data: session, status } = useSession();
	const userId = session?.user?.id;

	const { data: organizers, isLoading: orgsLoading } =
		trpc.organizers.myOrganizers.useQuery(undefined, { enabled: !!userId });

	const [organizerId, setOrganizerId] = useState<string>("");
	const [title, setTitle] = useState<string>("");
	const [slug, setSlug] = useState<string>("");
	const [format, setFormat] = useState<string>("meetup");
	const [topic, setTopic] = useState<string>("technology");
	const [tagInput, setTagInput] = useState<string>("");
	const [tags, setTags] = useState<string[]>([]);
	const [description, setDescription] = useState<string>("");

	// Dates
	const [startDate, setStartDate] = useState<string>("");
	const [startTime, setStartTime] = useState<string>("10:00");
	const [endDate, setEndDate] = useState<string>("");
	const [endTime, setEndTime] = useState<string>("17:00");

	// Location
	const [isOnline, setIsOnline] = useState<boolean>(false);
	const [location, setLocation] = useState<string>("");
	const [onlineLink, setOnlineLink] = useState<string>("");

	// Tickets
	const [tickets, setTickets] = useState<TicketTier[]>([
		{ id: "1", name: "General Admission", price: 0, quantity: "100" },
	]);

	const [error, setError] = useState<string | null>(null);

	const createEvent = trpc.events.create.useMutation();

	// Auto-fill organizer
	const effectiveOrgId = organizerId || organizers?.[0]?.id || "";

	const handleTitleChange = (val: string) => {
		setTitle(val);
		const autoSlug = val
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		setSlug(autoSlug);
	};

	const handleAddTicket = () => {
		setTickets([
			...tickets,
			{
				id: Math.random().toString(),
				name: "Supporter Pass",
				price: 499,
				quantity: "50",
			},
		]);
	};

	const handleRemoveTicket = (id: string) => {
		if (tickets.length === 1) return;
		setTickets(tickets.filter((t) => t.id !== id));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!effectiveOrgId) {
			setError("Please select or create an organizer profile first.");
			return;
		}

		if (!title.trim()) {
			setError("Event title is required.");
			return;
		}

		if (!startDate || !endDate) {
			setError("Start and end dates are required.");
			return;
		}

		const startDateTime = new Date(`${startDate}T${startTime}:00`);
		const endDateTime = new Date(`${endDate}T${endTime}:00`);

		if (
			Number.isNaN(startDateTime.getTime()) ||
			Number.isNaN(endDateTime.getTime())
		) {
			setError("Invalid date or time entered.");
			return;
		}

		if (endDateTime <= startDateTime) {
			setError("End time must be after the start time.");
			return;
		}

		try {
			await createEvent.mutateAsync({
				organizerId: effectiveOrgId,
				title: title.trim(),
				slug:
					slug.trim() ||
					title
						.trim()
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-"),
				format: format as
					| "meetup"
					| "conference"
					| "workshop"
					| "hackathon"
					| "fest"
					| "webinar"
					| "networking"
					| "other",
				topic: topic as
					| "technology"
					| "business"
					| "opensource"
					| "design"
					| "science"
					| "arts"
					| "social"
					| "campus"
					| "other",
				tags,
				description: description.trim() || undefined,
				eventStart: startDateTime.toISOString(),
				eventEnd: endDateTime.toISOString(),
				isOnline,
				location: isOnline ? undefined : location.trim() || undefined,
				onlineLink: isOnline ? onlineLink.trim() || undefined : undefined,
				tickets: tickets.map((t) => ({
					name: t.name.trim() || "Entry Pass",
					price: Number(t.price) || 0,
					quantity: t.quantity ? Number.parseInt(t.quantity, 10) : undefined,
				})),
			});

			window.location.href = "/dashboard";
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Failed to publish event";
			setError(msg);
		}
	};

	if (status === "unauthenticated") {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
					<h1 className="font-display font-semibold text-h2 mb-4">
						Sign in required
					</h1>
					<p className="text-body opacity-80 mb-8 max-w-md mx-auto">
						You need to be signed in to create and host events on openevents.
					</p>
					<Link
						href="/login"
						className="bg-stamp text-paper label px-6 py-3 rounded-md hover:opacity-90 inline-block transition-opacity"
					>
						Go to Sign In
					</Link>
				</main>
			</div>
		);
	}

	if (!orgsLoading && (!organizers || organizers.length === 0)) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
					<h1 className="font-display font-semibold text-h2 mb-4">
						Organizer Profile Needed
					</h1>
					<p className="text-body opacity-80 mb-8 max-w-md mx-auto">
						Before you can host an event, please create your community or
						organizer profile.
					</p>
					<Link
						href="/onboarding"
						className="bg-stamp text-paper label px-8 py-3 rounded-md hover:opacity-90 inline-block transition-opacity"
					>
						Complete Organizer Setup →
					</Link>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-paper flex flex-col">
			<SiteHeader />

			<main className="flex-1 max-w-3xl w-full mx-auto px-4 md:px-6 py-8">
				<div className="mb-8">
					<Link
						href="/dashboard"
						className="label text-xs opacity-60 hover:opacity-100 transition-opacity mb-4 inline-block"
					>
						← Back to Dashboard
					</Link>
					<h1 className="font-display font-semibold text-h1 text-ink">
						Host a New Event
					</h1>
					<p className="text-body opacity-70 mt-1">
						Fill out the details below to publish your event to the community.
					</p>
				</div>

				{error && (
					<div className="p-4 mb-6 text-sm text-alert bg-alert/10 border border-alert/20 rounded-md">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Organizer Selector */}
					{organizers && organizers.length > 1 && (
						<div className="p-6 border border-perforation rounded-lg bg-paper">
							<label htmlFor="organizer" className="block label mb-2">
								Hosting As
							</label>
							<select
								id="organizer"
								value={effectiveOrgId}
								onChange={(e) => setOrganizerId(e.target.value)}
								className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
							>
								{organizers.map((org) => (
									<option key={org.id} value={org.id}>
										{org.name} ({org.type})
									</option>
								))}
							</select>
						</div>
					)}

					{/* Basic Information */}
					<div className="p-6 border border-perforation rounded-lg bg-paper space-y-4">
						<h2 className="font-display font-semibold text-lg border-b border-perforation pb-3">
							1. Basic Information
						</h2>

						<div>
							<label htmlFor="title" className="block label mb-2">
								Event Title
							</label>
							<input
								id="title"
								type="text"
								required
								value={title}
								onChange={(e) => handleTitleChange(e.target.value)}
								placeholder="e.g. Bangalore Open Source Meetup #12"
								className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label htmlFor="slug" className="block label mb-2">
									Event URL Slug
								</label>
								<input
									id="slug"
									type="text"
									required
									value={slug}
									onChange={(e) => setSlug(e.target.value)}
									placeholder="bangalore-oss-12"
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body font-mono text-sm focus:outline-none focus:border-stamp"
								/>
							</div>

							<div>
								<label htmlFor="format" className="block label mb-2">
									Event Format
								</label>
								<select
									id="format"
									value={format}
									onChange={(e) => setFormat(e.target.value)}
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
								>
									{EVENT_FORMATS.map((f) => (
										<option key={f.value} value={f.value}>
											{f.label}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label htmlFor="topic" className="block label mb-2">
									Primary Topic
								</label>
								<select
									id="topic"
									value={topic}
									onChange={(e) => setTopic(e.target.value)}
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
								>
									{EVENT_TOPICS.map((t) => (
										<option key={t.value} value={t.value}>
											{t.label}
										</option>
									))}
								</select>
							</div>

							<div>
								<label htmlFor="tags" className="block label mb-2">
									Tags (optional)
								</label>
								<div className="flex items-center gap-2">
									<input
										id="tags"
										type="text"
										value={tagInput}
										onChange={(e) => setTagInput(e.target.value)}
										onKeyDown={(e) => {
											if (
												(e.key === "Enter" || e.key === ",") &&
												tagInput.trim()
											) {
												e.preventDefault();
												const newTag = tagInput
													.trim()
													.toLowerCase()
													.replace(/[^a-z0-9-]/g, "");
												if (
													newTag &&
													!tags.includes(newTag) &&
													tags.length < 10
												) {
													setTags([...tags, newTag]);
												}
												setTagInput("");
											}
										}}
										placeholder="Press Enter to add"
										className="flex-1 bg-paper border border-perforation rounded-md px-4 py-3 text-body text-sm focus:outline-none focus:border-stamp"
									/>
								</div>
								{tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-2">
										{tags.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center gap-1 px-2 py-1 bg-perforation/30 text-ink text-xs rounded font-mono"
											>
												{tag}
												<button
													type="button"
													onClick={() => setTags(tags.filter((t) => t !== tag))}
													className="text-alert/60 hover:text-alert"
													aria-label={`Remove tag ${tag}`}
												>
													×
												</button>
											</span>
										))}
									</div>
								)}
							</div>
						</div>

						<div>
							<label htmlFor="description" className="block label mb-2">
								Description & Agenda
							</label>
							<textarea
								id="description"
								rows={4}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="What is this event about? Who should attend? Include schedule and speaker details..."
								className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
							/>
						</div>
					</div>

					{/* Date & Time */}
					<div className="p-6 border border-perforation rounded-lg bg-paper space-y-4">
						<h2 className="font-display font-semibold text-lg border-b border-perforation pb-3">
							2. Schedule & Time
						</h2>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label htmlFor="startDate" className="block label mb-2">
									Start Date
								</label>
								<input
									id="startDate"
									type="date"
									required
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
								/>
							</div>
							<div>
								<label htmlFor="startTime" className="block label mb-2">
									Start Time
								</label>
								<input
									id="startTime"
									type="time"
									required
									value={startTime}
									onChange={(e) => setStartTime(e.target.value)}
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label htmlFor="endDate" className="block label mb-2">
									End Date
								</label>
								<input
									id="endDate"
									type="date"
									required
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
								/>
							</div>
							<div>
								<label htmlFor="endTime" className="block label mb-2">
									End Time
								</label>
								<input
									id="endTime"
									type="time"
									required
									value={endTime}
									onChange={(e) => setEndTime(e.target.value)}
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
								/>
							</div>
						</div>
					</div>

					{/* Venue / Location */}
					<div className="p-6 border border-perforation rounded-lg bg-paper space-y-4">
						<h2 className="font-display font-semibold text-lg border-b border-perforation pb-3">
							3. Format & Venue
						</h2>

						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={() => setIsOnline(false)}
								className={`label px-4 py-2 rounded-md border text-xs transition-colors ${
									!isOnline
										? "bg-stamp text-paper border-stamp font-semibold"
										: "bg-paper border-perforation text-ink opacity-70"
								}`}
							>
								📍 In-Person
							</button>
							<button
								type="button"
								onClick={() => setIsOnline(true)}
								className={`label px-4 py-2 rounded-md border text-xs transition-colors ${
									isOnline
										? "bg-stamp text-paper border-stamp font-semibold"
										: "bg-paper border-perforation text-ink opacity-70"
								}`}
							>
								💻 Virtual / Online
							</button>
						</div>

						{isOnline ? (
							<div>
								<label htmlFor="onlineLink" className="block label mb-2">
									Meeting / Stream URL
								</label>
								<input
									id="onlineLink"
									type="url"
									value={onlineLink}
									onChange={(e) => setOnlineLink(e.target.value)}
									placeholder="https://meet.google.com/abc-defg-hij"
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
								/>
							</div>
						) : (
							<div>
								<label htmlFor="location" className="block label mb-2">
									Venue Name & Address
								</label>
								<input
									id="location"
									type="text"
									value={location}
									onChange={(e) => setLocation(e.target.value)}
									placeholder="e.g. Samagata Hall, Koramangala 4th Block, Bengaluru"
									className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp"
								/>
							</div>
						)}
					</div>

					{/* Ticket Tiers */}
					<div className="p-6 border border-perforation rounded-lg bg-paper space-y-4">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h2 className="font-display font-semibold text-lg">
								4. Ticket Tiers & Pricing
							</h2>
							<button
								type="button"
								onClick={handleAddTicket}
								className="label text-xs text-stamp hover:underline"
							>
								+ Add Tier
							</button>
						</div>

						<div className="space-y-4">
							{tickets.map((t) => (
								<div
									key={t.id}
									className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 border border-perforation rounded-md bg-paper/50"
								>
									<div className="sm:col-span-6">
										<label
											htmlFor={`ticket-name-${t.id}`}
											className="block label text-xs mb-1"
										>
											Tier Name
										</label>
										<input
											id={`ticket-name-${t.id}`}
											type="text"
											required
											value={t.name}
											onChange={(e) => {
												const val = e.target.value;
												setTickets(
													tickets.map((item) =>
														item.id === t.id ? { ...item, name: val } : item,
													),
												);
											}}
											className="w-full bg-paper border border-perforation rounded px-3 py-2 text-sm focus:outline-none focus:border-stamp"
										/>
									</div>

									<div className="sm:col-span-3">
										<label
											htmlFor={`ticket-price-${t.id}`}
											className="block label text-xs mb-1"
										>
											Price (₹)
										</label>
										<input
											id={`ticket-price-${t.id}`}
											type="number"
											min={0}
											required
											value={t.price}
											onChange={(e) => {
												const val = Number.parseInt(e.target.value, 10) || 0;
												setTickets(
													tickets.map((item) =>
														item.id === t.id ? { ...item, price: val } : item,
													),
												);
											}}
											className="w-full bg-paper border border-perforation rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-stamp"
										/>
									</div>

									<div className="sm:col-span-2">
										<label
											htmlFor={`ticket-qty-${t.id}`}
											className="block label text-xs mb-1"
										>
											Quantity
										</label>
										<input
											id={`ticket-qty-${t.id}`}
											type="number"
											min={1}
											value={t.quantity}
											onChange={(e) => {
												const val = e.target.value;
												setTickets(
													tickets.map((item) =>
														item.id === t.id
															? { ...item, quantity: val }
															: item,
													),
												);
											}}
											className="w-full bg-paper border border-perforation rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-stamp"
										/>
									</div>

									<div className="sm:col-span-1 flex justify-end">
										{tickets.length > 1 && (
											<button
												type="button"
												onClick={() => handleRemoveTicket(t.id)}
												className="p-2 text-alert hover:bg-alert/10 rounded transition-colors text-xs"
												aria-label="Remove ticket tier"
											>
												✕
											</button>
										)}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-between pt-4 border-t border-perforation">
						<Link
							href="/dashboard"
							className="label text-ink opacity-60 hover:opacity-100 px-4 py-2"
						>
							Cancel
						</Link>

						<button
							type="submit"
							disabled={createEvent.isPending}
							className="group inline-flex items-center gap-2 pl-6 pr-2 py-2 bg-stamp text-paper rounded-full font-medium text-sm hover:opacity-95 transition-all shadow-sm disabled:opacity-50"
						>
							<span>
								{createEvent.isPending ? "Publishing..." : "Publish Event"}
							</span>
							<span className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-paper transition-transform duration-200 group-hover:translate-x-0.5">
								<svg
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
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
					</div>
				</form>
			</main>
		</div>
	);
}
