"use client";

import { trpc } from "@/lib/trpc";
import {
	AlertCircle,
	Calendar,
	Check,
	Clock,
	Copy,
	Edit3,
	MapPin,
	Plus,
	QrCode,
	RefreshCw,
	Settings,
	Share2,
	ShieldCheck,
	Sliders,
	Ticket,
	Trash2,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { JSX } from "react";
import {
	TicketDesignerModal,
	type TicketDesignLayout,
} from "@/components/tickets/ticket-designer-modal";

interface LocalTier {
	id?: string;
	name: string;
	description?: string | null;
	price: number;
	quantity?: number | null;
	maxPerOrder: number;
	salesStart?: string | null;
	salesEnd?: string | null;
	isPublished: boolean;
	allowWaitlist: boolean;
	allowTransfer: boolean;
	allowDrop: boolean;
	order: number;
	confirmedCount?: number;
	waitlistCount?: number;
	checkedInCount?: number;
	droppedCount?: number;
	transferredCount?: number;
	isSoldOut?: boolean;
	designLayout?: TicketDesignLayout | null;
}

export default function ManageTicketsPage(): JSX.Element {
	const params = useParams();
	const slug = params.slug as string;

	// Query event tickets & stats
	const { data, isLoading } = trpc.events.ticketsGet.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	const utils = trpc.useUtils();
	const { mutate: saveTiers, isPending: isSaving } =
		trpc.events.ticketsManageTiers.useMutation({
			onSuccess: () => {
				utils.events.ticketsGet.invalidate({ slug });
				setHasChanges(false);
				setToastMessage("Ticket configuration saved successfully!");
				setTimeout(() => setToastMessage(null), 3000);
			},
			onError: (err) => {
				alert(err.message);
			},
		});

	// Local state
	const [tiers, setTiers] = useState<LocalTier[]>([]);
	const [hasChanges, setHasChanges] = useState(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [copiedLinkTierId, setCopiedLinkTierId] = useState<string | null>(null);

	// Modal & Panel state
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);

	// Form fields
	const [tierName, setTierName] = useState("General Pass");
	const [tierDescription, setTierDescription] = useState("");
	const [isPaid, setIsPaid] = useState(false);
	const [tierPrice, setTierPrice] = useState(0);
	const [includeGst, setIncludeGst] = useState(true);
	const [includePlatformFee, setIncludePlatformFee] = useState(true);
	const [passFeesToAttendee, setPassFeesToAttendee] = useState(true);
	const [isCapacityLimited, setIsCapacityLimited] = useState(true);
	const [tierQuantity, setTierQuantity] = useState<number>(300);
	const [isLimitPerUser, setIsLimitPerUser] = useState(true);
	const [tierMaxPerOrder, setTierMaxPerOrder] = useState<number>(1);
	const [tierAllowWaitlist, setTierAllowWaitlist] = useState(true);
	const [tierAllowTransfer, setTierAllowTransfer] = useState(true);
	const [tierAllowDrop, setTierAllowDrop] = useState(true);
	const [isClosed, setIsClosed] = useState(false);

	// Advanced settings fields
	const [codePrefix, setCodePrefix] = useState("OPT");
	const [salesStartDate, setSalesStartDate] = useState<string>("");
	const [salesEndDate, setSalesEndDate] = useState<string>("");

	const [modalError, setModalError] = useState<string | null>(null);
	const [previewQrUrl, setPreviewQrUrl] = useState<string | null>(null);

	// Visual Ticket Pass Designer Studio State
	const [isDesignerOpen, setIsDesignerOpen] = useState(false);
	const [designerTierIndex, setDesignerTierIndex] = useState<number | null>(
		null,
	);

	const openDesigner = (index: number) => {
		setDesignerTierIndex(index);
		const targetTier = tiers[index];
		if (targetTier) {
			setTierName(targetTier.name);
		}
		setIsDesignerOpen(true);
	};

	// Generate QR Code data URL for the live ticket pass preview
	useEffect(() => {
		const code = codePrefix ? `${codePrefix}-849204` : "OPT-849204";
		QRCode.toDataURL(code, {
			width: 300,
			margin: 2,
			color: {
				dark: "#1B1A18",
				light: "#ffffff",
			},
		})
			.then((url) => setPreviewQrUrl(url))
			.catch((err) => console.error("QR Code Error:", err));
	}, [codePrefix]);

	// Sync fetched tiers to local state (default to 300 General Pass if empty)
	useEffect(() => {
		if (data?.tiers && data.tiers.length > 0) {
			setTiers(
				data.tiers.map((t) => ({
					id: t.id,
					name: t.name,
					description: t.description,
					price: t.price,
					quantity: t.quantity ?? 300,
					maxPerOrder: t.maxPerOrder ?? 1,
					salesStart: t.salesStart
						? new Date(t.salesStart).toISOString()
						: null,
					salesEnd: t.salesEnd ? new Date(t.salesEnd).toISOString() : null,
					isPublished: t.isPublished,
					allowWaitlist: t.allowWaitlist ?? true,
					allowTransfer: t.allowTransfer ?? true,
					allowDrop: t.allowDrop ?? true,
					order: t.order,
					confirmedCount: t.confirmedCount,
					waitlistCount: t.waitlistCount,
					checkedInCount: t.checkedInCount,
					droppedCount: t.droppedCount,
					transferredCount: t.transferredCount,
					isSoldOut: t.isSoldOut,
				})),
			);
			setHasChanges(false);
		} else if (data && (!data.tiers || data.tiers.length === 0)) {
			// Auto-populate default 300 capacity General Pass
			setTiers([
				{
					name: "General Pass",
					description: "Standard event admission pass.",
					price: 0,
					quantity: 300,
					maxPerOrder: 1,
					isPublished: true,
					allowWaitlist: true,
					allowTransfer: true,
					allowDrop: true,
					order: 0,
					confirmedCount: 0,
					waitlistCount: 0,
					checkedInCount: 0,
					droppedCount: 0,
					transferredCount: 0,
				},
			]);
			setHasChanges(true);
		}
	}, [data]);

	const openAddModal = () => {
		setEditingTierIndex(null);
		setTierName("");
		setTierDescription("");
		setIsPaid(false);
		setTierPrice(0);
		setIncludeGst(true);
		setIncludePlatformFee(true);
		setPassFeesToAttendee(true);
		setIsCapacityLimited(true);
		setTierQuantity(300);
		setIsLimitPerUser(true);
		setTierMaxPerOrder(1);
		setTierAllowWaitlist(true);
		setTierAllowTransfer(true);
		setTierAllowDrop(true);
		setIsClosed(false);
		setCodePrefix("OPT");
		setSalesStartDate("");
		setSalesEndDate("");
		setModalError(null);
		setIsAdvancedOpen(false);
		setIsModalOpen(true);
	};

	const openEditModal = (index: number) => {
		const t = tiers[index];
		setEditingTierIndex(index);
		setTierName(t.name);
		setTierDescription(t.description || "");
		setIsPaid(t.price > 0);
		setTierPrice(t.price);
		setIncludeGst(true);
		setIncludePlatformFee(true);
		setPassFeesToAttendee(true);
		setIsCapacityLimited(t.quantity !== null && t.quantity !== undefined);
		setTierQuantity(t.quantity ?? 300);
		setIsLimitPerUser((t.maxPerOrder ?? 1) > 0);
		setTierMaxPerOrder(t.maxPerOrder ?? 1);
		setTierAllowWaitlist(t.allowWaitlist ?? true);
		setTierAllowTransfer(t.allowTransfer ?? true);
		setTierAllowDrop(t.allowDrop ?? true);
		setIsClosed(!t.isPublished);
		setCodePrefix("OPT");
		setSalesStartDate(t.salesStart ? t.salesStart.substring(0, 10) : "");
		setSalesEndDate(t.salesEnd ? t.salesEnd.substring(0, 10) : "");
		setModalError(null);
		setIsAdvancedOpen(false);
		setIsModalOpen(true);
	};

	const handleModalSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!tierName.trim()) {
			setModalError("Pass title is required.");
			return;
		}

		const finalPrice = isPaid ? Math.max(0, Number(tierPrice) || 0) : 0;
		const finalQuantity = isCapacityLimited
			? Math.max(1, Number(tierQuantity) || 300)
			: null;
		const finalMaxPerOrder = isLimitPerUser
			? Math.max(1, Number(tierMaxPerOrder) || 1)
			: 10;

		const updatedTier: LocalTier = {
			name: tierName.trim(),
			description: tierDescription.trim() || null,
			price: finalPrice,
			quantity: finalQuantity,
			maxPerOrder: finalMaxPerOrder,
			salesStart: salesStartDate
				? new Date(salesStartDate).toISOString()
				: null,
			salesEnd: salesEndDate ? new Date(salesEndDate).toISOString() : null,
			isPublished: !isClosed,
			allowWaitlist: tierAllowWaitlist,
			allowTransfer: tierAllowTransfer,
			allowDrop: tierAllowDrop,
			order:
				editingTierIndex !== null
					? tiers[editingTierIndex].order
					: tiers.length,
		};

		if (editingTierIndex !== null) {
			const updated = [...tiers];
			updated[editingTierIndex] = {
				...updated[editingTierIndex],
				...updatedTier,
			};
			setTiers(updated);
		} else {
			setTiers([...tiers, updatedTier]);
		}

		setHasChanges(true);
		setIsModalOpen(false);
	};

	const handleDeleteTier = (index: number) => {
		const t = tiers[index];
		if (t.confirmedCount && t.confirmedCount > 0) {
			alert(
				"Cannot delete this tier because attendees already hold confirmed passes. You can unpublish/close it instead.",
			);
			return;
		}
		if (
			confirm(`Are you sure you want to delete the "${t.name}" ticket type?`)
		) {
			const updated = tiers.filter((_, i) => i !== index);
			setTiers(updated);
			setHasChanges(true);
			setIsModalOpen(false);
		}
	};

	const handleSaveChanges = () => {
		saveTiers({
			slug,
			tiers: tiers.map((t, idx) => ({
				id: t.id,
				name: t.name,
				description: t.description,
				price: t.price,
				quantity: t.quantity,
				maxPerOrder: t.maxPerOrder,
				salesStart: t.salesStart,
				salesEnd: t.salesEnd,
				isPublished: t.isPublished,
				allowWaitlist: t.allowWaitlist,
				allowTransfer: t.allowTransfer,
				allowDrop: t.allowDrop,
				order: idx,
			})),
		});
	};

	const handleCopyDirectLink = (tierId?: string) => {
		if (typeof window === "undefined") return;
		const origin = window.location.origin;
		const link = tierId
			? `${origin}/events/${slug}?ticket=${tierId}`
			: `${origin}/events/${slug}`;
		navigator.clipboard.writeText(link);
		setCopiedLinkTierId(tierId || "default");
		setTimeout(() => setCopiedLinkTierId(null), 2000);
	};

	if (isLoading) {
		return (
			<div className="flex-1 p-8 bg-paper text-ink flex items-center justify-center">
				<p className="animate-pulse opacity-60">
					Loading ticket configuration...
				</p>
			</div>
		);
	}

	const stats = data?.stats;
	const totalCapacity = stats?.eventCapacity || 300;

	return (
		<div className="flex-1 overflow-y-auto bg-paper text-ink pb-24">
			{/* Toast Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-stamp text-paper px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
					<Check className="w-4 h-4 text-paper" />
					{toastMessage}
				</div>
			)}

			<div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
				{/* Top Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-perforation pb-6">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<Ticket className="w-5 h-5 text-stamp" />
							<h1 className="font-display font-semibold text-2xl">
								Manage Tickets
							</h1>
						</div>
						<p className="opacity-70 text-sm">
							Configure passes, set capacity limits (default: 300), waitlist
							queues, and registration rules.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => openDesigner(0)}
							className="px-3.5 py-2 border border-perforation rounded-md text-sm font-medium hover:bg-perforation/20 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
						>
							<Sliders className="w-4 h-4 text-stamp" />
							Pass Studio
						</button>
						<button
							type="button"
							onClick={openAddModal}
							className="px-4 py-2 border border-perforation rounded-md text-sm font-medium hover:bg-perforation/20 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
						>
							<Plus className="w-4 h-4 text-stamp" />
							New Ticket Type
						</button>
						<button
							type="button"
							onClick={handleSaveChanges}
							disabled={!hasChanges || isSaving}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
								hasChanges
									? "bg-stamp text-paper hover:opacity-90 shadow-md cursor-pointer"
									: "bg-perforation/40 text-ink/40 cursor-not-allowed"
							}`}
						>
							{isSaving ? (
								<>
									<RefreshCw className="w-4 h-4 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Check className="w-4 h-4" />
									Save Changes
								</>
							)}
						</button>
					</div>
				</div>

				{/* Metric Counters */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="border border-perforation rounded-lg p-5 bg-paper/50 shadow-xs">
						<div className="flex items-center justify-between opacity-70 mb-2">
							<span className="text-xs uppercase font-medium tracking-wider">
								Total Capacity
							</span>
							<Users className="w-4 h-4 text-stamp" />
						</div>
						<div className="font-display text-2xl font-bold">
							{totalCapacity}
						</div>
						<p className="text-xs opacity-60 mt-1">
							Default 300 venue capacity
						</p>
					</div>

					<div className="border border-perforation rounded-lg p-5 bg-paper/50 shadow-xs">
						<div className="flex items-center justify-between opacity-70 mb-2">
							<span className="text-xs uppercase font-medium tracking-wider">
								Registered
							</span>
							<UserCheck className="w-4 h-4 text-stamp" />
						</div>
						<div className="font-display text-2xl font-bold text-stamp">
							{stats?.totalConfirmed ?? 0} / {totalCapacity}
						</div>
						<p className="text-xs opacity-60 mt-1">
							{totalCapacity - (stats?.totalConfirmed ?? 0)} spots remaining
						</p>
					</div>

					<div className="border border-perforation rounded-lg p-5 bg-paper/50 shadow-xs">
						<div className="flex items-center justify-between opacity-70 mb-2">
							<span className="text-xs uppercase font-medium tracking-wider">
								Waitlist Queue
							</span>
							<Clock className="w-4 h-4 text-ink/70" />
						</div>
						<div className="font-display text-2xl font-bold">
							{stats?.totalWaitlisted ?? 0}
						</div>
						<p className="text-xs opacity-60 mt-1">Auto-promotes on drop</p>
					</div>

					<div className="border border-perforation rounded-lg p-5 bg-paper/50 shadow-xs">
						<div className="flex items-center justify-between opacity-70 mb-2">
							<span className="text-xs uppercase font-medium tracking-wider">
								Checked In
							</span>
							<Check className="w-4 h-4 text-stamp" />
						</div>
						<div className="font-display text-2xl font-bold text-stamp">
							{stats?.totalCheckedIn ?? 0}
						</div>
						<p className="text-xs opacity-60 mt-1">Scanned at door</p>
					</div>
				</div>

				{/* Ticket Passes List & Cards */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-display font-semibold text-lg flex items-center gap-2">
							Tickets ({tiers.length})
						</h2>
					</div>

					{tiers.length === 0 ? (
						<div className="border border-perforation rounded-lg p-12 text-center bg-paper/40 flex flex-col items-center">
							<Ticket className="w-12 h-12 text-ink/30 mb-3" />
							<h3 className="font-display font-medium text-base mb-1">
								No ticket types configured
							</h3>
							<p className="text-xs opacity-60 max-w-sm mb-6">
								OpenEvents provides a default Free General Pass (limit 300) so
								your event is always ready to receive registrations.
							</p>
							<button
								type="button"
								onClick={openAddModal}
								className="px-4 py-2 bg-stamp text-paper rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-md"
							>
								<Plus className="w-4 h-4" />
								Add General Pass (300 Limit)
							</button>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							{tiers.map((tier, index) => {
								const confirmed = tier.confirmedCount ?? 0;
								const capacity = tier.quantity ?? 300;
								const isUnlimited =
									tier.quantity === null || tier.quantity === undefined;
								const pct = isUnlimited
									? 0
									: Math.min(100, Math.round((confirmed / capacity) * 100));
								const isSoldOut = !isUnlimited && confirmed >= capacity;

								return (
									<div
										key={tier.id || `tier-${index}`}
										className={`border rounded-xl p-5 transition-all flex flex-col justify-between shadow-xs relative overflow-hidden group ${
											tier.isPublished
												? "border-perforation bg-paper hover:border-stamp/40"
												: "border-perforation/50 bg-paper/40 opacity-70"
										}`}
									>
										{/* Ticket Stub Decorative Top Banner */}
										<div className="space-y-4">
											{/* Header info */}
											<div className="flex items-start justify-between gap-3">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded border bg-stamp/10 text-stamp border-stamp/20">
															{tier.price === 0
																? "FREE PASS"
																: `₹${tier.price}`}
														</span>

														{tier.isPublished ? (
															<span className="text-[11px] text-stamp font-mono flex items-center gap-1">
																<span className="w-1.5 h-1.5 rounded-full bg-stamp inline-block" />
																Available
															</span>
														) : (
															<span className="text-[11px] text-alert font-mono flex items-center gap-1">
																<span className="w-1.5 h-1.5 rounded-full bg-alert inline-block" />
																Closed
															</span>
														)}

														{index === 0 && (
															<span className="text-[10px] bg-stamp/10 text-stamp px-2 py-0.5 rounded font-mono font-medium">
																Default
															</span>
														)}
													</div>

													<h3 className="font-display font-semibold text-lg leading-tight pt-1">
														{tier.name}
													</h3>
												</div>

												{/* Quick Actions */}
												<div className="flex items-center gap-1 shrink-0">
													<button
														type="button"
														onClick={() => openEditModal(index)}
														className="px-3 py-1.5 bg-perforation/30 hover:bg-perforation/60 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
													>
														<Edit3 className="w-3.5 h-3.5" />
														Edit Pass
													</button>
													<button
														type="button"
														onClick={() => handleDeleteTier(index)}
														className="p-1.5 hover:bg-alert/10 rounded-md transition-colors text-alert cursor-pointer"
														title="Delete pass"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</div>

											{/* Mini Ticket Pass Layout Thumbnail with Direct Designer Launch */}
											<div className="relative rounded-lg border border-perforation bg-paper/60 p-2.5 flex items-center justify-between gap-3 overflow-hidden">
												<div className="flex items-center gap-2.5">
													<div className="w-10 h-7 rounded border border-stamp/30 bg-stamp/10 flex items-center justify-center shrink-0">
														<Ticket className="w-3.5 h-3.5 text-stamp" />
													</div>
													<div className="space-y-0.5">
														<div className="text-[11px] font-mono font-medium flex items-center gap-1.5">
															<span>Pass Canvas</span>
															<span className="text-[9px] text-stamp bg-stamp/10 px-1.5 py-0.2 rounded border border-stamp/20 uppercase">
																{tier.designLayout?.theme || "Classic"}
															</span>
														</div>
														<p className="text-[10px] opacity-60 font-mono">
															{tier.designLayout?.layers?.length || 9} canvas
															layers • Draggable layout
														</p>
													</div>
												</div>

												<button
													type="button"
													onClick={() => openDesigner(index)}
													className="px-2.5 py-1 bg-paper border border-perforation hover:border-stamp hover:text-stamp rounded-md text-[11px] font-mono font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
												>
													<Sliders className="w-3 h-3 text-stamp" />
													Edit Design
												</button>
											</div>

											{/* Description */}
											{tier.description ? (
												<p className="text-xs opacity-70 line-clamp-2">
													{tier.description}
												</p>
											) : (
												<p className="text-xs opacity-40 italic">
													Standard admission pass.
												</p>
											)}

											{/* Registration Progress Meter */}
											<div className="space-y-1.5 pt-1">
												<div className="flex items-center justify-between text-xs font-mono">
													<span className="opacity-80">
														Registered:{" "}
														<strong className="text-ink font-bold">
															{confirmed}
														</strong>{" "}
														/ {isUnlimited ? "Unlimited" : capacity}
													</span>
													<span className="text-[11px] opacity-60">
														{isUnlimited
															? "Open registration"
															: isSoldOut
																? "Sold Out"
																: `${capacity - confirmed} left`}
													</span>
												</div>

												{!isUnlimited && (
													<div className="w-full h-2 bg-perforation/40 rounded-full overflow-hidden">
														<div
															className={`h-full transition-all duration-300 ${
																pct >= 100 ? "bg-alert" : "bg-stamp"
															}`}
															style={{ width: `${pct}%` }}
														/>
													</div>
												)}
											</div>
										</div>

										{/* Feature Rules & Direct Link Bar */}
										<div className="border-t border-perforation/60 mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
											<div className="flex flex-wrap items-center gap-1.5 text-[11px] opacity-75">
												<span
													className={`px-1.5 py-0.5 rounded ${
														tier.allowWaitlist
															? "bg-perforation/40 text-ink"
															: "bg-perforation/20 line-through opacity-40"
													}`}
												>
													Waitlist{" "}
													{tier.waitlistCount ? `(${tier.waitlistCount})` : ""}
												</span>
												<span
													className={`px-1.5 py-0.5 rounded ${
														tier.allowTransfer
															? "bg-perforation/40 text-ink"
															: "bg-perforation/20 line-through opacity-40"
													}`}
												>
													Transferable
												</span>
												<span
													className={`px-1.5 py-0.5 rounded ${
														tier.allowDrop
															? "bg-perforation/40 text-ink"
															: "bg-perforation/20 line-through opacity-40"
													}`}
												>
													Droppable
												</span>
											</div>

											{/* Direct Link Action */}
											<button
												type="button"
												onClick={() => handleCopyDirectLink(tier.id)}
												className="text-[11px] text-stamp hover:underline flex items-center gap-1 cursor-pointer"
												title="Copy direct registration link for this pass"
											>
												{copiedLinkTierId === (tier.id || "default") ? (
													<>
														<Check className="w-3 h-3 text-stamp" />
														Copied!
													</>
												) : (
													<>
														<Share2 className="w-3 h-3" />
														Direct Link
													</>
												)}
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* ──────────────── Manage / Edit Ticket Drawer/Modal (Wide 2-Column Layout with Fixed Header & Footer) ──────────────── */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
					<div className="bg-paper border border-perforation rounded-2xl max-w-5xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col overflow-hidden">
						{/* Fixed Header */}
						<div className="flex items-center justify-between border-b border-perforation p-6 pb-4 shrink-0 bg-paper">
							<div className="flex items-center gap-2">
								<Ticket className="w-5 h-5 text-stamp" />
								<h3 className="font-display font-semibold text-xl">
									{editingTierIndex !== null
										? "Edit Ticket Type"
										: "New Ticket Type"}
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setIsModalOpen(false)}
								className="p-1 hover:bg-perforation/20 rounded-md cursor-pointer transition-colors"
								aria-label="Close modal"
							>
								<X className="w-4 h-4 opacity-70" />
							</button>
						</div>

						{modalError && (
							<div className="mx-6 mt-4 bg-alert/10 text-alert p-3 rounded-lg text-xs flex items-center gap-2 shrink-0">
								<AlertCircle className="w-4 h-4 shrink-0" />
								{modalError}
							</div>
						)}

						{/* Scrollable Form Body */}
						{(() => {
							const basePrice = Math.max(0, Number(tierPrice) || 0);
							const gstAmount = includeGst
								? Number((basePrice * 0.18).toFixed(2))
								: 0;
							const priceIncGst = Number((basePrice + gstAmount).toFixed(2));
							const platformFeeAmount = includePlatformFee
								? Number((basePrice * 0.0708).toFixed(2))
								: 0;
							const gatewayFeeAmount = includePlatformFee
								? Number((basePrice * 0.0236).toFixed(2))
								: 0;
							const totalFeeAmount = Number(
								(platformFeeAmount + gatewayFeeAmount).toFixed(2),
							);
							const totalPriceForUser = passFeesToAttendee
								? Number((basePrice + gstAmount + totalFeeAmount).toFixed(2))
								: basePrice;
							const organizerPayout = passFeesToAttendee
								? basePrice
								: Number(
										Math.max(
											0,
											basePrice -
												(includeGst ? basePrice - basePrice / 1.18 : 0) -
												totalFeeAmount,
										).toFixed(2),
									);

							return (
								<form
									id="ticket-modal-form"
									onSubmit={handleModalSubmit}
									className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
								>
									<div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
										{/* ── Left Column: Single-Piece QR Ticket Pass (md:col-span-5) ── */}
										<div className="md:col-span-5 space-y-4 md:sticky md:top-0">
											<div className="flex items-center justify-between">
												<span className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
													<Ticket className="w-3.5 h-3.5 text-stamp" />
													Attendee Ticket Pass
												</span>
												<div className="flex items-center gap-2">
													<button
														type="button"
														onClick={() => {
															setDesignerTierIndex(editingTierIndex ?? 0);
															setIsDesignerOpen(true);
														}}
														className="text-[11px] font-mono text-stamp bg-stamp/10 hover:bg-stamp/20 border border-stamp/20 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
													>
														<Sliders className="w-3 h-3" />
														Customize Canvas
													</button>
													<span className="text-[10px] font-mono opacity-60 bg-perforation/40 px-2 py-0.5 rounded">
														Live Preview
													</span>
												</div>
											</div>

											{/* ── Authentic Single-Piece QR Ticket Pass Card ── */}
											<div className="border border-perforation rounded-2xl overflow-hidden shadow-md bg-paper transition-all">
												{/* Header Section */}
												<div className="p-5 bg-paper border-b border-perforation space-y-3">
													<div className="flex items-center justify-between gap-2">
														<span className="text-[11px] font-mono font-bold uppercase tracking-widest text-stamp bg-stamp/10 px-2.5 py-0.5 rounded-full border border-stamp/20 truncate max-w-[170px]">
															{tierName.trim() || "General Pass"}
														</span>

														<span
															className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
																isPaid
																	? "bg-stamp/15 text-stamp border-stamp/30"
																	: "bg-perforation/40 text-ink/70 border-perforation"
															}`}
														>
															{isPaid
																? passFeesToAttendee
																	? `₹${totalPriceForUser.toFixed(2)}`
																	: `₹${basePrice.toFixed(2)}`
																: "FREE PASS"}
														</span>
													</div>

													<div>
														<h4 className="font-display font-bold text-xl leading-tight text-ink line-clamp-1">
															{data?.event?.title || "Sudo Reboot"}
														</h4>
														<p className="text-xs opacity-60 font-mono mt-0.5">
															Hosted by{" "}
															{data?.event?.organizer?.name ||
																"OpenEvents Community"}
														</p>
													</div>

													{/* Event Date & Location */}
													<div className="grid grid-cols-1 gap-1.5 pt-1 text-xs opacity-75">
														<div className="flex items-center gap-2">
															<Calendar className="w-3.5 h-3.5 text-stamp shrink-0" />
															<span className="text-xs font-mono">
																{data?.event?.eventStart
																	? new Date(
																			data.event.eventStart,
																		).toLocaleDateString("en-US", {
																			weekday: "short",
																			month: "short",
																			day: "numeric",
																			year: "numeric",
																		})
																	: "Saturday, Oct 24, 2026"}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<MapPin className="w-3.5 h-3.5 text-stamp shrink-0" />
															<span className="text-xs truncate">
																{data?.event?.location ||
																	"Main Auditorium / Online Stream"}
															</span>
														</div>
													</div>
												</div>

												{/* Single-Piece Ticket Body with Scannable QR Code */}
												<div className="p-6 bg-paper/60 space-y-4 flex flex-col items-center text-center">
													{/* Attendee Holder */}
													<div className="space-y-0.5">
														<span className="text-[10px] font-mono uppercase tracking-widest opacity-50 block">
															Ticket Holder
														</span>
														<h5 className="font-display font-semibold text-base text-ink">
															Alex Morgan
														</h5>
														<p className="text-xs font-mono opacity-60">
															alex@example.com
														</p>
													</div>

													{/* Live Rendered Scannable QR Code */}
													<div className="bg-white p-3.5 rounded-xl border border-perforation shadow-sm space-y-2 flex flex-col items-center">
														{previewQrUrl ? (
															// biome-ignore lint/performance/noImgElement: Client-side generated QR data URL
															<img
																src={previewQrUrl}
																alt="Ticket Verification QR Code"
																className="w-40 h-40 object-contain"
															/>
														) : (
															<div className="w-40 h-40 bg-paper/50 flex items-center justify-center">
																<QrCode className="w-20 h-20 text-ink/40" />
															</div>
														)}
														<div className="text-[11px] font-mono font-bold tracking-widest text-ink/70 uppercase">
															{codePrefix
																? `${codePrefix}-849204`
																: "OPT-849204"}
														</div>
													</div>

													{/* Confirmed Badge & Scanning Note */}
													<div className="space-y-1">
														<div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stamp/10 border border-stamp/20 text-stamp text-[11px] font-mono font-semibold">
															<ShieldCheck className="w-3.5 h-3.5 text-stamp" />
															Confirmed Admission Pass
														</div>
														<p className="text-[11px] opacity-60 max-w-xs">
															Show this QR code at the check-in desk for entry.
														</p>
													</div>

													{/* Rules & Limits Summary Badges */}
													<div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono pt-1">
														<span className="px-2 py-0.5 rounded bg-perforation/40 text-ink/70">
															{isCapacityLimited
																? `Cap: ${tierQuantity} seats`
																: "Cap: Unlimited"}
														</span>
														<span className="px-2 py-0.5 rounded bg-perforation/40 text-ink/70">
															Max/Order:{" "}
															{isLimitPerUser ? tierMaxPerOrder : "10"}
														</span>
														{tierAllowWaitlist && (
															<span className="px-2 py-0.5 rounded bg-stamp/10 text-stamp border border-stamp/20">
																Waitlist On
															</span>
														)}
														{tierAllowTransfer && (
															<span className="px-2 py-0.5 rounded bg-stamp/10 text-stamp border border-stamp/20">
																Transferable
															</span>
														)}
														{tierAllowDrop && (
															<span className="px-2 py-0.5 rounded bg-stamp/10 text-stamp border border-stamp/20">
																Auto-Drop
															</span>
														)}
														{isClosed && (
															<span className="px-2 py-0.5 rounded bg-alert/10 text-alert border border-alert/20 font-bold">
																Sales Paused
															</span>
														)}
													</div>
												</div>
											</div>

											{/* Live Price Receipt Breakdown (if Paid) */}
											{isPaid && (
												<div className="p-3.5 rounded-xl border border-stamp/30 bg-stamp/5 space-y-1.5 font-mono text-xs animate-in fade-in">
													<div className="flex items-center justify-between text-ink/70">
														<span>Base Ticket Price:</span>
														<span>₹{basePrice.toFixed(2)}</span>
													</div>
													{includeGst && (
														<div className="flex items-center justify-between text-ink/70">
															<span>GST (18%):</span>
															<span>+ ₹{gstAmount.toFixed(2)}</span>
														</div>
													)}
													{includePlatformFee && (
														<div className="flex items-center justify-between text-ink/70">
															<span>Platform & Gateway Fee (9.44%):</span>
															<span>+ ₹{totalFeeAmount.toFixed(2)}</span>
														</div>
													)}
													<div className="border-t border-perforation/80 pt-1.5 flex items-center justify-between text-stamp font-bold text-sm">
														<span className="font-sans">
															Total Price for User:
														</span>
														<span>₹{totalPriceForUser.toFixed(2)}</span>
													</div>
													<div className="flex items-center justify-between text-[11px] opacity-70 pt-0.5">
														<span className="font-sans">
															Estimated Organizer Payout:
														</span>
														<span>₹{organizerPayout.toFixed(2)}</span>
													</div>
												</div>
											)}
										</div>

										{/* ── Right Column: Ticket Configuration Controls (md:col-span-7) ── */}
										<div className="md:col-span-7 space-y-4">
											{/* Ticket Title */}
											<div>
												<label
													htmlFor="modal-tier-title"
													className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
												>
													Ticket Title *
												</label>
												<input
													id="modal-tier-title"
													type="text"
													required
													value={tierName}
													onChange={(e) => setTierName(e.target.value)}
													placeholder="e.g. General Pass"
													className="w-full px-3.5 py-2 border border-perforation rounded-lg bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp"
												/>
											</div>

											{/* Description */}
											<div>
												<label
													htmlFor="modal-tier-desc"
													className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
												>
													Description
												</label>
												<textarea
													id="modal-tier-desc"
													rows={2}
													value={tierDescription}
													onChange={(e) => setTierDescription(e.target.value)}
													placeholder="e.g. Standard full access pass with attendee kit"
													className="w-full px-3.5 py-2 border border-perforation rounded-lg bg-paper text-ink text-sm focus:outline-none focus:ring-1 focus:ring-stamp resize-none"
												/>
											</div>

											{/* Paid Ticket Engine */}
											<div className="p-3.5 space-y-3 bg-paper/60 border border-perforation rounded-xl">
												<label className="flex items-center justify-between cursor-pointer">
													<div>
														<span className="font-medium block">
															Paid Ticket
														</span>
														<span className="text-xs opacity-60">
															{isPaid
																? "Paid registration with automated GST & fee handling"
																: "Free admission (Default)"}
														</span>
													</div>
													<input
														type="checkbox"
														checked={isPaid}
														onChange={(e) => {
															const nextVal = e.target.checked;
															setIsPaid(nextVal);
															if (nextVal && tierPrice === 0) {
																setTierPrice(1);
															}
														}}
														className="w-4 h-4 accent-stamp cursor-pointer"
													/>
												</label>

												{isPaid && (
													<div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-1">
														{/* Ticket Price Field */}
														<div className="flex items-center justify-between gap-4 p-3 bg-paper rounded-lg border border-perforation">
															<label
																htmlFor="modal-tier-price"
																className="text-xs font-semibold uppercase tracking-wider opacity-80"
															>
																Ticket Price
															</label>
															<div className="flex items-center">
																<input
																	id="modal-tier-price"
																	type="number"
																	min="1"
																	step="any"
																	value={tierPrice}
																	onChange={(e) =>
																		setTierPrice(Number(e.target.value))
																	}
																	className="w-28 px-3 py-1.5 border border-r-0 border-perforation rounded-l-md bg-paper text-ink text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-stamp"
																/>
																<span className="px-3 py-1.5 bg-perforation/30 border border-perforation rounded-r-md text-xs font-mono font-bold text-ink/70">
																	₹
																</span>
															</div>
														</div>

														{/* Include GST (18%) Switch */}
														<div className="p-3 bg-paper rounded-lg border border-perforation space-y-1">
															<label className="flex items-center justify-between cursor-pointer">
																<div>
																	<span className="text-xs font-medium block">
																		Include GST (18%)
																	</span>
																	<span className="text-[11px] opacity-60 font-mono">
																		{includeGst
																			? `Total Price Inc GST ( ₹${priceIncGst.toFixed(2)} )`
																			: "GST calculation disabled"}
																	</span>
																</div>
																<input
																	type="checkbox"
																	checked={includeGst}
																	onChange={(e) =>
																		setIncludeGst(e.target.checked)
																	}
																	className="w-4 h-4 accent-stamp cursor-pointer"
																/>
															</label>
														</div>

														{/* Include Platform Fee Switch */}
														<div className="p-3 bg-paper rounded-lg border border-perforation space-y-2">
															<label className="flex items-center justify-between cursor-pointer">
																<div>
																	<div className="flex items-center gap-1.5">
																		<span className="text-xs font-medium">
																			Include Platform Fee
																		</span>
																		{includePlatformFee && (
																			<span className="text-xs font-mono opacity-70">
																				( ₹{totalFeeAmount.toFixed(2)} )
																			</span>
																		)}
																	</div>
																	<div className="text-[11px] opacity-60 font-mono space-x-2 pt-0.5">
																		<span>Platform: 7.08%</span>
																		<span>•</span>
																		<span>Gateway: 2.36%</span>
																	</div>
																</div>
																<input
																	type="checkbox"
																	checked={includePlatformFee}
																	onChange={(e) =>
																		setIncludePlatformFee(e.target.checked)
																	}
																	className="w-4 h-4 accent-stamp cursor-pointer"
																/>
															</label>
														</div>

														{/* Fee Handling Mode */}
														<div className="p-3 bg-paper rounded-lg border border-perforation space-y-2">
															<span className="text-xs font-medium block opacity-80">
																Fee Handling
															</span>
															<div className="grid grid-cols-2 gap-2 text-xs">
																<button
																	type="button"
																	onClick={() => setPassFeesToAttendee(true)}
																	className={`p-2 rounded-md border text-left cursor-pointer transition-colors ${
																		passFeesToAttendee
																			? "border-stamp bg-stamp/10 font-semibold text-stamp"
																			: "border-perforation opacity-60 hover:opacity-100"
																	}`}
																>
																	<span className="block text-[11px]">
																		Pass to Attendee
																	</span>
																	<span className="text-[10px] opacity-75 font-normal">
																		Buyer pays fees
																	</span>
																</button>

																<button
																	type="button"
																	onClick={() => setPassFeesToAttendee(false)}
																	className={`p-2 rounded-md border text-left cursor-pointer transition-colors ${
																		!passFeesToAttendee
																			? "border-stamp bg-stamp/10 font-semibold text-stamp"
																			: "border-perforation opacity-60 hover:opacity-100"
																	}`}
																>
																	<span className="block text-[11px]">
																		Absorb in Ticket
																	</span>
																	<span className="text-[10px] opacity-75 font-normal">
																		Deduct from payout
																	</span>
																</button>
															</div>
														</div>
													</div>
												)}
											</div>

											{/* Feature Toggles & Limits List */}
											<div className="border border-perforation rounded-xl divide-y divide-perforation bg-paper/40 overflow-hidden text-sm">
												{/* Limit Capacity (Max 300 default) */}
												<div className="p-3.5 space-y-2">
													<label className="flex items-center justify-between cursor-pointer">
														<div>
															<span className="font-medium block">
																Limit Capacity (Default: 300)
															</span>
															<span className="text-xs opacity-60">
																Capped total seats allocated for this pass
															</span>
														</div>
														<input
															type="checkbox"
															checked={isCapacityLimited}
															onChange={(e) =>
																setIsCapacityLimited(e.target.checked)
															}
															className="w-4 h-4 accent-stamp cursor-pointer"
														/>
													</label>

													{isCapacityLimited && (
														<div className="pt-1">
															<label
																htmlFor="modal-tier-capacity"
																className="sr-only"
															>
																Capacity
															</label>
															<div className="flex items-center gap-2">
																<span className="text-xs opacity-70 font-mono">
																	Capacity Limit:
																</span>
																<input
																	id="modal-tier-capacity"
																	type="number"
																	min="1"
																	value={tierQuantity}
																	onChange={(e) =>
																		setTierQuantity(Number(e.target.value))
																	}
																	className="w-28 px-3 py-1.5 border border-perforation rounded-md bg-paper text-ink text-sm font-mono focus:outline-none focus:ring-1 focus:ring-stamp"
																/>
																<span className="text-xs opacity-50">
																	people
																</span>
															</div>
														</div>
													)}
												</div>

												{/* Limit Tickets Per User */}
												<div className="p-3.5 space-y-2">
													<label className="flex items-center justify-between cursor-pointer">
														<div>
															<span className="font-medium block">
																Limit Tickets Per User
															</span>
															<span className="text-xs opacity-60">
																Maximum passes one attendee can claim
															</span>
														</div>
														<input
															type="checkbox"
															checked={isLimitPerUser}
															onChange={(e) =>
																setIsLimitPerUser(e.target.checked)
															}
															className="w-4 h-4 accent-stamp cursor-pointer"
														/>
													</label>

													{isLimitPerUser && (
														<div className="pt-1">
															<label
																htmlFor="modal-tier-max-order"
																className="sr-only"
															>
																Max per User
															</label>
															<div className="flex items-center gap-2">
																<span className="text-xs opacity-70 font-mono">
																	Max per Order:
																</span>
																<input
																	id="modal-tier-max-order"
																	type="number"
																	min="1"
																	max="10"
																	value={tierMaxPerOrder}
																	onChange={(e) =>
																		setTierMaxPerOrder(Number(e.target.value))
																	}
																	className="w-24 px-3 py-1.5 border border-perforation rounded-md bg-paper text-ink text-sm font-mono focus:outline-none focus:ring-1 focus:ring-stamp"
																/>
															</div>
														</div>
													)}
												</div>

												{/* Waitlisting */}
												<label className="flex items-center justify-between p-3.5 hover:bg-perforation/10 cursor-pointer">
													<div>
														<span className="font-medium block">
															Waitlisting
														</span>
														<span className="text-xs opacity-60">
															Queue attendees automatically once capacity is
															reached
														</span>
													</div>
													<input
														type="checkbox"
														checked={tierAllowWaitlist}
														onChange={(e) =>
															setTierAllowWaitlist(e.target.checked)
														}
														className="w-4 h-4 accent-stamp cursor-pointer"
													/>
												</label>

												{/* Allow Transfer */}
												<label className="flex items-center justify-between p-3.5 hover:bg-perforation/10 cursor-pointer">
													<div>
														<span className="font-medium block">
															Allow Ticket Transfer
														</span>
														<span className="text-xs opacity-60">
															Attendees can give pass to another person with
															secure claim link
														</span>
													</div>
													<input
														type="checkbox"
														checked={tierAllowTransfer}
														onChange={(e) =>
															setTierAllowTransfer(e.target.checked)
														}
														className="w-4 h-4 accent-stamp cursor-pointer"
													/>
												</label>

												{/* Allow Drop */}
												<label className="flex items-center justify-between p-3.5 hover:bg-perforation/10 cursor-pointer">
													<div>
														<span className="font-medium block">
															Allow Ticket Drop
														</span>
														<span className="text-xs opacity-60">
															Auto-promotes next waitlisted attendee on drop
														</span>
													</div>
													<input
														type="checkbox"
														checked={tierAllowDrop}
														onChange={(e) => setTierAllowDrop(e.target.checked)}
														className="w-4 h-4 accent-stamp cursor-pointer"
													/>
												</label>

												{/* Close Ticket (Pause Sales) */}
												<label className="flex items-center justify-between p-3.5 hover:bg-perforation/10 cursor-pointer">
													<div>
														<span className="font-medium block">
															Close Ticket
														</span>
														<span className="text-xs opacity-60">
															Temporarily stop registrations for this pass
														</span>
													</div>
													<input
														type="checkbox"
														checked={isClosed}
														onChange={(e) => setIsClosed(e.target.checked)}
														className="w-4 h-4 accent-alert cursor-pointer"
													/>
												</label>
											</div>

											{/* Direct URL: "Show This Ticket Only" (MakeMyPass Feature) */}
											<div className="p-3.5 border border-perforation rounded-xl bg-paper/60 space-y-2 text-xs">
												<div className="flex items-center justify-between">
													<span className="font-semibold text-xs uppercase tracking-wider opacity-80">
														Show This Ticket Only Link
													</span>
													<button
														type="button"
														onClick={() =>
															handleCopyDirectLink(
																editingTierIndex !== null
																	? tiers[editingTierIndex]?.id
																	: undefined,
															)
														}
														className="text-stamp hover:underline flex items-center gap-1 font-mono cursor-pointer"
													>
														{copiedLinkTierId ? (
															<>
																<Check className="w-3.5 h-3.5 text-stamp" />{" "}
																Copied
															</>
														) : (
															<>
																<Copy className="w-3.5 h-3.5" /> Copy Link
															</>
														)}
													</button>
												</div>
												<p className="opacity-60 text-[11px] font-mono truncate">
													{typeof window !== "undefined"
														? `${window.location.origin}/events/${slug}?ticket=${
																editingTierIndex !== null &&
																tiers[editingTierIndex]?.id
																	? tiers[editingTierIndex].id
																	: "general-pass"
															}`
														: `/events/${slug}?ticket=general-pass`}
												</p>
											</div>

											{/* Advanced Settings Toggle */}
											<div>
												<button
													type="button"
													onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
													className="text-xs text-ink/70 hover:text-ink font-medium flex items-center gap-1.5 cursor-pointer py-1"
												>
													<Settings className="w-3.5 h-3.5 text-stamp" />
													{isAdvancedOpen
														? "Hide Advanced Settings"
														: "Advanced Settings"}
												</button>

												{isAdvancedOpen && (
													<div className="mt-2 p-3.5 border border-perforation rounded-xl bg-paper/40 space-y-3 text-xs animate-in fade-in">
														<div>
															<label
																htmlFor="modal-code-prefix"
																className="block font-semibold uppercase tracking-wider mb-1 opacity-70"
															>
																Ticket Code Prefix
															</label>
															<input
																id="modal-code-prefix"
																type="text"
																value={codePrefix}
																onChange={(e) =>
																	setCodePrefix(e.target.value.toUpperCase())
																}
																placeholder="OPT"
																className="w-full px-3 py-1.5 border border-perforation rounded-md bg-paper text-ink font-mono uppercase"
															/>
														</div>

														<div className="grid grid-cols-2 gap-3 pt-1">
															<div>
																<label
																	htmlFor="modal-sales-start"
																	className="block font-semibold uppercase tracking-wider mb-1 opacity-70"
																>
																	Sales Start Date
																</label>
																<input
																	id="modal-sales-start"
																	type="date"
																	value={salesStartDate}
																	onChange={(e) =>
																		setSalesStartDate(e.target.value)
																	}
																	className="w-full px-3 py-1.5 border border-perforation rounded-md bg-paper text-ink font-mono text-xs"
																/>
															</div>

															<div>
																<label
																	htmlFor="modal-sales-end"
																	className="block font-semibold uppercase tracking-wider mb-1 opacity-70"
																>
																	Sales End Date
																</label>
																<input
																	id="modal-sales-end"
																	type="date"
																	value={salesEndDate}
																	onChange={(e) =>
																		setSalesEndDate(e.target.value)
																	}
																	className="w-full px-3 py-1.5 border border-perforation rounded-md bg-paper text-ink font-mono text-xs"
																/>
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								</form>
							);
						})()}

						{/* Fixed Sticky Footer Actions */}
						<div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-perforation p-4 sm:p-6 sm:py-4 bg-paper/95 backdrop-blur-xs shrink-0">
							{editingTierIndex !== null ? (
								<button
									type="button"
									onClick={() => handleDeleteTier(editingTierIndex)}
									className="w-full sm:w-auto px-3.5 py-2 text-alert border border-alert/30 hover:bg-alert/10 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
								>
									<Trash2 className="w-3.5 h-3.5" />
									Delete Pass
								</button>
							) : (
								<div className="hidden sm:block" />
							)}

							<div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="flex-1 sm:flex-initial px-4 py-2 border border-perforation rounded-lg text-xs font-medium hover:bg-perforation/20 transition-colors cursor-pointer text-center"
								>
									Cancel
								</button>
								<button
									type="submit"
									form="ticket-modal-form"
									className="flex-1 sm:flex-initial px-5 py-2 bg-stamp text-paper rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-md text-center"
								>
									{editingTierIndex !== null ? "Update Ticket" : "Add Ticket"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ── Visual Ticket Pass Designer Studio Modal ── */}
			{isDesignerOpen && (
				<TicketDesignerModal
					isOpen={isDesignerOpen}
					onClose={() => setIsDesignerOpen(false)}
					onSave={(layout) => {
						if (designerTierIndex !== null && tiers[designerTierIndex]) {
							const updated = [...tiers];
							updated[designerTierIndex] = {
								...updated[designerTierIndex],
								designLayout: layout,
							};
							setTiers(updated);
							setHasChanges(true);
						}
						setToastMessage("Ticket pass design saved successfully!");
						setTimeout(() => setToastMessage(null), 3000);
					}}
					initialLayout={
						designerTierIndex !== null
							? tiers[designerTierIndex]?.designLayout || null
							: null
					}
					tierName={
						designerTierIndex !== null
							? tiers[designerTierIndex]?.name || tierName
							: tierName
					}
					eventTitle={data?.event?.title || "Sudo Reboot"}
					organizerName={data?.event?.organizer?.name || "OpenEvents Community"}
					eventStart={
						data?.event?.eventStart
							? new Date(data.event.eventStart).toISOString()
							: null
					}
					location={data?.event?.location || null}
					codePrefix={codePrefix}
				/>
			)}
		</div>
	);
}
