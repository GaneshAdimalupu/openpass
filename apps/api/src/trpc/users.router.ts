import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authedProcedure, router } from "./trpc";

export const usersRouter = router({
	getProfile: authedProcedure.query(async ({ ctx }) => {
		const [user, pwCheck] = await Promise.all([
			ctx.prisma.user.findUnique({
				where: { id: ctx.userId },
				select: {
					id: true,
					name: true,
					username: true,
					email: true,
					phone: true,
					image: true,
					role: true,
					identityProvider: true,
					whatsapp: true,
					instagram: true,
					twitter: true,
					linkedin: true,
					facebook: true,
					createdAt: true,
					organizers: {
						select: {
							id: true,
							name: true,
							slug: true,
							type: true,
							category: true,
							_count: {
								select: {
									events: true,
								},
							},
						},
					},
					sessions: {
						select: {
							id: true,
							deviceId: true,
							browser: true,
							os: true,
							deviceType: true,
							ipAddress: true,
							lastActive: true,
							expires: true,
							createdAt: true,
						},
						orderBy: {
							lastActive: "desc",
						},
					},
				},
			}),
			ctx.prisma.user.findUnique({
				where: { id: ctx.userId },
				select: { passwordHash: true },
			}),
		]);

		if (!user) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "User not found.",
			});
		}

		const totalHostedEvents = user.organizers.reduce(
			(acc, org) => acc + org._count.events,
			0,
		);

		return {
			...user,
			hasPassword: Boolean(pwCheck?.passwordHash),
			totalHostedEvents,
		};
	}),

	updateBasicInfo: authedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Name cannot be empty").max(100),
				username: z.string().max(30).optional().nullable(),
				phone: z.string().max(30).optional().nullable(),
				image: z
					.string()
					.url("Must be a valid URL")
					.optional()
					.nullable()
					.or(z.literal("")),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			let formattedUsername: string | null = null;
			if (input.username?.trim()) {
				formattedUsername = input.username
					.trim()
					.toLowerCase()
					.replace(/^@/, "");

				if (!/^[a-z0-9_-]{3,30}$/.test(formattedUsername)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Username must be 3-30 characters and contain only lowercase letters, numbers, hyphens, and underscores.",
					});
				}

				const existing = await ctx.prisma.user.findFirst({
					where: {
						username: formattedUsername,
						NOT: { id: ctx.userId },
					},
				});

				if (existing) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "This username is already taken.",
					});
				}
			}

			const updated = await ctx.prisma.user.update({
				where: { id: ctx.userId },
				data: {
					name: input.name.trim(),
					username: formattedUsername,
					phone: input.phone?.trim() || null,
					image: input.image?.trim() || null,
				},
				select: {
					id: true,
					name: true,
					username: true,
					phone: true,
					image: true,
				},
			});

			return updated;
		}),

	updateSocials: authedProcedure
		.input(
			z.object({
				whatsapp: z.string().max(50).optional().nullable(),
				instagram: z.string().max(100).optional().nullable(),
				twitter: z.string().max(100).optional().nullable(),
				linkedin: z.string().max(100).optional().nullable(),
				facebook: z.string().max(100).optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const updated = await ctx.prisma.user.update({
				where: { id: ctx.userId },
				data: {
					whatsapp: input.whatsapp?.trim() || null,
					instagram: input.instagram?.trim() || null,
					twitter: input.twitter?.trim() || null,
					linkedin: input.linkedin?.trim() || null,
					facebook: input.facebook?.trim() || null,
				},
				select: {
					id: true,
					whatsapp: true,
					instagram: true,
					twitter: true,
					linkedin: true,
					facebook: true,
				},
			});

			return updated;
		}),

	changePassword: authedProcedure
		.input(
			z.object({
				currentPassword: z.string().optional(),
				newPassword: z
					.string()
					.min(8, "Password must be at least 8 characters"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.prisma.user.findUnique({
				where: { id: ctx.userId },
				select: { id: true, passwordHash: true },
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found.",
				});
			}

			// If user already has a password, verify current password
			if (user.passwordHash) {
				if (!input.currentPassword) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Current password is required.",
					});
				}
				const isValid = await bcrypt.compare(
					input.currentPassword,
					user.passwordHash,
				);
				if (!isValid) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Incorrect current password.",
					});
				}
			}

			// Hash new password with bcrypt cost factor 12
			const newHash = await bcrypt.hash(input.newPassword, 12);

			await ctx.prisma.user.update({
				where: { id: ctx.userId },
				data: { passwordHash: newHash },
			});

			return { success: true };
		}),

	logoutDevice: authedProcedure
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Only allow deleting sessions owned by the current user
			await ctx.prisma.session.deleteMany({
				where: { id: input.sessionId, userId: ctx.userId },
			});

			return { success: true };
		}),

	logoutAllDevices: authedProcedure
		.input(z.object({ exceptSessionId: z.string().optional() }).optional())
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.session.deleteMany({
				where: {
					userId: ctx.userId,
					...(input?.exceptSessionId && {
						id: { not: input.exceptSessionId },
					}),
				},
			});

			return { success: true };
		}),
});
