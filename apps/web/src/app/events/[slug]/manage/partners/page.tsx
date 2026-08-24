"use client";

import { trpc } from "@/lib/trpc";
import {
	Award,
	Building2,
	Check,
	Copy,
	Edit3,
	ExternalLink,
	Globe,
	Handshake,
	Image as ImageIcon,
	Plus,
	Sparkles,
	Trash2,
	Upload,
	Users,
	X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export interface LocalPartner {
	id: string;
	type: "sponsor" | "community";
	name: string;
	tier?: string | null;
	customTier?: string | null;
	logoUrl?: string | null;
	websiteUrl?: string | null;
}

const SPONSOR_TIERS = [
	"Platinum",
	"Gold",
	"Silver",
	"Bronze",
	"Venue Partner",
	"Custom",
];

export default function ManagePartnersPage() {
	const params = useParams();
	const slug = params.slug as string;

	// Fetch partners from PostgreSQL
	const { data, isLoading } = trpc.events.partnersGet.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	const utils = trpc.useUtils();
	const { mutate: savePartners, isPending: isSaving } =
		trpc.events.partnersSave.useMutation({
			onSuccess: () => {
				utils.events.partnersGet.invalidate({ slug });
				setHasChanges(false);
			},
		});

	// UI States
	const [showPartners, setShowPartners] = useState(true);
	const [sponsors, setSponsors] = useState<LocalPartner[]>([]);
	const [communityPartners, setCommunityPartners] = useState<LocalPartner[]>(
		[],
	);
	const [hasChanges, setHasChanges] = useState(false);
	const [copied, setCopied] = useState(false);

	// Modal States
	const [modalType, setModalType] = useState<"sponsor" | "community" | null>(
		null,
	);
	const [editingPartner, setEditingPartner] = useState<LocalPartner | null>(
		null,
	);
	const [formName, setFormName] = useState("");
	const [formTier, setFormTier] = useState("Platinum");
	const [formCustomTier, setFormCustomTier] = useState("");
	const [formLogoUrl, setFormLogoUrl] = useState("");
	const [formWebsiteUrl, setFormWebsiteUrl] = useState("");

	// Initialize on data load
	useEffect(() => {
		if (data) {
			setShowPartners(data.event.showPartners ?? true);
			setSponsors(
				data.sponsors.map((s) => ({
					id: s.id,
					type: "sponsor",
					name: s.name,
					tier: s.tier,
					customTier: s.customTier,
					logoUrl: s.logoUrl,
					websiteUrl: s.websiteUrl,
				})),
			);
			setCommunityPartners(
				data.communityPartners.map((p) => ({
					id: p.id,
					type: "community",
					name: p.name,
					logoUrl: p.logoUrl,
					websiteUrl: p.websiteUrl,
				})),
			);
		}
	}, [data]);

	const handleCopy = () => {
		const origin =
			typeof window !== "undefined"
				? window.location.origin
				: "https://makemyevent.org";
		navigator.clipboard.writeText(`${origin}/events/${slug}#partners`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const openAddModal = (type: "sponsor" | "community") => {
		setModalType(type);
		setEditingPartner(null);
		setFormName("");
		setFormTier("Platinum");
		setFormCustomTier("");
		setFormLogoUrl("");
		setFormWebsiteUrl("");
	};

	const openEditModal = (partner: LocalPartner) => {
		setModalType(partner.type);
		setEditingPartner(partner);
		setFormName(partner.name);
		setFormTier(partner.tier || "Platinum");
		setFormCustomTier(partner.customTier || "");
		setFormLogoUrl(partner.logoUrl || "");
		setFormWebsiteUrl(partner.websiteUrl || "");
	};

	const handleSaveModal = () => {
		if (!formName.trim()) return;

		let formattedUrl = formWebsiteUrl.trim();
		if (
			formattedUrl &&
			!formattedUrl.startsWith("http://") &&
			!formattedUrl.startsWith("https://")
		) {
			formattedUrl = `https://${formattedUrl}`;
		}

		if (editingPartner) {
			const updated: LocalPartner = {
				...editingPartner,
				name: formName.trim(),
				tier: modalType === "sponsor" ? formTier : null,
				customTier:
					modalType === "sponsor" && formTier === "Custom"
						? formCustomTier.trim()
						: null,
				logoUrl: formLogoUrl.trim() || null,
				websiteUrl: formattedUrl || null,
			};

			if (modalType === "sponsor") {
				setSponsors((prev) =>
					prev.map((s) => (s.id === updated.id ? updated : s)),
				);
			} else {
				setCommunityPartners((prev) =>
					prev.map((p) => (p.id === updated.id ? updated : p)),
				);
			}
		} else {
			const newPartner: LocalPartner = {
				id: `temp_${Date.now()}`,
				type: modalType || "sponsor",
				name: formName.trim(),
				tier: modalType === "sponsor" ? formTier : null,
				customTier:
					modalType === "sponsor" && formTier === "Custom"
						? formCustomTier.trim()
						: null,
				logoUrl: formLogoUrl.trim() || null,
				websiteUrl: formattedUrl || null,
			};

			if (modalType === "sponsor") {
				setSponsors((prev) => [...prev, newPartner]);
			} else {
				setCommunityPartners((prev) => [...prev, newPartner]);
			}
		}

		setHasChanges(true);
		setModalType(null);
	};

	const handleDelete = (id: string, type: "sponsor" | "community") => {
		if (type === "sponsor") {
			setSponsors((prev) => prev.filter((s) => s.id !== id));
		} else {
			setCommunityPartners((prev) => prev.filter((p) => p.id !== id));
		}
		setHasChanges(true);
	};

	const handleSaveAll = () => {
		const allPartners = [
			...sponsors.map((s) => ({
				type: "sponsor",
				name: s.name,
				tier: s.tier || null,
				customTier: s.customTier || null,
				logoUrl: s.logoUrl || null,
				websiteUrl: s.websiteUrl || null,
			})),
			...communityPartners.map((p) => ({
				type: "community",
				name: p.name,
				tier: null,
				customTier: null,
				logoUrl: p.logoUrl || null,
				websiteUrl: p.websiteUrl || null,
			})),
		];

		savePartners({
			slug,
			showPartners,
			partners: allPartners,
		});
	};

	const getTierBadgeStyle = (tier?: string | null) => {
		switch (tier) {
			case "Platinum":
			case "Gold":
			case "Venue Partner":
				return "bg-stamp/10 text-stamp border-stamp/20";
			case "Silver":
			case "Bronze":
				return "bg-perforation/40 text-ink border-perforation";
			default:
				return "bg-perforation/30 text-ink/70 border-perforation";
		}
	};

	if (isLoading) {
		return (
			<div className="p-8 flex items-center justify-center min-h-[400px] text-ink/60 font-mono text-sm animate-pulse">
				Loading Partners & Sponsors...
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
						<span>Ecosystem & Supporters</span>
					</div>
					<h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
						Sponsors & Partners
					</h1>
					<p className="text-sm text-ink/60 mt-1">
						Showcase your corporate sponsors, venue hosts, and community
						partners on your event page.
					</p>
				</div>

				<button
					type="button"
					onClick={handleSaveAll}
					disabled={isSaving}
					className="px-5 py-2 bg-ink text-paper text-sm font-medium rounded-md hover:bg-ink/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2 self-start sm:self-auto shadow-sm"
				>
					<Upload className="w-4 h-4" />
					{isSaving ? "Saving..." : "Save Partners"}
				</button>
			</div>

			{/* Hero Feature Switch Card */}
			<div className="border border-perforation rounded-xl bg-paper p-6 space-y-4 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div
							className={`w-10 h-10 rounded-lg flex items-center justify-center ${
								showPartners
									? "bg-stamp/10 text-stamp"
									: "bg-perforation/40 text-ink/50"
							}`}
						>
							<Handshake className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="font-display font-semibold text-base text-ink">
									Show Sponsors & Partners on Event Page
								</h2>
								{showPartners ? (
									<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-stamp/10 text-stamp border border-stamp/20 font-mono">
										<span className="w-1.5 h-1.5 rounded-full bg-stamp animate-pulse" />
										Partners Live
									</span>
								) : (
									<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-perforation/40 text-ink/60 border border-perforation font-mono">
										<span className="w-1.5 h-1.5 rounded-full bg-ink/40" />
										Hidden (No Sponsors Displayed)
									</span>
								)}
							</div>
							<p className="text-xs text-ink/60 mt-0.5">
								{showPartners
									? "Sponsors and community partner logos will appear prominently on your event page."
									: "The partner sections are hidden from attendees. Useful for self-funded or community meetups without formal sponsors."}
							</p>
						</div>
					</div>

					{/* Switch Toggle */}
					<label className="relative inline-flex items-center cursor-pointer shrink-0">
						<input
							type="checkbox"
							checked={showPartners}
							onChange={(e) => {
								setShowPartners(e.target.checked);
								setHasChanges(true);
							}}
							className="sr-only peer"
						/>
						<div className="w-12 h-6 bg-perforation peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-paper after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-paper after:border-perforation after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stamp" />
					</label>
				</div>

				{/* Public Route Preview */}
				{showPartners && (
					<div className="pt-4 border-t border-perforation flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
						<span className="text-ink/70 font-medium">
							Sponsors Section Anchor:
						</span>
						<div className="flex items-center gap-2 flex-1 sm:max-w-md">
							<code className="px-3 py-1.5 bg-perforation/20 rounded font-mono text-xs border border-perforation text-ink flex-1 truncate">
								https://makemyevent.org/events/{slug}#partners
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
			{!showPartners && (
				<div className="bg-perforation/20 border border-dashed border-perforation rounded-lg p-5 flex items-start gap-3 text-sm text-ink/80">
					<Sparkles className="w-5 h-5 text-ink/50 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-ink">
							Partners section is currently hidden
						</p>
						<p className="text-xs text-ink/60 mt-0.5">
							Enable the toggle above whenever you secure event sponsors or
							community partners to display their branding.
						</p>
					</div>
				</div>
			)}

			{/* Main Content Area */}
			<div
				className={`space-y-10 transition-opacity duration-200 ${
					!showPartners ? "opacity-60 pointer-events-auto" : "opacity-100"
				}`}
			>
				{/* 1. Sponsors Section */}
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-perforation pb-3">
						<div className="flex items-baseline gap-2.5">
							<h3 className="font-display font-semibold text-xl text-ink flex items-center gap-2">
								<Award className="w-5 h-5 text-stamp" /> Event Sponsors
							</h3>
							<span className="text-xs text-ink/50 font-mono">
								(Recommended 2:1 aspect ratio logo)
							</span>
						</div>

						<button
							type="button"
							onClick={() => openAddModal("sponsor")}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-paper rounded-md font-medium text-xs hover:bg-ink/90 transition-colors shadow-sm self-start sm:self-auto"
						>
							<Plus className="w-3.5 h-3.5" /> Add Sponsor
						</button>
					</div>

					{sponsors.length === 0 ? (
						<div className="p-8 border border-dashed border-perforation rounded-xl text-center bg-perforation/10 space-y-3">
							<Building2 className="w-8 h-8 text-ink/30 mx-auto" />
							<p className="font-medium text-sm text-ink">
								No sponsors added yet
							</p>
							<p className="text-xs text-ink/50 max-w-xs mx-auto">
								Add Platinum, Gold, Silver, or Venue sponsors to acknowledge
								their financial or in-kind support.
							</p>
							<button
								type="button"
								onClick={() => openAddModal("sponsor")}
								className="px-3.5 py-1.5 bg-ink text-paper rounded text-xs font-medium hover:bg-ink/90 inline-flex items-center gap-1.5"
							>
								<Plus className="w-3.5 h-3.5" /> Add First Sponsor
							</button>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{sponsors.map((sponsor) => {
								const displayTier =
									sponsor.tier === "Custom"
										? sponsor.customTier || "Custom"
										: sponsor.tier || "Sponsor";

								return (
									<div
										key={sponsor.id}
										className="border border-perforation rounded-xl bg-paper overflow-hidden shadow-sm hover:border-ink/50 transition-all flex flex-col group"
									>
										{/* Logo Area */}
										<div className="h-32 bg-perforation/15 border-b border-perforation flex items-center justify-center p-4 relative overflow-hidden">
											{sponsor.logoUrl ? (
												// biome-ignore lint/performance/noImgElement: arbitrary external partner logo
												<img
													src={sponsor.logoUrl}
													alt={sponsor.name}
													className="max-h-full max-w-full object-contain"
												/>
											) : (
												<div className="w-16 h-16 rounded-lg bg-perforation/30 border border-perforation text-ink/40 flex flex-col items-center justify-center text-[10px] text-center font-mono">
													<ImageIcon className="w-5 h-5 mb-1" />
													No Logo
												</div>
											)}
										</div>

										{/* Content */}
										<div className="p-4 flex-1 flex flex-col justify-between gap-3">
											<div>
												<div className="flex items-center justify-between gap-2 mb-1.5">
													<span
														className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${getTierBadgeStyle(
															sponsor.tier,
														)}`}
													>
														{displayTier}
													</span>

													<div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
														<button
															type="button"
															onClick={() => openEditModal(sponsor)}
															className="p-1 text-ink/60 hover:text-ink hover:bg-perforation/30 rounded"
															title="Edit sponsor"
														>
															<Edit3 className="w-3.5 h-3.5" />
														</button>
														<button
															type="button"
															onClick={() =>
																handleDelete(sponsor.id, "sponsor")
															}
															className="p-1 text-alert/60 hover:text-alert hover:bg-alert/10 rounded"
															title="Delete sponsor"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</button>
													</div>
												</div>

												<h4 className="font-display font-semibold text-base text-ink">
													{sponsor.name}
												</h4>
											</div>

											{sponsor.websiteUrl && (
												<a
													href={sponsor.websiteUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-ink/60 hover:text-ink flex items-center gap-1 truncate pt-2 border-t border-perforation/40 font-mono"
												>
													<Globe className="w-3 h-3 shrink-0" />
													<span className="truncate">
														{sponsor.websiteUrl.replace(/^https?:\/\//, "")}
													</span>
													<ExternalLink className="w-2.5 h-2.5 shrink-0 ml-auto" />
												</a>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* 2. Community Partners Section */}
				<div className="space-y-4 pt-4">
					<div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-perforation pb-3">
						<div>
							<h3 className="font-display font-semibold text-xl text-ink flex items-center gap-2">
								<Users className="w-5 h-5 text-ink/70" /> Community Partners
							</h3>
							<p className="text-xs text-ink/50 mt-0.5">
								Partner communities, student clubs, and tech groups co-promoting
								the event.
							</p>
						</div>

						<button
							type="button"
							onClick={() => openAddModal("community")}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-paper rounded-md font-medium text-xs hover:bg-ink/90 transition-colors shadow-sm self-start sm:self-auto"
						>
							<Plus className="w-3.5 h-3.5" /> Add Partner
						</button>
					</div>

					{communityPartners.length === 0 ? (
						<div className="p-8 border border-dashed border-perforation rounded-xl text-center bg-perforation/10 space-y-3">
							<Handshake className="w-8 h-8 text-ink/30 mx-auto" />
							<p className="font-medium text-sm text-ink">
								No community partners added
							</p>
							<p className="text-xs text-ink/50 max-w-xs mx-auto">
								Add local developer groups, university chapters, or partner
								initiatives.
							</p>
							<button
								type="button"
								onClick={() => openAddModal("community")}
								className="px-3.5 py-1.5 bg-ink text-paper rounded text-xs font-medium hover:bg-ink/90 inline-flex items-center gap-1.5"
							>
								<Plus className="w-3.5 h-3.5" /> Add First Partner
							</button>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{communityPartners.map((partner) => (
								<div
									key={partner.id}
									className="border border-perforation rounded-xl bg-paper overflow-hidden shadow-sm hover:border-ink/50 transition-all flex flex-col group"
								>
									{/* Logo Area */}
									<div className="h-28 bg-perforation/15 border-b border-perforation flex items-center justify-center p-4 relative overflow-hidden">
										{partner.logoUrl ? (
											// biome-ignore lint/performance/noImgElement: arbitrary external partner logo
											<img
												src={partner.logoUrl}
												alt={partner.name}
												className="max-h-full max-w-full object-contain"
											/>
										) : (
											<div className="w-14 h-14 rounded-lg bg-perforation/30 border border-perforation text-ink/40 flex flex-col items-center justify-center text-[10px] text-center font-mono">
												<ImageIcon className="w-4 h-4 mb-1" />
												No Logo
											</div>
										)}
									</div>

									{/* Content */}
									<div className="p-4 flex-1 flex flex-col justify-between gap-3">
										<div>
											<div className="flex items-center justify-between gap-2 mb-1">
												<span className="px-2 py-0.5 rounded text-[10px] font-mono bg-perforation/30 border border-perforation text-ink/70">
													Community Partner
												</span>

												<div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
													<button
														type="button"
														onClick={() => openEditModal(partner)}
														className="p-1 text-ink/60 hover:text-ink hover:bg-perforation/30 rounded"
														title="Edit partner"
													>
														<Edit3 className="w-3.5 h-3.5" />
													</button>
													<button
														type="button"
														onClick={() =>
															handleDelete(partner.id, "community")
														}
														className="p-1 text-alert/60 hover:text-alert hover:bg-alert/10 rounded"
														title="Delete partner"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</div>

											<h4 className="font-display font-semibold text-base text-ink">
												{partner.name}
											</h4>
										</div>

										{partner.websiteUrl && (
											<a
												href={partner.websiteUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-xs text-ink/60 hover:text-ink flex items-center gap-1 truncate pt-2 border-t border-perforation/40 font-mono"
											>
												<Globe className="w-3 h-3 shrink-0" />
												<span className="truncate">
													{partner.websiteUrl.replace(/^https?:\/\//, "")}
												</span>
												<ExternalLink className="w-2.5 h-2.5 shrink-0 ml-auto" />
											</a>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Modal Dialog for Sponsor & Partner */}
			{modalType && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
					<div className="bg-paper border border-perforation rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-lg text-ink">
								{editingPartner ? "Edit" : "Add"}{" "}
								{modalType === "sponsor" ? "Sponsor" : "Community Partner"}
							</h3>
							<button
								type="button"
								onClick={() => setModalType(null)}
								className="text-ink/40 hover:text-ink p-1 rounded"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-4">
							{/* Tier for Sponsors */}
							{modalType === "sponsor" && (
								<div className="space-y-1.5">
									<label
										htmlFor="partner-tier"
										className="text-xs font-medium text-ink"
									>
										Sponsorship Tier *
									</label>
									<select
										id="partner-tier"
										value={formTier}
										onChange={(e) => setFormTier(e.target.value)}
										className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
									>
										{SPONSOR_TIERS.map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
									</select>
								</div>
							)}

							{/* Custom Tier text if selected */}
							{modalType === "sponsor" && formTier === "Custom" && (
								<div className="space-y-1.5">
									<label
										htmlFor="custom-tier-name"
										className="text-xs font-medium text-ink"
									>
										Custom Tier Name *
									</label>
									<input
										id="custom-tier-name"
										type="text"
										value={formCustomTier}
										onChange={(e) => setFormCustomTier(e.target.value)}
										placeholder="e.g. Swag Partner, Coffee Sponsor"
										className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
									/>
								</div>
							)}

							{/* Name */}
							<div className="space-y-1.5">
								<label
									htmlFor="partner-name"
									className="text-xs font-medium text-ink"
								>
									{modalType === "sponsor" ? "Sponsor" : "Partner"} Name *
								</label>
								<input
									id="partner-name"
									type="text"
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									placeholder={
										modalType === "sponsor"
											? "e.g. Google Cloud, GitHub, Zerodha"
											: "e.g. FOSS United Bangalore, ACM Student Chapter"
									}
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								/>
							</div>

							{/* Website URL */}
							<div className="space-y-1.5">
								<label
									htmlFor="partner-website"
									className="text-xs font-medium text-ink"
								>
									Website Link
								</label>
								<input
									id="partner-website"
									type="text"
									value={formWebsiteUrl}
									onChange={(e) => setFormWebsiteUrl(e.target.value)}
									placeholder="https://example.com"
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								/>
							</div>

							{/* Logo URL */}
							<div className="space-y-1.5">
								<label
									htmlFor="partner-logo"
									className="text-xs font-medium text-ink"
								>
									Logo Image URL
								</label>
								<input
									id="partner-logo"
									type="text"
									value={formLogoUrl}
									onChange={(e) => setFormLogoUrl(e.target.value)}
									placeholder="https://example.com/logo.png"
									className="w-full px-3 py-2 bg-paper border border-perforation rounded-md text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-ink"
								/>
								<p className="text-[11px] text-ink/50">
									Direct link to a PNG, SVG, or JPG logo.
								</p>
							</div>

							{/* Instant Preview if Logo URL provided */}
							{formLogoUrl && (
								<div className="p-3 bg-perforation/15 border border-perforation rounded-lg flex items-center justify-center h-20 overflow-hidden">
									{/* biome-ignore lint/performance/noImgElement: arbitrary external partner logo */}
									<img
										src={formLogoUrl}
										alt="Preview"
										className="max-h-full max-w-full object-contain"
										onError={(e) => {
											(e.target as HTMLElement).style.display = "none";
										}}
									/>
								</div>
							)}
						</div>

						<div className="flex justify-end gap-2 pt-2 border-t border-perforation">
							<button
								type="button"
								onClick={() => setModalType(null)}
								className="px-3.5 py-1.5 border border-perforation hover:bg-perforation/20 rounded text-xs font-medium text-ink"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSaveModal}
								disabled={!formName.trim()}
								className="px-4 py-1.5 bg-ink text-paper rounded text-xs font-medium hover:bg-ink/90 disabled:opacity-50"
							>
								{editingPartner ? "Update" : "Add"}
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
						{isSaving ? "Saving Changes..." : "Save Partners"}
					</button>
				</div>
			)}
		</div>
	);
}
