"use server";

import bcrypt from "bcryptjs";
import { prisma } from "db";

export type RegisterResult = {
	success?: boolean;
	error?: string;
};

export async function registerUser(
	formData: FormData,
): Promise<RegisterResult> {
	const rawName = formData.get("name");
	const rawEmail = formData.get("email");
	const rawPassword = formData.get("password");

	if (
		typeof rawEmail !== "string" ||
		typeof rawPassword !== "string" ||
		!rawEmail.trim() ||
		!rawPassword
	) {
		return { error: "Email and password are required" };
	}

	const name =
		typeof rawName === "string" && rawName.trim() ? rawName.trim() : null;
	const email = rawEmail.trim().toLowerCase();
	const password = rawPassword;

	try {
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return { error: "User already exists with this email" };
		}

		const passwordHash = await bcrypt.hash(password, 12);

		await prisma.user.create({
			data: {
				name,
				email,
				passwordHash,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Registration error:", error);
		return { error: "Something went wrong during registration" };
	}
}
