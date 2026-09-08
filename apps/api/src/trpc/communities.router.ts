import { TRPCError } from "@trpc/server";
import type { MemberRole, PrismaClient } from "db";
import { z } from "zod";
import { sendInviteEmail } from "../services/email.service";
import { authedProcedure, publicProcedure, router } from "./trpc";

/**
 * Asserts that the requester has administrative control over an Organization
 * (either as Owner or as an OrganizerMember with ADMIN/OWNER role).
 */
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

/**
 * Asserts that the requester has management control over a Sub-Community
 * (either as Org Owner/Admin OR as a CommunityMember with ADMIN/OWNER role).
 */
export async function assertCommunityAccess(
	client: PrismaClient,
	communityId: string,
	userId: string,
	allowedRoles: MemberRole[] = ["OWNER", "ADMIN"],
) {
	const community = await client.community.findUnique({
		where: { id: communityId },
		include: {
			organizer: {
				select: { id: true, ownerId: true },
			},
		},
	});

	if (!community) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Sub-community not found.",
		});
	}

	// 1. Parent Org Owner
	if (community.organizer.ownerId === userId) {
		return community;
	}

	// 2. Parent Org Admin
	const orgMembership = await client.organizerMember.findFirst({
		where: {
			organizerId: community.organizerId,
			userId,
			role: { in: ["ADMIN", "OWNER"] },
		},
	});
	if (orgMembership) {
		return community;
	}

	// 3. Community-specific Lead / Admin
	const commMembership = await client.communityMember.findFirst({
		where: {
			communityId,
			userId,
			role: { in: allowedRoles },
		},
	});
	if (commMembership) {
		return community;
	}

	throw new TRPCError({
		code: "FORBIDDEN",
		message: "You do not have permission to manage this sub-community.",
	});
}

export const communitiesRouter = router({
	/**
	 * List all sub-communities under a given parent Organization.
	 */
	listByOrganizer: publicProcedure
		.input(
			z.object({
				organizerId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			if (!input.organizerId) return [];
			return ctx.prisma.community.findMany({
				where: { organizerId: input.organizerId },
				orderBy: { createdAt: "asc" },
				select: {
					id: true,
					name: true,
					slug: true,
					description: true,
					logoUrl: true,
					bannerUrl: true,
					category: true,
					createdAt: true,
					_count: {
						select: {
							events: true,
							members: true,
						},
					},
				},
			});
		}),

	/**
	 * Get details for a specific sub-community by slug.
	 */
	getBySlug: publicProcedure
		.input(
			z.object({
				slug: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const community = await ctx.prisma.community.findUnique({
				where: { slug: input.slug },
				include: {
					organizer: {
						select: {
							id: true,
							name: true,
							slug: true,
							logoUrl: true,
							type: true,
							category: true,
						},
					},
					members: {
						select: {
							id: true,
							userId: true,
							name: true,
							email: true,
							role: true,
							user: {
								select: {
									image: true,
								},
							},
						},
					},
					events: {
						where: { status: "published" },
						orderBy: { eventStart: "asc" },
						select: {
							id: true,
							title: true,
							slug: true,
							bannerUrl: true,
							format: true,
							eventStart: true,
							eventEnd: true,
							location: true,
							isOnline: true,
							tickets: {
								select: { id: true, price: true },
							},
						},
					},
				},
			});

			if (!community) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sub-community not found.",
				});
			}

			return community;
		}),

	/**
	 * Create a new Sub-Community under a parent Organization.
	 * Only Org Owner / Org Admin can create a sub-community.
	 */
	create: authedProcedure
		.input(
			z.object({
				organizerId: z.string(),
				name: z.string().min(2, "Name must be at least 2 characters").max(100),
				slug: z.string().min(2).max(100),
				description: z.string().optional(),
				logoUrl: z.string().optional(),
				bannerUrl: z.string().optional(),
				category: z.string().default("tech"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertOrganizerAdmin(ctx.prisma, input.organizerId, ctx.userId);

			const cleanSlug = input.slug
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-|-$/g, "");

			const existing = await ctx.prisma.community.findUnique({
				where: { slug: cleanSlug },
			});

			const finalSlug = existing
				? `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`
				: cleanSlug;

			const community = await ctx.prisma.community.create({
				data: {
					organizerId: input.organizerId,
					name: input.name.trim(),
					slug: finalSlug,
					description: input.description?.trim() || null,
					logoUrl: input.logoUrl?.trim() || null,
					bannerUrl: input.bannerUrl?.trim() || null,
					category: input.category,
					members: {
						create: {
							userId: ctx.userId,
							email:
								(
									await ctx.prisma.user.findUnique({
										where: { id: ctx.userId },
										select: { email: true },
									})
								)?.email || "",
							role: "OWNER",
						},
					},
				},
			});

			return community;
		}),

	/**
	 * Update sub-community metadata.
	 * Org Admin OR Community Lead (ADMIN/OWNER).
	 */
	update: authedProcedure
		.input(
			z.object({
				communityId: z.string(),
				name: z.string().min(2).max(100).optional(),
				description: z.string().optional().nullable(),
				logoUrl: z.string().optional().nullable(),
				bannerUrl: z.string().optional().nullable(),
				category: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertCommunityAccess(ctx.prisma, input.communityId, ctx.userId);

			const updated = await ctx.prisma.community.update({
				where: { id: input.communityId },
				data: {
					...(input.name && { name: input.name.trim() }),
					...(input.description !== undefined && {
						description: input.description?.trim() || null,
					}),
					...(input.logoUrl !== undefined && {
						logoUrl: input.logoUrl?.trim() || null,
					}),
					...(input.bannerUrl !== undefined && {
						bannerUrl: input.bannerUrl?.trim() || null,
					}),
					...(input.category && { category: input.category }),
				},
			});

			return updated;
		}),

	/**
	 * Add/Invite a Lead or Coordinator to a Sub-Community.
	 */
	addMember: authedProcedure
		.input(
			z.object({
				communityId: z.string(),
				email: z.string().email(),
				name: z.string().optional(),
				role: z
					.enum(["OWNER", "ADMIN", "COORDINATOR", "VOLUNTEER"])
					.default("ADMIN"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertCommunityAccess(ctx.prisma, input.communityId, ctx.userId);

			const normalizedEmail = input.email.trim().toLowerCase();
			const matchedUser = await ctx.prisma.user.findUnique({
				where: { email: normalizedEmail },
				select: { id: true, name: true },
			});

			const member = await ctx.prisma.communityMember.upsert({
				where: {
					communityId_email: {
						communityId: input.communityId,
						email: normalizedEmail,
					},
				},
				update: {
					role: input.role as MemberRole,
					userId: matchedUser?.id || undefined,
					name: input.name || matchedUser?.name || undefined,
				},
				create: {
					communityId: input.communityId,
					email: normalizedEmail,
					name: input.name || matchedUser?.name || null,
					userId: matchedUser?.id || null,
					role: input.role as MemberRole,
				},
				include: {
					community: {
						select: {
							name: true,
							slug: true,
							organizer: { select: { name: true, slug: true } },
						},
					},
				},
			});

			// Dispatch transactional invitation email via Resend
			const appUrl =
				process.env.NEXT_PUBLIC_APP_URL ||
				process.env.APP_URL ||
				"http://localhost:3000";
			sendInviteEmail({
				toEmail: normalizedEmail,
				recipientName: input.name || matchedUser?.name,
				role: input.role,
				targetName: member.community.name,
				type: "community",
				actionUrl: `${appUrl}/organization/${member.community.organizer.slug}/community/${member.community.slug}`,
			}).catch((err) =>
				console.error("Failed to send community invite email:", err),
			);

			return member;
		}),

	/**
	 * Remove a member from a Sub-Community.
	 */
	removeMember: authedProcedure
		.input(
			z.object({
				communityId: z.string(),
				memberId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertCommunityAccess(ctx.prisma, input.communityId, ctx.userId);

			await ctx.prisma.communityMember.delete({
				where: { id: input.memberId },
			});

			return { success: true };
		}),

	/**
	 * Delete a Sub-Community.
	 * Org Owner/Admin only.
	 */
	delete: authedProcedure
		.input(z.object({ communityId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const community = await ctx.prisma.community.findUnique({
				where: { id: input.communityId },
				select: { organizerId: true },
			});

			if (!community) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Community not found.",
				});
			}

			await assertOrganizerAdmin(ctx.prisma, community.organizerId, ctx.userId);

			await ctx.prisma.community.delete({
				where: { id: input.communityId },
			});

			return { success: true };
		}),
});
