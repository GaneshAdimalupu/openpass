import { TRPCError } from "@trpc/server";
import type { EventStatus, PrismaClient } from "db";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { sendTicketEmail } from "../services/email.service";
import { authedProcedure, publicProcedure, router } from "./trpc";

const BANNER_BUCKET = "event-banners";
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5 MB

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

/**
 * Enterprise-grade authorization helper grounded in Cal.com & Pretix RBAC standards.
 * Verifies that the requester has the required role (Owner, Team Member, or Volunteer)
 * for the given event.
 */
export async function assertEventAccess(
	client: PrismaClient,
	slugOrId: string,
	userId: string,
	allowedRoles: Array<
		"OWNER" | "ADMIN" | "EDITOR" | "COORDINATOR" | "VOLUNTEER" | "DEVICE"
	> = ["OWNER", "ADMIN", "EDITOR"],
) {
	const event = await client.event.findFirst({
		where: {
			OR: [{ id: slugOrId }, { slug: slugOrId }],
		},
		include: {
			organizer: {
				select: { id: true, ownerId: true },
			},
			volunteers: {
				where: { userId },
				select: { id: true, role: true },
			},
		},
	});

	if (!event) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Event not found.",
		});
	}

	// 1. Direct Organizer Owner
	if (event.organizer.ownerId === userId) {
		return event;
	}

	// 2. Organizer Team Member with appropriate role
	const membership = await client.organizerMember.findFirst({
		where: {
			organizerId: event.organizerId,
			userId,
			role: { in: allowedRoles },
		},
	});
	if (membership) {
		return event;
	}

	// 3. Event-specific Volunteer (authorized for check-in / volunteer tasks)
	if (allowedRoles.includes("VOLUNTEER") && event.volunteers.length > 0) {
		return event;
	}

	throw new TRPCError({
		code: "FORBIDDEN",
		message: "You do not have permission to manage or scan for this event.",
	});
}

export const eventsRouter = router({
	list: publicProcedure.query(({ ctx }) => {
		const now = new Date();
		return ctx.prisma.event.findMany({
			where: {
				status: "published",
				eventEnd: { gte: now },
			},
			orderBy: { eventStart: "asc" },
			select: {
				id: true,
				title: true,
				slug: true,
				description: true,
				format: true,
				bannerUrl: true,
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
		.input(
			z.object({
				organizerId: z.string(),
				status: z
					.enum(["published", "draft", "completed", "cancelled"])
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			let isAuthorizedStaff = false;
			if (ctx.userId) {
				const organizer = await ctx.prisma.organizer.findUnique({
					where: { id: input.organizerId },
					select: { ownerId: true },
				});
				if (organizer?.ownerId === ctx.userId) {
					isAuthorizedStaff = true;
				} else {
					const membership = await ctx.prisma.organizerMember.findFirst({
						where: {
							organizerId: input.organizerId,
							userId: ctx.userId,
							role: { in: ["OWNER", "ADMIN", "EDITOR", "COORDINATOR"] },
						},
					});
					if (membership) {
						isAuthorizedStaff = true;
					}
				}
			}

			// If caller is NOT authorized staff, strictly limit visibility to published/completed
			const allowedStatuses: EventStatus[] | undefined = isAuthorizedStaff
				? input.status
					? [input.status as EventStatus]
					: undefined
				: input.status && input.status === "completed"
					? ["completed" as EventStatus]
					: ["published" as EventStatus];

			return ctx.prisma.event.findMany({
				where: {
					organizerId: input.organizerId,
					...(allowedStatuses ? { status: { in: allowedStatuses } } : {}),
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
					bannerUrl: true,
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
			return ctx.prisma.event.findFirst({
				where: { slug: input.slug, status: "published" },
				select: {
					id: true,
					title: true,
					slug: true,
					description: true,
					format: true,
					topic: true,
					tags: true,
					status: true,
					bannerUrl: true,
					eventStart: true,
					eventEnd: true,
					timezone: true,
					location: true,
					isOnline: true,
					onlineLink: true,
					capacity: true,
					registrationStart: true,
					registrationEnd: true,
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

	manageGetBySlug: authedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
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
					bannerUrl: true,
					shortDescription: true,
					showSpeakers: true,
					eventStart: true,
					eventEnd: true,
					timezone: true,
					location: true,
					isOnline: true,
					onlineLink: true,
					recordingLink: true,
					mapLink: true,
					isPaid: true,
					ticketDescription: true,
					showRsvp: true,
					capacity: true,
					registrationStart: true,
					registrationEnd: true,
					organizerId: true,
					organizer: {
						select: {
							id: true,
							name: true,
							slug: true,
							type: true,
							category: true,
							ownerId: true,
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

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to manage this event.",
					});
				}
			}

			return event;
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
				timezone: z.string().default("UTC"),
				registrationStart: z.string().optional(),
				registrationEnd: z.string().optional(),
				isOnline: z.boolean().default(false),
				location: z.string().optional(),
				onlineLink: z.string().optional(),
				capacity: z.number().int().positive().default(300),
				tickets: z
					.array(
						z.object({
							name: z.string().min(1),
							price: z.number().int().min(0).default(0),
							quantity: z.number().int().positive().optional(),
						}),
					)
					.default([{ name: "General Pass", price: 0, quantity: 300 }]),
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
					status: "draft",
					eventStart: new Date(input.eventStart),
					eventEnd: new Date(input.eventEnd),
					timezone: input.timezone,
					registrationStart: input.registrationStart
						? new Date(input.registrationStart)
						: null,
					registrationEnd: input.registrationEnd
						? new Date(input.registrationEnd)
						: null,
					isOnline: input.isOnline,
					location: input.isOnline ? null : input.location?.trim() || null,
					onlineLink: input.isOnline ? input.onlineLink?.trim() || null : null,
					capacity: input.capacity || 300,
					organizerId: input.organizerId,
					tickets: {
						create: input.tickets.map((t) => ({
							name: t.name.trim(),
							price: t.price,
							quantity: t.quantity !== undefined ? t.quantity : 300,
							isPublished: true,
							allowWaitlist: true,
							allowTransfer: true,
							allowDrop: true,
							maxPerOrder: 1,
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

	update: authedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(3).max(120),
				description: z.string().optional(),
				shortDescription: z.string().optional(),
				showSpeakers: z.boolean().default(true),
				format: z.enum(EVENT_FORMATS),
				topic: z.enum(EVENT_TOPICS),
				isOnline: z.boolean(),
				location: z.string().optional(),
				onlineLink: z.string().optional(),
				recordingLink: z.string().optional(),
				mapLink: z.string().optional(),
				isPaid: z.boolean().default(false),
				ticketDescription: z.string().optional(),
				showRsvp: z.boolean().default(false),
				timezone: z.string(),
				eventStart: z.string(),
				eventEnd: z.string(),
				registrationStart: z.string().nullable(),
				registrationEnd: z.string().nullable(),
				bannerUrl: z.string().nullable().optional(),
				status: z
					.enum(["draft", "published", "cancelled", "completed"])
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { id: input.id },
				include: { organizer: true },
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Verify permissions
			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to edit this event.",
					});
				}
			}

			return ctx.prisma.event.update({
				where: { id: input.id },
				data: {
					title: input.title.trim(),
					description: input.description?.trim() || null,
					shortDescription: input.shortDescription?.trim() || null,
					showSpeakers: input.showSpeakers,
					format: input.format,
					topic: input.topic,
					isOnline: input.isOnline,
					location: input.isOnline ? null : input.location?.trim() || null,
					onlineLink: input.isOnline ? input.onlineLink?.trim() || null : null,
					recordingLink: input.recordingLink?.trim() || null,
					mapLink: input.mapLink?.trim() || null,
					isPaid: input.isPaid,
					ticketDescription: input.ticketDescription?.trim() || null,
					showRsvp: input.showRsvp,
					timezone: input.timezone,
					eventStart: new Date(input.eventStart),
					eventEnd: new Date(input.eventEnd),
					registrationStart: input.registrationStart
						? new Date(input.registrationStart)
						: null,
					registrationEnd: input.registrationEnd
						? new Date(input.registrationEnd)
						: null,
					...(input.bannerUrl !== undefined
						? { bannerUrl: input.bannerUrl }
						: {}),
					...(input.status ? { status: input.status } : {}),
				},
			});
		}),

	delete: authedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { id: input.id },
				include: { organizer: true },
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Verify permissions
			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to delete this event.",
					});
				}
			}

			await ctx.prisma.event.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	rsvpGetForm: authedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to manage this event.",
					});
				}
			}

			const rsvpForm = await ctx.prisma.rsvpForm.findUnique({
				where: { eventId: event.id },
				include: { customQuestions: { orderBy: { order: "asc" } } },
			});

			if (rsvpForm) return rsvpForm;

			return ctx.prisma.rsvpForm.create({
				data: { eventId: event.id },
				include: { customQuestions: { orderBy: { order: "asc" } } },
			});
		}),

	rsvpUpdateForm: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				isPublished: z.boolean(),
				allowEdit: z.boolean(),
				requiresApproval: z.boolean(),
				maxRsvpCount: z.number().int().min(1),
				description: z.string().nullable().optional(),
				customQuestions: z.array(
					z.object({
						question: z.string(),
						type: z.string(),
						isMandatory: z.boolean(),
						options: z.string().nullable().optional(),
						description: z.string().nullable().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to manage this event.",
					});
				}
			}

			const rsvpForm = await ctx.prisma.rsvpForm.upsert({
				where: { eventId: event.id },
				update: {
					isPublished: input.isPublished,
					allowEdit: input.allowEdit,
					requiresApproval: input.requiresApproval,
					maxRsvpCount: input.maxRsvpCount,
					description: input.description,
				},
				create: {
					eventId: event.id,
					isPublished: input.isPublished,
					allowEdit: input.allowEdit,
					requiresApproval: input.requiresApproval,
					maxRsvpCount: input.maxRsvpCount,
					description: input.description,
				},
			});

			// Refresh custom questions
			await ctx.prisma.customQuestion.deleteMany({
				where: { rsvpFormId: rsvpForm.id },
			});

			if (input.customQuestions.length > 0) {
				await ctx.prisma.customQuestion.createMany({
					data: input.customQuestions.map((q, index) => ({
						rsvpFormId: rsvpForm.id,
						question: q.question,
						type: q.type,
						isMandatory: q.isMandatory,
						options: q.options,
						description: q.description,
						order: index,
					})),
				});
			}

			return ctx.prisma.rsvpForm.findUnique({
				where: { id: rsvpForm.id },
				include: { customQuestions: { orderBy: { order: "asc" } } },
			});
		}),

	rsvpGetSubmissions: authedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Permission denied.",
					});
			}

			const submissions = await ctx.prisma.rsvpSubmission.findMany({
				where: { eventId: event.id },
				include: {
					user: { select: { name: true, email: true } },
					checkIns: true,
				},
				orderBy: { createdAt: "desc" },
			});

			return submissions.map((sub) => {
				const hasCheckedInToday = sub.checkIns.some((ci) => {
					const today = new Date().toISOString().split("T")[0];
					const ciDate = new Date(ci.timestamp).toISOString().split("T")[0];
					return today === ciDate;
				});

				return {
					id: sub.id,
					userId: sub.userId,
					name: sub.user.name,
					email: sub.user.email,
					status: sub.status,
					confirmAttendance: sub.confirmAttendance,
					answers: sub.answers,
					hasCheckedInToday,
					checkIns: sub.checkIns,
				};
			});
		}),

	rsvpUpdateSubmissionStatus: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				submissionId: z.string(),
				status: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Permission denied.",
					});
			}

			// FOSS United rule: when Accepted, automatically confirm attendance (for backwards compatibility/simplicity, though typically users confirm it themselves)
			const confirmAttendance = input.status === "Accepted";

			return ctx.prisma.rsvpSubmission.update({
				where: { id: input.submissionId, eventId: event.id },
				data: { status: input.status, confirmAttendance },
			});
		}),

	rsvpToggleCheckIn: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				submissionId: z.string(),
				action: z.enum(["checkin", "undo"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Permission denied.",
					});
			}

			const today = new Date().toISOString().split("T")[0];

			if (input.action === "checkin") {
				// Prevent double check-in for the same day
				const existing = await ctx.prisma.rsvpCheckIn.findFirst({
					where: {
						submissionId: input.submissionId,
						timestamp: {
							gte: new Date(`${today}T00:00:00.000Z`),
							lt: new Date(`${today}T23:59:59.999Z`),
						},
					},
				});

				if (!existing) {
					await ctx.prisma.rsvpCheckIn.create({
						data: { submissionId: input.submissionId },
					});
				}
			} else {
				// Remove today's check-in
				const existing = await ctx.prisma.rsvpCheckIn.findFirst({
					where: {
						submissionId: input.submissionId,
						timestamp: {
							gte: new Date(`${today}T00:00:00.000Z`),
							lt: new Date(`${today}T23:59:59.999Z`),
						},
					},
				});
				if (existing) {
					await ctx.prisma.rsvpCheckIn.delete({ where: { id: existing.id } });
				}
			}

			return { success: true };
		}),

	rsvpGetStats: authedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			const totalAccepted = await ctx.prisma.rsvpSubmission.count({
				where: { eventId: event.id, confirmAttendance: true },
			});

			const today = new Date().toISOString().split("T")[0];
			const totalCheckedInToday = await ctx.prisma.rsvpCheckIn.count({
				where: {
					submission: { eventId: event.id },
					timestamp: {
						gte: new Date(`${today}T00:00:00.000Z`),
						lt: new Date(`${today}T23:59:59.999Z`),
					},
				},
			});

			return { totalAccepted, totalCheckedInToday };
		}),

	cfpGetForm: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			const cfpForm = await ctx.prisma.cfpForm.findUnique({
				where: { eventId: event.id },
				include: { customQuestions: { orderBy: { order: "asc" } } },
			});

			return cfpForm;
		}),

	cfpUpdateForm: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				isPublished: z.boolean(),
				allowEdit: z.boolean(),
				anonymiseProposals: z.boolean(),
				hideReviews: z.boolean(),
				onlyWorkshops: z.boolean(),
				onlyTalks: z.boolean(),
				deadline: z.string().nullable().optional(),
				publicCustomResponses: z.boolean(),
				guidelines: z.string().nullable().optional(),
				customQuestions: z.array(
					z.object({
						question: z.string(),
						type: z.string(),
						isMandatory: z.boolean(),
						options: z.string().nullable().optional(),
						description: z.string().nullable().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to manage this event.",
					});
				}
			}

			const deadlineDate = input.deadline ? new Date(input.deadline) : null;

			const cfpForm = await ctx.prisma.cfpForm.upsert({
				where: { eventId: event.id },
				update: {
					isPublished: input.isPublished,
					allowEdit: input.allowEdit,
					anonymiseProposals: input.anonymiseProposals,
					hideReviews: input.hideReviews,
					onlyWorkshops: input.onlyWorkshops,
					onlyTalks: input.onlyTalks,
					deadline: deadlineDate,
					publicCustomResponses: input.publicCustomResponses,
					guidelines: input.guidelines,
				},
				create: {
					eventId: event.id,
					isPublished: input.isPublished,
					allowEdit: input.allowEdit,
					anonymiseProposals: input.anonymiseProposals,
					hideReviews: input.hideReviews,
					onlyWorkshops: input.onlyWorkshops,
					onlyTalks: input.onlyTalks,
					deadline: deadlineDate,
					publicCustomResponses: input.publicCustomResponses,
					guidelines: input.guidelines,
				},
			});

			// Refresh custom questions
			await ctx.prisma.cfpCustomQuestion.deleteMany({
				where: { cfpFormId: cfpForm.id },
			});

			if (input.customQuestions.length > 0) {
				await ctx.prisma.cfpCustomQuestion.createMany({
					data: input.customQuestions.map((q, index) => ({
						cfpFormId: cfpForm.id,
						question: q.question,
						type: q.type,
						isMandatory: q.isMandatory,
						options: q.options,
						description: q.description,
						order: index,
					})),
				});
			}

			return ctx.prisma.cfpForm.findUnique({
				where: { id: cfpForm.id },
				include: { customQuestions: { orderBy: { order: "asc" } } },
			});
		}),

	cfpGetSubmissions: authedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR", "VOLUNTEER"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Permission denied.",
					});
				}
			}

			const submissions = await ctx.prisma.cfpSubmission.findMany({
				where: { eventId: event.id },
				include: {
					speaker: {
						select: { id: true, name: true, email: true, image: true },
					},
					reviews: { select: { id: true, score: true, reviewerId: true } },
				},
				orderBy: { createdAt: "desc" },
			});

			return submissions;
		}),

	cfpUpdateSubmissionStatus: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				submissionId: z.string(),
				status: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Permission denied.",
					});
				}
			}

			return ctx.prisma.cfpSubmission.update({
				where: { id: input.submissionId, eventId: event.id },
				data: { status: input.status },
			});
		}),

	scheduleGet: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				select: {
					id: true,
					title: true,
					slug: true,
					eventStart: true,
					eventEnd: true,
					showSchedule: true,
				},
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			const items = await ctx.prisma.scheduleItem.findMany({
				where: { eventId: event.id },
				include: {
					linkedCfpSubmission: {
						select: {
							id: true,
							title: true,
							sessionType: true,
							speaker: {
								select: { id: true, name: true, email: true, image: true },
							},
						},
					},
				},
				orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }],
			});

			const acceptedProposals = await ctx.prisma.cfpSubmission.findMany({
				where: { eventId: event.id, status: "Accepted" },
				include: {
					speaker: {
						select: { id: true, name: true, email: true, image: true },
					},
				},
				orderBy: { title: "asc" },
			});

			return {
				event,
				items,
				acceptedProposals,
			};
		}),

	scheduleSave: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				showSchedule: z.boolean(),
				items: z.array(
					z.object({
						id: z.string().optional(),
						title: z.string(),
						description: z.string().nullable().optional(),
						scheduledDate: z.string(),
						startTime: z.string(),
						endTime: z.string(),
						stage: z.string().nullable().optional(),
						type: z.string().default("talk"),
						speakerName: z.string().nullable().optional(),
						linkedCfpSubmissionId: z.string().nullable().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to edit the schedule.",
					});
				}
			}

			// Update showSchedule on Event
			await ctx.prisma.event.update({
				where: { id: event.id },
				data: { showSchedule: input.showSchedule },
			});

			// Re-sync schedule items
			await ctx.prisma.scheduleItem.deleteMany({
				where: { eventId: event.id },
			});

			if (input.items.length > 0) {
				await ctx.prisma.scheduleItem.createMany({
					data: input.items.map((item) => ({
						eventId: event.id,
						title: item.title,
						description: item.description,
						scheduledDate: item.scheduledDate,
						startTime: item.startTime,
						endTime: item.endTime,
						stage: item.stage,
						type: item.type,
						speakerName: item.speakerName,
						linkedCfpSubmissionId: item.linkedCfpSubmissionId,
					})),
				});
			}

			return ctx.prisma.scheduleItem.findMany({
				where: { eventId: event.id },
				include: {
					linkedCfpSubmission: {
						select: {
							id: true,
							title: true,
							sessionType: true,
							speaker: {
								select: { id: true, name: true, email: true, image: true },
							},
						},
					},
				},
				orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }],
			});
		}),

	partnersGet: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				select: {
					id: true,
					title: true,
					slug: true,
					showPartners: true,
				},
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			const partners = await ctx.prisma.eventPartner.findMany({
				where: { eventId: event.id },
				orderBy: { order: "asc" },
			});

			return {
				event,
				sponsors: partners.filter((p) => p.type === "sponsor"),
				communityPartners: partners.filter((p) => p.type === "community"),
			};
		}),

	partnersSave: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				showPartners: z.boolean(),
				partners: z.array(
					z.object({
						id: z.string().optional(),
						type: z.string(),
						name: z.string(),
						tier: z.string().nullable().optional(),
						customTier: z.string().nullable().optional(),
						logoUrl: z.string().nullable().optional(),
						websiteUrl: z.string().nullable().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message:
							"You do not have permission to manage partners for this event.",
					});
				}
			}

			// Update showPartners on Event
			await ctx.prisma.event.update({
				where: { id: event.id },
				data: { showPartners: input.showPartners },
			});

			// Re-sync partners
			await ctx.prisma.eventPartner.deleteMany({
				where: { eventId: event.id },
			});

			if (input.partners.length > 0) {
				await ctx.prisma.eventPartner.createMany({
					data: input.partners.map((p, index) => ({
						eventId: event.id,
						type: p.type,
						name: p.name,
						tier: p.tier,
						customTier: p.customTier,
						logoUrl: p.logoUrl,
						websiteUrl: p.websiteUrl,
						order: index,
					})),
				});
			}

			const updated = await ctx.prisma.eventPartner.findMany({
				where: { eventId: event.id },
				orderBy: { order: "asc" },
			});

			return {
				sponsors: updated.filter((p) => p.type === "sponsor"),
				communityPartners: updated.filter((p) => p.type === "community"),
			};
		}),

	usersSearch: authedProcedure
		.input(z.object({ query: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const q = input.query.trim().toLowerCase().replace(/^@/, "");
			if (!q) return [];

			const users = await ctx.prisma.user.findMany({
				where: {
					OR: [
						{ name: { contains: q, mode: "insensitive" } },
						{ username: { contains: q, mode: "insensitive" } },
						{ email: { contains: q, mode: "insensitive" } },
					],
				},
				select: {
					id: true,
					name: true,
					username: true,
					email: true,
					image: true,
				},
				take: 8,
			});

			return users;
		}),

	volunteersGet: authedProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: {
					organizer: {
						include: {
							owner: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
								},
							},
							members: {
								include: {
									user: {
										select: {
											id: true,
											name: true,
											username: true,
											email: true,
											image: true,
										},
									},
								},
							},
						},
					},
				},
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			let volunteers = await ctx.prisma.eventVolunteer.findMany({
				where: { eventId: event.id },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
							image: true,
						},
					},
				},
				orderBy: { createdAt: "asc" },
			});

			// Auto-populate organization owner & members as event volunteers if none exist (FOSS United standard)
			if (volunteers.length === 0) {
				const defaultPeopleToSeed = [
					...(event.organizer.owner
						? [
								{
									name: event.organizer.owner.name || "Organizer Lead",
									email: event.organizer.owner.email,
									role: "Core Organizer",
									userId: event.organizer.ownerId,
								},
							]
						: []),
					...event.organizer.members.map((m) => ({
						name: m.name || m.email.split("@")[0],
						email: m.email,
						role: m.role || "Volunteer",
						userId: m.userId,
					})),
				];

				for (const person of defaultPeopleToSeed) {
					try {
						await ctx.prisma.eventVolunteer.upsert({
							where: {
								eventId_email: {
									eventId: event.id,
									email: person.email,
								},
							},
							create: {
								eventId: event.id,
								name: person.name,
								email: person.email,
								role: person.role,
								userId: person.userId,
							},
							update: {},
						});
					} catch (_err) {
						// Ignore duplicate seeding errors if any
					}
				}

				// Re-query newly seeded volunteers
				volunteers = await ctx.prisma.eventVolunteer.findMany({
					where: { eventId: event.id },
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								email: true,
								image: true,
							},
						},
					},
					orderBy: { createdAt: "asc" },
				});
			}

			return {
				event,
				volunteers,
				isOwner: event.organizer.ownerId === ctx.userId,
			};
		}),

	volunteersAdd: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				name: z.string(),
				email: z.string().email(),
				role: z.string().default("Volunteer"),
				customRole: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message:
							"You do not have permission to add volunteers to this event.",
					});
				}
			}

			// Check if a registered user exists with this email
			const existingUser = await ctx.prisma.user.findUnique({
				where: { email: input.email.toLowerCase() },
				select: { id: true },
			});

			const volunteer = await ctx.prisma.eventVolunteer.upsert({
				where: {
					eventId_email: {
						eventId: event.id,
						email: input.email.toLowerCase(),
					},
				},
				update: {
					name: input.name,
					role: input.role,
					customRole: input.customRole,
					userId: existingUser?.id || null,
				},
				create: {
					eventId: event.id,
					email: input.email.toLowerCase(),
					name: input.name,
					role: input.role,
					customRole: input.customRole,
					userId: existingUser?.id || null,
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
							image: true,
						},
					},
				},
			});

			return volunteer;
		}),

	volunteersUpdate: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				volunteerId: z.string(),
				name: z.string(),
				role: z.string(),
				customRole: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to edit volunteers.",
					});
				}
			}

			return ctx.prisma.eventVolunteer.update({
				where: { id: input.volunteerId, eventId: event.id },
				data: {
					name: input.name,
					role: input.role,
					customRole: input.customRole,
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
							image: true,
						},
					},
				},
			});
		}),

	volunteersRemove: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				volunteerId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR", "COORDINATOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to remove volunteers.",
					});
				}
			}

			await ctx.prisma.eventVolunteer.delete({
				where: { id: input.volunteerId, eventId: event.id },
			});

			return { success: true };
		}),

	// ──────────────────────────────────────────────────────────
	// TICKETING SYSTEM: TIERS, BOOKING, DROP, WAITLIST & TRANSFER
	// ──────────────────────────────────────────────────────────

	ticketsGet: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				select: {
					id: true,
					title: true,
					slug: true,
					description: true,
					format: true,
					bannerUrl: true,
					status: true,
					capacity: true,
					eventStart: true,
					eventEnd: true,
					location: true,
					isOnline: true,
					organizerId: true,
					organizer: {
						select: {
							id: true,
							name: true,
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
									name: true,
									email: true,
									role: true,
									user: { select: { image: true } },
								},
							},
						},
					},
					volunteers: {
						select: {
							id: true,
							name: true,
							role: true,
							user: { select: { image: true } },
						},
					},
					tickets: {
						orderBy: { order: "asc" },
						include: {
							issuedTickets: {
								select: {
									id: true,
									status: true,
								},
							},
						},
					},
				},
			});

			if (!event) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}

			// Format tiers with real counts
			const tiers = event.tickets.map((t) => {
				const confirmedCount = t.issuedTickets.filter(
					(i) => i.status === "CONFIRMED" || i.status === "CHECKED_IN",
				).length;
				const waitlistCount = t.issuedTickets.filter(
					(i) => i.status === "WAITLISTED",
				).length;
				const checkedInCount = t.issuedTickets.filter(
					(i) => i.status === "CHECKED_IN",
				).length;
				const droppedCount = t.issuedTickets.filter(
					(i) => i.status === "DROPPED",
				).length;
				const transferredCount = t.issuedTickets.filter(
					(i) => i.status === "TRANSFERRED",
				).length;

				return {
					id: t.id,
					eventId: t.eventId,
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
					order: t.order,
					confirmedCount,
					waitlistCount,
					checkedInCount,
					droppedCount,
					transferredCount,
					isSoldOut: t.quantity !== null && confirmedCount >= t.quantity,
				};
			});

			const totalConfirmed = tiers.reduce(
				(sum, t) => sum + t.confirmedCount,
				0,
			);
			const totalWaitlisted = tiers.reduce(
				(sum, t) => sum + t.waitlistCount,
				0,
			);
			const totalCheckedIn = tiers.reduce(
				(sum, t) => sum + t.checkedInCount,
				0,
			);
			const totalDropped = tiers.reduce((sum, t) => sum + t.droppedCount, 0);

			// Default volunteers to organization owner and team members if no explicit event volunteers are assigned (FOSS United standard)
			const defaultVolunteers = [
				...(event.organizer.owner?.name
					? [
							{
								id: `owner-${event.organizer.owner.id}`,
								name: event.organizer.owner.name,
								role: "Core Organizer",
								user: event.organizer.owner.image
									? { image: event.organizer.owner.image }
									: null,
							},
						]
					: []),
				...event.organizer.members.map((m) => ({
					id: m.id,
					name: m.name || m.email.split("@")[0],
					role: m.role || "Volunteer",
					user: m.user?.image ? { image: m.user.image } : null,
				})),
			];

			const effectiveVolunteers =
				event.volunteers.length > 0 ? event.volunteers : defaultVolunteers;

			return {
				event: {
					...event,
					volunteers: effectiveVolunteers,
				},
				tiers,
				stats: {
					totalConfirmed,
					totalWaitlisted,
					totalCheckedIn,
					totalDropped,
					eventCapacity: event.capacity,
				},
			};
		}),

	ticketsManageTiers: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				tiers: z.array(
					z.object({
						id: z.string().optional(),
						name: z.string().min(1, "Tier name is required"),
						description: z.string().nullable().optional(),
						price: z.number().int().min(0).default(0),
						quantity: z.number().int().positive().nullable().optional(),
						maxPerOrder: z.number().int().positive().default(1),
						salesStart: z.string().nullable().optional(),
						salesEnd: z.string().nullable().optional(),
						isPublished: z.boolean().default(true),
						allowWaitlist: z.boolean().default(true),
						allowTransfer: z.boolean().default(true),
						allowDrop: z.boolean().default(true),
						order: z.number().int().default(0),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: { organizer: true },
			});
			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.organizer.ownerId !== ctx.userId) {
				const member = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR"] },
					},
				});
				if (!member) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to manage tickets.",
					});
				}
			}

			// Sync tiers
			const incomingIds = input.tiers
				.map((t) => t.id)
				.filter(Boolean) as string[];

			// Delete removed tiers that have 0 issued tickets
			const existingTiers = await ctx.prisma.ticket.findMany({
				where: { eventId: event.id },
				include: { issuedTickets: true },
			});

			for (const existing of existingTiers) {
				if (!incomingIds.includes(existing.id)) {
					if (existing.issuedTickets.length === 0) {
						await ctx.prisma.ticket.delete({ where: { id: existing.id } });
					} else {
						// Soft unpublish if tickets exist
						await ctx.prisma.ticket.update({
							where: { id: existing.id },
							data: { isPublished: false },
						});
					}
				}
			}

			// Upsert incoming tiers
			for (let i = 0; i < input.tiers.length; i++) {
				const t = input.tiers[i];
				const tierData = {
					name: t.name,
					description: t.description || null,
					price: t.price,
					quantity: t.quantity ?? null,
					maxPerOrder: t.maxPerOrder,
					salesStart: t.salesStart ? new Date(t.salesStart) : null,
					salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
					isPublished: t.isPublished,
					allowWaitlist: t.allowWaitlist,
					allowTransfer: t.allowTransfer,
					allowDrop: t.allowDrop,
					order: i,
				};

				if (t.id?.startsWith("cm")) {
					await ctx.prisma.ticket.update({
						where: { id: t.id },
						data: tierData,
					});
				} else {
					await ctx.prisma.ticket.create({
						data: {
							eventId: event.id,
							...tierData,
						},
					});
				}
			}

			return { success: true };
		}),

	ticketBook: publicProcedure
		.input(
			z.object({
				slug: z.string(),
				tierId: z.string(),
				attendeeName: z.string().min(1, "Name is required"),
				attendeeEmail: z.string().email("Invalid email address"),
				attendeePhone: z.string().optional(),
				answers: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await ctx.prisma.event.findUnique({
				where: { slug: input.slug },
				include: {
					tickets: {
						where: { id: input.tierId },
						include: {
							issuedTickets: {
								where: {
									status: { in: ["CONFIRMED", "CHECKED_IN", "WAITLISTED"] },
								},
							},
						},
					},
				},
			});

			if (!event)
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

			if (event.status !== "published") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"This event is currently in draft mode and not accepting registrations. The organizer must publish the event first.",
				});
			}

			const tier = event.tickets[0];
			if (!tier)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Ticket tier not found",
				});

			// Execute booking inside atomic transaction to eliminate concurrency overselling race conditions
			return ctx.prisma.$transaction(async (tx) => {
				// 1. Check if this attendee already has an active confirmed ticket for this tier
				const existingConfirmed = await tx.issuedTicket.findFirst({
					where: {
						ticketId: tier.id,
						attendeeEmail: {
							equals: input.attendeeEmail.trim(),
							mode: "insensitive",
						},
						status: { in: ["CONFIRMED", "CHECKED_IN"] },
					},
				});

				if (existingConfirmed) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "You already have a confirmed ticket for this tier.",
					});
				}

				// 2. Compute current confirmed count atomically
				const confirmedCount = await tx.issuedTicket.count({
					where: {
						ticketId: tier.id,
						status: { in: ["CONFIRMED", "CHECKED_IN"] },
					},
				});

				const isSoldOut =
					tier.quantity !== null && confirmedCount >= tier.quantity;

				// Generate code: OPT-XXXX-YYYY
				const randChars = () =>
					Math.random().toString(36).substring(2, 6).toUpperCase();
				const ticketCode = `OPT-${randChars()}-${randChars()}`;
				const qrToken = `qrv1_${crypto.randomUUID().replace(/-/g, "")}`;

				if (!isSoldOut) {
					// Capacity available -> Issue CONFIRMED ticket
					const issued = await tx.issuedTicket.create({
						data: {
							ticketId: tier.id,
							eventId: event.id,
							userId: ctx.userId ?? null,
							ticketCode,
							qrToken,
							attendeeName: input.attendeeName.trim(),
							attendeeEmail: input.attendeeEmail.trim().toLowerCase(),
							attendeePhone: input.attendeePhone?.trim() || null,
							answers: input.answers || null,
							status: "CONFIRMED",
						},
					});

					// Dispatch ticket confirmation email with embedded QR code
					sendTicketEmail({
						toEmail: issued.attendeeEmail,
						attendeeName: issued.attendeeName,
						eventTitle: event.title,
						eventStart: event.eventStart,
						location: event.location,
						ticketCode: issued.ticketCode,
						qrToken: issued.qrToken,
						tierName: tier.name,
					}).catch((err) =>
						console.error("Ticket email dispatch background error:", err),
					);

					return {
						status: "CONFIRMED" as const,
						ticketCode: issued.ticketCode,
						qrToken: issued.qrToken,
						message: "Your ticket has been confirmed!",
					};
				}

				// Sold Out -> Check waitlist eligibility
				if (!tier.allowWaitlist) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"This ticket tier is sold out and waitlisting is disabled.",
					});
				}

				const waitlistedCount = await tx.issuedTicket.count({
					where: {
						ticketId: tier.id,
						status: "WAITLISTED",
					},
				});
				const waitlistOrder = waitlistedCount + 1;

				const issuedWaitlist = await tx.issuedTicket.create({
					data: {
						ticketId: tier.id,
						eventId: event.id,
						userId: ctx.userId ?? null,
						ticketCode,
						qrToken,
						attendeeName: input.attendeeName.trim(),
						attendeeEmail: input.attendeeEmail.trim().toLowerCase(),
						attendeePhone: input.attendeePhone?.trim() || null,
						answers: input.answers || null,
						status: "WAITLISTED",
						waitlistOrder,
					},
				});

				return {
					status: "WAITLISTED" as const,
					ticketCode: issuedWaitlist.ticketCode,
					qrToken: issuedWaitlist.qrToken,
					waitlistOrder,
					message: `You are #${waitlistOrder} in the queue on the waitlist.`,
				};
			});
		}),

	ticketGetByCode: publicProcedure
		.input(z.object({ ticketCode: z.string() }))
		.query(async ({ ctx, input }) => {
			const ticket = await ctx.prisma.issuedTicket.findUnique({
				where: { ticketCode: input.ticketCode },
				include: {
					ticket: true,
					event: {
						select: {
							id: true,
							title: true,
							slug: true,
							eventStart: true,
							eventEnd: true,
							location: true,
							isOnline: true,
							onlineLink: true,
							organizer: {
								select: {
									id: true,
									name: true,
									slug: true,
									logoUrl: true,
								},
							},
						},
					},
					transfers: {
						orderBy: { createdAt: "desc" },
						take: 1,
					},
				},
			});

			if (!ticket) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
			}

			return ticket;
		}),

	ticketDrop: publicProcedure
		.input(
			z.object({
				ticketCode: z.string(),
				confirmAttendeeEmail: z.string().email().optional(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const ticket = await ctx.prisma.issuedTicket.findUnique({
				where: { ticketCode: input.ticketCode },
				include: {
					ticket: true,
					event: {
						select: {
							id: true,
							organizer: { select: { ownerId: true } },
						},
					},
				},
			});

			if (!ticket) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
			}

			// Security Authorization Check:
			const isOwner =
				ctx.userId &&
				(ticket.userId === ctx.userId ||
					ticket.event.organizer.ownerId === ctx.userId);
			const emailMatches =
				input.confirmAttendeeEmail &&
				input.confirmAttendeeEmail.trim().toLowerCase() ===
					ticket.attendeeEmail.toLowerCase();

			if (!isOwner && !emailMatches) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"To drop this ticket, please confirm your registered attendee email address.",
				});
			}

			if (ticket.status !== "CONFIRMED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cannot drop ticket with status ${ticket.status}`,
				});
			}

			if (!ticket.ticket.allowDrop) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Ticket dropping is not allowed for this tier.",
				});
			}

			// Atomic Drop and Waitlist Promotion Transaction
			return ctx.prisma.$transaction(async (tx) => {
				// 1. Mark ticket as DROPPED
				await tx.issuedTicket.update({
					where: { id: ticket.id },
					data: { status: "DROPPED" },
				});

				// 2. AUTO-WAITLIST PROMOTION ENGINE:
				const nextWaitlisted = await tx.issuedTicket.findFirst({
					where: {
						ticketId: ticket.ticketId,
						status: "WAITLISTED",
					},
					orderBy: [{ waitlistOrder: "asc" }, { createdAt: "asc" }],
				});

				let promotedAttendeeEmail: string | null = null;

				if (nextWaitlisted) {
					// Promote waitlisted attendee to CONFIRMED
					await tx.issuedTicket.update({
						where: { id: nextWaitlisted.id },
						data: {
							status: "CONFIRMED",
							waitlistOrder: null,
						},
					});
					promotedAttendeeEmail = nextWaitlisted.attendeeEmail;

					// Fetch ticket & event context for email dispatch
					const promotedTicket = await tx.issuedTicket.findUnique({
						where: { id: nextWaitlisted.id },
						include: { event: true, ticket: true },
					});

					if (promotedTicket) {
						sendTicketEmail({
							toEmail: promotedTicket.attendeeEmail,
							attendeeName: promotedTicket.attendeeName,
							eventTitle: promotedTicket.event.title,
							eventStart: promotedTicket.event.eventStart,
							location: promotedTicket.event.location,
							ticketCode: promotedTicket.ticketCode,
							qrToken: promotedTicket.qrToken,
							tierName: promotedTicket.ticket.name,
						}).catch((err) =>
							console.error("Promoted waitlist ticket email error:", err),
						);
					}
				}

				return {
					success: true,
					promotedAttendeeEmail,
					message: promotedAttendeeEmail
						? "Ticket dropped. The next attendee on the waitlist was automatically promoted to Confirmed!"
						: "Ticket dropped successfully.",
				};
			});
		}),

	ticketTransferInitiate: publicProcedure
		.input(
			z.object({
				ticketCode: z.string(),
				confirmSenderEmail: z.string().email().optional(),
				recipientName: z.string().min(1, "Recipient name is required"),
				recipientEmail: z.string().email("Invalid recipient email"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const ticket = await ctx.prisma.issuedTicket.findUnique({
				where: { ticketCode: input.ticketCode },
				include: {
					ticket: true,
					event: {
						select: {
							id: true,
							organizer: { select: { ownerId: true } },
						},
					},
				},
			});

			if (!ticket) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
			}

			// Security Authorization Check:
			const isOwner =
				ctx.userId &&
				(ticket.userId === ctx.userId ||
					ticket.event.organizer.ownerId === ctx.userId);
			const emailMatches =
				input.confirmSenderEmail &&
				input.confirmSenderEmail.trim().toLowerCase() ===
					ticket.attendeeEmail.toLowerCase();

			if (!isOwner && !emailMatches) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"To transfer this ticket, please confirm your registered attendee email address.",
				});
			}

			if (ticket.status !== "CONFIRMED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cannot transfer ticket with status ${ticket.status}`,
				});
			}

			if (!ticket.ticket.allowTransfer) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Ticket transfer is disabled for this tier.",
				});
			}

			if (
				ticket.attendeeEmail.toLowerCase() ===
				input.recipientEmail.toLowerCase()
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot transfer ticket to the same email address.",
				});
			}

			// Generate transfer token (valid for 48 hours)
			const transferToken = `tr_${crypto.randomUUID().replace(/-/g, "")}`;
			const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

			return ctx.prisma.$transaction(async (tx) => {
				// Invalidate any previously pending transfer tokens for this ticket
				await tx.ticketTransfer.updateMany({
					where: {
						issuedTicketId: ticket.id,
						status: "PENDING",
					},
					data: { status: "CANCELLED" },
				});

				const transfer = await tx.ticketTransfer.create({
					data: {
						issuedTicketId: ticket.id,
						senderEmail: ticket.attendeeEmail,
						recipientName: input.recipientName.trim(),
						recipientEmail: input.recipientEmail.trim().toLowerCase(),
						transferToken,
						expiresAt,
						status: "PENDING",
					},
				});

				return {
					success: true,
					transferToken: transfer.transferToken,
					expiresAt: transfer.expiresAt,
				};
			});
		}),

	ticketTransferGet: publicProcedure
		.input(z.object({ transferToken: z.string() }))
		.query(async ({ ctx, input }) => {
			const transfer = await ctx.prisma.ticketTransfer.findUnique({
				where: { transferToken: input.transferToken },
				include: {
					issuedTicket: {
						include: {
							ticket: true,
							event: {
								select: {
									id: true,
									title: true,
									slug: true,
									eventStart: true,
									eventEnd: true,
									location: true,
									organizer: {
										select: {
											name: true,
											logoUrl: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!transfer) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transfer invitation not found.",
				});
			}

			const isExpired = new Date() > new Date(transfer.expiresAt);

			return {
				transfer,
				isExpired,
			};
		}),

	ticketTransferClaim: publicProcedure
		.input(
			z.object({
				transferToken: z.string(),
				attendeeName: z.string().min(1, "Name is required"),
				attendeeEmail: z.string().email("Invalid email"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const transfer = await ctx.prisma.ticketTransfer.findUnique({
				where: { transferToken: input.transferToken },
				include: { issuedTicket: true },
			});

			if (!transfer) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transfer not found.",
				});
			}

			if (transfer.status !== "PENDING") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Transfer is already ${transfer.status}`,
				});
			}

			if (new Date() > new Date(transfer.expiresAt)) {
				await ctx.prisma.ticketTransfer.update({
					where: { id: transfer.id },
					data: { status: "EXPIRED" },
				});
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This transfer link has expired.",
				});
			}

			// Strict Cryptographic Recipient Validation (Pretix Standard)
			const normalizedClaimEmail = input.attendeeEmail.trim().toLowerCase();
			const normalizedTargetEmail = transfer.recipientEmail
				.trim()
				.toLowerCase();

			if (normalizedClaimEmail !== normalizedTargetEmail) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: `This transfer was issued exclusively for ${transfer.recipientEmail}. Please claim using the designated email address.`,
				});
			}

			// Generate fresh code and QR token for security
			const randChars = () =>
				Math.random().toString(36).substring(2, 6).toUpperCase();
			const newTicketCode = `OPT-${randChars()}-${randChars()}`;
			const newQrToken = `qrv1_${crypto.randomUUID().replace(/-/g, "")}`;

			// Execute atomically in a transaction
			await ctx.prisma.$transaction([
				ctx.prisma.issuedTicket.update({
					where: { id: transfer.issuedTicketId },
					data: {
						attendeeName: input.attendeeName.trim(),
						attendeeEmail: normalizedClaimEmail,
						ticketCode: newTicketCode,
						qrToken: newQrToken,
						userId: ctx.userId ?? null,
						status: "CONFIRMED",
					},
				}),
				ctx.prisma.ticketTransfer.update({
					where: { id: transfer.id },
					data: {
						status: "COMPLETED",
						completedAt: new Date(),
					},
				}),
			]);

			// Fetch updated ticket pass context for email receipt
			const claimedPass = await ctx.prisma.issuedTicket.findUnique({
				where: { id: transfer.issuedTicketId },
				include: { event: true, ticket: true },
			});

			if (claimedPass) {
				sendTicketEmail({
					toEmail: claimedPass.attendeeEmail,
					attendeeName: claimedPass.attendeeName,
					eventTitle: claimedPass.event.title,
					eventStart: claimedPass.event.eventStart,
					location: claimedPass.event.location,
					ticketCode: claimedPass.ticketCode,
					qrToken: claimedPass.qrToken,
					tierName: claimedPass.ticket.name,
				}).catch((err) =>
					console.error("Transferred ticket email dispatch error:", err),
				);
			}

			return {
				success: true,
				ticketCode: newTicketCode,
				message: "Ticket transfer completed successfully!",
			};
		}),

	ticketVerifyCheckIn: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				codeOrToken: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await assertEventAccess(
				ctx.prisma,
				input.slug,
				ctx.userId,
				["OWNER", "ADMIN", "EDITOR", "COORDINATOR", "VOLUNTEER", "DEVICE"],
			);

			const ticket = await ctx.prisma.issuedTicket.findFirst({
				where: {
					eventId: event.id,
					OR: [
						{ qrToken: input.codeOrToken },
						{ ticketCode: input.codeOrToken },
					],
				},
				include: { ticket: true },
			});

			if (!ticket) {
				return {
					valid: false,
					alreadyCheckedIn: false,
					attendeeName: null,
					attendeeEmail: null,
					ticketCode: null,
					tierName: null,
					checkedInAt: null,
					message: "Ticket not found for this event.",
				};
			}

			if (ticket.status === "CHECKED_IN") {
				return {
					valid: false,
					alreadyCheckedIn: true,
					attendeeName: ticket.attendeeName,
					attendeeEmail: ticket.attendeeEmail,
					ticketCode: ticket.ticketCode,
					tierName: ticket.ticket.name,
					checkedInAt: ticket.checkedInAt,
					message: `Already checked in at ${ticket.checkedInAt?.toLocaleTimeString()}`,
				};
			}

			if (ticket.status === "DROPPED" || ticket.status === "CANCELLED") {
				return {
					valid: false,
					alreadyCheckedIn: false,
					attendeeName: ticket.attendeeName,
					attendeeEmail: ticket.attendeeEmail,
					ticketCode: ticket.ticketCode,
					tierName: ticket.ticket.name,
					checkedInAt: null,
					message: `This ticket was ${ticket.status.toLowerCase()} and is invalid.`,
				};
			}

			if (ticket.status === "WAITLISTED") {
				return {
					valid: false,
					alreadyCheckedIn: false,
					attendeeName: ticket.attendeeName,
					attendeeEmail: ticket.attendeeEmail,
					ticketCode: ticket.ticketCode,
					tierName: ticket.ticket.name,
					checkedInAt: null,
					message:
						"This attendee is on the waitlist and has not been confirmed.",
				};
			}

			// Atomic State Transition (Eliminates Multi-Scanner Race Conditions)
			const now = new Date();
			const updateResult = await ctx.prisma.issuedTicket.updateMany({
				where: {
					id: ticket.id,
					status: "CONFIRMED", // Strictly matches only if still CONFIRMED
				},
				data: {
					status: "CHECKED_IN",
					checkedInAt: now,
				},
			});

			if (updateResult.count === 0) {
				// Another scanner checked in this exact ticket milliseconds ago!
				const reChecked = await ctx.prisma.issuedTicket.findUnique({
					where: { id: ticket.id },
				});

				return {
					valid: false,
					alreadyCheckedIn: true,
					attendeeName: ticket.attendeeName,
					attendeeEmail: ticket.attendeeEmail,
					ticketCode: ticket.ticketCode,
					tierName: ticket.ticket.name,
					checkedInAt: reChecked?.checkedInAt || now,
					message: `Already checked in at ${(reChecked?.checkedInAt || now).toLocaleTimeString()}`,
				};
			}

			return {
				valid: true,
				alreadyCheckedIn: false,
				attendeeName: ticket.attendeeName,
				attendeeEmail: ticket.attendeeEmail,
				ticketCode: ticket.ticketCode,
				tierName: ticket.ticket.name,
				checkedInAt: now,
				message: "Checked in successfully!",
			};
		}),

	manageGuestsList: authedProcedure
		.input(
			z.object({
				slug: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const event = await assertEventAccess(
				ctx.prisma,
				input.slug,
				ctx.userId,
				["OWNER", "ADMIN", "EDITOR", "COORDINATOR", "VOLUNTEER"],
			);

			const [issuedTickets, rsvpSubmissions, rsvpForm] = await Promise.all([
				ctx.prisma.issuedTicket.findMany({
					where: { eventId: event.id },
					include: {
						ticket: { select: { id: true, name: true, price: true } },
						user: { select: { id: true, name: true, image: true } },
					},
					orderBy: { createdAt: "desc" },
				}),
				ctx.prisma.rsvpSubmission.findMany({
					where: { eventId: event.id },
					include: {
						user: {
							select: { id: true, name: true, email: true, image: true },
						},
						checkIns: { select: { id: true, timestamp: true } },
					},
					orderBy: { createdAt: "desc" },
				}),
				ctx.prisma.rsvpForm.findUnique({
					where: { eventId: event.id },
					include: { customQuestions: { orderBy: { order: "asc" } } },
				}),
			]);

			return {
				event: {
					id: event.id,
					title: event.title,
					slug: event.slug,
					capacity: event.capacity,
				},
				issuedTickets,
				rsvpSubmissions,
				rsvpForm,
			};
		}),

	manageGuestToggleCheckIn: authedProcedure
		.input(
			z.object({
				slug: z.string(),
				guestType: z.enum(["ticket", "rsvp"]),
				id: z.string(),
				action: z.enum(["checkin", "undo"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const event = await assertEventAccess(
				ctx.prisma,
				input.slug,
				ctx.userId,
				["OWNER", "ADMIN", "EDITOR", "COORDINATOR", "VOLUNTEER"],
			);

			if (input.guestType === "ticket") {
				const ticket = await ctx.prisma.issuedTicket.findUnique({
					where: { id: input.id, eventId: event.id },
				});
				if (!ticket) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Ticket pass not found.",
					});
				}

				const newStatus =
					input.action === "checkin" ? "CHECKED_IN" : "CONFIRMED";
				const checkedInAt = input.action === "checkin" ? new Date() : null;

				return ctx.prisma.issuedTicket.update({
					where: { id: ticket.id },
					data: { status: newStatus, checkedInAt },
				});
			}

			const submission = await ctx.prisma.rsvpSubmission.findUnique({
				where: { id: input.id, eventId: event.id },
			});
			if (!submission) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "RSVP submission not found.",
				});
			}

			if (input.action === "checkin") {
				const existing = await ctx.prisma.rsvpCheckIn.findFirst({
					where: { submissionId: submission.id },
				});
				if (!existing) {
					await ctx.prisma.rsvpCheckIn.create({
						data: {
							submissionId: submission.id,
						},
					});
				}
			} else {
				await ctx.prisma.rsvpCheckIn.deleteMany({
					where: { submissionId: submission.id },
				});
			}
			return { success: true };
		}),

	// ─────────── Banner Upload ───────────

	bannerUploadUrl: authedProcedure
		.input(
			z.object({
				eventId: z.string(),
				fileType: z.enum([...ALLOWED_MIME_TYPES]),
				fileSize: z.number().max(MAX_BANNER_SIZE),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!supabaseAdmin) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage is not configured.",
				});
			}

			// Verify event exists and user has permission
			const event = await ctx.prisma.event.findUnique({
				where: { id: input.eventId },
				include: { organizer: { select: { ownerId: true } } },
			});
			if (!event) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}
			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to edit this event.",
					});
				}
			}

			// Sanitized storage path — no user input in the filename
			const ext =
				input.fileType.split("/")[1] === "jpeg"
					? "jpg"
					: input.fileType.split("/")[1];
			const storagePath = `${input.eventId}/${Date.now()}.${ext}`;

			// Create signed upload URL (expires in 2 minutes)
			const { data, error } = await supabaseAdmin.storage
				.from(BANNER_BUCKET)
				.createSignedUploadUrl(storagePath);

			if (error || !data) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Storage error: ${error?.message || "Unknown error"}`,
				});
			}

			// Build the public URL for after upload completes
			const { data: publicUrlData } = supabaseAdmin.storage
				.from(BANNER_BUCKET)
				.getPublicUrl(storagePath);

			return {
				signedUrl: data.signedUrl,
				token: data.token,
				storagePath,
				publicUrl: publicUrlData.publicUrl,
			};
		}),

	bannerConfirm: authedProcedure
		.input(
			z.object({
				eventId: z.string(),
				publicUrl: z.string().url(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify event exists and user has permission
			const event = await ctx.prisma.event.findUnique({
				where: { id: input.eventId },
				include: { organizer: { select: { ownerId: true } } },
			});
			if (!event) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}
			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to edit this event.",
					});
				}
			}

			return ctx.prisma.event.update({
				where: { id: input.eventId },
				data: { bannerUrl: input.publicUrl },
				select: { id: true, bannerUrl: true },
			});
		}),

	bannerDelete: authedProcedure
		.input(z.object({ eventId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (!supabaseAdmin) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage is not configured.",
				});
			}

			// Verify event exists and user has permission
			const event = await ctx.prisma.event.findUnique({
				where: { id: input.eventId },
				include: { organizer: { select: { ownerId: true } } },
			});
			if (!event) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}
			if (event.organizer.ownerId !== ctx.userId) {
				const membership = await ctx.prisma.organizerMember.findFirst({
					where: {
						organizerId: event.organizerId,
						userId: ctx.userId,
						role: { in: ["ADMIN", "EDITOR"] },
					},
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to edit this event.",
					});
				}
			}

			// Delete file from storage if bannerUrl exists
			if (event.bannerUrl) {
				try {
					// Extract path from URL: .../event-banners/<eventId>/<file>
					const url = new URL(event.bannerUrl);
					const pathParts = url.pathname.split(`/${BANNER_BUCKET}/`);
					if (pathParts[1]) {
						await supabaseAdmin.storage
							.from(BANNER_BUCKET)
							.remove([pathParts[1]]);
					}
				} catch {
					// Non-fatal: DB update still proceeds
					console.warn(
						"[banner] Failed to delete storage file:",
						event.bannerUrl,
					);
				}
			}

			return ctx.prisma.event.update({
				where: { id: input.eventId },
				data: { bannerUrl: null },
				select: { id: true, bannerUrl: true },
			});
		}),
});
