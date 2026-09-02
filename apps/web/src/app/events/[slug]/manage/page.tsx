"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
	Eye,
	EyeOff,
	Edit3,
	ExternalLink,
	Copy,
	Trash2,
	ImagePlus,
	X,
} from "lucide-react";
import Image from "next/image";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function EventManagePage() {
	const params = useParams();
	const slug = params.slug as string;
	const router = useRouter();

	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	// Basic Info
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [shortDescription, setShortDescription] = useState("");
	const [format, setFormat] = useState("meetup");
	const [topic, setTopic] = useState("technology");
	const [isOnline, setIsOnline] = useState(false);
	const [location, setLocation] = useState("");
	const [onlineLink, setOnlineLink] = useState("");
	const [showSpeakers, setShowSpeakers] = useState(true);
	const [recordingLink, setRecordingLink] = useState("");
	const [mapLink, setMapLink] = useState("");
	const [isPaid, setIsPaid] = useState(false);
	const [ticketDescription, setTicketDescription] = useState("");

	// Dates
	const [eventStartDate, setEventStartDate] = useState("");
	const [eventStartTime, setEventStartTime] = useState("");
	const [eventEndDate, setEventEndDate] = useState("");
	const [eventEndTime, setEventEndTime] = useState("");
	const [timezone, setTimezone] = useState(
		() =>
			(typeof Intl !== "undefined" &&
				Intl.DateTimeFormat().resolvedOptions().timeZone) ||
			"UTC",
	);

	// Registration
	const [registrationStartDate, setRegistrationStartDate] = useState("");
	const [registrationStartTime, setRegistrationStartTime] = useState("");
	const [closeRegistration, setCloseRegistration] = useState(false);
	const [registrationEndDate, setRegistrationEndDate] = useState("");
	const [registrationEndTime, setRegistrationEndTime] = useState("");

	const {
		data: event,
		isLoading,
		refetch: refetchEvent,
	} = trpc.events.manageGetBySlug.useQuery({ slug }, { enabled: !!slug });

	// Banner upload state
	const [bannerPreview, setBannerPreview] = useState<string | null>(null);
	const [bannerUploading, setBannerUploading] = useState(false);
	const [bannerError, setBannerError] = useState<string | null>(null);
	const bannerUploadUrl = trpc.events.bannerUploadUrl.useMutation();
	const bannerConfirm = trpc.events.bannerConfirm.useMutation();
	const bannerDeleteMut = trpc.events.bannerDelete.useMutation();

	const updateEvent = trpc.events.update.useMutation({
		onSuccess: () => {
			alert("Event updated successfully!");
		},
		onError: (err: { message: string }) => {
			alert(err.message);
		},
	});

	const deleteEvent = trpc.events.delete.useMutation({
		onSuccess: () => {
			router.push("/dashboard");
		},
		onError: (err: { message: string }) => {
			alert(err.message);
			setIsDeleting(false);
		},
	});

	const handleDeleteEvent = () => {
		if (!event) return;
		setIsDeleting(true);
		deleteEvent.mutate({ id: event.id });
	};

	useEffect(() => {
		if (event) {
			setTitle(event.title);
			setDescription(event.description || "");
			setShortDescription(event.shortDescription || "");
			setFormat(event.format || "meetup");
			setTopic(event.topic || "technology");
			setIsOnline(event.isOnline);
			setLocation(event.location || "");
			setOnlineLink(event.onlineLink || "");
			setShowSpeakers(event.showSpeakers ?? true);
			setRecordingLink(event.recordingLink || "");
			setMapLink(event.mapLink || "");
			setIsPaid(event.isPaid ?? false);
			setTicketDescription(event.ticketDescription || "");
			if (event.timezone) {
				setTimezone(event.timezone);
			}

			const formatLocalDate = (d: Date) => {
				const year = d.getFullYear();
				const month = String(d.getMonth() + 1).padStart(2, "0");
				const day = String(d.getDate()).padStart(2, "0");
				return `${year}-${month}-${day}`;
			};
			const formatLocalTime = (d: Date) => {
				const hours = String(d.getHours()).padStart(2, "0");
				const minutes = String(d.getMinutes()).padStart(2, "0");
				return `${hours}:${minutes}`;
			};

			if (event.eventStart) {
				const start = new Date(event.eventStart);
				setEventStartDate(formatLocalDate(start));
				setEventStartTime(formatLocalTime(start));
			}

			if (event.eventEnd) {
				const end = new Date(event.eventEnd);
				setEventEndDate(formatLocalDate(end));
				setEventEndTime(formatLocalTime(end));
			}

			if (event.registrationStart) {
				const regStart = new Date(event.registrationStart);
				setRegistrationStartDate(formatLocalDate(regStart));
				setRegistrationStartTime(formatLocalTime(regStart));
			}

			if (event.registrationEnd) {
				const regEnd = new Date(event.registrationEnd);
				setRegistrationEndDate(formatLocalDate(regEnd));
				setRegistrationEndTime(formatLocalTime(regEnd));
				setCloseRegistration(true);
			}
		}
	}, [event]);

	if (isLoading || !event) {
		return (
			<div className="w-full flex items-center justify-center min-h-[50vh]">
				<div className="text-gray-500">Loading event details...</div>
			</div>
		);
	}

	const handleSave = (
		customStatus?: "draft" | "published" | "cancelled" | "completed",
	) => {
		let evStart = null;
		let evEnd = null;
		let regStart = null;
		let regEnd = null;

		if (eventStartDate && eventStartTime) {
			evStart = new Date(`${eventStartDate}T${eventStartTime}:00`);
		}
		if (eventEndDate && eventEndTime) {
			evEnd = new Date(`${eventEndDate}T${eventEndTime}:00`);
		}
		if (registrationStartDate && registrationStartTime) {
			regStart = new Date(
				`${registrationStartDate}T${registrationStartTime}:00`,
			);
		}
		if (closeRegistration && registrationEndDate && registrationEndTime) {
			regEnd = new Date(`${registrationEndDate}T${registrationEndTime}:00`);
		}

		updateEvent.mutate({
			id: event.id,
			title,
			description,
			shortDescription,
			showSpeakers,
			format: format as
				| "conference"
				| "meetup"
				| "workshop"
				| "hackathon"
				| "webinar",
			topic: topic as
				| "other"
				| "technology"
				| "business"
				| "opensource"
				| "design"
				| "science"
				| "arts"
				| "social"
				| "campus",
			isOnline,
			location,
			onlineLink,
			recordingLink,
			mapLink,
			isPaid,
			ticketDescription,
			eventStart: evStart ? evStart.toISOString() : event.eventStart,
			eventEnd: evEnd ? evEnd.toISOString() : event.eventEnd,
			timezone,
			registrationStart: regStart ? regStart.toISOString() : null,
			registrationEnd: regEnd ? regEnd.toISOString() : null,
			bannerUrl:
				bannerPreview !== null ? bannerPreview : event.bannerUrl || null,
			status: (customStatus || event.status) as
				| "draft"
				| "published"
				| "cancelled"
				| "completed",
		});
	};

	/**
	 * Resize an image file to max 1920px width using canvas,
	 * then upload to Supabase via signed URL.
	 */
	const handleBannerUpload = async (file: File) => {
		setBannerError(null);

		// Client-side type check
		const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
		if (!allowedTypes.includes(file.type)) {
			setBannerError("Only PNG, JPG, or WebP images are accepted.");
			return;
		}

		// Client-side size check (pre-resize)
		if (file.size > 10 * 1024 * 1024) {
			setBannerError("File too large. Max 10MB before resize.");
			return;
		}

		setBannerUploading(true);

		try {
			// 1. Resize on canvas
			const resizedBlob = await new Promise<Blob>((resolve, reject) => {
				const img = new window.Image();
				img.onload = () => {
					const MAX_W = 1920;
					const MAX_H = 1080;
					let w = img.width;
					let h = img.height;

					if (w > MAX_W) {
						h = Math.round(h * (MAX_W / w));
						w = MAX_W;
					}
					if (h > MAX_H) {
						w = Math.round(w * (MAX_H / h));
						h = MAX_H;
					}

					const canvas = document.createElement("canvas");
					canvas.width = w;
					canvas.height = h;
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						reject(new Error("Canvas not supported"));
						return;
					}
					ctx.drawImage(img, 0, 0, w, h);
					canvas.toBlob(
						(blob) => {
							if (blob) resolve(blob);
							else reject(new Error("Canvas toBlob failed"));
						},
						"image/webp",
						0.85,
					);
				};
				img.onerror = () => reject(new Error("Failed to load image"));
				img.src = URL.createObjectURL(file);
			});

			// Check resized size
			if (resizedBlob.size > 5 * 1024 * 1024) {
				setBannerError(
					"Image still exceeds 5MB after resize. Try a smaller image.",
				);
				setBannerUploading(false);
				return;
			}

			// 2. Get signed upload URL from API
			const uploadData = await bannerUploadUrl.mutateAsync({
				eventId: event.id,
				fileType: "image/webp",
				fileSize: resizedBlob.size,
			});

			// 3. Upload directly to Supabase
			const uploadRes = await fetch(uploadData.signedUrl, {
				method: "PUT",
				headers: {
					"Content-Type": "image/webp",
				},
				body: resizedBlob,
			});

			if (!uploadRes.ok) {
				throw new Error(`Upload failed: ${uploadRes.statusText}`);
			}

			// 4. Confirm upload in DB
			await bannerConfirm.mutateAsync({
				eventId: event.id,
				publicUrl: uploadData.publicUrl,
			});

			// 5. Optimistic UI update
			setBannerPreview(uploadData.publicUrl);
			refetchEvent();
		} catch (err) {
			setBannerError(
				err instanceof Error ? err.message : "Upload failed. Try again.",
			);
		} finally {
			setBannerUploading(false);
		}
	};

	const handleBannerDelete = async () => {
		setBannerError(null);
		setBannerUploading(true);
		try {
			await bannerDeleteMut.mutateAsync({ eventId: event.id });
			setBannerPreview(null);
			refetchEvent();
		} catch (err) {
			setBannerError(
				err instanceof Error ? err.message : "Failed to remove banner.",
			);
		} finally {
			setBannerUploading(false);
		}
	};

	return (
		<div className="w-full px-4 py-8 md:p-8 z-0 min-h-screen pb-24 text-ink bg-paper">
			{/* Top Header Row */}
			<div className="flex flex-col md:flex-row gap-2 justify-between">
				<div className="flex flex-col gap-3 mt-5 md:mt-0">
					<div className="flex gap-3 items-center">
						<div className="prose">
							<h1 className="text-4xl font-bold font-display m-0">
								{event.title}
							</h1>
						</div>
						<div
							className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
								event.status === "published"
									? "border-stamp text-stamp bg-stamp/10"
									: "border-perforation text-ink/70 bg-ink/5"
							}`}
						>
							{event.status === "published" && (
								<span className="w-2 h-2 rounded-full bg-stamp animate-pulse" />
							)}
							<span>{event.status === "published" ? "Live" : "Draft"}</span>
						</div>
					</div>
					<div className="flex gap-2 items-center text-base text-ink/60">
						<div className="capitalize">{event.format}</div>
						<div className="w-1.5 h-1.5 rounded-full bg-perforation" />
						<div className="font-mono text-sm">
							<span>
								{new Date(event.eventStart).toLocaleDateString("en-IN", {
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							</span>
							{event.eventStart !== event.eventEnd && (
								<span>
									{" "}
									-{" "}
									{new Date(event.eventEnd).toLocaleDateString("en-IN", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => {
							const nextStatus =
								event.status === "published" ? "draft" : "published";
							handleSave(nextStatus);
						}}
						disabled={updateEvent.isPending}
						className={`w-fit px-4 py-2 text-sm rounded-md flex items-center gap-2 font-medium transition-colors border cursor-pointer ${
							event.status === "published"
								? "bg-alert/10 text-alert border-alert hover:bg-alert/20"
								: "bg-stamp/10 text-stamp border-stamp hover:bg-stamp/20"
						}`}
					>
						{event.status === "published" ? (
							<EyeOff size={16} />
						) : (
							<Eye size={16} />
						)}
						{event.status === "published" ? "Unpublish Event" : "Publish Event"}
					</button>
				</div>
			</div>

			{/* Banner Upload Section */}
			<div className="flex flex-col my-6">
				<div className="font-display font-semibold text-xl text-ink border-b-2 border-perforation pb-2">
					Event Banner
				</div>
				<div className="mt-4 max-w-xl">
					{bannerPreview || event.bannerUrl ? (
						<div className="relative rounded-lg overflow-hidden border border-perforation w-full h-36 sm:h-40">
							<Image
								src={bannerPreview || event.bannerUrl || ""}
								alt="Event banner preview"
								fill
								unoptimized
								className="object-cover"
							/>
							<button
								type="button"
								onClick={handleBannerDelete}
								disabled={bannerUploading}
								className="absolute top-2 right-2 p-1.5 rounded-md bg-ink/70 text-paper hover:bg-alert transition-colors cursor-pointer disabled:opacity-50"
								aria-label="Remove banner"
							>
								<X size={16} />
							</button>
							{bannerUploading && (
								<div className="absolute inset-0 bg-ink/30 flex items-center justify-center">
									<div className="w-8 h-8 border-2 border-paper border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</div>
					) : (
						<label
							htmlFor="banner-upload"
							className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-perforation hover:border-stamp/50 transition-colors cursor-pointer bg-perforation/10 w-full h-36 sm:h-40 ${
								bannerUploading ? "pointer-events-none opacity-60" : ""
							}`}
						>
							{bannerUploading ? (
								<div className="w-8 h-8 border-2 border-stamp border-t-transparent rounded-full animate-spin" />
							) : (
								<>
									<ImagePlus className="w-6 h-6 text-ink/30" />
									<span className="text-sm text-ink/60 font-body">
										Click to upload a banner image
									</span>
									<span className="text-xs text-ink/50 font-mono text-center px-2">
										Recommended: 1:1 Square (1200 × 1200 px) or 16:9 Banner
										(1920 × 1080 px) · PNG, JPG, WebP up to 5MB
									</span>
								</>
							)}
							<input
								id="banner-upload"
								type="file"
								accept="image/png,image/jpeg,image/webp"
								className="sr-only"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleBannerUpload(file);
									e.target.value = "";
								}}
							/>
						</label>
					)}
					{bannerError && (
						<p className="text-sm text-alert mt-2">{bannerError}</p>
					)}
				</div>
			</div>

			{/* Event Details */}
			<div className="flex flex-col my-8">
				<div className="font-display font-semibold text-xl text-ink border-b-2 border-perforation pb-2">
					Event Details
				</div>
				<div className="p-2 my-1 grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
					<div>
						<label
							htmlFor="event-permalink"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Event Permalink
						</label>
						<input
							id="event-permalink"
							type="text"
							value={slug}
							disabled
							className="w-full bg-ink/5 border border-perforation px-3 py-2 rounded-md text-sm text-ink/60 focus:outline-none font-mono"
						/>
						<p className="text-xs text-ink/50 mt-1">
							The unique permalink for this event URL.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<div>
							<label
								htmlFor="event-link-preview"
								className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
							>
								Event Public Link
							</label>
							<div className="flex">
								<input
									id="event-link-preview"
									type="text"
									value={`/events/${slug}`}
									disabled
									className="w-full bg-ink/5 border border-perforation px-3 py-2 rounded-l-md text-sm text-ink/60 focus:outline-none font-mono"
								/>
								<button
									type="button"
									onClick={() => {
										const fullUrl =
											typeof window !== "undefined"
												? `${window.location.origin}/events/${slug}`
												: `/events/${slug}`;
										navigator.clipboard.writeText(fullUrl);
										alert("Event link copied to clipboard!");
									}}
									className="bg-paper border border-l-0 border-perforation px-3 py-2 rounded-r-md hover:bg-ink/5 transition-colors flex items-center justify-center"
									title="Copy event link"
								>
									<Copy size={16} className="text-ink/60" />
								</button>
							</div>
						</div>
						<Link
							href={`/events/${slug}`}
							target="_blank"
							rel="noopener noreferrer"
							className="w-fit px-4 py-2 text-sm bg-paper border border-perforation hover:border-stamp/40 text-ink rounded-md flex items-center gap-2 font-medium transition-colors hover:bg-ink/5"
						>
							View Live Event <ExternalLink size={14} className="text-stamp" />
						</Link>
					</div>

					<div>
						<label
							htmlFor="event-title-input"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Event Name
						</label>
						<input
							id="event-title-input"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="event-status-select"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Event Status
						</label>
						<select
							id="event-status-select"
							disabled
							className="w-full bg-ink/5 border border-perforation px-3 py-2 rounded-md text-sm text-ink/60 focus:outline-none"
						>
							<option>{event.status === "published" ? "Live" : "Draft"}</option>
						</select>
						<p className="text-xs text-ink/50 mt-1">
							Current status of the event.
						</p>
					</div>

					<div>
						<label
							htmlFor="event-format-select"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Event Type
						</label>
						<select
							id="event-format-select"
							value={format}
							onChange={(e) => setFormat(e.target.value)}
							className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
						>
							<option value="meetup">Meetup</option>
							<option value="conference">Conference</option>
							<option value="workshop">Workshop</option>
							<option value="hackathon">Hackathon</option>
						</select>
					</div>
					<div>
						<label
							htmlFor="event-short-desc-input"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Short Event Bio
						</label>
						<input
							id="event-short-desc-input"
							type="text"
							value={shortDescription}
							onChange={(e) => setShortDescription(e.target.value)}
							className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
						/>
						<p className="text-xs text-ink/50 mt-1">
							This bio may be used in OG images and in event cards. Typically it
							is a one-liner.
						</p>
					</div>

					<div>
						<label className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2 flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={showSpeakers}
								onChange={(e) => setShowSpeakers(e.target.checked)}
								className="rounded border-perforation text-stamp focus:ring-stamp h-4 w-4"
							/>
							Show Speakers Tab
						</label>
						<p className="text-xs text-ink/50 mt-1">
							Show speakers (added in event schedule) profile linked to their
							proposals.
						</p>
					</div>

					<div className="col-span-1 md:col-span-2">
						<span className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2">
							Event Description
						</span>
						<RichTextEditor
							value={description}
							onChange={(html) => setDescription(html)}
						/>
					</div>
				</div>
			</div>

			{/* Event Timeline */}
			<div className="flex flex-col my-8 relative">
				<div className="font-display font-semibold text-xl text-ink border-b-2 border-perforation pb-2">
					Event Timeline
				</div>
				<div className="p-2 my-1 grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
					<div>
						<label
							htmlFor="event-start-date"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Event Start Date & Time
						</label>
						<div className="flex gap-2">
							<input
								id="event-start-date"
								type="date"
								value={eventStartDate}
								onChange={(e) => setEventStartDate(e.target.value)}
								className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none font-mono"
							/>
							<input
								id="event-start-time"
								type="time"
								aria-label="Event Start Time"
								value={eventStartTime}
								onChange={(e) => setEventStartTime(e.target.value)}
								className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none font-mono"
							/>
						</div>
					</div>
					<div>
						<label
							htmlFor="event-end-date"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Event End Date & Time
						</label>
						<div className="flex gap-2">
							<input
								id="event-end-date"
								type="date"
								value={eventEndDate}
								onChange={(e) => setEventEndDate(e.target.value)}
								className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none font-mono"
							/>
							<input
								id="event-end-time"
								type="time"
								aria-label="Event End Time"
								value={eventEndTime}
								onChange={(e) => setEventEndTime(e.target.value)}
								className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none font-mono"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Livestreaming */}
			<div className="flex flex-col my-8">
				<div className="font-display font-semibold text-xl text-ink border-b-2 border-perforation pb-2">
					Livestreaming
				</div>
				<div className="p-2 my-1 grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
					<div>
						<label
							htmlFor="event-livestream-input"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Livestream Link
						</label>
						<input
							id="event-livestream-input"
							type="url"
							value={onlineLink}
							onChange={(e) => setOnlineLink(e.target.value)}
							className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="event-recording-input"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Recorded Video Link
						</label>
						<input
							id="event-recording-input"
							type="url"
							value={recordingLink}
							onChange={(e) => setRecordingLink(e.target.value)}
							className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
						/>
						<p className="text-xs text-ink/50 mt-1">
							Provide a link to the event recording.
						</p>
					</div>
				</div>
			</div>

			{/* Location Details */}
			<div className="flex flex-col my-8">
				<div className="font-display font-semibold text-xl text-ink border-b-2 border-perforation pb-2">
					Location Details
				</div>
				<div className="p-2 my-1 grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
					<div>
						<label
							htmlFor="event-location-input"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Location
						</label>
						<input
							id="event-location-input"
							type="text"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
						/>
						<p className="text-xs text-ink/50 mt-1">
							Event Venue if offline else Jitsi meet or Online
						</p>
					</div>
					<div>
						<label
							htmlFor="event-map-input"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Map Link
						</label>
						<input
							id="event-map-input"
							type="url"
							value={mapLink}
							onChange={(e) => setMapLink(e.target.value)}
							className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
						/>
						<p className="text-xs text-ink/50 mt-1">
							Prefer OpenStreetMap (OSM) links, e.g., https://osmapp.org/
						</p>
					</div>
				</div>
			</div>

			{/* Ticket Settings */}
			<div className="flex flex-col my-8">
				<div className="font-display font-semibold text-xl text-ink border-b-2 border-perforation pb-2">
					Ticket Settings
				</div>
				<div className="p-2 my-1 grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
					<div>
						<label className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2 flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={isPaid}
								onChange={(e) => setIsPaid(e.target.checked)}
								className="rounded border-perforation text-stamp focus:ring-stamp h-4 w-4"
							/>
							Paid Event
						</label>
						<p className="text-xs text-ink/50 mt-1">
							Enable ticket purchases for this event.
						</p>
					</div>
					<div className="col-span-1 md:col-span-2">
						<label
							htmlFor="event-ticket-desc-input"
							className="block text-[0.81rem] uppercase tracking-[0.04em] font-medium text-ink mb-2"
						>
							Ticket Form Description
						</label>
						<textarea
							id="event-ticket-desc-input"
							rows={6}
							value={ticketDescription}
							onChange={(e) => setTicketDescription(e.target.value)}
							className="w-full bg-paper border border-perforation px-3 py-2 rounded-md text-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
						/>
						<p className="text-xs text-ink/50 mt-1">
							Supports markdown (bold, italic, bullet points, headings). Shown
							at the top of the ticket purchase page.
						</p>
					</div>
				</div>
			</div>

			{/* Danger Zone */}
			<div className="flex flex-col my-8 border border-alert/30 bg-alert/5 rounded-lg p-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h3 className="font-display font-semibold text-base text-alert">
							Danger Zone
						</h3>
						<p className="text-xs text-ink/70 mt-1">
							Permanently delete this event and all associated tickets, RSVP
							forms, schedules, and attendee records.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowDeleteModal(true)}
						className="px-4 py-2 text-xs font-semibold text-paper bg-alert rounded-md hover:bg-alert/90 transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
					>
						<Trash2 className="w-3.5 h-3.5" />
						<span>Delete Event</span>
					</button>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
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
								"{event.title}"
							</strong>
							? All tickets, RSVPs, speaker proposals, and check-in records will
							be permanently removed.
						</p>

						<div className="flex items-center justify-end gap-3 pt-2">
							<button
								type="button"
								onClick={() => setShowDeleteModal(false)}
								disabled={isDeleting}
								className="px-4 py-2 text-xs font-medium text-ink bg-perforation/30 hover:bg-perforation/50 rounded-lg transition-colors cursor-pointer"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDeleteEvent}
								disabled={isDeleting}
								className="px-4 py-2 text-xs font-semibold text-paper bg-alert hover:bg-alert/90 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
							>
								{isDeleting ? "Deleting..." : "Yes, Delete Event"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Form Action Bar at bottom */}
			<div className="fixed bottom-0 right-0 left-0 md:left-64 bg-paper/95 backdrop-blur-xs border-t border-perforation px-4 sm:px-8 py-3.5 flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
				<div className="text-xs sm:text-sm text-ink/60 font-medium">
					{updateEvent.isPending ? "Saving..." : "Unsaved changes"}
				</div>
				<button
					type="button"
					onClick={() => handleSave()}
					disabled={updateEvent.isPending}
					className="px-4 sm:px-6 py-2 text-xs sm:text-sm bg-stamp text-paper rounded-md hover:opacity-90 transition-opacity font-medium flex items-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
				>
					<Edit3 size={16} />
					{updateEvent.isPending ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</div>
	);
}
