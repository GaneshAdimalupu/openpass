"use client";

import { trpc } from "@/lib/trpc";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { JSX } from "react";

/* ──────────────────────────────────────────────────────────────────────
 * 2-tier Organizer Taxonomy (6 balanced groups for 3x2 / 2x3 grid)
 * Main group ↔ OrganizerType enum in Prisma
 * Sub-category ↔ Organizer.category string
 * ────────────────────────────────────────────────────────────────────── */

type OrgType =
	| "personal"
	| "education"
	| "community"
	| "professional"
	| "venue"
	| "public_sector";

interface SubCategory {
	value: string;
	label: string;
	hint: string;
}

interface OrgGroup {
	id: OrgType;
	title: string;
	description: string;
	icon: JSX.Element;
	subCategories: SubCategory[];
}

const ORG_GROUPS: OrgGroup[] = [
	{
		id: "personal",
		title: "Personal & Creative",
		description: "Solo creators, independent hosts, artists, and educators.",
		icon: (
			<svg
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		),
		subCategories: [
			{
				value: "individual_host",
				label: "Individual Host",
				hint: "Private dinners, personal workshops, solo meetups",
			},
			{
				value: "independent_creator",
				label: "Independent Creator",
				hint: "Educators, artists, streamers, podcast hosts",
			},
		],
	},
	{
		id: "education",
		title: "Education & Campus",
		description:
			"Student unions, college clubs, fest committees, and academic departments.",
		icon: (
			<svg
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
				<path d="M22 10v6" />
				<path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
			</svg>
		),
		subCategories: [
			{
				value: "student_club",
				label: "Student Club",
				hint: "Campus societies, tech clubs, coding chapters",
			},
			{
				value: "academic_institution",
				label: "Academic Institution",
				hint: "University departments, schools, research labs",
			},
		],
	},
	{
		id: "community",
		title: "Local Community",
		description:
			"Developer groups, hobby clubs, open-source chapters, and local meetups.",
		icon: (
			<svg
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
				<circle cx="9" cy="7" r="4" />
				<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
				<path d="M16 3.13a4 4 0 0 1 0 7.75" />
			</svg>
		),
		subCategories: [
			{
				value: "tech_community",
				label: "Tech Community",
				hint: "Developer groups, FOSS chapters, user groups",
			},
			{
				value: "hobby_club",
				label: "Hobby Club",
				hint: "Book clubs, cycling groups, board game meetups",
			},
			{
				value: "civic_association",
				label: "Civic Association",
				hint: "Neighborhood societies, volunteer groups, civic bodies",
			},
		],
	},
	{
		id: "professional",
		title: "Agencies & Producers",
		description:
			"Event management firms, conference producers, and PR agencies.",
		icon: (
			<svg
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
				<path d="M9 22v-4h6v4" />
				<path d="M8 6h.01" />
				<path d="M16 6h.01" />
				<path d="M12 6h.01" />
				<path d="M12 10h.01" />
				<path d="M12 14h.01" />
				<path d="M16 10h.01" />
				<path d="M16 14h.01" />
				<path d="M8 10h.01" />
				<path d="M8 14h.01" />
			</svg>
		),
		subCategories: [
			{
				value: "boutique_agency",
				label: "Boutique Agency",
				hint: "Event management firms, PR and media agencies",
			},
			{
				value: "enterprise_organiser",
				label: "Enterprise Organiser",
				hint: "Professional conference organisers, summit producers",
			},
		],
	},
	{
		id: "venue",
		title: "Venues & Spaces",
		description:
			"Co-working spaces, cafes, auditoriums, theaters, and creative hubs.",
		icon: (
			<svg
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M3 21h18" />
				<path d="M5 21V7l8-4v18" />
				<path d="M19 21V11l-6-4" />
				<path d="M9 9v.01" />
				<path d="M9 12v.01" />
				<path d="M9 15v.01" />
				<path d="M9 18v.01" />
			</svg>
		),
		subCategories: [
			{
				value: "coworking_space",
				label: "Co-working Space",
				hint: "Tech hubs, shared workspaces, incubator halls",
			},
			{
				value: "creative_studio",
				label: "Studio & Creative Hub",
				hint: "Art studios, maker spaces, rehearsal rooms",
			},
			{
				value: "hospitality_venue",
				label: "Hospitality Venue",
				hint: "Cafes, lounges, rooftop bars, boutique halls",
			},
		],
	},
	{
		id: "public_sector",
		title: "Corporate & Non-Profit",
		description:
			"Corporate brands, DevRel teams, NGOs, foundations, and public bodies.",
		icon: (
			<svg
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M12 2v20" />
				<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
			</svg>
		),
		subCategories: [
			{
				value: "corporate_brand",
				label: "Corporate Brand",
				hint: "Tech companies, DevRel teams, product launches",
			},
			{
				value: "non_profit",
				label: "Non-Profit / NGO",
				hint: "Charities, trusts, foundations, volunteer orgs",
			},
			{
				value: "government_body",
				label: "Government Body",
				hint: "Civic councils, public departments, municipal bodies",
			},
		],
	},
];

export function OnboardingFlow(): JSX.Element {
	const { data: session, status } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();
	const isCreatingNew = searchParams.get("mode") === "new";

	const { data: organizers, isLoading: isCheckingOrg } =
		trpc.organizers.myOrganizers.useQuery(undefined, {
			enabled: !!session?.user?.id,
		});

	useEffect(() => {
		if (!isCreatingNew && organizers && organizers.length > 0) {
			router.replace("/dashboard");
		}
	}, [organizers, isCreatingNew, router]);

	const [step, setStep] = useState<1 | 2>(1);
	const [selectedGroupId, setSelectedGroupId] = useState<OrgType>("community");
	const [selectedCategory, setSelectedCategory] =
		useState<string>("tech_community");
	const [orgName, setOrgName] = useState<string>("");
	const [orgSlug, setOrgSlug] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	const createOrganizer = trpc.organizers.create.useMutation();

	const activeGroup =
		ORG_GROUPS.find((g) => g.id === selectedGroupId) || ORG_GROUPS[2];

	const handleGroupSelect = (groupId: OrgType) => {
		setSelectedGroupId(groupId);
		const group = ORG_GROUPS.find((g) => g.id === groupId);
		if (group?.subCategories[0]) {
			setSelectedCategory(group.subCategories[0].value);
		}
	};

	const handleNameChange = (val: string) => {
		setOrgName(val);
		const generatedSlug = val
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		setOrgSlug(generatedSlug);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!session?.user?.id) {
			setError("Please sign in to complete organizer setup.");
			return;
		}

		if (!orgName.trim()) {
			setError("Organizer name is required.");
			return;
		}

		try {
			await createOrganizer.mutateAsync({
				name: orgName.trim(),
				slug:
					orgSlug.trim() ||
					orgName
						.trim()
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-"),
				type: selectedGroupId,
				category: selectedCategory as
					| "individual_host"
					| "independent_creator"
					| "student_club"
					| "academic_institution"
					| "tech_community"
					| "hobby_club"
					| "civic_association"
					| "boutique_agency"
					| "enterprise_organiser"
					| "coworking_space"
					| "creative_studio"
					| "hospitality_venue"
					| "corporate_brand"
					| "non_profit"
					| "government_body",
				ownerId: session.user.id,
			});

			router.push("/dashboard");
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Failed to create organizer";
			setError(msg);
		}
	};

	if (
		status === "loading" ||
		(status === "authenticated" && isCheckingOrg && !isCreatingNew)
	) {
		return (
			<div className="w-full max-w-md mx-auto text-center py-16">
				<p className="text-body opacity-60">Loading organizer details...</p>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return (
			<div className="w-full max-w-md mx-auto text-center py-16">
				<h1 className="font-display font-semibold text-h2 mb-4">
					Sign in required
				</h1>
				<p className="text-body opacity-80 mb-8">
					Please sign in or create an account before setting up your organizer
					profile.
				</p>
				<a
					href="/login"
					className="bg-stamp text-paper label px-6 py-3 rounded-md hover:opacity-90 inline-block"
				>
					Go to Sign In
				</a>
			</div>
		);
	}

	return (
		<div className="w-full max-w-4xl mx-auto">
			{step === 1 ? (
				<div>
					<div className="text-center mb-10">
						<span className="label text-stamp font-mono text-xs mb-2 block">
							Step 1 of 2
						</span>
						<h1 className="font-display font-semibold text-h1 mb-3">
							What best describes you?
						</h1>
						<p className="text-body opacity-80 max-w-lg mx-auto">
							Select your organizer type so we can customize your dashboard,
							features, and event templates.
						</p>
					</div>

					{/* Symmetrical 6-card grid (3x2 on desktop, 2x3 on tablet, 1 col on mobile) */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
						{ORG_GROUPS.map((group) => {
							const isSelected = selectedGroupId === group.id;
							return (
								<button
									key={group.id}
									type="button"
									onClick={() => handleGroupSelect(group.id)}
									className={`flex flex-col text-left p-5 rounded-lg border transition-all duration-200 ${
										isSelected
											? "border-stamp bg-paper ring-2 ring-stamp shadow-sm"
											: "border-perforation bg-paper/50 hover:bg-paper hover:border-ink/20"
									}`}
								>
									<div
										className={`p-2.5 rounded-md w-fit mb-3 ${
											isSelected
												? "bg-stamp text-paper"
												: "bg-perforation/40 text-ink"
										}`}
									>
										{group.icon}
									</div>
									<h2 className="font-display font-semibold text-base text-ink mb-1">
										{group.title}
									</h2>
									<p className="text-xs opacity-70 text-ink flex-1 leading-relaxed">
										{group.description}
									</p>
								</button>
							);
						})}
					</div>

					{/* Sub-category pills */}
					<div className="border border-perforation rounded-lg p-5 bg-paper/50 mb-8">
						<p className="label text-xs mb-3 opacity-70">
							Select your specific organization type:
						</p>
						<div className="flex flex-wrap gap-2">
							{activeGroup.subCategories.map((sub) => {
								const isActive = selectedCategory === sub.value;
								return (
									<button
										key={sub.value}
										type="button"
										onClick={() => setSelectedCategory(sub.value)}
										className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
											isActive
												? "bg-stamp text-paper border-stamp font-medium"
												: "bg-paper border-perforation text-ink hover:border-ink/30"
										}`}
									>
										{sub.label}
									</button>
								);
							})}
						</div>
						{activeGroup.subCategories.find(
							(s) => s.value === selectedCategory,
						) && (
							<p className="text-xs opacity-50 mt-3 font-mono">
								→{" "}
								{
									activeGroup.subCategories.find(
										(s) => s.value === selectedCategory,
									)?.hint
								}
							</p>
						)}
					</div>

					<div className="border-t border-perforation flex justify-end pt-6">
						<button
							type="button"
							onClick={() => setStep(2)}
							className="bg-stamp text-paper label px-8 py-3 rounded-md hover:opacity-90 transition-opacity text-sm"
						>
							Next: Organization Details →
						</button>
					</div>
				</div>
			) : (
				<div>
					<div className="text-center mb-10">
						<span className="label text-stamp font-mono text-xs mb-2 block">
							Step 2 of 2
						</span>
						<h1 className="font-display font-semibold text-h1 mb-3">
							{selectedGroupId === "personal"
								? "Create your Host Profile"
								: selectedGroupId === "venue"
									? "Set up your Venue Profile"
									: selectedGroupId === "education"
										? "Set up your Campus Profile"
										: "Create your Organizer Profile"}
						</h1>
						<p className="text-body opacity-80 max-w-lg mx-auto">
							{selectedGroupId === "personal"
								? "This profile will be the public home for events you host as an individual creator or host."
								: selectedGroupId === "venue"
									? "This profile will be the public home for all events hosted at your space."
									: "This profile will be the public home for all the events you host on openevents."}
						</p>
					</div>

					{error && (
						<div className="p-4 mb-6 text-sm text-alert bg-alert/10 border border-alert/20 rounded-md text-center">
							{error}
						</div>
					)}

					<form
						onSubmit={handleSubmit}
						className="space-y-6 max-w-xl mx-auto mb-8"
					>
						{/* Selected type badge */}
						<div className="p-4 border border-perforation rounded-md bg-perforation/10 flex items-center gap-3">
							<div className="p-2 rounded bg-stamp/10 text-stamp">
								{activeGroup.icon}
							</div>
							<div>
								<p className="font-medium text-sm text-ink">
									{activeGroup.title}
								</p>
								<p className="text-xs opacity-60 font-mono">
									{
										activeGroup.subCategories.find(
											(s) => s.value === selectedCategory,
										)?.label
									}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setStep(1)}
								className="ml-auto label text-xs text-stamp hover:underline"
							>
								Change
							</button>
						</div>

						<div>
							<label htmlFor="orgName" className="block label mb-2">
								{selectedGroupId === "personal"
									? "Your Display Name or Host Name"
									: selectedGroupId === "venue"
										? "Venue or Space Name"
										: selectedGroupId === "education"
											? "Club, College or Chapter Name"
											: "Organization or Community Name"}
							</label>
							<input
								id="orgName"
								type="text"
								required
								value={orgName}
								onChange={(e) => handleNameChange(e.target.value)}
								placeholder={
									selectedGroupId === "personal"
										? session?.user?.name || "e.g. Alex Rivera"
										: selectedGroupId === "venue"
											? "e.g. Koramangala Hub"
											: selectedGroupId === "education"
												? "e.g. FOSS Club STIST"
												: "e.g. Bangalore Tech Meetup"
								}
								className="w-full bg-paper border border-perforation rounded-md px-4 py-3 text-body focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp"
							/>
						</div>

						<div>
							<label htmlFor="orgSlug" className="block label mb-2">
								Public Handle / URL Slug
							</label>
							<div className="flex items-center rounded-md border border-perforation bg-paper overflow-hidden focus-within:border-stamp focus-within:ring-1 focus-within:ring-stamp">
								<span className="px-3 py-3 text-sm text-ink opacity-50 bg-perforation/20 font-mono border-r border-perforation">
									{typeof window !== "undefined"
										? `${window.location.host}/`
										: "openpass.me/"}
								</span>
								<input
									id="orgSlug"
									type="text"
									required
									value={orgSlug}
									onChange={(e) => setOrgSlug(e.target.value)}
									placeholder={
										selectedGroupId === "personal"
											? "alex-rivera"
											: selectedGroupId === "venue"
												? "koramangala-hub"
												: selectedGroupId === "education"
													? "foss-club-stist"
													: "bangalore-tech"
									}
									className="flex-1 bg-transparent px-3 py-3 text-sm text-body font-mono focus:outline-none"
								/>
							</div>
							<p className="text-xs opacity-60 mt-1">
								Only lowercase letters, numbers, and dashes.
							</p>
						</div>

						<div className="border-t border-perforation flex justify-between items-center pt-6">
							<button
								type="button"
								onClick={() => setStep(1)}
								className="label text-ink opacity-70 hover:opacity-100 px-4 py-2"
							>
								← Back
							</button>

							<button
								type="submit"
								disabled={createOrganizer.isPending}
								className="bg-stamp text-paper label px-8 py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
							>
								{createOrganizer.isPending
									? "Creating..."
									: "Complete Setup & Launch"}
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
