"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
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
	ADMIN:
		"bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
	EDITOR: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
	COORDINATOR:
		"bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
	VOLUNTEER:
		"bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
	VIEWER: "bg-perforation/40 text-ink opacity-80 border-perforation",
	DEVICE: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
};

export default function OrganizationOverviewPage(): JSX.Element {
	const params = useParams();
	const slug = (params?.slug as string) || "";
	const { status } = useSession();

	const [activeTab, setActiveTab] = useState<"overview">("overview");
	const [searchQuery, setSearchQuery] = useState<string>("");
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
		}
	}, [org]);

	const isOwnerOrAdmin =
		org?.currentUserRole === "OWNER" || org?.currentUserRole === "ADMIN";

	// Filtered member list
	const filteredMembers = useMemo(() => {
		if (!org) return [];
		const q = searchQuery.trim().toLowerCase();
		if (!q) return org.members;
		return org.members.filter(
			(m) =>
				m.email.toLowerCase().includes(q) ||
				m.name?.toLowerCase().includes(q) ||
				m.role.toLowerCase().includes(q),
		);
	}, [org, searchQuery]);

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
					✓ {toastMessage}
				</div>
			)}

			<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
				{/* Top Navigation & Breadcrumb */}
				<div className="flex items-center justify-between">
					<Link
						href="/dashboard"
						className="label inline-flex items-center gap-1.5 text-xs text-ink opacity-70 hover:opacity-100 transition-opacity"
					>
						<span>←</span>
						<span>Back to Dashboard</span>
					</Link>
				</div>

				{isLoading ? (
					<div className="space-y-6 animate-pulse">
						<div className="h-14 bg-perforation/20 rounded-lg" />
						<div className="h-48 bg-perforation/20 rounded-lg" />
						<div className="h-64 bg-perforation/20 rounded-lg" />
					</div>
				) : !org ? (
					<div className="border border-perforation rounded-lg p-12 text-center bg-paper/60 space-y-4">
						<h1 className="font-display font-semibold text-h2 text-ink">
							Organization Not Found
						</h1>
						<p className="text-body opacity-70">
							The organization with handle{" "}
							<code className="font-mono text-xs bg-perforation/30 px-1.5 py-0.5 rounded">
								@{slug}
							</code>{" "}
							could not be found.
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
						{/* Organization Page Header & Tabs */}
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
							<div className="flex items-center gap-6 border-b border-perforation text-sm font-medium">
								<button
									type="button"
									onClick={() => setActiveTab("overview")}
									className={`pb-3 relative transition-colors label text-xs ${
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
										Host Account: {org.owner.email}
									</p>

									{/* Social Link if configured */}
									{org.instagram && (
										<div className="pt-1">
											<a
												href={
													org.instagram.startsWith("http")
														? org.instagram
														: `https://instagram.com/${org.instagram.replace("@", "")}`
												}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 text-xs text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
											>
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
												<span className="font-mono">
													@{org.instagram.replace("@", "")}
												</span>
											</a>
										</div>
									)}
								</div>
							</div>

							{/* Action Buttons: Edit, Share, Embed */}
							<div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
								{isOwnerOrAdmin && (
									<button
										type="button"
										onClick={() => setIsEditOrgOpen(true)}
										className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors flex items-center gap-1.5 cursor-pointer"
									>
										<span>✏️</span>
										<span>Edit Organization</span>
									</button>
								)}
								<button
									type="button"
									onClick={handleShare}
									className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors flex items-center gap-1.5 cursor-pointer"
								>
									<span>🔗</span>
									<span>Share</span>
								</button>
								<button
									type="button"
									onClick={() => setIsEmbedOpen(true)}
									className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors flex items-center gap-1.5 cursor-pointer"
								>
									<span>{"</>"}</span>
									<span>Embed</span>
								</button>
							</div>
						</div>

						{/* ──────────────── 2. About the Organization Card ──────────────── */}
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
									<p className="whitespace-pre-wrap">{org.description}</p>
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

						{/* ──────────────── 3. Organization Members Section ──────────────── */}
						<div className="border border-perforation rounded-lg p-6 bg-paper/60 shadow-xs space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<h3 className="font-display font-semibold text-base text-ink">
									Organization Members
								</h3>

								{isOwnerOrAdmin && (
									<button
										type="button"
										onClick={() => setIsAddMemberOpen(true)}
										className="bg-stamp text-paper label text-xs px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
									>
										<span>+</span>
										<span>Add Member</span>
									</button>
								)}
							</div>

							{/* Search Event Hosts Bar */}
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink opacity-40 text-xs">
									🔍
								</span>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search Event Hosts..."
									className="w-full bg-paper border border-perforation rounded-md pl-9 pr-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							{/* Members List */}
							<div className="space-y-2.5 pt-2">
								{/* 1. Primary Owner Row */}
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
												{org.owner.email}
											</p>
										</div>
									</div>

									<span
										className={`px-2.5 py-0.5 rounded text-[10px] font-semibold font-mono border ${ROLE_BADGE_STYLES.OWNER}`}
									>
										Owner
									</span>
								</div>

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
														title="Edit Role"
														className="p-1 text-ink opacity-60 hover:opacity-100 hover:text-stamp transition-colors cursor-pointer"
													>
														✏️
													</button>
													<button
														type="button"
														onClick={() =>
															handleRemoveMember(member.id, member.email)
														}
														title="Remove Member"
														className="p-1 text-alert opacity-70 hover:opacity-100 transition-colors cursor-pointer"
													>
														🗑️
													</button>
												</div>
											)}
										</div>
									</div>
								))}

								{filteredMembers.length === 0 && searchQuery && (
									<div className="text-center py-6 text-xs opacity-60">
										No event hosts matching &ldquo;{searchQuery}&rdquo;
									</div>
								)}
							</div>
						</div>
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
					<div className="w-full max-w-md bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Add Member
							</h3>
							<button
								type="button"
								onClick={() => setIsAddMemberOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								✕
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
									htmlFor="newMemberEmail"
									className="block label text-xs mb-1.5"
								>
									Enter Email
								</label>
								<input
									id="newMemberEmail"
									type="email"
									required
									value={newMemberEmail}
									onChange={(e) => setNewMemberEmail(e.target.value)}
									placeholder="Enter the email address for the Member"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							<div>
								<label
									htmlFor="newMemberName"
									className="block label text-xs mb-1.5"
								>
									Full Name (Optional)
								</label>
								<input
									id="newMemberName"
									type="text"
									value={newMemberName}
									onChange={(e) => setNewMemberName(e.target.value)}
									placeholder="e.g. Adnan Kattekaden"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							<div>
								<label
									htmlFor="newMemberRole"
									className="block label text-xs mb-1.5"
								>
									Select Role
								</label>
								<select
									id="newMemberRole"
									value={newMemberRole}
									onChange={(e) =>
										setNewMemberRole(e.target.value as RoleOption)
									}
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								>
									<option value="ADMIN">Admin</option>
									<option value="EDITOR">Editor</option>
									<option value="COORDINATOR">Coordinator</option>
									<option value="VOLUNTEER">Volunteer</option>
									<option value="VIEWER">Viewer</option>
									<option value="DEVICE">Device (Scanner)</option>
								</select>
								<p className="text-[11px] opacity-60 mt-1.5 font-mono">
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
					<div className="w-full max-w-md bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Edit Member
							</h3>
							<button
								type="button"
								onClick={() => setEditingMember(null)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								✕
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
									htmlFor="editMemberEmail"
									className="block label text-xs mb-1.5"
								>
									Enter Email
								</label>
								<input
									id="editMemberEmail"
									type="email"
									disabled
									value={editingMember.email}
									className="w-full bg-perforation/20 border border-perforation rounded-md px-3 py-2 text-xs text-body opacity-70 cursor-not-allowed font-mono"
								/>
							</div>

							<div>
								<label
									htmlFor="editMemberRoleSelect"
									className="block label text-xs mb-1.5"
								>
									Select Role
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
									<option value="DEVICE">Device (Scanner)</option>
								</select>
								<p className="text-[11px] opacity-60 mt-1.5 font-mono">
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
									{updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ──────────────── DRAWER / MODAL 3: Edit Organization ──────────────── */}
			{isEditOrgOpen && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex justify-end"
				>
					<div className="w-full max-w-md h-full bg-paper border-l border-perforation p-6 shadow-2xl space-y-5 overflow-y-auto animate-in slide-in-from-right duration-200">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
								<span>←</span>
								<span>Edit Organization</span>
							</h3>
							<button
								type="button"
								onClick={() => setIsEditOrgOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close drawer"
							>
								✕
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
									placeholder="https://instagram.com/playfest or @playfest"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							{/* Description Markdown Editor */}
							<div>
								<label
									htmlFor="orgDescriptionInput"
									className="block label text-xs mb-1"
								>
									Organization Description
								</label>
								<textarea
									id="orgDescriptionInput"
									rows={6}
									value={orgDescription}
									onChange={(e) => setOrgDescription(e.target.value)}
									placeholder="Write something about your organization..."
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body leading-relaxed focus:outline-none focus:border-stamp"
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
								✕
							</button>
						</div>

						<p className="text-xs opacity-70">
							Copy and paste this iframe snippet into your website to embed your
							events and tickets:
						</p>

						<div className="p-3 bg-perforation/20 rounded border border-perforation font-mono text-[11px] text-ink select-all overflow-x-auto">
							{`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/events#${slug}" width="100%" height="600" frameborder="0"></iframe>`}
						</div>

						<div className="flex justify-end pt-2">
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(
										`<iframe src="${window.location.origin}/events#${slug}" width="100%" height="600" frameborder="0"></iframe>`,
									);
									showToast("Embed code copied to clipboard");
									setIsEmbedOpen(false);
								}}
								className="bg-stamp text-paper label text-xs px-4 py-2 rounded-md hover:opacity-90 cursor-pointer"
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
