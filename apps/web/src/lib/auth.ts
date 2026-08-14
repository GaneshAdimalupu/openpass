import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type UserRole, prisma } from "db";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

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

const githubId =
	process.env.AUTH_GITHUB_ID ||
	process.env.GITHUB_CLIENT_ID ||
	process.env.GITHUB_ID;
const githubSecret =
	process.env.AUTH_GITHUB_SECRET ||
	process.env.GITHUB_CLIENT_SECRET ||
	process.env.GITHUB_SECRET;

if (githubId && githubSecret) {
	providers.push(
		GitHubProvider({
			clientId: githubId,
			clientSecret: githubSecret,
			allowDangerousEmailAccountLinking: true,
		}),
	);
}

const googleId =
	process.env.AUTH_GOOGLE_ID ||
	process.env.GOOGLE_CLIENT_ID ||
	process.env.GOOGLE_ID;
const googleSecret =
	process.env.AUTH_GOOGLE_SECRET ||
	process.env.GOOGLE_CLIENT_SECRET ||
	process.env.GOOGLE_SECRET;

if (googleId && googleSecret) {
	providers.push(
		GoogleProvider({
			clientId: googleId,
			clientSecret: googleSecret,
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

				// Generate unique session token for this device and record in database
				const sessionToken =
					(token.sessionToken as string) || crypto.randomUUID();
				token.sessionToken = sessionToken;

				try {
					const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
					await prisma.session.upsert({
						where: { sessionToken },
						update: { expires },
						create: {
							sessionToken,
							userId: user.id as string,
							expires,
						},
					});
				} catch {
					// session tracking background sync
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
				// Verify session is still valid in database (if revoked remotely, kick out)
				if (token.sessionToken) {
					try {
						const activeSession = await prisma.session.findUnique({
							where: { sessionToken: token.sessionToken as string },
						});
						if (!activeSession) {
							// Session was revoked remotely! Invalidate this JWT token immediately
							return null;
						}
					} catch {
						// session check background ignore
					}
				}

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
			if (!token?.id) {
				return null as unknown as typeof session;
			}
			if (session.user) {
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
