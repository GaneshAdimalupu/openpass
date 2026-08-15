import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authedProcedure, publicProcedure, router } from "./trpc";

/**
 * Event Format and Topic constants — single source of truth.
 * Format = "What kind of event is this?" (mutually exclusive)
 * Topic  = "What subject area?" (primary topic)
 * Tags   = free-form multi-select for discoverability
 */
const EVENT_FORMATS = [
	"meetup",
	"conference",
	"workshop",
	"hackathon",
	"fest",
	"webinar",
	"networking",
	"other",
] as const;

const EVENT_TOPICS = [
	"technology",
	"business",
	"opensource",
	"design",
	"science",
	"arts",
	"social",
	"campus",
	"other",
] as const;

export const eventsRouter = router({
	list: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.event.findMany({
			where: { status: "published", eventStart: { gte: new Date() } },
			orderBy: { eventStart: "asc" },
			select: {
				id: true,
				title: true,
				slug: true,
				description: true,
				format: true,
				topic: true,
				tags: true,
				eventStart: true,
				eventEnd: true,
				location: true,
				isOnline: true,
				tickets: {
					select: { id: true, name: true, price: true, quantity: true },
				},
				organizer: {
					select: {
						id: true,
						name: true,
						slug: true,
						type: true,
						category: true,
					},
				},
			},
		});
	}),

	byOrganizer: publicProcedure
		.input(z.object({ organizerId: z.string() }))
		.query(({ ctx, input }) => {
			return ctx.prisma.event.findMany({
				where: {
					organizerId: input.organizerId,
					status: "published",
				},
				orderBy: { eventStart: "desc" },
				select: {
					id: true,
					title: true,
					slug: true,
					description: true,
					format: true,
					topic: true,
					tags: true,
					status: true,
					eventStart: true,
					eventEnd: true,
					location: true,
					isOnline: true,
					capacity: true,
					tickets: {
						select: { id: true, name: true, price: true, quantity: true },
					},
				},
			});
		}),

	getBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(({ ctx, input }) => {
			return ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				select: {
					id: true,
					title: true,
					slug: true,
					description: true,
					format: true,
					topic: true,
					tags: true,
					status: true,
					eventStart: true,
					eventEnd: true,
					timezone: true,
					location: true,
					isOnline: true,
					onlineLink: true,
					capacity: true,
					organizer: {
						select: {
							id: true,
							name: true,
							slug: true,
							type: true,
							category: true,
						},
					},
					tickets: {
						select: {
							id: true,
							name: true,
							price: true,
							quantity: true,
						},
					},
				},
			});
		}),

	create: authedProcedure
		.input(
			z.object({
				organizerId: z.string(),
				title: z.string().min(3).max(120),
				slug: z.string().min(3).max(120),
				description: z.string().optional(),
				format: z.enum(EVENT_FORMATS).default("meetup"),
				topic: z.enum(EVENT_TOPICS).default("technology"),
				tags: z.array(z.string().max(40)).max(10).default([]),
				eventStart: z.string(), // ISO String
				eventEnd: z.string(), // ISO String
				timezone: z.string().default("Asia/Kolkata"),
				isOnline: z.boolean().default(false),
				location: z.string().optional(),
				onlineLink: z.string().optional(),
				capacity: z.number().int().positive().optional(),
				tickets: z
					.array(
						z.object({
							name: z.string().min(1),
							price: z.number().int().min(0).default(0),
							quantity: z.number().int().positive().optional(),
						}),
					)
					.min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify the organizer belongs to the current user
			const organizer = await ctx.prisma.organizer.findUnique({
				where: { id: input.organizerId },
				select: { ownerId: true },
			});

			if (!organizer) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organizer not found.",
				});
			}

			if (organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: input.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message:
							"You do not have permission to create events for this organizer.",
					});
				}
			}

			const cleanSlug = input.slug
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-|-$/g, "");

			const existing = await ctx.prisma.event.findUnique({
				where: { slug: cleanSlug },
			});

			const finalSlug = existing
				? `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`
				: cleanSlug;

			return ctx.prisma.event.create({
				data: {
					title: input.title.trim(),
					slug: finalSlug,
					description: input.description?.trim() || null,
					format: input.format,
					topic: input.topic,
					tags: input.tags.map((t) => t.trim().toLowerCase()),
					status: "published",
					eventStart: new Date(input.eventStart),
					eventEnd: new Date(input.eventEnd),
					timezone: input.timezone,
					isOnline: input.isOnline,
					location: input.isOnline ? null : input.location?.trim() || null,
					onlineLink: input.isOnline ? input.onlineLink?.trim() || null : null,
					capacity: input.capacity || null,
					organizerId: input.organizerId,
					tickets: {
						create: input.tickets.map((t) => ({
							name: t.name.trim(),
							price: t.price,
							quantity: t.quantity || null,
						})),
					},
				},
				select: {
					id: true,
					title: true,
					slug: true,
					format: true,
					topic: true,
					eventStart: true,
				},
			});
		}),
});
