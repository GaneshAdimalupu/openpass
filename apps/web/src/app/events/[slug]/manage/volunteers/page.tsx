"use client";

import { trpc } from "@/lib/trpc";
import {
	Check,
	Copy,
	Edit3,
	Plus,
	Search,
	Shield,
	Sparkles,
	Trash2,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export interface VolunteerData {
	id: string;
	eventId: string;
	userId?: string | null;
	name: string;
	email: string;
	role: string;
	customRole?: string | null;
	user?: {
		id: string;
		name?: string | null;
		username?: string | null;
		email: string;
		image?: string | null;
	} | null;
}

interface UserSearchResult {
	id: string;
	name?: string | null;
	username?: string | null;
	email: string;
	image?: string | null;
}

const VOLUNTEER_ROLES = [
	"Core Team Member",
	"Registration Desk",
	"Stage Manager",
	"Volunteer",
	"Custom",
];

export default function ManageVolunteersPage() {
	const params = useParams();
	const slug = params.slug as string;

	// Fetch team data from PostgreSQL
	const { data, isLoading } = trpc.events.volunteersGet.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	const utils = trpc.useUtils();

	// Mutations
	const { mutate: addVolunteer, isPending: isAdding } =
		trpc.events.volunteersAdd.useMutation({
			onSuccess: () => {
				utils.events.volunteersGet.invalidate({ slug });
				setShowAddModal(false);
				resetForm();
			},
		});

	const { mutate: updateVolunteer, isPending: isUpdating } =
		trpc.events.volunteersUpdate.useMutation({
			onSuccess: () => {
				utils.events.volunteersGet.invalidate({ slug });
				setEditingVolunteer(null);
				resetForm();
			},
		});

	const { mutate: removeVolunteer, isPending: isRemoving } =
		trpc.events.volunteersRemove.useMutation({
			onSuccess: () => {
				utils.events.volunteersGet.invalidate({ slug });
				setRemovingVolunteer(null);
			},
		});

	// UI State
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("All");
	const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

	// Modal States
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingVolunteer, setEditingVolunteer] =
		useState<VolunteerData | null>(null);
	const [removingVolunteer, setRemovingVolunteer] =
		useState<VolunteerData | null>(null);

	// Add Form & Autocomplete State
	const [userSearchQuery, setUserSearchQuery] = useState("");
	const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
		null,
	);
	const [formName, setFormName] = useState("");
	const [formEmail, setFormEmail] = useState("");
	const [formRole, setFormRole] = useState("Volunteer");
	const [formCustomRole, setFormCustomRole] = useState("");

	// Live User Search Query
	const { data: searchResults, isFetching: isSearching } =
		trpc.events.usersSearch.useQuery(
			{ query: userSearchQuery },
			{ enabled: userSearchQuery.trim().length > 0 },
		);

	const volunteers = useMemo(() => {
		return (data?.volunteers as unknown as VolunteerData[] | undefined) ?? [];
	}, [data?.volunteers]);

	const resetForm = () => {
		setUserSearchQuery("");
		setSelectedUser(null);
		setFormName("");
		setFormEmail("");
		setFormRole("Volunteer");
		setFormCustomRole("");
	};

	const handleSelectUser = (u: UserSearchResult) => {
		setSelectedUser(u);
		setFormName(u.name || u.username || u.email.split("@")[0]);
		setFormEmail(u.email);
		setUserSearchQuery("");
	};

	const openEditModal = (volunteer: VolunteerData) => {
		setEditingVolunteer(volunteer);
		setFormName(volunteer.name);
		setFormEmail(volunteer.email);
		setFormRole(volunteer.role);
		setFormCustomRole(volunteer.customRole || "");
	};

	const handleCopyEmail = (email: string) => {
		navigator.clipboard.writeText(email);
		setCopiedEmail(email);
		setTimeout(() => setCopiedEmail(null), 2000);
	};

	const handleAddSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formName.trim() || !formEmail.trim()) return;

		addVolunteer({
			slug,
			name: formName.trim(),
			email: formEmail.trim(),
			role: formRole,
			customRole: formRole === "Custom" ? formCustomRole.trim() : null,
		});
	};

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingVolunteer || !formName.trim()) return;

		updateVolunteer({
			slug,
			volunteerId: editingVolunteer.id,
			name: formName.trim(),
			role: formRole,
			customRole: formRole === "Custom" ? formCustomRole.trim() : null,
		});
	};

	const handleRemoveConfirm = () => {
		if (!removingVolunteer) return;
		removeVolunteer({
			slug,
			volunteerId: removingVolunteer.id,
		});
	};

	// Filtered list
	const filteredVolunteers = useMemo(() => {
		return volunteers.filter((v) => {
			const matchesSearch =
				v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				v.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = roleFilter === "All" || v.role === roleFilter;
			return matchesSearch && matchesRole;
		});
	}, [volunteers, searchQuery, roleFilter]);

	const getRoleBadge = (role: string, customRole?: string | null) => {
		const displayRole = role === "Custom" ? customRole || "Custom Role" : role;
		switch (role) {
			case "Core Team Member":
				return (
					<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-stamp/10 text-stamp border border-stamp/30 font-mono">
						<Shield className="w-3 h-3" />
						{displayRole}
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-perforation/40 text-ink/80 border border-perforation font-mono">
						<Users className="w-3 h-3" />
						{displayRole}
					</span>
				);
		}
	};

	if (isLoading) {
		return (
			<div className="p-8 flex items-center justify-center min-h-[400px] text-ink/60 font-mono text-sm animate-pulse">
				Loading Volunteers & Team...
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-perforation pb-6">
				<div>
					<div className="flex items-center gap-2 text-xs font-mono text-ink/60 uppercase tracking-wider mb-1">
						<span>Event Management</span>
						<span>/</span>
						<span>Volunteers & Team</span>
					</div>
					<h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
						Event Volunteers
					</h1>
					<p className="text-sm text-ink/60 mt-1">
						Manage organizers, registration desk staff, stage managers, and
						event volunteers.
					</p>
				</div>

				<button
					type="button"
					onClick={() => {
						resetForm();
						setShowAddModal(true);
					}}
					className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-md hover:bg-ink/90 transition-colors inline-flex items-center gap-2 self-start sm:self-auto shadow-sm"
				>
					<Plus className="w-4 h-4" /> Add Volunteer
				</button>
			</div>

			{/* Search & Filter Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-paper p-3 border border-perforation rounded-xl shadow-sm">
				<div className="relative flex-1">
					<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by volunteer name, @username, or email..."
						className="w-full pl-9 pr-4 py-1.5 text-sm bg-transparent border-0 focus:outline-none text-ink placeholder:text-ink/40 font-mono"
					/>
				</div>

				<div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-perforation pt-2 sm:pt-0 sm:pl-3">
					<span className="text-xs text-ink/60 font-medium whitespace-nowrap">
						Role:
					</span>
					<select
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
						className="px-2.5 py-1 text-xs bg-paper border border-perforation rounded-md text-ink focus:outline-none focus:ring-1 focus:ring-ink font-mono"
					>
						<option value="All">All Roles</option>
						{VOLUNTEER_ROLES.map((r) => (
							<option key={r} value={r}>
								{r}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Volunteers Grid */}
			{filteredVolunteers.length === 0 ? (
				<div className="p-12 border border-dashed border-perforation rounded-xl text-center bg-perforation/10 space-y-3">
					<Users className="w-10 h-10 text-ink/30 mx-auto" />
					<p className="font-medium text-base text-ink">
						{searchQuery || roleFilter !== "All"
							? "No volunteers match your search"
							: "No volunteers added yet"}
					</p>
					<p className="text-xs text-ink/50 max-w-sm mx-auto">
						Invite coordinators, desk staff, and helpers to assist with event
						check-ins and logistics.
					</p>
					<button
						type="button"
						onClick={() => {
							resetForm();
							setShowAddModal(true);
						}}
						className="px-4 py-2 bg-ink text-paper rounded text-xs font-medium hover:bg-ink/90 inline-flex items-center gap-1.5 shadow-sm"
					>
						<Plus className="w-4 h-4" /> Add First Volunteer
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{filteredVolunteers.map((volunteer) => {
						const initials = volunteer.name
							.split(" ")
							.map((n) => n[0])
							.join("")
							.toUpperCase()
							.slice(0, 2);

						return (
							<div
								key={volunteer.id}
								className="border border-perforation rounded-xl bg-paper p-5 shadow-sm hover:border-ink/50 transition-all flex flex-col justify-between gap-4 group relative"
							>
								<div className="space-y-3">
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-center gap-3">
											{volunteer.user?.image ? (
												// biome-ignore lint/performance/noImgElement: arbitrary profile image
												<img
													src={volunteer.user.image}
													alt={volunteer.name}
													className="w-10 h-10 rounded-full object-cover border border-perforation"
												/>
											) : (
												<div className="w-10 h-10 rounded-full bg-perforation/40 text-ink/70 flex items-center justify-center font-display font-semibold text-sm border border-perforation">
													{initials || "V"}
												</div>
											)}
											<div>
												<div className="flex items-center gap-1.5">
													<h3 className="font-display font-semibold text-base text-ink line-clamp-1">
														{volunteer.name}
													</h3>
													{volunteer.user?.username && (
														<span className="text-xs font-mono text-ink/50 font-normal">
															@{volunteer.user.username}
														</span>
													)}
												</div>

												{volunteer.user ? (
													<span className="text-[10px] text-stamp font-mono flex items-center gap-1">
														<UserCheck className="w-2.5 h-2.5" /> Registered
														User
													</span>
												) : (
													<span className="text-[10px] text-ink/40 font-mono">
														Invited
													</span>
												)}
											</div>
										</div>

										<div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
											<button
												type="button"
												onClick={() => openEditModal(volunteer)}
												className="p-1.5 text-ink/60 hover:text-ink hover:bg-perforation/30 rounded transition-colors"
												title="Edit role"
											>
												<Edit3 className="w-3.5 h-3.5" />
											</button>
											<button
												type="button"
												onClick={() => setRemovingVolunteer(volunteer)}
												className="p-1.5 text-alert/60 hover:text-alert hover:bg-alert/10 rounded transition-colors"
												title="Remove volunteer"
											>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</div>

									{/* Email Box */}
									<div className="flex items-center justify-between gap-2 p-2 bg-perforation/15 rounded-lg border border-perforation/50 text-xs text-ink/70">
										<span
											className="font-mono truncate"
											title={volunteer.email}
										>
											{volunteer.email}
										</span>
										<button
											type="button"
											onClick={() => handleCopyEmail(volunteer.email)}
											className="p-1 hover:bg-perforation/40 rounded text-ink/60 hover:text-ink shrink-0"
											title="Copy email"
										>
											{copiedEmail === volunteer.email ? (
												<Check className="w-3 h-3 text-stamp" />
											) : (
												<Copy className="w-3 h-3" />
											)}
										</button>
									</div>
								</div>

								{/* Role Badge */}
								<div className="pt-2 border-t border-perforation/50 flex items-center justify-between">
									{getRoleBadge(volunteer.role, volunteer.customRole)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Add Volunteer Modal with Live User Search */}
			{showAddModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
					<div className="bg-paper border border-perforation rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<div>
								<h3 className="font-display font-semibold text-lg text-ink">
									Add Event Volunteer
								</h3>
								<p className="text-xs text-ink/60 mt-0.5">
									Search registered users or invite directly by email.
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowAddModal(false)}
								className="text-ink/40 hover:text-ink p-1 rounded"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Live User Search Autocomplete */}
						{!selectedUser ? (
							<div className="space-y-2">
								<label
									htmlFor="user-search-input"
									className="text-xs font-medium text-ink flex items-center gap-1.5"
								>
									<Sparkles className="w-3.5 h-3.5 text-stamp" />
									Find Registered User
								</label>
								<div className="relative">
									<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
									<input
										id="user-search-input"
										type="text"
										value={userSearchQuery}
										onChange={(e) => setUserSearchQuery(e.target.value)}
										placeholder="Search name, @username, or email..."
										className="w-full pl-9 pr-4 py-2 bg-paper border border-perforation rounded-md text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink placeholder:text-ink/40 font-mono"
									/>
									{isSearching && (
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink/40 font-mono">
											Searching...
										</span>
									)}
								</div>

								{/* Autocomplete Dropdown */}
								{userSearchQuery.trim().length > 0 && (
									<div className="border border-perforation rounded-lg bg-paper shadow-md max-h-48 overflow-y-auto divide-y divide-perforation/40">
										{searchResults && searchResults.length > 0 ? (
											searchResults.map((u) => (
												<button
													key={u.id}
													type="button"
													onClick={() => handleSelectUser(u)}
													className="w-full p-2.5 text-left hover:bg-perforation/20 transition-colors flex items-center gap-3 cursor-pointer"
												>
													{u.image ? (
														// biome-ignore lint/performance/noImgElement: avatar
														<img
															src={u.image}
															alt={u.name || "Avatar"}
															className="w-7 h-7 rounded-full object-cover border border-perforation shrink-0"
														/>
													) : (
														<div className="w-7 h-7 rounded-full bg-perforation/40 text-ink/70 flex items-center justify-center font-display font-semibold text-xs shrink-0 border border-perforation">
															{u.name?.[0]?.toUpperCase() || "U"}
														</div>
													)}
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-1.5">
															<span className="text-xs font-semibold text-ink truncate">
																{u.name || "OpenEvents User"}
															</span>
															{u.username && (
																<span className="text-[11px] font-mono text-stamp">
																	@{u.username}
																</span>
															)}
														</div>
														<p className="text-[10px] font-mono text-ink/50 truncate">
															{u.email}
														</p>
													</div>
													<span className="text-[10px] font-mono text-stamp shrink-0">
														Select
													</span>
												</button>
											))
										) : !isSearching ? (
											<div className="p-3 text-center text-xs text-ink/50 font-mono">
												No matching user found. Fill form below to invite by
												email.
											</div>
										) : null}
									</div>
								)}
							</div>
						) : (
							/* Selected User Pill */
							<div className="p-3 bg-stamp/10 border border-stamp/30 rounded-lg flex items-center justify-between gap-3">
								<div className="flex items-center gap-2.5 min-w-0">
									{selectedUser.image ? (
										// biome-ignore lint/performance/noImgElement: avatar
										<img
											src={selectedUser.image}
											alt={selectedUser.name || "Avatar"}
											className="w-8 h-8 rounded-full object-cover border border-stamp/40"
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-stamp/20 text-stamp flex items-center justify-center font-display font-semibold text-xs">
											{selectedUser.name?.[0]?.toUpperCase() || "U"}
										</div>
									)}
									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="text-xs font-semibold text-ink truncate">
												{selectedUser.name}
											</span>
											{selectedUser.username && (
												<span className="text-[11px] font-mono text-stamp">
													@{selectedUser.username}
												</span>
											)}
										</div>
										<p className="text-[10px] font-mono text-ink/60 truncate">
											{selectedUser.email}
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => setSelectedUser(null)}
									className="text-xs text-ink/60 hover:text-ink p-1 font-mono underline"
								>
									Change
								</button>
							</div>
						)}

						<form onSubmit={handleAddSubmit} className="space-y-4">
							<div className="space-y-1.5">
								<label
									htmlFor="volunteer-name"
									className="text-xs font-medium text-ink"
								>
									Full Name *
								</label>
								<input
									id="volunteer-name"
									type="text"
									required
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									placeholder="e.g. Alex Morgan"
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								/>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="volunteer-email"
									className="text-xs font-medium text-ink"
								>
									Email Address *
								</label>
								<input
									id="volunteer-email"
									type="email"
									required
									value={formEmail}
									onChange={(e) => setFormEmail(e.target.value)}
									placeholder="alex@example.com"
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								/>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="volunteer-role"
									className="text-xs font-medium text-ink"
								>
									Team Role *
								</label>
								<select
									id="volunteer-role"
									value={formRole}
									onChange={(e) => setFormRole(e.target.value)}
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								>
									{VOLUNTEER_ROLES.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>

							{formRole === "Custom" && (
								<div className="space-y-1.5">
									<label
										htmlFor="custom-role"
										className="text-xs font-medium text-ink"
									>
										Custom Role Title *
									</label>
									<input
										id="custom-role"
										type="text"
										required
										value={formCustomRole}
										onChange={(e) => setFormCustomRole(e.target.value)}
										placeholder="e.g. Photography & Media, AV Technician"
										className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
									/>
								</div>
							)}

							<div className="flex justify-end gap-2 pt-3 border-t border-perforation">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="px-3.5 py-1.5 border border-perforation hover:bg-perforation/20 rounded text-xs font-medium text-ink"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isAdding || !formName.trim() || !formEmail.trim()}
									className="px-4 py-1.5 bg-ink text-paper rounded text-xs font-medium hover:bg-ink/90 disabled:opacity-50 inline-flex items-center gap-1.5"
								>
									{isAdding ? "Adding..." : "Add Volunteer"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Volunteer Modal */}
			{editingVolunteer && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
					<div className="bg-paper border border-perforation rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-lg text-ink">
								Edit Volunteer
							</h3>
							<button
								type="button"
								onClick={() => setEditingVolunteer(null)}
								className="text-ink/40 hover:text-ink p-1 rounded"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<form onSubmit={handleEditSubmit} className="space-y-4">
							<div className="space-y-1.5">
								<label
									htmlFor="edit-name"
									className="text-xs font-medium text-ink"
								>
									Full Name *
								</label>
								<input
									id="edit-name"
									type="text"
									required
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								/>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="edit-email"
									className="text-xs font-medium text-ink"
								>
									Email Address
								</label>
								<input
									id="edit-email"
									type="email"
									disabled
									value={formEmail}
									className="w-full px-3 py-2 bg-perforation/20 border border-perforation rounded-md text-sm font-mono text-ink/60 cursor-not-allowed"
								/>
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor="edit-role"
									className="text-xs font-medium text-ink"
								>
									Team Role *
								</label>
								<select
									id="edit-role"
									value={formRole}
									onChange={(e) => setFormRole(e.target.value)}
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								>
									{VOLUNTEER_ROLES.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>

							{formRole === "Custom" && (
								<div className="space-y-1.5">
									<label
										htmlFor="edit-custom-role"
										className="text-xs font-medium text-ink"
									>
										Custom Role Title *
									</label>
									<input
										id="edit-custom-role"
										type="text"
										required
										value={formCustomRole}
										onChange={(e) => setFormCustomRole(e.target.value)}
										className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
									/>
								</div>
							)}

							<div className="flex justify-end gap-2 pt-3 border-t border-perforation">
								<button
									type="button"
									onClick={() => setEditingVolunteer(null)}
									className="px-3.5 py-1.5 border border-perforation hover:bg-perforation/20 rounded text-xs font-medium text-ink"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isUpdating || !formName.trim()}
									className="px-4 py-1.5 bg-ink text-paper rounded text-xs font-medium hover:bg-ink/90 disabled:opacity-50 inline-flex items-center gap-1.5"
								>
									{isUpdating ? "Saving..." : "Save Changes"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Remove Confirmation Dialog */}
			{removingVolunteer && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
					<div className="bg-paper border border-perforation rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Remove Volunteer?
							</h3>
							<button
								type="button"
								onClick={() => setRemovingVolunteer(null)}
								className="text-ink/40 hover:text-ink p-1 rounded"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<p className="text-sm text-ink/70">
							Are you sure you want to remove{" "}
							<span className="font-semibold text-ink">
								{removingVolunteer.name}
							</span>{" "}
							from the event team?
						</p>

						<div className="flex justify-end gap-2 pt-2 border-t border-perforation">
							<button
								type="button"
								onClick={() => setRemovingVolunteer(null)}
								className="px-3.5 py-1.5 border border-perforation hover:bg-perforation/20 rounded text-xs font-medium text-ink"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleRemoveConfirm}
								disabled={isRemoving}
								className="px-4 py-1.5 bg-alert text-paper rounded text-xs font-medium hover:bg-alert/90 disabled:opacity-50"
							>
								{isRemoving ? "Removing..." : "Remove"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
