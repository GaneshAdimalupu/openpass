"use client";

import {
	Check,
	Eye,
	Layers,
	Move,
	QrCode,
	RotateCcw,
	Sliders,
	Ticket,
	Trash2,
	Type,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX, MouseEvent, TouchEvent } from "react";

export interface TicketLayer {
	id: string;
	type: "text" | "qr" | "badge";
	name: string;
	x: number; // percentage (0 to 100)
	y: number; // percentage (0 to 100)
	token: string; // e.g. "event_title", "attendee_name", "ticket_code", "event_date", "event_time", "location", "custom"
	customText?: string;
	fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
	fontFamily?: "display" | "sans" | "mono";
	fontColor?: "ink" | "stamp" | "alert" | "muted";
	fontWeight?: "normal" | "medium" | "semibold" | "bold";
	qrSize?: "sm" | "md" | "lg";
	isLocked?: boolean;
}

export interface TicketDesignLayout {
	theme: "classic" | "dark" | "stamp" | "minimal";
	layers: TicketLayer[];
}

export const DEFAULT_TICKET_LAYERS: TicketLayer[] = [
	{
		id: "tier_badge",
		type: "badge",
		name: "Ticket Tier Badge",
		x: 6,
		y: 8,
		token: "tier_name",
		fontSize: "xs",
		fontFamily: "mono",
		fontColor: "stamp",
		fontWeight: "bold",
	},
	{
		id: "event_title",
		type: "text",
		name: "Event Title",
		x: 6,
		y: 20,
		token: "event_title",
		fontSize: "2xl",
		fontFamily: "display",
		fontColor: "ink",
		fontWeight: "bold",
	},
	{
		id: "organizer_name",
		type: "text",
		name: "Organizer Name",
		x: 6,
		y: 33,
		token: "organizer_name",
		fontSize: "xs",
		fontFamily: "mono",
		fontColor: "muted",
		fontWeight: "medium",
	},
	{
		id: "event_date_time",
		type: "text",
		name: "Date & Time",
		x: 6,
		y: 45,
		token: "event_date_time",
		fontSize: "xs",
		fontFamily: "mono",
		fontColor: "ink",
		fontWeight: "medium",
	},
	{
		id: "location",
		type: "text",
		name: "Location",
		x: 6,
		y: 55,
		token: "location",
		fontSize: "xs",
		fontFamily: "sans",
		fontColor: "muted",
		fontWeight: "normal",
	},
	{
		id: "attendee_name",
		type: "text",
		name: "Attendee Name",
		x: 6,
		y: 72,
		token: "attendee_name",
		fontSize: "base",
		fontFamily: "display",
		fontColor: "ink",
		fontWeight: "semibold",
	},
	{
		id: "attendee_email",
		type: "text",
		name: "Attendee Email",
		x: 6,
		y: 82,
		token: "attendee_email",
		fontSize: "xs",
		fontFamily: "mono",
		fontColor: "muted",
		fontWeight: "normal",
	},
	{
		id: "qr_code",
		type: "qr",
		name: "Verification QR Code",
		x: 68,
		y: 28,
		token: "qr_code",
		qrSize: "md",
	},
	{
		id: "ticket_code",
		type: "text",
		name: "Ticket Code",
		x: 68,
		y: 82,
		token: "ticket_code",
		fontSize: "xs",
		fontFamily: "mono",
		fontColor: "muted",
		fontWeight: "bold",
	},
];

interface TicketDesignerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (layout: TicketDesignLayout) => void;
	initialLayout?: TicketDesignLayout | null;
	tierName: string;
	eventTitle: string;
	organizerName: string;
	eventStart?: string | null;
	location?: string | null;
	codePrefix?: string;
}

export function TicketDesignerModal({
	isOpen,
	onClose,
	onSave,
	initialLayout,
	tierName,
	eventTitle,
	organizerName,
	eventStart,
	location,
	codePrefix = "OPT",
}: TicketDesignerModalProps): JSX.Element | null {
	const [layers, setLayers] = useState<TicketLayer[]>(() => {
		if (initialLayout?.layers && initialLayout.layers.length > 0) {
			return initialLayout.layers;
		}
		return DEFAULT_TICKET_LAYERS;
	});

	const [theme, setTheme] = useState<"classic" | "dark" | "stamp" | "minimal">(
		initialLayout?.theme || "classic",
	);
	const [activeLayerId, setActiveLayerId] = useState<string>("qr_code");
	const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
	const [zoom, setZoom] = useState<number>(100);
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

	// Canvas Dragging State
	const canvasRef = useRef<HTMLDivElement>(null);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});

	// Generate sample QR code data URL
	useEffect(() => {
		const sampleCode = `${codePrefix}-849204`;
		QRCode.toDataURL(sampleCode, {
			width: 256,
			margin: 2,
			color: {
				dark: theme === "dark" ? "#F7F6F2" : "#1B1A18",
				light: theme === "dark" ? "#1B1A18" : "#ffffff",
			},
		})
			.then((url) => setQrDataUrl(url))
			.catch((err) => console.error("QR Generation Error:", err));
	}, [codePrefix, theme]);

	// Sync initial layout when opened
	useEffect(() => {
		if (isOpen) {
			if (initialLayout?.layers && initialLayout.layers.length > 0) {
				setLayers(initialLayout.layers);
				setTheme(initialLayout.theme || "classic");
			} else {
				setLayers(DEFAULT_TICKET_LAYERS);
				setTheme("classic");
			}
		}
	}, [isOpen, initialLayout]);

	// Selected active layer
	const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

	// Drag Handlers
	const handlePointerDown = (
		e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>,
		layerId: string,
	) => {
		e.stopPropagation();
		setActiveLayerId(layerId);

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
		const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

		const targetLayer = layers.find((l) => l.id === layerId);
		if (!targetLayer) return;

		// Calculate click offset within element percentage
		const currentLayerPixelX = (targetLayer.x / 100) * rect.width;
		const currentLayerPixelY = (targetLayer.y / 100) * rect.height;

		setDragOffset({
			x: clientX - rect.left - currentLayerPixelX,
			y: clientY - rect.top - currentLayerPixelY,
		});
		setDraggingId(layerId);
	};

	const handlePointerMove = useCallback(
		(e: globalThis.MouseEvent | globalThis.TouchEvent) => {
			if (!draggingId || !canvasRef.current) return;

			const canvas = canvasRef.current;
			const rect = canvas.getBoundingClientRect();
			const clientX =
				"touches" in e
					? (e as globalThis.TouchEvent).touches[0].clientX
					: (e as globalThis.MouseEvent).clientX;
			const clientY =
				"touches" in e
					? (e as globalThis.TouchEvent).touches[0].clientY
					: (e as globalThis.MouseEvent).clientY;

			// Position relative to canvas
			const rawX = clientX - rect.left - dragOffset.x;
			const rawY = clientY - rect.top - dragOffset.y;

			// Clamp percentages between 2% and 90%
			const clampedX = Math.max(
				2,
				Math.min(90, Number(((rawX / rect.width) * 100).toFixed(1))),
			);
			const clampedY = Math.max(
				2,
				Math.min(90, Number(((rawY / rect.height) * 100).toFixed(1))),
			);

			setLayers((prev) =>
				prev.map((layer) =>
					layer.id === draggingId
						? { ...layer, x: clampedX, y: clampedY }
						: layer,
				),
			);
		},
		[draggingId, dragOffset],
	);

	const handlePointerUp = useCallback(() => {
		setDraggingId(null);
	}, []);

	useEffect(() => {
		if (draggingId) {
			window.addEventListener("mousemove", handlePointerMove);
			window.addEventListener("mouseup", handlePointerUp);
			window.addEventListener("touchmove", handlePointerMove);
			window.addEventListener("touchend", handlePointerUp);
		}
		return () => {
			window.removeEventListener("mousemove", handlePointerMove);
			window.removeEventListener("mouseup", handlePointerUp);
			window.removeEventListener("touchmove", handlePointerMove);
			window.removeEventListener("touchend", handlePointerUp);
		};
	}, [draggingId, handlePointerMove, handlePointerUp]);

	// Layer Modification Helpers
	const updateActiveLayer = (updates: Partial<TicketLayer>) => {
		if (!activeLayerId) return;
		setLayers((prev) =>
			prev.map((l) => (l.id === activeLayerId ? { ...l, ...updates } : l)),
		);
	};

	const handleAddTextLayer = () => {
		const newId = `text_${Date.now()}`;
		const newLayer: TicketLayer = {
			id: newId,
			type: "text",
			name: "New Text Layer",
			x: 30,
			y: 50,
			token: "custom",
			customText: "Custom Badge Text",
			fontSize: "sm",
			fontFamily: "sans",
			fontColor: "ink",
			fontWeight: "medium",
		};
		setLayers((prev) => [...prev, newLayer]);
		setActiveLayerId(newId);
	};

	const handleAddQrLayer = () => {
		if (layers.some((l) => l.type === "qr")) {
			alert("A QR layer already exists on this ticket pass.");
			return;
		}
		const newId = `qr_${Date.now()}`;
		const newLayer: TicketLayer = {
			id: newId,
			type: "qr",
			name: "QR Code",
			x: 70,
			y: 30,
			token: "qr_code",
			qrSize: "md",
		};
		setLayers((prev) => [...prev, newLayer]);
		setActiveLayerId(newId);
	};

	const handleDeleteLayer = (layerId: string) => {
		if (layers.length <= 1) {
			alert("Ticket must contain at least one layer.");
			return;
		}
		setLayers((prev) => prev.filter((l) => l.id !== layerId));
		if (activeLayerId === layerId) {
			const remaining = layers.filter((l) => l.id !== layerId);
			setActiveLayerId(remaining[0]?.id || "");
		}
	};

	const handleResetToDefault = () => {
		if (confirm("Reset all layers and positions to standard default layout?")) {
			setLayers(DEFAULT_TICKET_LAYERS);
			setTheme("classic");
			setActiveLayerId("qr_code");
		}
	};

	const handleSave = () => {
		onSave({
			theme,
			layers,
		});
		onClose();
	};

	// Token Resolver for live rendering
	const resolveTokenText = (layer: TicketLayer): string => {
		if (viewMode === "edit") {
			switch (layer.token) {
				case "event_title":
					return "{{event_title}}";
				case "attendee_name":
					return "{{name}}";
				case "attendee_email":
					return "{{email}}";
				case "ticket_code":
					return "{{ticket_code}}";
				case "tier_name":
					return `{{tier_name}}`;
				case "organizer_name":
					return "{{organizer}}";
				case "event_date_time":
					return "{{event_date}} • {{event_time}}";
				case "location":
					return "{{location}}";
				case "custom":
					return layer.customText || "Custom Label";
				default:
					return `{{${layer.token}}}`;
			}
		}

		// Sample Preview mode values
		switch (layer.token) {
			case "event_title":
				return eventTitle || "Sudo Reboot 2026";
			case "attendee_name":
				return "Alex Morgan";
			case "attendee_email":
				return "alex.morgan@example.com";
			case "ticket_code":
				return `${codePrefix}-849204`;
			case "tier_name":
				return tierName || "General Pass";
			case "organizer_name":
				return `Hosted by ${organizerName || "MakeMyEvent"}`;
			case "event_date_time":
				return eventStart
					? `${new Date(eventStart).toLocaleDateString("en-US", {
							weekday: "short",
							month: "short",
							day: "numeric",
						})} • 10:00 AM`
					: "Sat, Oct 24, 2026 • 10:00 AM";
			case "location":
				return location || "Main Stage & Online Stream";
			case "custom":
				return layer.customText || "VIP Admission";
			default:
				return layer.customText || "";
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
			<div className="bg-paper border border-perforation rounded-2xl max-w-6xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[94vh] flex flex-col overflow-hidden text-ink">
				{/* ── Studio Top Header ── */}
				<div className="flex items-center justify-between border-b border-perforation px-6 py-3.5 shrink-0 bg-paper">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-stamp/10 border border-stamp/20 text-stamp">
							<Ticket className="w-5 h-5" />
						</div>
						<div>
							<h3 className="font-display font-semibold text-lg leading-tight flex items-center gap-2">
								Visual Ticket Designer
								<span className="text-xs font-mono font-normal text-stamp bg-stamp/10 px-2 py-0.5 rounded border border-stamp/20">
									{tierName}
								</span>
							</h3>
							<p className="text-xs opacity-60 font-mono">
								Drag elements to reposition • Changes apply to digital & print
								passes
							</p>
						</div>
					</div>

					{/* View Mode Toggle: Edit Layout vs Sample Preview */}
					<div className="flex items-center gap-3">
						<div className="flex items-center p-1 bg-perforation/40 rounded-lg border border-perforation text-xs font-medium">
							<button
								type="button"
								onClick={() => setViewMode("edit")}
								className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
									viewMode === "edit"
										? "bg-paper text-ink font-semibold shadow-xs"
										: "opacity-60 hover:opacity-100"
								}`}
							>
								<Sliders className="w-3.5 h-3.5 text-stamp" />
								Edit Layout
							</button>
							<button
								type="button"
								onClick={() => setViewMode("preview")}
								className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
									viewMode === "preview"
										? "bg-paper text-ink font-semibold shadow-xs"
										: "opacity-60 hover:opacity-100"
								}`}
							>
								<Eye className="w-3.5 h-3.5 text-stamp" />
								Sample Preview
							</button>
						</div>

						<button
							type="button"
							onClick={onClose}
							className="p-1.5 hover:bg-perforation/20 rounded-md cursor-pointer transition-colors"
							aria-label="Close modal"
						>
							<X className="w-4 h-4 opacity-70" />
						</button>
					</div>
				</div>

				{/* ── Studio Body (Canvas + Inspector) ── */}
				<div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
					{/* ── Left / Center Canvas Workspace (lg:col-span-8) ── */}
					<div className="lg:col-span-8 bg-paper/40 border-r border-perforation p-4 sm:p-6 flex flex-col overflow-y-auto">
						{/* Canvas Controls Toolbar */}
						<div className="flex flex-wrap items-center justify-between gap-3 pb-4 shrink-0 text-xs">
							{/* Theme Presets */}
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-mono text-xs opacity-70">Theme:</span>
								<div className="flex flex-wrap items-center gap-1">
									{[
										{ id: "classic", label: "Classic Paper" },
										{ id: "dark", label: "Dark Ink" },
										{ id: "stamp", label: "Stamp Emerald" },
										{ id: "minimal", label: "Minimal" },
									].map((t) => (
										<button
											key={t.id}
											type="button"
											onClick={() => setTheme(t.id as typeof theme)}
											className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer border ${
												theme === t.id
													? "bg-stamp text-paper border-stamp font-medium"
													: "bg-paper border-perforation hover:bg-perforation/20"
											}`}
										>
											{t.label}
										</button>
									))}
								</div>
							</div>

							{/* Zoom Controls & Reset */}
							<div className="flex items-center gap-2">
								<div className="flex items-center border border-perforation rounded-lg overflow-hidden bg-paper">
									<button
										type="button"
										onClick={() => setZoom((z) => Math.max(50, z - 10))}
										className="p-1.5 hover:bg-perforation/20 cursor-pointer"
										title="Zoom Out"
									>
										<ZoomOut className="w-3.5 h-3.5" />
									</button>
									<span className="px-2 font-mono text-[11px] min-w-[45px] text-center">
										{zoom}%
									</span>
									<button
										type="button"
										onClick={() => setZoom((z) => Math.min(130, z + 10))}
										className="p-1.5 hover:bg-perforation/20 cursor-pointer"
										title="Zoom In"
									>
										<ZoomIn className="w-3.5 h-3.5" />
									</button>
								</div>

								<button
									type="button"
									onClick={handleResetToDefault}
									className="px-2.5 py-1 text-[11px] font-mono border border-perforation hover:bg-perforation/20 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
									title="Reset layout to default"
								>
									<RotateCcw className="w-3 h-3" />
									Reset
								</button>
							</div>
						</div>

						{/* Canvas Viewport */}
						<div className="flex-1 flex items-center justify-center p-2 sm:p-4 bg-perforation/20 rounded-2xl border border-perforation overflow-auto min-h-[360px]">
							<div
								style={{
									transform: `scale(${zoom / 100})`,
									transformOrigin: "center center",
									transition: draggingId ? "none" : "transform 0.15s ease",
								}}
							>
								{/* ── Ticket Pass Canvas Box (600x340 proportional) ── */}
								<div
									ref={canvasRef}
									className={`relative w-[600px] h-[340px] rounded-2xl shadow-xl select-none overflow-hidden transition-colors ${
										theme === "dark"
											? "bg-ink text-paper border border-perforation/30"
											: theme === "stamp"
												? "bg-stamp/10 text-ink border-2 border-stamp/40"
												: "bg-paper text-ink border border-perforation"
									}`}
								>
									{/* Background Watermark/Branding */}
									<div className="absolute right-6 top-6 opacity-5 pointer-events-none font-display font-black text-6xl uppercase tracking-tighter">
										OpenPass
									</div>

									{/* Render Layers on Canvas */}
									{layers.map((layer) => {
										const isSelected = activeLayerId === layer.id;
										const isDragging = draggingId === layer.id;

										// Font Size classes
										const fontSizeClass =
											layer.fontSize === "3xl"
												? "text-2xl"
												: layer.fontSize === "2xl"
													? "text-xl font-bold"
													: layer.fontSize === "xl"
														? "text-lg font-semibold"
														: layer.fontSize === "lg"
															? "text-base font-semibold"
															: layer.fontSize === "base"
																? "text-sm"
																: layer.fontSize === "xs"
																	? "text-[11px]"
																	: "text-xs";

										// Font Family
										const fontFamilyClass =
											layer.fontFamily === "display"
												? "font-display"
												: layer.fontFamily === "mono"
													? "font-mono"
													: "font-sans";

										// Font Color
										const fontColorClass =
											layer.fontColor === "stamp"
												? "text-stamp"
												: layer.fontColor === "alert"
													? "text-alert"
													: layer.fontColor === "muted"
														? "opacity-60"
														: "";

										return (
											<div
												key={layer.id}
												onPointerDown={(e) => handlePointerDown(e, layer.id)}
												style={{
													left: `${layer.x}%`,
													top: `${layer.y}%`,
													position: "absolute",
													zIndex: isSelected ? 30 : 10,
												}}
												className={`cursor-grab active:cursor-grabbing group transition-all ${
													viewMode === "edit"
														? isSelected
															? "ring-2 ring-stamp ring-offset-2 ring-offset-paper rounded-md p-1 bg-stamp/5"
															: "hover:ring-1 hover:ring-stamp/50 hover:bg-stamp/5 rounded-md p-1"
														: ""
												}`}
											>
												{/* Position Tooltip while dragging */}
												{isDragging && viewMode === "edit" && (
													<div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink text-paper text-[9px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none z-50">
														X: {layer.x}% • Y: {layer.y}%
													</div>
												)}

												{/* Layer Content */}
												{layer.type === "badge" ? (
													<span className="inline-flex items-center gap-1 font-mono font-bold uppercase tracking-widest text-stamp bg-stamp/10 px-2.5 py-0.5 rounded-full border border-stamp/30 text-[10px]">
														{resolveTokenText(layer)}
													</span>
												) : layer.type === "qr" ? (
													<div className="bg-white p-2 rounded-xl border border-perforation shadow-md flex flex-col items-center gap-1">
														{qrDataUrl ? (
															// biome-ignore lint/performance/noImgElement: Client-side generated QR data URL
															<img
																src={qrDataUrl}
																alt="Ticket QR"
																className={`object-contain pointer-events-none ${
																	layer.qrSize === "lg"
																		? "w-36 h-36"
																		: layer.qrSize === "sm"
																			? "w-24 h-24"
																			: "w-30 h-30"
																}`}
															/>
														) : (
															<div className="w-28 h-28 bg-perforation/20 flex items-center justify-center">
																<QrCode className="w-12 h-12 opacity-40" />
															</div>
														)}
														<span className="text-[9px] font-mono font-bold uppercase tracking-wider text-black/60">
															{viewMode === "edit"
																? "{{ticket_code}}"
																: `${codePrefix}-849204`}
														</span>
													</div>
												) : (
													<div
														className={`${fontSizeClass} ${fontFamilyClass} ${fontColorClass} whitespace-nowrap leading-tight`}
													>
														{resolveTokenText(layer)}
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</div>

					{/* ── Right Column: Layers & Property Inspector (lg:col-span-4) ── */}
					<div className="lg:col-span-4 flex flex-col bg-paper divide-y divide-perforation overflow-y-auto">
						{/* ── Layers Section ── */}
						<div className="p-4 space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
									<Layers className="w-3.5 h-3.5 text-stamp" />
									Layers
								</span>
								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={handleAddTextLayer}
										className="px-2 py-1 text-[11px] font-medium border border-perforation hover:bg-perforation/20 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
									>
										<Type className="w-3 h-3 text-stamp" />+ Text
									</button>
									<button
										type="button"
										onClick={handleAddQrLayer}
										className="px-2 py-1 text-[11px] font-medium border border-perforation hover:bg-perforation/20 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
									>
										<QrCode className="w-3 h-3 text-stamp" />+ QR
									</button>
								</div>
							</div>

							{/* Layers List */}
							<div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
								{layers.map((layer) => {
									const isSelected = activeLayerId === layer.id;
									return (
										<div
											key={layer.id}
											className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors border ${
												isSelected
													? "bg-stamp/10 border-stamp text-stamp font-medium"
													: "border-transparent hover:bg-perforation/20 opacity-80"
											}`}
										>
											<button
												type="button"
												onClick={() => setActiveLayerId(layer.id)}
												className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer"
											>
												{layer.type === "qr" ? (
													<QrCode className="w-3.5 h-3.5 shrink-0" />
												) : (
													<Type className="w-3.5 h-3.5 shrink-0" />
												)}
												<span className="truncate">{layer.name}</span>
											</button>

											<div className="flex items-center gap-1 shrink-0">
												<span className="text-[10px] font-mono opacity-60">
													{layer.x}%, {layer.y}%
												</span>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteLayer(layer.id);
													}}
													className="p-1 hover:text-alert opacity-50 hover:opacity-100 cursor-pointer"
													title="Delete layer"
												>
													<Trash2 className="w-3 h-3" />
												</button>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* ── Layer Inspector Section ── */}
						{activeLayer && (
							<div className="p-4 space-y-4 flex-1">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
										<Sliders className="w-3.5 h-3.5 text-stamp" />
										Inspector: {activeLayer.name}
									</span>
								</div>

								{/* Position (X, Y) */}
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div>
										<label
											htmlFor="inspector-x"
											className="block text-[10px] font-mono uppercase opacity-70 mb-1"
										>
											Position X (%)
										</label>
										<input
											id="inspector-x"
											type="number"
											min="0"
											max="100"
											value={activeLayer.x}
											onChange={(e) =>
												updateActiveLayer({ x: Number(e.target.value) })
											}
											className="w-full px-2.5 py-1.5 border border-perforation rounded-md bg-paper text-ink font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stamp"
										/>
									</div>
									<div>
										<label
											htmlFor="inspector-y"
											className="block text-[10px] font-mono uppercase opacity-70 mb-1"
										>
											Position Y (%)
										</label>
										<input
											id="inspector-y"
											type="number"
											min="0"
											max="100"
											value={activeLayer.y}
											onChange={(e) =>
												updateActiveLayer({ y: Number(e.target.value) })
											}
											className="w-full px-2.5 py-1.5 border border-perforation rounded-md bg-paper text-ink font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stamp"
										/>
									</div>
								</div>

								{/* Text / Token Config (for text & badge layers) */}
								{activeLayer.type !== "qr" && (
									<>
										<div>
											<label
												htmlFor="inspector-token"
												className="block text-[10px] font-mono uppercase opacity-70 mb-1"
											>
												Data Token
											</label>
											<select
												id="inspector-token"
												value={activeLayer.token}
												onChange={(e) =>
													updateActiveLayer({ token: e.target.value })
												}
												className="w-full px-2.5 py-1.5 border border-perforation rounded-md bg-paper text-ink text-xs focus:outline-none focus:ring-1 focus:ring-stamp"
											>
												<option value="event_title">
													{"{{event_title}} - Event Title"}
												</option>
												<option value="attendee_name">
													{"{{name}} - Attendee Name"}
												</option>
												<option value="attendee_email">
													{"{{email}} - Attendee Email"}
												</option>
												<option value="ticket_code">
													{"{{ticket_code}} - Pass Code"}
												</option>
												<option value="tier_name">
													{"{{tier_name}} - Pass Tier"}
												</option>
												<option value="organizer_name">
													{"{{organizer}} - Organizer"}
												</option>
												<option value="event_date_time">
													{"{{event_date_time}} - Date & Time"}
												</option>
												<option value="location">
													{"{{location}} - Venue / Online"}
												</option>
												<option value="custom">Custom Static Text</option>
											</select>
										</div>

										{activeLayer.token === "custom" && (
											<div>
												<label
													htmlFor="inspector-custom-text"
													className="block text-[10px] font-mono uppercase opacity-70 mb-1"
												>
													Custom Text Content
												</label>
												<input
													id="inspector-custom-text"
													type="text"
													value={activeLayer.customText || ""}
													onChange={(e) =>
														updateActiveLayer({ customText: e.target.value })
													}
													placeholder="Enter custom text..."
													className="w-full px-2.5 py-1.5 border border-perforation rounded-md bg-paper text-ink text-xs focus:outline-none focus:ring-1 focus:ring-stamp"
												/>
											</div>
										)}

										{/* Typography Controls */}
										<div className="grid grid-cols-2 gap-2 text-xs">
											<div>
												<label
													htmlFor="inspector-font-size"
													className="block text-[10px] font-mono uppercase opacity-70 mb-1"
												>
													Font Size
												</label>
												<select
													id="inspector-font-size"
													value={activeLayer.fontSize || "sm"}
													onChange={(e) =>
														updateActiveLayer({
															fontSize: e.target
																.value as TicketLayer["fontSize"],
														})
													}
													className="w-full px-2.5 py-1.5 border border-perforation rounded-md bg-paper text-ink text-xs"
												>
													<option value="xs">XS (11px)</option>
													<option value="sm">SM (12px)</option>
													<option value="base">Base (14px)</option>
													<option value="lg">LG (16px)</option>
													<option value="xl">XL (18px)</option>
													<option value="2xl">2XL (20px)</option>
													<option value="3xl">3XL (24px)</option>
												</select>
											</div>

											<div>
												<label
													htmlFor="inspector-font-family"
													className="block text-[10px] font-mono uppercase opacity-70 mb-1"
												>
													Font Family
												</label>
												<select
													id="inspector-font-family"
													value={activeLayer.fontFamily || "sans"}
													onChange={(e) =>
														updateActiveLayer({
															fontFamily: e.target
																.value as TicketLayer["fontFamily"],
														})
													}
													className="w-full px-2.5 py-1.5 border border-perforation rounded-md bg-paper text-ink text-xs"
												>
													<option value="display">Archivo (Display)</option>
													<option value="sans">IBM Plex Sans</option>
													<option value="mono">IBM Plex Mono</option>
												</select>
											</div>
										</div>

										{/* Color Token */}
										<div>
											<label
												htmlFor="inspector-color"
												className="block text-[10px] font-mono uppercase opacity-70 mb-1"
											>
												Color Style
											</label>
											<div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
												{[
													{ id: "ink", label: "Ink" },
													{ id: "stamp", label: "Stamp" },
													{ id: "muted", label: "Muted" },
													{ id: "alert", label: "Alert" },
												].map((c) => (
													<button
														key={c.id}
														type="button"
														onClick={() =>
															updateActiveLayer({
																fontColor: c.id as TicketLayer["fontColor"],
															})
														}
														className={`p-1.5 rounded border text-center transition-colors cursor-pointer ${
															(activeLayer.fontColor || "ink") === c.id
																? "border-stamp bg-stamp/10 font-bold text-stamp"
																: "border-perforation opacity-70 hover:opacity-100"
														}`}
													>
														{c.label}
													</button>
												))}
											</div>
										</div>
									</>
								)}

								{/* QR Code Specific Controls */}
								{activeLayer.type === "qr" && (
									<div>
										<label
											htmlFor="inspector-qr-size"
											className="block text-[10px] font-mono uppercase opacity-70 mb-1"
										>
											QR Code Dimension
										</label>
										<div className="grid grid-cols-3 gap-2 text-xs">
											{[
												{ id: "sm", label: "Small" },
												{ id: "md", label: "Medium" },
												{ id: "lg", label: "Large" },
											].map((sz) => (
												<button
													key={sz.id}
													type="button"
													onClick={() =>
														updateActiveLayer({
															qrSize: sz.id as TicketLayer["qrSize"],
														})
													}
													className={`p-2 rounded-md border text-center transition-colors cursor-pointer ${
														(activeLayer.qrSize || "md") === sz.id
															? "border-stamp bg-stamp/10 font-semibold text-stamp"
															: "border-perforation opacity-70 hover:opacity-100"
													}`}
												>
													{sz.label}
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* ── Pinned Bottom Action Bar ── */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-perforation p-4 sm:px-6 sm:py-4 bg-paper/95 backdrop-blur-xs shrink-0">
					<div className="flex items-center gap-2 text-xs opacity-70 font-mono text-center sm:text-left">
						<Move className="w-3.5 h-3.5 text-stamp shrink-0" />
						<span>Drag any element on canvas to customize position</span>
					</div>

					<div className="flex items-center justify-end gap-3 w-full sm:w-auto">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 sm:flex-initial px-4 py-2 border border-perforation rounded-lg text-xs font-medium hover:bg-perforation/20 transition-colors cursor-pointer text-center"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSave}
							className="flex-1 sm:flex-initial px-5 py-2 bg-stamp text-paper rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center justify-center gap-1.5"
						>
							<Check className="w-3.5 h-3.5" />
							Save Ticket Design
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
