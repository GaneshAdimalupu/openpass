"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import { Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { use, useState } from "react";
import type { JSX } from "react";

interface CommunityPageProps {
	params: Promise<{
		slug: string;
		communitySlug: string;
	}>;
}

export default function SubCommunityPage({
	params,
}: CommunityPageProps): JSX.Element {
	const resolvedParams = use(params);
	const { slug, communitySlug } = resolvedParams;

	const { data: session } = useSession();
	const userId = session?.user?.id;

	const [isAddLeadOpen, setIsAddLeadOpen] = useState<boolean>(false);
	const [newLeadEmail, setNewLeadEmail] = useState<string>("");
	const [newLeadName, setNewLeadName] = useState<string>("");
	const [newLeadRole, setNewLeadRole] = useState<
		"ADMIN" | "COORDINATOR" | "VOLUNTEER"
	>("ADMIN");
	const [addLeadError, setAddLeadError] = useState<string | null>(null);

	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const {
		data: community,
		isLoading,
		refetch,
	} = trpc.communities.getBySlug.useQuery(
		{ slug: communitySlug },
		{ enabled: Boolean(communitySlug) },
	);

	const addLeadMutation = trpc.communities.addMember.useMutation();
	const removeLeadMutation = trpc.communities.removeMember.useMutation();

	// Check if current user is a Community Lead or Parent Org Owner
	const isLeadOrAdmin =
		Boolean(userId) &&
		(community?.members.some(
			(m) => m.userId === userId && (m.role === "ADMIN" || m.role === "OWNER"),
		) ||
			false);

	const handleAddLead = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!community) return;
		setAddLeadError(null);

		try {
			await addLeadMutation.mutateAsync({
				communityId: community.id,
				email: newLeadEmail.trim().toLowerCase(),
				name: newLeadName.trim() || undefined,
				role: newLeadRole,
			});
			await refetch();
			setIsAddLeadOpen(false);
			setNewLeadEmail("");
			setNewLeadName("");
			showToast("Community lead added successfully");
		} catch (err: unknown) {
			setAddLeadError(
				err instanceof Error ? err.message : "Failed to add lead",
			);
		}
	};

	const handleRemoveLead = async (memberId: string) => {
		if (!community) return;
		if (
			confirm(
				"Are you sure you want to remove this lead from the community chapter?",
			)
		) {
			try {
				await removeLeadMutation.mutateAsync({
					communityId: community.id,
					memberId,
				});
				await refetch();
				showToast("Community lead removed");
			} catch (err: unknown) {
				showToast(err instanceof Error ? err.message : "Failed to remove lead");
			}
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 py-12 flex items-center justify-center">
					<div className="text-center space-y-3">
						<div className="w-8 h-8 border-2 border-stamp border-t-transparent rounded-full animate-spin mx-auto" />
						<p className="font-mono text-xs text-ink opacity-70">
							Loading community chapter...
						</p>
					</div>
				</main>
			</div>
		);
	}

	if (!community) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 py-16 text-center">
					<h1 className="font-display font-semibold text-h2 mb-4">
						Community Chapter Not Found
					</h1>
					<p className="text-body opacity-80 max-w-md mx-auto mb-8">
						The sub-community chapter you are looking for does not exist or may
						have been moved.
					</p>
					<Link
						href={`/organization/${slug}`}
						className="bg-stamp text-paper label px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
					>
						Back to Parent Organization
					</Link>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-paper flex flex-col">
			<SiteHeader />

			{/* Floating Toast Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-ink text-paper px-4 py-3 rounded-lg shadow-lg border border-perforation text-xs font-mono animate-in fade-in slide-in-from-bottom-2">
					{toastMessage}
				</div>
			)}

			<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
				{/* Top Navigation & Breadcrumb */}
				<div className="flex items-center justify-between">
					<Link
						href={`/organization/${slug}`}
						className="label inline-flex items-center gap-1.5 text-xs text-ink opacity-70 hover:opacity-100 transition-opacity"
					>
						<svg
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
						<span>Back to {community.organizer.name}</span>
					</Link>

					<span className="font-mono text-[11px] opacity-60">
						Community Chapter
					</span>
				</div>

				{/* ──────────────── 1. Header & Identity Card ──────────────── */}
				<div className="border border-perforation rounded-lg p-6 bg-paper/80 shadow-sm space-y-5">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-perforation pb-5">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-xl border border-perforation bg-stamp/10 flex items-center justify-center text-stamp font-display font-bold text-2xl overflow-hidden shrink-0">
								{community.logoUrl ? (
									<Image
										src={community.logoUrl}
										alt={community.name}
										width={64}
										height={64}
										className="w-full h-full object-cover"
									/>
								) : (
									community.name.charAt(0).toUpperCase()
								)}
							</div>

							<div>
								<div className="flex items-center gap-2 flex-wrap">
									<h1 className="font-display font-semibold text-h3 text-ink">
										{community.name}
									</h1>
									<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-stamp/10 text-stamp border border-stamp/20">
										{community.category || "Community"}
									</span>
								</div>

								<p className="text-xs font-mono opacity-70 mt-1 flex items-center gap-1.5">
									<span>Chapter of</span>
									<Link
										href={`/organization/${community.organizer.slug}`}
										className="text-stamp hover:underline font-semibold"
									>
										{community.organizer.name}
									</Link>
								</p>
							</div>
						</div>

						{isLeadOrAdmin && (
							<button
								type="button"
								onClick={() => setIsAddLeadOpen(true)}
								className="bg-stamp text-paper label text-xs px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
							>
								<span>+ Add Chapter Lead</span>
							</button>
						)}
					</div>

					{community.description && (
						<p className="text-xs text-body opacity-80 leading-relaxed max-w-3xl">
							{community.description}
						</p>
					)}

					<div className="flex items-center gap-6 pt-2 font-mono text-xs opacity-75">
						<div className="flex items-center gap-1.5">
							<Users className="w-4 h-4 text-stamp" />
							<span>{community.members.length} Leads & Core Members</span>
						</div>
						<div className="flex items-center gap-1.5">
							<svg
								aria-hidden="true"
								className="w-4 h-4 text-stamp"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
								<line x1="16" x2="16" y1="2" y2="6" />
								<line x1="8" x2="8" y1="2" y2="6" />
								<line x1="3" x2="21" y1="10" y2="10" />
							</svg>
							<span>{community.events.length} Events Hosted</span>
						</div>
					</div>
				</div>

				{/* ──────────────── 2. Events Hosted by Chapter ──────────────── */}
				<div className="border border-perforation rounded-lg p-6 bg-paper/60 shadow-xs space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-display font-semibold text-base text-ink">
							Chapter Events ({community.events.length})
						</h2>

						{isLeadOrAdmin && (
							<Link
								href="/dashboard?action=create"
								className="bg-stamp text-paper label text-xs px-3.5 py-1.5 rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
							>
								<span>+ Host Chapter Event</span>
							</Link>
						)}
					</div>

					{community.events.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
							{community.events.map((event) => (
								<Link
									key={event.id}
									href={`/events/${event.slug}`}
									className="p-4 rounded-lg border border-perforation bg-paper hover:border-ink/50 transition-all shadow-xs flex flex-col justify-between gap-3 group"
								>
									<div className="space-y-1.5">
										<div className="flex items-center justify-between gap-2">
											<span className="font-mono text-[10px] opacity-60">
												{new Date(event.eventStart).toLocaleDateString(
													undefined,
													{
														month: "short",
														day: "numeric",
														year: "numeric",
													},
												)}
											</span>
											<span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-stamp/10 text-stamp border border-stamp/20">
												{event.format}
											</span>
										</div>
										<h3 className="font-display font-semibold text-sm text-ink group-hover:text-stamp transition-colors">
											{event.title}
										</h3>
										<p className="text-[11px] text-ink opacity-70 truncate font-mono">
											{event.isOnline
												? "Online Event"
												: event.location || "In-person Event"}
										</p>
									</div>

									<div className="pt-2 border-t border-perforation flex items-center justify-between text-[11px] font-mono opacity-70">
										<span>Passes available</span>
										<span className="text-stamp group-hover:translate-x-0.5 transition-transform">
											View Event →
										</span>
									</div>
								</Link>
							))}
						</div>
					) : (
						<div className="p-8 text-center border border-dashed border-perforation rounded-lg bg-paper/40">
							<p className="text-xs text-ink opacity-70 mb-3">
								No events hosted by {community.name} yet.
							</p>
							{isLeadOrAdmin && (
								<Link
									href="/dashboard?action=create"
									className="bg-stamp text-paper label text-xs px-4 py-2 rounded-md hover:opacity-90 transition-opacity inline-block"
								>
									Host First Chapter Event
								</Link>
							)}
						</div>
					)}
				</div>

				{/* ──────────────── 3. Community Leads & Team ──────────────── */}
				<div className="border border-perforation rounded-lg p-6 bg-paper/60 shadow-xs space-y-4">
					<div className="flex items-center justify-between border-b border-perforation pb-4">
						<div>
							<h2 className="font-display font-semibold text-base text-ink">
								Chapter Leads & Core Team ({community.members.length})
							</h2>
							<p className="text-[11px] font-mono opacity-60">
								Organizers and community moderators managing {community.name}
							</p>
						</div>

						{isLeadOrAdmin && (
							<button
								type="button"
								onClick={() => setIsAddLeadOpen(true)}
								className="label text-xs text-stamp hover:underline cursor-pointer"
							>
								+ Add Lead
							</button>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
						{community.members.map((m) => (
							<div
								key={m.id}
								className="p-3.5 rounded-lg border border-perforation bg-paper flex items-center justify-between gap-3 shadow-2xs"
							>
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 rounded-full bg-stamp/15 text-stamp font-display font-semibold text-xs flex items-center justify-center shrink-0">
										{m.user?.image ? (
											<Image
												src={m.user.image}
												alt={m.name || m.email}
												width={36}
												height={36}
												unoptimized
												className="w-full h-full rounded-full object-cover"
											/>
										) : (
											(m.name || m.email).charAt(0).toUpperCase()
										)}
									</div>
									<div className="truncate">
										<p className="font-medium text-xs text-ink truncate">
											{m.name || m.email.split("@")[0]}
										</p>
										<span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-stamp/10 text-stamp inline-block mt-0.5">
											{m.role}
										</span>
									</div>
								</div>

								{isLeadOrAdmin && m.userId !== userId && (
									<button
										type="button"
										onClick={() => handleRemoveLead(m.id)}
										className="text-alert opacity-60 hover:opacity-100 p-1 text-xs cursor-pointer"
										title="Remove lead"
									>
										<X className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						))}
					</div>
				</div>
			</main>

			{/* ──────────────── MODAL: Add Chapter Lead ──────────────── */}
			{isAddLeadOpen && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4"
				>
					<div className="w-full max-w-sm bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Add Chapter Lead
							</h3>
							<button
								type="button"
								onClick={() => setIsAddLeadOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{addLeadError && (
							<div className="p-3 bg-alert/10 border border-alert/30 rounded text-alert text-xs">
								{addLeadError}
							</div>
						)}

						<form onSubmit={handleAddLead} className="space-y-4">
							<div>
								<label htmlFor="leadEmail" className="block label text-xs mb-1">
									Email Address *
								</label>
								<input
									id="leadEmail"
									type="email"
									required
									value={newLeadEmail}
									onChange={(e) => setNewLeadEmail(e.target.value)}
									placeholder="lead@example.com"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							<div>
								<label htmlFor="leadName" className="block label text-xs mb-1">
									Name
								</label>
								<input
									id="leadName"
									type="text"
									value={newLeadName}
									onChange={(e) => setNewLeadName(e.target.value)}
									placeholder="Full Name"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							<div>
								<label htmlFor="leadRole" className="block label text-xs mb-1">
									Role
								</label>
								<select
									id="leadRole"
									value={newLeadRole}
									onChange={(e) =>
										setNewLeadRole(
											e.target.value as "ADMIN" | "COORDINATOR" | "VOLUNTEER",
										)
									}
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								>
									<option value="ADMIN">Community Lead / Admin</option>
									<option value="COORDINATOR">Coordinator</option>
									<option value="VOLUNTEER">Volunteer</option>
								</select>
							</div>

							<div className="flex items-center justify-end gap-3 pt-3 border-t border-perforation">
								<button
									type="button"
									onClick={() => setIsAddLeadOpen(false)}
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={addLeadMutation.isPending}
									className="bg-stamp text-paper label text-xs px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
								>
									{addLeadMutation.isPending ? "Adding..." : "Add Lead"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
