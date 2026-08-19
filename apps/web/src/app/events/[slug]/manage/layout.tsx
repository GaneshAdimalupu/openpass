"use client";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { trpc } from "@/lib/trpc";
import {
	Calendar,
	ExternalLink,
	FileText,
	Globe,
	Mic,
	Settings,
	Shield,
	Sparkles,
	Ticket,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { JSX } from "react";

interface NavGroup {
	title: string;
	items: Array<{
		label: string;
		href: string;
		icon: React.ElementType;
	}>;
}

export default function ManageEventLayout({
	children,
}: {
	children: React.ReactNode;
}): JSX.Element {
	const params = useParams();
	const pathname = usePathname();
	const slug = params.slug as string;
	const { status } = useSession();

	const { data: event, isLoading } = trpc.events.manageGetBySlug.useQuery(
		{ slug },
		{ enabled: !!slug },
	);

	// Structured in logical lifecycle order following docs/
	const navGroups: NavGroup[] = [
		{
			title: "SETUP",
			items: [
				{
					label: "Overview",
					href: `/events/${slug}/manage`,
					icon: Settings,
				},
				{
					label: "Tickets & Passes",
					href: `/events/${slug}/manage/tickets`,
					icon: Ticket,
				},
				{
					label: "RSVP & Custom Form",
					href: `/events/${slug}/manage/rsvp`,
					icon: FileText,
				},
			],
		},
		{
			title: "PROGRAM & CALLS",
			items: [
				{
					label: "Schedule",
					href: `/events/${slug}/manage/schedule`,
					icon: Calendar,
				},
				{
					label: "CFP (Proposals)",
					href: `/events/${slug}/manage/cfp`,
					icon: Mic,
				},
			],
		},
		{
			title: "PEOPLE & OPERATIONS",
			items: [
				{
					label: "Guests & Check-in",
					href: `/events/${slug}/manage/guests`,
					icon: Users,
				},
				{
					label: "Team & Volunteers",
					href: `/events/${slug}/manage/volunteers`,
					icon: Shield,
				},
				{
					label: "Partners & Sponsors",
					href: `/events/${slug}/manage/partners`,
					icon: Sparkles,
				},
			],
		},
	];

	if (status === "unauthenticated") {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<DashboardHeader />
				<main className="flex-1 flex items-center justify-center p-6 text-center">
					<p className="text-sm opacity-70">
						Please sign in to access your dashboard.
					</p>
				</main>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<DashboardHeader />
				<main className="flex-1 flex items-center justify-center p-6">
					<p className="animate-pulse text-sm opacity-60">Loading event...</p>
				</main>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<DashboardHeader />
				<main className="flex-1 flex items-center justify-center p-6 text-center">
					<p className="text-sm opacity-70">Event not found.</p>
				</main>
			</div>
		);
	}

	// Flatten all nav items for mobile horizontal pills
	const allNavItems = navGroups.flatMap((g) => g.items);

	return (
		<div className="h-screen bg-paper flex flex-col overflow-hidden text-ink">
			<DashboardHeader title={event.title} />

			{/* Mobile Horizontal Sub-Navigation Bar */}
			<div className="md:hidden bg-paper border-b border-perforation px-3 py-2 shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none">
				{allNavItems.map((item) => {
					const Icon = item.icon;
					const isOverview = item.href === `/events/${slug}/manage`;
					const isActive = isOverview
						? pathname === item.href
						: pathname.startsWith(item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
								isActive
									? "bg-stamp text-paper shadow-xs font-semibold"
									: "bg-perforation/20 text-ink/75 hover:bg-perforation/40 hover:text-ink"
							}`}
						>
							<Icon
								className={`w-3.5 h-3.5 shrink-0 ${
									isActive ? "text-paper" : "text-stamp"
								}`}
							/>
							<span>{item.label}</span>
						</Link>
					);
				})}
			</div>

			<div className="flex-1 flex w-full overflow-hidden relative">
				{/* Desktop Sidebar (hidden on mobile) */}
				<aside className="hidden md:flex md:w-64 border-r border-perforation bg-paper/60 flex-col justify-between shrink-0">
					{/* Top Event Identity Header */}
					<div>
						<div className="p-4 border-b border-perforation space-y-2">
							<Link
								href="/dashboard"
								className="text-xs text-ink/60 hover:text-ink transition-colors inline-block"
							>
								← Back to Dashboard
							</Link>

							<h2 className="font-display font-semibold text-base leading-tight line-clamp-2">
								{event.title}
							</h2>

							<div className="flex items-center justify-between pt-1">
								<span
									className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
										event.status === "published"
											? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
											: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
									}`}
								>
									<span
										className={`w-1.5 h-1.5 rounded-full ${
											event.status === "published"
												? "bg-green-500"
												: "bg-amber-500"
										}`}
									/>
									{event.status === "published" ? "Live" : "Draft"}
								</span>

								<span className="text-[11px] font-mono opacity-60 capitalize">
									{event.format}
								</span>
							</div>
						</div>

						{/* Navigation Groups */}
						<nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)]">
							{navGroups.map((group) => (
								<div key={group.title} className="space-y-1">
									<div className="px-3 text-[10px] font-mono font-semibold uppercase tracking-widest opacity-50 mb-1">
										{group.title}
									</div>

									{group.items.map((item) => {
										const Icon = item.icon;
										const isOverview = item.href === `/events/${slug}/manage`;
										const isActive = isOverview
											? pathname === item.href
											: pathname.startsWith(item.href);

										return (
											<Link
												key={item.href}
												href={item.href}
												className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
													isActive
														? "bg-stamp text-paper shadow-xs"
														: "text-ink/75 hover:bg-perforation/20 hover:text-ink"
												}`}
											>
												<Icon
													className={`w-4 h-4 shrink-0 ${
														isActive ? "text-paper" : "text-stamp"
													}`}
												/>
												<span className="truncate">{item.label}</span>
											</Link>
										);
									})}
								</div>
							))}
						</nav>
					</div>

					{/* Bottom Footer Action: View Live Public Event */}
					<div className="p-3 border-t border-perforation bg-paper/40">
						<Link
							href={`/events/${slug}`}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full px-3 py-2 border border-perforation hover:border-stamp/40 rounded-md text-xs font-medium flex items-center justify-between gap-2 hover:bg-perforation/15 transition-all text-ink/80 hover:text-ink"
						>
							<span className="flex items-center gap-2">
								<Globe className="w-3.5 h-3.5 text-stamp" />
								<span>View Live Event</span>
							</span>
							<ExternalLink className="w-3.5 h-3.5 opacity-60" />
						</Link>
					</div>
				</aside>

				{/* Main Content Area */}
				<main className="flex-1 bg-paper relative overflow-y-auto w-full">
					{children}
				</main>
			</div>
		</div>
	);
}
