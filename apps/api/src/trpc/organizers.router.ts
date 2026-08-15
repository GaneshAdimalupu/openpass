import { TRPCError } from "@trpc/server";
import type { MemberRole, PrismaClient } from "db";
import { z } from "zod";
import { authedProcedure, publicProcedure, router } from "./trpc";

/**
 * Organizer sub-categories mapped by OrganizerType (main group).
 * This list is the single source of truth for the 2-tier organizer taxonomy.
 */
const ORGANIZER_CATEGORIES = [
	// personal
	"individual_host",
	"independent_creator",
	// education
	"student_club",
	"academic_institution",
	// community
	"tech_community",
	"hobby_club",
	"civic_association",
	// professional
	"boutique_agency",
	"enterprise_organiser",
	"event_organiser",
	// venue
	"coworking_space",
	"creative_studio",
	"hospitality_venue",
	// public_sector
	"corporate_brand",
	"non_profit",
	"government_body",
] as const;

const MEMBER_ROLES = [
	"ADMIN",
	"EDITOR",
	"COORDINATOR",
	"VOLUNTEER",
	"VIEWER",
	"DEVICE",
] as const;

async function assertOrganizerAdmin(
	client: PrismaClient,
	organizerId: string,
	userId: string,
) {
	const organizer = await client.organizer.findUnique({
		where: { id: organizerId },
		select: { id: true, ownerId: true },
	});
	if (!organizer) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Organization not found.",
		});
	}
	if (organizer.ownerId === userId) {
		return organizer;
	}
	const membership = await client.organizerMember.findFirst({
		where: {
			organizerId,
			userId,
			role: { in: ["ADMIN", "OWNER"] },
		},
	});
	if (!membership) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to manage this organization.",
		});
	}
	return organizer;
}

export const organizersRouter = router({
	create: authedProcedure
		.input(
			z.object({
				name: z.string().min(2).max(100),
				slug: z.string().min(2).max(100),
				type: z.enum([
					"personal",
					"education",
					"community",
					"professional",
					"venue",
					"public_sector",
				]),
				category: z.enum(ORGANIZER_CATEGORIES),
				ownerId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const cleanSlug = input.slug
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-|-$/g, "");

			// Verify ownership: only allow creating organizers for yourself
			if (input.ownerId !== ctx.userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only create organizers for your own account.",
				});
			}

			const userExists = await ctx.prisma.user.findUnique({
				where: { id: ctx.userId },
			});

			if (!userExists) {
				throw new Error(
					"User account not found. Your session may be from before a database reset. Please sign out and sign in again.",
				);
			}

			const existing = await ctx.prisma.organizer.findUnique({
				where: { slug: cleanSlug },
			});

			const finalSlug = existing
				? `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`
				: cleanSlug;

			return ctx.prisma.organizer.create({
				data: {
					name: input.name.trim(),
					title: input.name.trim(),
					slug: finalSlug,
					type: input.type,
					category: input.category,
					ownerId: input.ownerId,
				},
				select: {
					id: true,
					name: true,
					title: true,
					slug: true,
					type: true,
					category: true,
					createdAt: true,
				},
			});
		}),

	myOrganizers: publicProcedure
		.input(z.object({ ownerId: z.string() }))
		.query(({ ctx, input }) => {
			return ctx.prisma.organizer.findMany({
				where: {
					OR: [
						{ ownerId: input.ownerId },
						{
							members: {
								some: { userId: input.ownerId },
							},
						},
					],
				},
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					title: true,
					slug: true,
					type: true,
					category: true,
					logoUrl: true,
					createdAt: true,
					_count: {
						select: { events: true, members: true },
					},
				},
			});
		}),

	getOverview: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const org = await ctx.prisma.organizer.findUnique({
				where: { slug: input.slug },
				select: {
					id: true,
					name: true,
					title: true,
					description: true,
					logoUrl: true,
					instagram: true,
					twitter: true,
					website: true,
					slug: true,
					type: true,
					category: true,
					createdAt: true,
					ownerId: true,
					owner: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					members: {
						select: {
							id: true,
							email: true,
							name: true,
							role: true,
							createdAt: true,
							userId: true,
							user: {
								select: {
									id: true,
									name: true,
									image: true,
								},
							},
						},
						orderBy: { createdAt: "asc" },
					},
					events: {
						select: {
							id: true,
							title: true,
							slug: true,
							status: true,
							eventStart: true,
							eventEnd: true,
							location: true,
							isOnline: true,
							_count: {
								select: {
									tickets: true,
								},
							},
						},
						orderBy: { eventStart: "desc" },
					},
					_count: {
						select: {
							events: true,
							members: true,
						},
					},
				},
			});

			if (!org) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found.",
				});
			}

			// Determine current user's role in this organization
			let currentUserRole: string | null = null;
			if (ctx.userId) {
				if (ctx.userId === org.ownerId) {
					currentUserRole = "OWNER";
				} else {
					const memberRecord = org.members.find((m) => m.userId === ctx.userId);
					if (memberRecord) {
						currentUserRole = memberRecord.role;
					}
				}
			}

			return {
				...org,
				currentUserRole,
			};
		}),

	updateOrganization: authedProcedure
		.input(
			z.object({
				organizerId: z.string(),
				title: z.string().min(1).max(100).optional(),
				description: z.string().max(3000).optional().nullable(),
				logoUrl: z
					.string()
					.url("Must be a valid URL")
					.optional()
					.nullable()
					.or(z.literal("")),
				instagram: z.string().max(100).optional().nullable(),
				twitter: z.string().max(100).optional().nullable(),
				website: z.string().max(200).optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertOrganizerAdmin(ctx.prisma, input.organizerId, ctx.userId);

			return ctx.prisma.organizer.update({
				where: { id: input.organizerId },
				data: {
					...(input.title !== undefined && { title: input.title.trim() }),
					...(input.description !== undefined && {
						description: input.description?.trim() || null,
					}),
					...(input.logoUrl !== undefined && {
						logoUrl: input.logoUrl?.trim() || null,
					}),
					...(input.instagram !== undefined && {
						instagram: input.instagram?.trim() || null,
					}),
					...(input.twitter !== undefined && {
						twitter: input.twitter?.trim() || null,
					}),
					...(input.website !== undefined && {
						website: input.website?.trim() || null,
					}),
				},
				select: {
					id: true,
					title: true,
					description: true,
					logoUrl: true,
					instagram: true,
					twitter: true,
					website: true,
				},
			});
		}),

	addMember: authedProcedure
		.input(
			z.object({
				organizerId: z.string(),
				email: z.string().email("Invalid email address"),
				role: z.enum(MEMBER_ROLES),
				name: z.string().max(100).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const org = await assertOrganizerAdmin(
				ctx.prisma,
				input.organizerId,
				ctx.userId,
			);

			const normalizedEmail = input.email.trim().toLowerCase();

			// Check if the email belongs to the organization owner
			const owner = await ctx.prisma.user.findUnique({
				where: { id: org.ownerId },
				select: { email: true },
			});
			if (owner && owner.email.toLowerCase() === normalizedEmail) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"The owner is already the primary organizer of this account.",
				});
			}

			// Check if target user already has an account
			const existingUser = await ctx.prisma.user.findUnique({
				where: { email: normalizedEmail },
				select: { id: true, name: true },
			});

			return ctx.prisma.organizerMember.upsert({
				where: {
					organizerId_email: {
						organizerId: input.organizerId,
						email: normalizedEmail,
					},
				},
				update: {
					role: input.role as MemberRole,
					name: input.name || existingUser?.name || undefined,
					userId: existingUser?.id || undefined,
				},
				create: {
					organizerId: input.organizerId,
					email: normalizedEmail,
					name: input.name || existingUser?.name || null,
					role: input.role as MemberRole,
					userId: existingUser?.id || null,
				},
			});
		}),

	updateMemberRole: authedProcedure
		.input(
			z.object({
				memberId: z.string(),
				role: z.enum(MEMBER_ROLES),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.prisma.organizerMember.findUnique({
				where: { id: input.memberId },
				select: { id: true, organizerId: true },
			});

			if (!member) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Member not found.",
				});
			}

			await assertOrganizerAdmin(ctx.prisma, member.organizerId, ctx.userId);

			return ctx.prisma.organizerMember.update({
				where: { id: input.memberId },
				data: { role: input.role as MemberRole },
			});
		}),

	removeMember: authedProcedure
		.input(
			z.object({
				memberId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.prisma.organizerMember.findUnique({
				where: { id: input.memberId },
				select: { id: true, organizerId: true },
			});

			if (!member) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Member not found.",
				});
			}

			await assertOrganizerAdmin(ctx.prisma, member.organizerId, ctx.userId);

			await ctx.prisma.organizerMember.delete({
				where: { id: input.memberId },
			});

			return { success: true };
		}),

	getBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(({ ctx, input }) => {
			return ctx.prisma.organizer.findUnique({
				where: { slug: input.slug },
				select: {
					id: true,
					name: true,
					title: true,
					description: true,
					logoUrl: true,
					instagram: true,
					twitter: true,
					website: true,
					slug: true,
					type: true,
					category: true,
					createdAt: true,
					events: {
						where: { status: "published" },
						orderBy: { eventStart: "asc" },
						select: {
							id: true,
							title: true,
							slug: true,
							format: true,
							topic: true,
							eventStart: true,
							eventEnd: true,
							location: true,
							isOnline: true,
						},
					},
				},
			});
		}),
});
