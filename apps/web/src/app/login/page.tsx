import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { type JSX, Suspense } from "react";

export default function LoginPage(): JSX.Element {
	return (
		<div className="min-h-screen bg-paper flex flex-col">
			<header className="border-b border-perforation py-4">
				<div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
					<Link
						href="/"
						className="font-display font-semibold text-h3 text-ink"
					>
						makemyevent
					</Link>
				</div>
			</header>

			<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-24 flex items-center justify-center">
				<Suspense
					fallback={
						<div className="p-8 text-center text-ink/60 label">Loading...</div>
					}
				>
					<LoginForm />
				</Suspense>
			</main>
		</div>
	);
}
