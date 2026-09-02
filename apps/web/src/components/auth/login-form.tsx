"use client";

import { registerUser } from "@/app/actions/auth";
import { getClientDeviceId } from "@/lib/device";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import type { JSX } from "react";

export function LoginForm(): JSX.Element {
	const searchParams = useSearchParams();
	const urlError = searchParams.get("error");

	const [isLogin, setIsLogin] = useState<boolean>(true);
	const [name, setName] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Ensure persistent device ID is initialized in cookies & localStorage
	useEffect(() => {
		getClientDeviceId();
	}, []);

	useEffect(() => {
		if (urlError === "OAuthAccountNotLinked") {
			setError(
				"An account with this email already exists under another sign-in method. Email account linking is now enabled — please click Sign In with GitHub again to link your accounts.",
			);
		} else if (urlError === "Configuration") {
			setError(
				"Authentication configuration error. Please check server settings.",
			);
		} else if (urlError) {
			setError("Authentication error occurred. Please try again.");
		}
	}, [urlError]);

	const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const normalizedEmail = email.trim().toLowerCase();

		try {
			if (isLogin) {
				const res = await signIn("credentials", {
					email: normalizedEmail,
					password,
					redirect: false,
				});

				if (res?.error) {
					setError("Invalid email or password");
					setIsLoading(false);
				} else {
					window.location.href = callbackUrl;
				}
			} else {
				const formData = new FormData();
				if (name.trim()) {
					formData.append("name", name.trim());
				}
				formData.append("email", normalizedEmail);
				formData.append("password", password);

				const result = await registerUser(formData);
				if (result.error) {
					setError(result.error);
					setIsLoading(false);
				} else {
					// Automatically log in after registration to complete onboarding
					await signIn("credentials", {
						email: normalizedEmail,
						password,
						callbackUrl: "/onboarding",
					});
				}
			}
		} catch {
			setError("Something went wrong. Please try again.");
			setIsLoading(false);
		}
	};

	const handleOAuthLogin = (provider: string) => {
		signIn(provider, { callbackUrl });
	};

	return (
		<div className="w-full max-w-sm mx-auto">
			<div className="text-center mb-8">
				<h1 className="font-display font-semibold text-h2 mb-2">
					{isLogin ? "Welcome back" : "Create an account"}
				</h1>
				<p className="text-body opacity-80">
					{isLogin
						? "Sign in to your makemyevent account"
						: "Sign up to start organizing and attending"}
				</p>
			</div>

			<div className="space-y-4 mb-8">
				<button
					type="button"
					onClick={() => handleOAuthLogin("github")}
					className="w-full flex items-center justify-center gap-4 bg-paper border border-perforation text-ink p-4 rounded-md hover:border-ink/30 transition-colors"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
						<path d="M9 18c-4.51 2-5-2-7-2" />
					</svg>
					<span className="label">Continue with GitHub</span>
				</button>

				<button
					type="button"
					onClick={() => handleOAuthLogin("google")}
					className="w-full flex items-center justify-center gap-4 bg-paper border border-perforation text-ink p-4 rounded-md hover:border-ink/30 transition-colors"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
						<path d="M2 12h20" />
					</svg>
					<span className="label">Continue with Google</span>
				</button>
			</div>

			<div className="relative mb-8 text-center">
				<div className="absolute inset-0 flex items-center" aria-hidden="true">
					<div className="w-full border-t border-perforation" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-paper px-4 label text-ink opacity-60">Or</span>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				{error && (
					<div className="p-3 mb-4 text-sm text-alert bg-alert/10 border border-alert/20 rounded-md text-center">
						{error}
					</div>
				)}
				{!isLogin && (
					<div>
						<label htmlFor="name" className="block label mb-2">
							Full name
						</label>
						<input
							id="name"
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							className="w-full bg-paper border border-perforation rounded-md px-4 py-4 text-body focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp"
						/>
					</div>
				)}
				<div>
					<label htmlFor="email" className="block label mb-2">
						Email address
					</label>
					<input
						id="email"
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						className="w-full bg-paper border border-perforation rounded-md px-4 py-4 text-body focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp"
					/>
				</div>
				<div>
					<label htmlFor="password" className="block label mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
						className="w-full bg-paper border border-perforation rounded-md px-4 py-4 text-body focus:outline-none focus:border-stamp focus:ring-1 focus:ring-stamp"
					/>
				</div>
				<button
					type="submit"
					disabled={isLoading}
					className="w-full bg-stamp text-paper label p-4 rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
				>
					{isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
				</button>
			</form>

			<div className="mt-6 text-center">
				<button
					type="button"
					onClick={() => {
						setIsLogin(!isLogin);
						setError(null);
					}}
					className="text-body text-sm underline hover:text-stamp transition-colors"
				>
					{isLogin
						? "Don't have an account? Sign up"
						: "Already have an account? Sign in"}
				</button>
			</div>

			<p className="mt-8 text-center text-body text-sm opacity-60">
				By continuing, you agree to our{" "}
				<Link href="#" className="underline hover:text-ink">
					Terms of Service
				</Link>{" "}
				and{" "}
				<Link href="#" className="underline hover:text-ink">
					Privacy Policy
				</Link>
				.
			</p>
		</div>
	);
}
