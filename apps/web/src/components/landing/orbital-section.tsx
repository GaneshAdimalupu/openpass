import {
	Building2,
	CalendarDays,
	Camera,
	HandshakeIcon,
	Mail,
	Megaphone,
	Ticket,
	Users,
} from "lucide-react";
import type { ComponentType, JSX, SVGProps } from "react";

// ── Diagram coordinate system: 560 × 520 ──────────────────────────────────
const W = 560;
const H = 520;
const CX = 280; // center x
const CY = 260; // center y
const ORBIT = 180; // orbit radius in SVG units
const CENTER_R = 96; // center circle radius in SVG units

/** angle 0° = top, clockwise */
function polar(deg: number): { x: number; y: number } {
	const rad = (deg * Math.PI) / 180;
	return {
		x: CX + Math.sin(rad) * ORBIT,
		y: CY - Math.cos(rad) * ORBIT,
	};
}

interface SatNode {
	id: string;
	label: string;
	Icon: ComponentType<SVGProps<SVGSVGElement>>;
	angle: number;
}

const NODES: SatNode[] = [
	{ id: "partners", label: "Partners", Icon: Building2, angle: 0 },
	{ id: "tickets", label: "Tickets", Icon: Ticket, angle: 45 },
	{ id: "checkin", label: "Check-In", Icon: Camera, angle: 90 },
	{ id: "schedule", label: "Schedule", Icon: CalendarDays, angle: 135 },
	{ id: "guests", label: "Guests", Icon: Users, angle: 180 },
	{ id: "cfp", label: "CFP", Icon: Megaphone, angle: 225 },
	{ id: "email", label: "Email Passes", Icon: Mail, angle: 270 },
	{ id: "volunteers", label: "Volunteers", Icon: HandshakeIcon, angle: 315 },
];

export function OrbitalDiagram(): JSX.Element {
	return (
		<div className="w-full max-w-[540px] mx-auto">
			{/* Mobile: pill grid (diagram too dense on small screens) */}
			<div className="md:hidden grid grid-cols-2 gap-2.5">
				{NODES.map((node) => {
					const NodeIcon = node.Icon;
					return (
						<div
							key={node.id}
							className="flex items-center gap-2 px-3 py-2.5 bg-paper border border-perforation rounded-xl shadow-sm"
						>
							<NodeIcon
								width={14}
								height={14}
								className="text-stamp shrink-0"
								aria-hidden="true"
							/>
							<span className="text-sm font-medium text-ink">{node.label}</span>
						</div>
					);
				})}
			</div>

			{/* Desktop: static orbital diagram */}
			<div
				className="hidden md:block relative w-full"
				style={{ aspectRatio: `${W} / ${H}` }}
				role="img"
				aria-label="Diagram showing Your Event at centre surrounded by features: Tickets, Check-In, Email Passes, Schedule, Guests, CFP, Volunteers, Partners"
			>
				{/* SVG layer — dashed connector lines only */}
				<svg
					viewBox={`0 0 ${W} ${H}`}
					className="absolute inset-0 w-full h-full pointer-events-none"
					aria-hidden="true"
				>
					<defs>
						<radialGradient id="centre-glow" cx="50%" cy="50%" r="50%">
							<stop
								offset="0%"
								stopColor="var(--color-paper)"
								stopOpacity="1"
							/>
							<stop
								offset="100%"
								stopColor="var(--color-perforation)"
								stopOpacity="0.35"
							/>
						</radialGradient>
					</defs>

					{/* Dashed connector lines */}
					{NODES.map((node) => {
						const { x, y } = polar(node.angle);
						return (
							<line
								key={node.id}
								x1={CX}
								y1={CY}
								x2={x}
								y2={y}
								stroke="var(--color-perforation)"
								strokeWidth="1.5"
								strokeDasharray="5 4"
							/>
						);
					})}
				</svg>

				{/* Centre circle */}
				<div
					className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper border border-perforation shadow-md flex items-center justify-center z-10"
					style={{
						left: `${(CX / W) * 100}%`,
						top: `${(CY / H) * 100}%`,
						width: `${((CENTER_R * 2) / W) * 100}%`,
						aspectRatio: "1",
					}}
				>
					<span className="font-display font-semibold text-ink text-sm text-center leading-snug select-none">
						Your
						<br />
						Event
					</span>
				</div>

				{/* Satellite pill nodes */}
				{NODES.map((node) => {
					const { x, y } = polar(node.angle);
					const NodeIcon = node.Icon;
					return (
						<div
							key={node.id}
							className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 bg-paper border border-perforation rounded-2xl shadow-sm whitespace-nowrap z-10"
							style={{
								left: `${(x / W) * 100}%`,
								top: `${(y / H) * 100}%`,
							}}
						>
							<NodeIcon
								width={13}
								height={13}
								className="text-stamp shrink-0"
								aria-hidden="true"
							/>
							<span className="text-xs font-medium text-ink">{node.label}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function OrbitalSection(): JSX.Element {
	return (
		<section className="border-b border-perforation py-16 md:py-24 overflow-hidden">
			<div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
				<OrbitalDiagram />
			</div>
		</section>
	);
}
