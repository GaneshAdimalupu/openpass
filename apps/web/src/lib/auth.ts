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

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
	providers.push(
		GitHubProvider({
			clientId: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			allowDangerousEmailAccountLinking: true,
		}),
	);
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
	providers.push(
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			allowDangerousEmailAccountLinking: true,
		}),
	);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
	adapter: PrismaAdapter(prisma),
	session: { strategy: "jwt" },
	trustHost: true,
	secret: (() => {
		const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
		if (!s) {
			throw new Error(
				"Missing AUTH_SECRET or NEXTAUTH_SECRET environment variable. Auth cannot start without a signing secret.",
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
			if (user) {
				token.id = user.id;
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
					deviceId = cookieStore.get("openevents_device_id")?.value || null;
				} catch {
					// safe fallback in environments where cookies() is not available
				}

				const { browser, os, deviceType } = parseUserAgent(userAgent);
				const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

				try {
					// 1. Check if an active session already exists for this physical device/browser
					let existingSession = null;
					if (deviceId) {
						existingSession = await prisma.session.findFirst({
							where: {
								userId: user.id as string,
								deviceId,
							},
						});
					}

					// 2. Fallback: match by device signature if deviceId cookie was cleared
					if (!existingSession && userAgent) {
						existingSession = await prisma.session.findFirst({
							where: {
								userId: user.id as string,
								os,
								browser,
								deviceType,
							},
							orderBy: { lastActive: "desc" },
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
								userId: user.id as string,
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
				} catch (err) {
					console.error("Session recording notice:", err);
				}

				// If user exists in DB but name or image is null, sync from OAuth profile
				if (token.id && profile) {
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
								where: { id: token.id as string },
								data: updateData,
							});
						}
					} catch {
						// background sync ignore
					}
				}
			} else if (token.id) {
				// Refresh from DB if name or image is missing from token
				if (!token.name || !token.picture) {
					try {
						const dbUser = await prisma.user.findUnique({
							where: { id: token.id as string },
							select: { name: true, image: true, role: true, email: true },
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
				if (typeof token.id === "string") {
					session.user.id = token.id;
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
