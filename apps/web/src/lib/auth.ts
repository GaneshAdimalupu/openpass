import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type UserRole, prisma } from "db";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { cookies, headers } from "next/headers";
import { parseUserAgent } from "./device";

const providers: Provider[] = [
	CredentialsProvider({
		name: "Credentials",
		credentials: {
			email: { label: "Email", type: "email" },
			password: { label: "Password", type: "password" },
		},
		async authorize(credentials) {
			if (!credentials?.email || !credentials?.password) {
				return null;
			}

			const email = (credentials.email as string).trim().toLowerCase();

			const user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user?.passwordHash) {
				return null;
			}

			const isPasswordValid = await bcrypt.compare(
				credentials.password as string,
				user.passwordHash,
			);

			if (!isPasswordValid) {
				return null;
			}

			return {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image,
				role: user.role,
			};
		},
	}),
];

if (
	(process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID) &&
	(process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET)
) {
	providers.push(
		GitHubProvider({
			clientId:
				process.env.AUTH_GITHUB_ID || (process.env.GITHUB_CLIENT_ID as string),
			clientSecret:
				process.env.AUTH_GITHUB_SECRET ||
				(process.env.GITHUB_CLIENT_SECRET as string),
			// Safe: GitHub verifies email ownership. Allows credential-registered
			// users to later link their GitHub account without OAuthAccountNotLinked.
			allowDangerousEmailAccountLinking: true,
		}),
	);
}

if (
	(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
	(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET)
) {
	providers.push(
		GoogleProvider({
			clientId:
				process.env.AUTH_GOOGLE_ID || (process.env.GOOGLE_CLIENT_ID as string),
			clientSecret:
				process.env.AUTH_GOOGLE_SECRET ||
				(process.env.GOOGLE_CLIENT_SECRET as string),
			// Safe: Google verifies email ownership. Allows credential-registered
			// users to later link their Google account without OAuthAccountNotLinked.
			allowDangerousEmailAccountLinking: true,
		}),
	);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
	adapter: PrismaAdapter(prisma),
	session: { strategy: "jwt" },
	trustHost: true,
	secret: (() => {
		const s = process.env.AUTH_SECRET;
		if (!s) {
			throw new Error(
				"Missing AUTH_SECRET environment variable. Auth cannot start without a signing secret.",
			);
		}
		return s;
	})(),
	pages: {
		signIn: "/login",
	},
	providers,
	events: {
		async signOut(message) {
			if ("token" in message && message.token?.sessionToken) {
				try {
					await prisma.session.deleteMany({
						where: { sessionToken: message.token.sessionToken as string },
					});
				} catch {
					// session cleanup ignore
				}
			}
		},
	},
	callbacks: {
		async jwt({ token, user, profile }) {
			const userId = (user?.id || token.id || token.sub) as string | undefined;

			if (user) {
				if (userId) {
					token.id = userId;
					token.sub = userId;
				}
				token.name = user.name || profile?.name || token.name;
				token.picture =
					user.image ||
					(profile as { picture?: string })?.picture ||
					(profile as { avatar_url?: string })?.avatar_url ||
					token.picture;
				token.role = user.role || token.role;

				// Generate persistent session token
				const sessionToken =
					(token.sessionToken as string) || crypto.randomUUID();
				token.sessionToken = sessionToken;

				// ──────────────── Smart Device Tracking & Session Management ────────────────
				let userAgent: string | null = null;
				let ipAddress: string | null = null;
				let deviceId: string | null = null;

				try {
					const reqHeaders = await headers();
					userAgent = reqHeaders.get("user-agent") || null;
					ipAddress =
						reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
						reqHeaders.get("x-real-ip") ||
						null;
				} catch {
					// safe fallback in environments where headers() is not available
				}

				try {
					const cookieStore = await cookies();
					deviceId =
						cookieStore.get("makemyevent_device_id")?.value ||
						cookieStore.get("openevents_device_id")?.value ||
						null;
				} catch {
					// safe fallback in environments where cookies() is not available
				}

				const { browser, os, deviceType } = parseUserAgent(userAgent);
				const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

				if (userId) {
					try {
						// 1. Match session by unique sessionToken or explicit deviceId
						let existingSession = null;
						if (sessionToken) {
							existingSession = await prisma.session.findFirst({
								where: {
									userId,
									sessionToken,
								},
							});
						}

						if (!existingSession && deviceId) {
							existingSession = await prisma.session.findFirst({
								where: {
									userId,
									deviceId,
								},
							});
						}

						if (existingSession) {
							// Reuse and update the existing device session without creating duplicates
							await prisma.session.update({
								where: { id: existingSession.id },
								data: {
									sessionToken,
									expires,
									lastActive: new Date(),
									userAgent,
									browser,
									os,
									deviceType,
									ipAddress,
									deviceId: deviceId || existingSession.deviceId,
								},
							});
						} else {
							// First login on this device -> create a new device session record
							await prisma.session.create({
								data: {
									sessionToken,
									userId,
									expires,
									lastActive: new Date(),
									userAgent,
									browser,
									os,
									deviceType,
									ipAddress,
									deviceId,
								},
							});
						}
						// Mark that session was successfully persisted. The refresh path
						// uses this flag to distinguish "never created" (safe to heal)
						// from "explicitly revoked" (must honour the revocation).
						token.sessionRecordedAt = Date.now();
					} catch (err) {
						console.error("Session recording notice:", err);
					}
				}

				// Auto-link any pending team invitations or volunteer assignments matching user's email
				if (user.email) {
					try {
						const normalizedEmail = user.email.toLowerCase();
						await Promise.all([
							prisma.organizerMember.updateMany({
								where: { email: normalizedEmail, userId: null },
								data: { userId: userId as string },
							}),
							prisma.communityMember.updateMany({
								where: { email: normalizedEmail, userId: null },
								data: { userId: userId as string },
							}),
							prisma.eventVolunteer.updateMany({
								where: { email: normalizedEmail, userId: null },
								data: { userId: userId as string },
							}),
						]);
					} catch {
						// background link ignore
					}
				}

				// If user exists in DB but name or image is null, sync from OAuth profile
				if (userId && profile) {
					try {
						const profileName = profile.name;
						const profileImage =
							(profile as { picture?: string })?.picture ||
							(profile as { avatar_url?: string })?.avatar_url;

						const updateData: { name?: string; image?: string } = {};
						if (!user.name && profileName) {
							updateData.name = profileName;
						}
						if (!user.image && profileImage) {
							updateData.image = profileImage;
						}

						if (Object.keys(updateData).length > 0) {
							await prisma.user.update({
								where: { id: userId },
								data: updateData,
							});
						}
					} catch {
						// background sync ignore
					}
				}
			} else if (userId) {
				// ──────────────── Token Refresh & Remote Revocation Check ────────────────
				token.id = userId;
				token.sub = userId;
				const sessionToken = token.sessionToken as string | undefined;

				if (sessionToken) {
					try {
						const activeSession = await prisma.session.findFirst({
							where: {
								userId,
								sessionToken,
								expires: { gte: new Date() },
							},
							select: { id: true, lastActive: true },
						});

						if (!activeSession) {
							// ── Distinguish "never persisted" from "explicitly revoked" ──
							// sessionRecordedAt is set only after a successful DB write.
							// If it exists, the session was known-good and its absence
							// means the user (or an admin) deliberately revoked it via
							// logoutDevice / logoutAllDevices. Honour that revocation.
							const wasRecorded = typeof token.sessionRecordedAt === "number";

							if (wasRecorded) {
								// Explicit revocation — invalidate JWT immediately
								return null;
							}

							// Session was never successfully persisted (transient DB error
							// or race during initial OAuth callback). Verify the user
							// account still exists before attempting a one-time heal.
							const dbUser = await prisma.user.findUnique({
								where: { id: userId },
								select: { id: true, name: true, image: true, role: true },
							});

							if (!dbUser) {
								// User account deleted — revoke
								return null;
							}

							// Re-create the missing session record (one-time heal)
							let userAgent: string | null = null;
							let ipAddress: string | null = null;
							let deviceId: string | null = null;

							try {
								const reqHeaders = await headers();
								userAgent = reqHeaders.get("user-agent") || null;
								ipAddress =
									reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
									reqHeaders.get("x-real-ip") ||
									null;
							} catch {
								// safe fallback
							}

							try {
								const cookieStore = await cookies();
								deviceId =
									cookieStore.get("makemyevent_device_id")?.value ||
									cookieStore.get("openevents_device_id")?.value ||
									null;
							} catch {
								// safe fallback
							}

							const { browser, os, deviceType } = parseUserAgent(userAgent);
							const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

							try {
								await prisma.session.create({
									data: {
										sessionToken,
										userId,
										expires,
										lastActive: new Date(),
										userAgent,
										browser,
										os,
										deviceType,
										ipAddress,
										deviceId,
									},
								});
								// Persist flag so future missing-record checks correctly
								// treat the absence as explicit revocation, not creation failure
								token.sessionRecordedAt = Date.now();
							} catch {
								// Heal failed — will retry on next request
							}

							if (dbUser.name) token.name = dbUser.name;
							if (dbUser.image) token.picture = dbUser.image;
							if (dbUser.role) token.role = dbUser.role;
						} else {
							// Session exists — ensure sessionRecordedAt is set
							// (migration path for JWTs issued before this flag existed)
							if (typeof token.sessionRecordedAt !== "number") {
								token.sessionRecordedAt = Date.now();
							}

							// Update lastActive if more than 5 minutes have elapsed since last DB update
							const lastUpdated = (token.lastActiveUpdated as number) || 0;
							const fiveMinutes = 5 * 60 * 1000;
							if (Date.now() - lastUpdated > fiveMinutes) {
								await prisma.session.update({
									where: { id: activeSession.id },
									data: { lastActive: new Date() },
								});
								token.lastActiveUpdated = Date.now();
							}
						}
					} catch (err) {
						// Gracefully handle transient DB errors without kicking out user
						console.error("Session verification notice:", err);
					}
				}

				// Refresh from DB if name or image is missing from token
				if (!token.name || !token.picture) {
					try {
						const dbUser = await prisma.user.findUnique({
							where: { id: userId },
							select: { name: true, image: true, role: true },
						});
						if (dbUser) {
							if (dbUser.name) {
								token.name = dbUser.name;
							}
							if (dbUser.image) {
								token.picture = dbUser.image;
							}
							if (dbUser.role) {
								token.role = dbUser.role;
							}
						}
					} catch {
						// ignore
					}
				}
			}
			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				const userId = (token.id || token.sub) as string | undefined;
				if (userId) {
					session.user.id = userId;
				}
				if (typeof token.name === "string") {
					session.user.name = token.name;
				}
				if (typeof token.picture === "string") {
					session.user.image = token.picture;
				}
				if (typeof token.role === "string") {
					session.user.role = token.role as UserRole;
				}
				if (typeof token.sessionToken === "string") {
					(session as unknown as { sessionToken: string }).sessionToken =
						token.sessionToken;
				}
			}
			return session;
		},
	},
});
