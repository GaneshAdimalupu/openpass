"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { trpc } from "@/lib/trpc";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

type RoleOption =
	| "ADMIN"
	| "EDITOR"
	| "COORDINATOR"
	| "VOLUNTEER"
	| "VIEWER"
	| "DEVICE";

type RoleFilter = "ALL" | RoleOption;

const ROLE_DESCRIPTIONS: Record<RoleOption, string> = {
	ADMIN: "Can manage members, edit organization details, and publish events",
	EDITOR: "Can create, edit, and publish events",
	COORDINATOR: "Can coordinate attendees, speakers, and event schedules",
	VOLUNTEER: "Can assist on-site and scan ticket check-ins",
	VIEWER: "Can view event details and organization metrics",
	DEVICE: "Check-in kiosk and barcode scanning terminal",
};

const ROLE_BADGE_STYLES: Record<string, string> = {
	OWNER: "bg-stamp/10 text-stamp border-stamp/30",
	ADMIN: "bg-stamp/10 text-stamp border-stamp/30",
	EDITOR: "bg-perforation/40 text-ink border-perforation",
	COORDINATOR: "bg-perforation/40 text-ink border-perforation",
	VOLUNTEER: "bg-perforation/40 text-ink border-perforation",
	VIEWER: "bg-perforation/20 text-ink/70 border-perforation",
	DEVICE: "bg-perforation/30 text-ink font-mono border-perforation",
};

export default function OrganizationOverviewPage(): JSX.Element {
	const params = useParams();
	const slug = (params?.slug as string) || "";
	const { status } = useSession();

	const [activeTab, setActiveTab] = useState<"overview" | "events" | "team">(
		"overview",
	);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedRoleFilter, setSelectedRoleFilter] =
		useState<RoleFilter>("ALL");
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Modals & Drawer State
	const [isEditOrgOpen, setIsEditOrgOpen] = useState<boolean>(false);
	const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
	const [editingMember, setEditingMember] = useState<{
		id: string;
		email: string;
		name: string | null;
		role: RoleOption;
	} | null>(null);
	const [isEmbedOpen, setIsEmbedOpen] = useState<boolean>(false);

	// Form States - Edit Organization
	const [orgTitle, setOrgTitle] = useState<string>("");
	const [orgDescription, setOrgDescription] = useState<string>("");
	const [orgLogoUrl, setOrgLogoUrl] = useState<string>("");
	const [orgInstagram, setOrgInstagram] = useState<string>("");
	const [orgTwitter, setOrgTwitter] = useState<string>("");
	const [orgWebsite, setOrgWebsite] = useState<string>("");
	const [orgError, setOrgError] = useState<string | null>(null);

	// Form States - Add Member
	const [newMemberEmail, setNewMemberEmail] = useState<string>("");
	const [newMemberName, setNewMemberName] = useState<string>("");
	const [newMemberRole, setNewMemberRole] = useState<RoleOption>("VOLUNTEER");
	const [addMemberError, setAddMemberError] = useState<string | null>(null);

	// Form States - Edit Member
	const [editMemberRole, setEditMemberRole] = useState<RoleOption>("VOLUNTEER");
	const [editMemberError, setEditMemberError] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// tRPC Queries & Mutations
	const {
		data: org,
		isLoading,
		refetch,
	} = trpc.organizers.getOverview.useQuery(
		{ slug },
		{ enabled: Boolean(slug) },
	);

	const updateOrgMutation = trpc.organizers.updateOrganization.useMutation();
	const addMemberMutation = trpc.organizers.addMember.useMutation();
	const updateRoleMutation = trpc.organizers.updateMemberRole.useMutation();
	const removeMemberMutation = trpc.organizers.removeMember.useMutation();

	// Populate organization edit inputs when data arrives
	useEffect(() => {
		if (org) {
			setOrgTitle(org.title || org.name);
			setOrgDescription(org.description || "");
			setOrgLogoUrl(org.logoUrl || "");
			setOrgInstagram(org.instagram || "");
			setOrgTwitter(org.twitter || "");
			setOrgWebsite(org.website || "");
		}
	}, [org]);

	const isOwnerOrAdmin =
		org?.currentUserRole === "OWNER" || org?.currentUserRole === "ADMIN";
	const canCreateEvent =
		isOwnerOrAdmin ||
		org?.currentUserRole === "EDITOR" ||
		org?.currentUserRole === "COORDINATOR";

	// Filtered member list
	const filteredMembers = useMemo(() => {
		if (!org) return [];
		let list = org.members;

		if (selectedRoleFilter !== "ALL") {
			list = list.filter((m) => m.role === selectedRoleFilter);
		}

		const q = searchQuery.trim().toLowerCase();
		if (!q) return list;

		return list.filter(
			(m) =>
				m.email.toLowerCase().includes(q) ||
				m.name?.toLowerCase().includes(q) ||
				m.role.toLowerCase().includes(q),
		);
	}, [org, searchQuery, selectedRoleFilter]);

	// Actions
	const handleSaveOrganization = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!org) return;
		setOrgError(null);

		try {
			await updateOrgMutation.mutateAsync({
				organizerId: org.id,
				title: orgTitle.trim() || org.name,
				description: orgDescription.trim() || null,
				logoUrl: orgLogoUrl.trim() || null,
				instagram: orgInstagram.trim() || null,
				twitter: orgTwitter.trim() || null,
				website: orgWebsite.trim() || null,
			});
			await refetch();
			setIsEditOrgOpen(false);
			showToast("Organization profile updated");
		} catch (err: unknown) {
			setOrgError(
				err instanceof Error ? err.message : "Failed to update organization",
			);
		}
	};

	const handleAddMember = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!org) return;
		setAddMemberError(null);

		try {
			await addMemberMutation.mutateAsync({
				organizerId: org.id,
				email: newMemberEmail.trim(),
				name: newMemberName.trim() || undefined,
				role: newMemberRole,
			});
			await refetch();
			setIsAddMemberOpen(false);
			setNewMemberEmail("");
			setNewMemberName("");
			setNewMemberRole("VOLUNTEER");
			showToast("Team member added successfully");
		} catch (err: unknown) {
			setAddMemberError(
				err instanceof Error ? err.message : "Failed to add member",
			);
		}
	};

	const handleUpdateMemberRole = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingMember) return;
		setEditMemberError(null);

		try {
			await updateRoleMutation.mutateAsync({
				memberId: editingMember.id,
				role: editMemberRole,
			});
			await refetch();
			setEditingMember(null);
			showToast("Member role updated");
		} catch (err: unknown) {
			setEditMemberError(
				err instanceof Error ? err.message : "Failed to update role",
			);
		}
	};

	const handleRemoveMember = async (memberId: string, memberEmail: string) => {
		if (
			confirm(
				`Are you sure you want to remove ${memberEmail} from this organization?`,
			)
		) {
			try {
				await removeMemberMutation.mutateAsync({ memberId });
				await refetch();
				showToast("Member removed from organization");
			} catch (err: unknown) {
				showToast(
					err instanceof Error ? err.message : "Failed to remove member",
				);
			}
		}
	};

	const handleShare = () => {
		const url = `${window.location.origin}/organization/${slug}`;
		navigator.clipboard.writeText(url);
		showToast("Organization link copied to clipboard");
	};

	if (status === "unauthenticated") {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
					<h1 className="font-display font-semibold text-h2 mb-4">
						Sign In Required
					</h1>
					<p className="text-body opacity-80 max-w-md mb-8">
						Please sign in to view and manage this organization.
					</p>
					<Link
						href={`/login?callbackUrl=/organization/${slug}`}
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
						href="/dashboard"
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
						<span>Back to Dashboard</span>
					</Link>

					{canCreateEvent && (
						<Link
							href="/dashboard?action=create"
							className="group inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1 bg-stamp text-paper rounded-full font-medium text-xs hover:opacity-95 transition-all shadow-xs"
						>
							<span>Host Event</span>
							<span className="w-4 h-4 rounded-full bg-ink flex items-center justify-center text-paper transition-transform duration-200 group-hover:translate-x-0.5">
								<svg
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									width="8"
									height="8"
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
						</Link>
					)}
				</div>

				{isLoading ? (
					<div className="py-24 text-center">
						<div className="w-8 h-8 border-2 border-stamp border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<p className="text-xs font-mono opacity-60">
							Loading organization details...
						</p>
					</div>
				) : !org ? (
					<div className="border border-perforation rounded-lg p-12 text-center bg-paper/50">
						<h2 className="font-display font-semibold text-xl mb-2 text-ink">
							Organization Not Found
						</h2>
						<p className="text-body text-xs opacity-70 mb-6">
							The organization with handle "@{slug}" does not exist or you don't
							have access.
						</p>
						<Link
							href="/dashboard"
							className="inline-block bg-stamp text-paper label text-xs px-5 py-2.5 rounded-md hover:opacity-90"
						>
							Return to Dashboard
						</Link>
					</div>
				) : (
					<>
						{/* Organization Page Header & Profile Details */}
						<div className="space-y-4">
							<div className="flex items-center gap-3.5">
								<div className="w-10 h-10 rounded-lg bg-ink text-paper flex items-center justify-center font-display font-semibold text-lg shrink-0">
									{org.title?.charAt(0).toUpperCase() ||
										org.name.charAt(0).toUpperCase()}
								</div>
								<div>
									<h1 className="font-display font-semibold text-h2 text-ink">
										{org.title || org.name}
									</h1>
									<p className="text-xs font-mono opacity-60">@{org.slug}</p>
								</div>
							</div>

							{/* Navigation Tab Bar */}
							<div className="flex items-center gap-6 border-b border-perforation text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
								<button
									type="button"
									onClick={() => setActiveTab("overview")}
									className={`pb-3 relative transition-colors label text-xs cursor-pointer ${
										activeTab === "overview"
											? "text-ink font-semibold"
											: "text-ink opacity-60 hover:opacity-100"
									}`}
								>
									Overview
									{activeTab === "overview" && (
										<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />
									)}
								</button>
								<button
									type="button"
									onClick={() => setActiveTab("events")}
									className={`pb-3 relative transition-colors label text-xs cursor-pointer ${
										activeTab === "events"
											? "text-ink font-semibold"
											: "text-ink opacity-60 hover:opacity-100"
									}`}
								>
									Events ({org.events?.length || org._count?.events || 0})
									{activeTab === "events" && (
										<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />
									)}
								</button>
								<button
									type="button"
									onClick={() => setActiveTab("team")}
									className={`pb-3 relative transition-colors label text-xs cursor-pointer ${
										activeTab === "team"
											? "text-ink font-semibold"
											: "text-ink opacity-60 hover:opacity-100"
									}`}
								>
									Team Members ({(org.members?.length || 0) + 1})
									{activeTab === "team" && (
										<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />
									)}
								</button>
							</div>
						</div>

						{/* ──────────────── Metric Counters Strip ──────────────── */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
							<div className="border border-perforation rounded-lg p-4 bg-paper/60 shadow-xs">
								<span className="label text-[10px] text-ink opacity-60 block">
									Events Hosted
								</span>
								<span className="font-display font-semibold text-2xl text-ink mt-0.5 block">
									{org.events?.length || org._count?.events || 0}
								</span>
							</div>
							<div className="border border-perforation rounded-lg p-4 bg-paper/60 shadow-xs">
								<span className="label text-[10px] text-ink opacity-60 block">
									Team Members
								</span>
								<span className="font-display font-semibold text-2xl text-ink mt-0.5 block">
									{(org.members?.length || 0) + 1}
								</span>
							</div>
							<div className="border border-perforation rounded-lg p-4 bg-paper/60 shadow-xs">
								<span className="label text-[10px] text-ink opacity-60 block">
									Organization Type
								</span>
								<span className="font-mono text-xs font-semibold text-ink mt-2 block capitalize">
									{org.type}
								</span>
							</div>
							<div className="border border-perforation rounded-lg p-4 bg-paper/60 shadow-xs">
								<span className="label text-[10px] text-ink opacity-60 block">
									Category
								</span>
								<span className="font-mono text-xs font-semibold text-ink mt-2 block truncate">
									{org.category}
								</span>
							</div>
						</div>

						{/* ──────────────── 1. Organization Details Card ──────────────── */}
						<div className="border border-perforation rounded-lg p-6 sm:p-8 bg-paper/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
								{/* Organization Logo Banner */}
								<div className="relative w-48 sm:w-60 h-28 sm:h-32 rounded-lg bg-perforation/30 border border-perforation flex items-center justify-center font-display font-semibold text-2xl text-ink shrink-0 overflow-hidden">
									{org.logoUrl ? (
										<Image
											src={org.logoUrl}
											alt={org.title || org.name}
											fill
											unoptimized
											className="object-cover"
										/>
									) : (
										<div className="text-center p-4">
											<span className="font-display font-semibold text-xl tracking-wider text-ink block">
												{org.title || org.name}
											</span>
											<span className="text-[10px] font-mono opacity-50 uppercase tracking-widest block mt-1">
												{org.type} • {org.category}
											</span>
										</div>
									)}
								</div>

								{/* Title, Socials & Handle */}
								<div className="space-y-2">
									<h2 className="font-display font-semibold text-h3 text-ink">
										{org.title || org.name}
									</h2>
									<p className="font-mono text-xs opacity-60">
										Host: {org.owner.name || "Anonymous"}
									</p>

									{/* Social Links Strip */}
									<div className="flex flex-wrap items-center gap-3 pt-1">
										{org.website && (
											<a
												href={
													org.website.startsWith("http")
														? org.website
														: `https://${org.website}`
												}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-xs text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
												title="Website"
											>
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
													<circle cx="12" cy="12" r="10" />
													<line x1="2" x2="22" y1="12" y2="12" />
													<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
												</svg>
												<span className="font-mono text-[11px]">Website</span>
											</a>
										)}

										{org.twitter && (
											<a
												href={
													org.twitter.startsWith("http")
														? org.twitter
														: `https://x.com/${org.twitter.replace("@", "")}`
												}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-xs text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
												title="Twitter / X"
											>
												<svg
													aria-hidden="true"
													className="w-3.5 h-3.5"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
												</svg>
												<span className="font-mono text-[11px]">
													@{org.twitter.replace("@", "")}
												</span>
											</a>
										)}

										{org.instagram && (
											<a
												href={
													org.instagram.startsWith("http")
														? org.instagram
														: `https://instagram.com/${org.instagram.replace("@", "")}`
												}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-xs text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
												title="Instagram"
											>
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
													<rect
														width="20"
														height="20"
														x="2"
														y="2"
														rx="5"
														ry="5"
													/>
													<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
													<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
												</svg>
												<span className="font-mono text-[11px]">
													@{org.instagram.replace("@", "")}
												</span>
											</a>
										)}
									</div>
								</div>
							</div>

							{/* Action Buttons: Edit, Share, Embed */}
							<div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
								{isOwnerOrAdmin && (
									<button
										type="button"
										onClick={() => setIsEditOrgOpen(true)}
										className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
									>
										<svg
											aria-hidden="true"
											xmlns="http://www.w3.org/2000/svg"
											width="13"
											height="13"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
											<path d="m15 5 4 4" />
										</svg>
										<span>Edit Organization</span>
									</button>
								)}
								<button
									type="button"
									onClick={handleShare}
									className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
								>
									<svg
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										width="13"
										height="13"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
										<polyline points="16 6 12 2 8 6" />
										<line x1="12" x2="12" y1="2" y2="15" />
									</svg>
									<span>Share</span>
								</button>
								<button
									type="button"
									onClick={() => setIsEmbedOpen(true)}
									className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
								>
									<svg
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										width="13"
										height="13"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polyline points="16 18 22 12 16 6" />
										<polyline points="8 6 2 12 8 18" />
									</svg>
									<span>Embed</span>
								</button>
							</div>
						</div>

						{/* ──────────────── 2. About the Organization Card ──────────────── */}
						{(activeTab === "overview" || activeTab === "team") && (
							<div className="border border-perforation rounded-lg p-6 bg-paper/60 shadow-xs space-y-3">
								<div className="flex items-center gap-2 text-ink opacity-80">
									<svg
										aria-hidden="true"
										className="w-4 h-4"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<circle cx="12" cy="12" r="10" />
										<line x1="12" x2="12" y1="8" y2="12" />
										<line x1="12" x2="12.01" y1="16" y2="16" />
									</svg>
									<h3 className="font-display font-medium text-sm text-ink">
										About the Organization
									</h3>
								</div>

								<div className="text-body text-xs leading-relaxed opacity-80 pt-1">
									{org.description ? (
										<div
											className="rich-editor-content text-xs leading-relaxed"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized rich text description rendered from organizer
											dangerouslySetInnerHTML={{ __html: org.description }}
										/>
									) : (
										<p className="italic opacity-60">
											No description provided yet.
											{isOwnerOrAdmin && (
												<button
													type="button"
													onClick={() => setIsEditOrgOpen(true)}
													className="ml-1 text-stamp underline cursor-pointer"
												>
													Add details about your organization
												</button>
											)}
										</p>
									)}
								</div>
							</div>
						)}

						{/* ──────────────── 3. Events Hosted by Organization ──────────────── */}
						{(activeTab === "overview" || activeTab === "events") && (
							<div className="border border-perforation rounded-lg p-6 bg-paper/60 shadow-xs space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="font-display font-semibold text-base text-ink">
										Events Hosted ({org.events?.length || 0})
									</h3>

									{canCreateEvent && (
										<Link
											href="/dashboard?action=create"
											className="bg-stamp text-paper label text-xs px-3.5 py-1.5 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
										>
											<span>+ Host Event</span>
										</Link>
									)}
								</div>

								{org.events && org.events.length > 0 ? (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
										{org.events.map((event) => (
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
														<span
															className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase border ${
																event.status === "published"
																	? "bg-stamp/10 text-stamp border-stamp/30"
																	: "bg-perforation/40 text-ink opacity-70 border-perforation"
															}`}
														>
															{event.status}
														</span>
													</div>
													<h4 className="font-display font-semibold text-sm text-ink group-hover:text-stamp transition-colors">
														{event.title}
													</h4>
													{event.isOnline ? (
														<p className="text-[11px] text-ink opacity-70 truncate font-mono">
															Online Event
														</p>
													) : event.location ? (
														<p className="text-[11px] text-ink opacity-70 truncate font-mono">
															{event.location}
														</p>
													) : null}
												</div>

												<div className="pt-2 border-t border-perforation flex items-center justify-between text-[11px] font-mono opacity-70">
													<span>{event._count?.tickets || 0} Ticket Types</span>
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
											No events hosted yet.
										</p>
										{canCreateEvent && (
											<Link
												href="/dashboard?action=create"
												className="bg-stamp text-paper label text-xs px-4 py-2 rounded-md hover:opacity-90 transition-opacity inline-block"
											>
												Host Your First Event
											</Link>
										)}
									</div>
								)}
							</div>
						)}

						{/* ──────────────── 4. Organization Members Section ──────────────── */}
						{(activeTab === "overview" || activeTab === "team") && (
							<div className="border border-perforation rounded-lg p-6 bg-paper/60 shadow-xs space-y-4">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
									<div>
										<h3 className="font-display font-semibold text-base text-ink">
											Organization Members
										</h3>
										<p className="text-[11px] font-mono opacity-60">
											{(org.members?.length || 0) + 1} Total Team Members
										</p>
									</div>

									{isOwnerOrAdmin && (
										<button
											type="button"
											onClick={() => setIsAddMemberOpen(true)}
											className="bg-stamp text-paper label text-xs px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
										>
											<svg
												aria-hidden="true"
												xmlns="http://www.w3.org/2000/svg"
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<line x1="12" x2="12" y1="5" y2="19" />
												<line x1="5" x2="19" y1="12" y2="12" />
											</svg>
											<span>Add Member</span>
										</button>
									)}
								</div>

								{/* Role Filter Pills */}
								<div className="flex flex-wrap items-center gap-2 pt-1">
									{(
										[
											"ALL",
											"ADMIN",
											"EDITOR",
											"COORDINATOR",
											"VOLUNTEER",
											"VIEWER",
										] as RoleFilter[]
									).map((role) => (
										<button
											key={role}
											type="button"
											onClick={() => setSelectedRoleFilter(role)}
											className={`px-3 py-1 rounded-full text-[10px] font-mono transition-all cursor-pointer border ${
												selectedRoleFilter === role
													? "bg-ink text-paper border-ink font-semibold"
													: "bg-paper border-perforation text-ink opacity-70 hover:opacity-100 hover:border-ink/40"
											}`}
										>
											{role === "ALL"
												? `All (${(org.members?.length || 0) + 1})`
												: `${role.charAt(0) + role.slice(1).toLowerCase()} (${
														org.members.filter((m) => m.role === role).length
													})`}
										</button>
									))}
								</div>

								{/* Search Event Hosts Bar */}
								<div className="relative flex items-center">
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
										className="absolute left-3 text-ink opacity-40 pointer-events-none"
									>
										<circle cx="11" cy="11" r="8" />
										<path d="m21 21-4.3-4.3" />
									</svg>
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search Event Hosts by name, email, or role..."
										className="w-full bg-paper border border-perforation rounded-md pl-9 pr-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
									/>
								</div>

								{/* Members List */}
								<div className="space-y-2.5 pt-2">
									{/* 1. Primary Owner Row */}
									{(selectedRoleFilter === "ALL" ||
										selectedRoleFilter === "ADMIN") && (
										<div className="p-3.5 rounded-md border border-perforation bg-paper flex items-center justify-between gap-4">
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-stamp/20 border border-stamp/40 text-stamp flex items-center justify-center font-display font-semibold text-xs shrink-0">
													{org.owner.name?.charAt(0).toUpperCase() || "O"}
												</div>
												<div>
													<p className="font-medium text-xs text-ink">
														{org.owner.name || org.title || org.name}
													</p>
													<p className="text-[11px] font-mono opacity-60">
														Host
													</p>
												</div>
											</div>

											<span
												className={`px-2.5 py-0.5 rounded text-[10px] font-semibold font-mono border ${ROLE_BADGE_STYLES.OWNER}`}
											>
												Owner
											</span>
										</div>
									)}

									{/* 2. Team Members Rows */}
									{filteredMembers.map((member) => (
										<div
											key={member.id}
											className="p-3.5 rounded-md border border-perforation bg-paper flex items-center justify-between gap-4"
										>
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-perforation/30 border border-perforation text-ink flex items-center justify-center font-display font-semibold text-xs shrink-0">
													{member.name?.charAt(0).toUpperCase() ||
														member.email.charAt(0).toUpperCase()}
												</div>
												<div>
													<p className="font-medium text-xs text-ink">
														{member.name || member.email.split("@")[0]}
													</p>
													<p className="text-[11px] font-mono opacity-60">
														{member.email}
													</p>
												</div>
											</div>

											<div className="flex items-center gap-3">
												<span
													className={`px-2.5 py-0.5 rounded text-[10px] font-semibold font-mono border ${
														ROLE_BADGE_STYLES[member.role] ||
														ROLE_BADGE_STYLES.VIEWER
													}`}
												>
													{member.role.charAt(0) +
														member.role.slice(1).toLowerCase()}
												</span>

												{isOwnerOrAdmin && (
													<div className="flex items-center gap-1.5">
														<button
															type="button"
															onClick={() =>
																setEditingMember({
																	id: member.id,
																	email: member.email,
																	name: member.name,
																	role: member.role as RoleOption,
																})
															}
															aria-label={`Edit role for ${member.email}`}
															title="Edit Role"
															className="p-1.5 rounded text-ink opacity-60 hover:opacity-100 hover:text-stamp hover:bg-perforation/20 transition-all cursor-pointer"
														>
															<svg
																aria-hidden="true"
																xmlns="http://www.w3.org/2000/svg"
																width="13"
																height="13"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="2"
																strokeLinecap="round"
																strokeLinejoin="round"
															>
																<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
																<path d="m15 5 4 4" />
															</svg>
														</button>
														<button
															type="button"
															onClick={() =>
																handleRemoveMember(member.id, member.email)
															}
															aria-label={`Remove member ${member.email}`}
															title="Remove Member"
															className="p-1.5 rounded text-alert opacity-70 hover:opacity-100 hover:bg-alert/10 transition-all cursor-pointer"
														>
															<svg
																aria-hidden="true"
																xmlns="http://www.w3.org/2000/svg"
																width="13"
																height="13"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="2"
																strokeLinecap="round"
																strokeLinejoin="round"
															>
																<path d="M3 6h18" />
																<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
																<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
															</svg>
														</button>
													</div>
												)}
											</div>
										</div>
									))}

									{filteredMembers.length === 0 &&
										(selectedRoleFilter !== "ALL" || searchQuery) && (
											<p className="text-xs font-mono opacity-50 text-center py-4">
												No members match the selected filter.
											</p>
										)}
								</div>
							</div>
						)}
					</>
				)}
			</main>

			{/* ──────────────── MODAL 1: Add Member ──────────────── */}
			{isAddMemberOpen && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4"
				>
					<div className="w-full max-w-md bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Add Organization Member
							</h3>
							<button
								type="button"
								onClick={() => setIsAddMemberOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{addMemberError && (
							<div className="p-3 text-xs text-alert bg-alert/10 border border-alert/20 rounded">
								{addMemberError}
							</div>
						)}

						<form onSubmit={handleAddMember} className="space-y-4">
							<div>
								<label
									htmlFor="newMemberEmailInput"
									className="block label text-xs mb-1"
								>
									Email Address *
								</label>
								<input
									id="newMemberEmailInput"
									type="email"
									required
									value={newMemberEmail}
									onChange={(e) => setNewMemberEmail(e.target.value)}
									placeholder="member@example.com"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							<div>
								<label
									htmlFor="newMemberNameInput"
									className="block label text-xs mb-1"
								>
									Full Name (Optional)
								</label>
								<input
									id="newMemberNameInput"
									type="text"
									value={newMemberName}
									onChange={(e) => setNewMemberName(e.target.value)}
									placeholder="e.g. Sarah Connor"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							<div>
								<label
									htmlFor="newMemberRoleSelect"
									className="block label text-xs mb-1"
								>
									Member Role
								</label>
								<select
									id="newMemberRoleSelect"
									value={newMemberRole}
									onChange={(e) =>
										setNewMemberRole(e.target.value as RoleOption)
									}
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								>
									<option value="ADMIN">Admin — Manage org & members</option>
									<option value="EDITOR">Editor — Create & edit events</option>
									<option value="COORDINATOR">
										Coordinator — Coordinate attendees & speakers
									</option>
									<option value="VOLUNTEER">
										Volunteer — Onsite assistance & scan check-ins
									</option>
									<option value="VIEWER">Viewer — Read-only access</option>
									<option value="DEVICE">Device — Ticket scanning kiosk</option>
								</select>
								<p className="text-[11px] opacity-60 mt-1 font-mono">
									{ROLE_DESCRIPTIONS[newMemberRole]}
								</p>
							</div>

							<div className="flex items-center justify-end gap-3 pt-3 border-t border-perforation">
								<button
									type="button"
									onClick={() => setIsAddMemberOpen(false)}
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={addMemberMutation.isPending}
									className="bg-stamp text-paper label text-xs px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
								>
									{addMemberMutation.isPending ? "Adding..." : "Add Member"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ──────────────── MODAL 2: Edit Member Role ──────────────── */}
			{editingMember && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4"
				>
					<div className="w-full max-w-md bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Change Role for {editingMember.email}
							</h3>
							<button
								type="button"
								onClick={() => setEditingMember(null)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{editMemberError && (
							<div className="p-3 text-xs text-alert bg-alert/10 border border-alert/20 rounded">
								{editMemberError}
							</div>
						)}

						<form onSubmit={handleUpdateMemberRole} className="space-y-4">
							<div>
								<label
									htmlFor="editMemberRoleSelect"
									className="block label text-xs mb-1"
								>
									Select New Role
								</label>
								<select
									id="editMemberRoleSelect"
									value={editMemberRole}
									onChange={(e) =>
										setEditMemberRole(e.target.value as RoleOption)
									}
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								>
									<option value="ADMIN">Admin</option>
									<option value="EDITOR">Editor</option>
									<option value="COORDINATOR">Coordinator</option>
									<option value="VOLUNTEER">Volunteer</option>
									<option value="VIEWER">Viewer</option>
									<option value="DEVICE">Device</option>
								</select>
								<p className="text-[11px] opacity-60 mt-1 font-mono">
									{ROLE_DESCRIPTIONS[editMemberRole]}
								</p>
							</div>

							<div className="flex items-center justify-end gap-3 pt-3 border-t border-perforation">
								<button
									type="button"
									onClick={() => setEditingMember(null)}
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={updateRoleMutation.isPending}
									className="bg-stamp text-paper label text-xs px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
								>
									{updateRoleMutation.isPending ? "Updating..." : "Update Role"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ──────────────── DRAWER 3: Edit Organization ──────────────── */}
			{isEditOrgOpen && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex justify-end"
				>
					<div className="w-full max-w-xl bg-paper h-full overflow-y-auto border-l border-perforation p-6 sm:p-8 space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
						<div className="flex items-center justify-between border-b border-perforation pb-4">
							<h3 className="font-display font-semibold text-lg text-ink">
								Edit Organization Profile
							</h3>
							<button
								type="button"
								onClick={() => setIsEditOrgOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close drawer"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{orgError && (
							<div className="p-3 text-xs text-alert bg-alert/10 border border-alert/20 rounded">
								{orgError}
							</div>
						)}

						<form onSubmit={handleSaveOrganization} className="space-y-4">
							{/* Logo Preview */}
							<div className="space-y-2">
								<label
									htmlFor="orgLogoUrlInput"
									className="block label text-xs"
								>
									Organization Logo / Poster
								</label>
								<div className="relative w-full h-36 rounded-lg bg-perforation/20 border border-perforation flex items-center justify-center overflow-hidden">
									{orgLogoUrl ? (
										<Image
											src={orgLogoUrl}
											alt="Preview"
											fill
											unoptimized
											className="object-cover"
										/>
									) : (
										<span className="font-display text-lg opacity-40">
											{orgTitle || org?.name}
										</span>
									)}
								</div>
								<input
									id="orgLogoUrlInput"
									type="url"
									value={orgLogoUrl}
									onChange={(e) => setOrgLogoUrl(e.target.value)}
									placeholder="https://example.com/logo.png"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							{/* Organization Name (Slug) - Readonly */}
							<div>
								<label
									htmlFor="orgSlugInput"
									className="block label text-xs mb-1"
								>
									Organization Handle
								</label>
								<input
									id="orgSlugInput"
									type="text"
									disabled
									value={org?.slug || ""}
									className="w-full bg-perforation/20 border border-perforation rounded-md px-3 py-2 text-xs text-body opacity-70 cursor-not-allowed font-mono"
								/>
								<p className="text-[11px] opacity-50 mt-1 font-mono">
									The organization handle is permanent and cannot be changed.
								</p>
							</div>

							{/* Organization Title */}
							<div>
								<label
									htmlFor="orgTitleInput"
									className="block label text-xs mb-1"
								>
									Organization Title
								</label>
								<input
									id="orgTitleInput"
									type="text"
									required
									value={orgTitle}
									onChange={(e) => setOrgTitle(e.target.value)}
									placeholder="e.g. PlayFest"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
								<p className="text-[11px] opacity-50 mt-1 font-mono">
									This will be displayed in the header and public event pages.
								</p>
							</div>

							{/* Website URL */}
							<div>
								<label
									htmlFor="orgWebsiteInput"
									className="block label text-xs mb-1"
								>
									Website
								</label>
								<input
									id="orgWebsiteInput"
									type="url"
									value={orgWebsite}
									onChange={(e) => setOrgWebsite(e.target.value)}
									placeholder="https://fossclub.org"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							{/* Twitter / X Handle */}
							<div>
								<label
									htmlFor="orgTwitterInput"
									className="block label text-xs mb-1"
								>
									Twitter / X Profile
								</label>
								<input
									id="orgTwitterInput"
									type="text"
									value={orgTwitter}
									onChange={(e) => setOrgTwitter(e.target.value)}
									placeholder="https://x.com/fossclub or @fossclub"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							{/* Instagram Handle */}
							<div>
								<label
									htmlFor="orgInstagramInput"
									className="block label text-xs mb-1"
								>
									Instagram Profile
								</label>
								<input
									id="orgInstagramInput"
									type="text"
									value={orgInstagram}
									onChange={(e) => setOrgInstagram(e.target.value)}
									placeholder="https://instagram.com/fossclub or @fossclub"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							{/* Description Rich Text / Markdown Editor */}
							<div>
								<label
									htmlFor="orgDescriptionInput"
									className="block label text-xs mb-1.5"
								>
									Organization Description
								</label>
								<RichTextEditor
									id="orgDescriptionInput"
									rows={7}
									value={orgDescription}
									onChange={setOrgDescription}
									placeholder="Write something..."
								/>
							</div>

							<div className="flex items-center justify-end gap-3 pt-4 border-t border-perforation">
								<button
									type="button"
									onClick={() => setIsEditOrgOpen(false)}
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={updateOrgMutation.isPending}
									className="bg-stamp text-paper label text-xs px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
								>
									{updateOrgMutation.isPending
										? "Saving..."
										: "Save Organization"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ──────────────── MODAL 4: Embed Snippet ──────────────── */}
			{isEmbedOpen && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4"
				>
					<div className="w-full max-w-md bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Embed Organization Widget
							</h3>
							<button
								type="button"
								onClick={() => setIsEmbedOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<p className="text-body text-xs opacity-80">
							Copy the iframe code below to embed your organization's upcoming
							events feed onto your own website:
						</p>

						<div className="p-3 bg-perforation/20 rounded border border-perforation font-mono text-[11px] break-all select-all text-ink">
							{`<iframe src="${typeof window !== "undefined" ? window.location.origin : "https://openevents.app"}/embed/org/${slug}" width="100%" height="450" frameborder="0"></iframe>`}
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<button
								type="button"
								onClick={() => {
									const snippet = `<iframe src="${window.location.origin}/embed/org/${slug}" width="100%" height="450" frameborder="0"></iframe>`;
									navigator.clipboard.writeText(snippet);
									showToast("Embed code copied to clipboard");
									setIsEmbedOpen(false);
								}}
								className="bg-stamp text-paper label text-xs px-4 py-2 rounded-md hover:opacity-90 transition-opacity cursor-pointer"
							>
								Copy Snippet
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
