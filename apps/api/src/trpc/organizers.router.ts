import { TRPCError } from "@trpc/server";
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
					slug: finalSlug,
					type: input.type,
					category: input.category,
					ownerId: input.ownerId,
				},
				select: {
					id: true,
					name: true,
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
				where: { ownerId: input.ownerId },
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					slug: true,
					type: true,
					category: true,
					createdAt: true,
					_count: {
						select: { events: true },
					},
				},
			});
		}),

	getBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(({ ctx, input }) => {
			return ctx.prisma.organizer.findUnique({
				where: { slug: input.slug },
				select: {
					id: true,
					name: true,
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
