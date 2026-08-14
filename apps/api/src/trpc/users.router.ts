import bcrypt from "bcryptjs";
import { z } from "zod";
import { publicProcedure, router } from "./trpc";

export const usersRouter = router({
	getProfile: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const user = await ctx.prisma.user.findUnique({
				where: { id: input.userId },
				select: {
					id: true,
					name: true,
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
					passwordHash: true,
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
							expires: true,
						},
						orderBy: {
							expires: "desc",
						},
					},
				},
			});

			if (!user) {
				throw new Error("User not found.");
			}

			const totalHostedEvents = user.organizers.reduce(
				(acc, org) => acc + org._count.events,
				0,
			);

			const { passwordHash, ...safeUser } = user;

			return {
				...safeUser,
				hasPassword: Boolean(passwordHash),
				totalHostedEvents,
			};
		}),

	updateBasicInfo: publicProcedure
		.input(
			z.object({
				userId: z.string(),
				name: z.string().min(1, "Name cannot be empty").max(100),
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
			const updated = await ctx.prisma.user.update({
				where: { id: input.userId },
				data: {
					name: input.name.trim(),
					phone: input.phone?.trim() || null,
					image: input.image?.trim() || null,
				},
				select: {
					id: true,
					name: true,
					phone: true,
					image: true,
				},
			});

			return updated;
		}),

	updateSocials: publicProcedure
		.input(
			z.object({
				userId: z.string(),
				whatsapp: z.string().max(50).optional().nullable(),
				instagram: z.string().max(100).optional().nullable(),
				twitter: z.string().max(100).optional().nullable(),
				linkedin: z.string().max(100).optional().nullable(),
				facebook: z.string().max(100).optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const updated = await ctx.prisma.user.update({
				where: { id: input.userId },
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

	changePassword: publicProcedure
		.input(
			z.object({
				userId: z.string(),
				currentPassword: z.string().optional(),
				newPassword: z
					.string()
					.min(8, "Password must be at least 8 characters"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.prisma.user.findUnique({
				where: { id: input.userId },
				select: { id: true, passwordHash: true },
			});

			if (!user) {
				throw new Error("User not found.");
			}

			// If user already has a password, verify current password
			if (user.passwordHash) {
				if (!input.currentPassword) {
					throw new Error("Current password is required.");
				}
				const isValid = await bcrypt.compare(
					input.currentPassword,
					user.passwordHash,
				);
				if (!isValid) {
					throw new Error("Incorrect current password.");
				}
			}

			// Hash new password with bcrypt cost factor 12
			const newHash = await bcrypt.hash(input.newPassword, 12);

			await ctx.prisma.user.update({
				where: { id: input.userId },
				data: { passwordHash: newHash },
			});

			return { success: true };
		}),

	logoutAllDevices: publicProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.session.deleteMany({
				where: { userId: input.userId },
			});

			return { success: true };
		}),
});
