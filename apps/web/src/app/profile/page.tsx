"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { trpc } from "@/lib/trpc";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { JSX } from "react";

export default function ProfilePage(): JSX.Element {
	const { data: session, status } = useSession();
	const userId = session?.user?.id;

	const {
		data: profile,
		isLoading,
		refetch,
	} = trpc.users.getProfile.useQuery(
		{ userId: userId as string },
		{ enabled: !!userId },
	);

	const updateBasicInfoMutation = trpc.users.updateBasicInfo.useMutation();
	const updateSocialsMutation = trpc.users.updateSocials.useMutation();
	const changePasswordMutation = trpc.users.changePassword.useMutation();
	const logoutAllDevicesMutation = trpc.users.logoutAllDevices.useMutation();

	// Modal States
	const [isBasicInfoOpen, setIsBasicInfoOpen] = useState<boolean>(false);
	const [isSocialsOpen, setIsSocialsOpen] = useState<boolean>(false);
	const [isPasswordOpen, setIsPasswordOpen] = useState<boolean>(false);

	// Form States - Basic Info
	const [nameInput, setNameInput] = useState<string>("");
	const [phoneInput, setPhoneInput] = useState<string>("");
	const [imageInput, setImageInput] = useState<string>("");
	const [basicInfoError, setBasicInfoError] = useState<string | null>(null);

	// Form States - Socials
	const [whatsappInput, setWhatsappInput] = useState<string>("");
	const [instagramInput, setInstagramInput] = useState<string>("");
	const [twitterInput, setTwitterInput] = useState<string>("");
	const [linkedinInput, setLinkedinInput] = useState<string>("");
	const [facebookInput, setFacebookInput] = useState<string>("");
	const [socialsError, setSocialsError] = useState<string | null>(null);

	// Form States - Password
	const [currentPassword, setCurrentPassword] = useState<string>("");
	const [newPassword, setNewPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

	// Success Toast state
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const showToast = (msg: string) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(null), 3000);
	};

	// Preload form inputs when profile loads
	useEffect(() => {
		if (profile) {
			setNameInput(profile.name || "");
			setPhoneInput(profile.phone || "");
			setImageInput(profile.image || "");
			setWhatsappInput(profile.whatsapp || "");
			setInstagramInput(profile.instagram || "");
			setTwitterInput(profile.twitter || "");
			setLinkedinInput(profile.linkedin || "");
			setFacebookInput(profile.facebook || "");
		}
	}, [profile]);

	if (status === "unauthenticated") {
		return (
			<div className="min-h-screen bg-paper flex flex-col">
				<SiteHeader />
				<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
					<h1 className="font-display font-semibold text-h2 mb-4">
						Sign In Required
					</h1>
					<p className="text-body opacity-80 max-w-md mb-8">
						Please sign in to view and manage your profile settings.
					</p>
					<Link
						href="/login"
						className="bg-stamp text-paper label px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
					>
						Sign In
					</Link>
				</main>
			</div>
		);
	}

	const handleSaveBasicInfo = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userId) return;
		setBasicInfoError(null);

		try {
			await updateBasicInfoMutation.mutateAsync({
				userId,
				name: nameInput.trim(),
				phone: phoneInput.trim() || null,
				image: imageInput.trim() || null,
			});
			await refetch();
			setIsBasicInfoOpen(false);
			showToast("Basic information updated successfully");
		} catch (err: unknown) {
			setBasicInfoError(
				err instanceof Error ? err.message : "Failed to update profile",
			);
		}
	};

	const handleSaveSocials = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userId) return;
		setSocialsError(null);

		try {
			await updateSocialsMutation.mutateAsync({
				userId,
				whatsapp: whatsappInput.trim() || null,
				instagram: instagramInput.trim() || null,
				twitter: twitterInput.trim() || null,
				linkedin: linkedinInput.trim() || null,
				facebook: facebookInput.trim() || null,
			});
			await refetch();
			setIsSocialsOpen(false);
			showToast("Social links and communications updated");
		} catch (err: unknown) {
			setSocialsError(
				err instanceof Error ? err.message : "Failed to update socials",
			);
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userId) return;
		setPasswordError(null);

		if (newPassword !== confirmPassword) {
			setPasswordError("New passwords do not match.");
			return;
		}

		if (newPassword.length < 8) {
			setPasswordError("Password must be at least 8 characters.");
			return;
		}

		try {
			await changePasswordMutation.mutateAsync({
				userId,
				currentPassword: currentPassword || undefined,
				newPassword,
			});
			setPasswordSuccess(true);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setTimeout(() => {
				setIsPasswordOpen(false);
				setPasswordSuccess(false);
				showToast("Password updated successfully");
			}, 1000);
		} catch (err: unknown) {
			setPasswordError(
				err instanceof Error ? err.message : "Failed to change password",
			);
		}
	};

	const handleLogoutAllDevices = async () => {
		if (!userId) return;
		if (
			confirm(
				"Are you sure you want to log out all other active sessions on your account?",
			)
		) {
			await logoutAllDevicesMutation.mutateAsync({ userId });
			await refetch();
			showToast("Logged out all other sessions");
		}
	};

	const handleInitial =
		profile?.name?.charAt(0).toUpperCase() ||
		profile?.email?.charAt(0).toUpperCase() ||
		"U";

	// Generate clean handle from name or email
	const handleSlug =
		profile?.organizers?.[0]?.slug ||
		profile?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
		profile?.email?.split("@")[0];

	return (
		<div className="min-h-screen bg-paper flex flex-col">
			<SiteHeader />

			{/* Floating Toast Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-ink text-paper px-4 py-3 rounded-lg shadow-lg border border-perforation text-xs font-mono animate-in fade-in slide-in-from-bottom-2">
					✓ {toastMessage}
				</div>
			)}

			<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
				{/* Top Back Action */}
				<div>
					<Link
						href="/dashboard"
						className="label inline-flex items-center gap-1.5 text-xs text-ink opacity-70 hover:opacity-100 transition-opacity"
					>
						<span>←</span>
						<span>Back to Dashboard</span>
					</Link>
				</div>

				{isLoading ? (
					<div className="space-y-6 animate-pulse">
						<div className="h-48 bg-perforation/30 rounded-lg" />
						<div className="h-64 bg-perforation/30 rounded-lg" />
					</div>
				) : (
					<>
						{/* ──────────────── 1. Profile Header Card ──────────────── */}
						<div className="border border-perforation rounded-lg p-6 sm:p-8 bg-paper/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
							<div className="flex items-start sm:items-center gap-5">
								{/* Profile Avatar / Photo */}
								<div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-perforation/30 border border-perforation flex items-center justify-center font-display font-semibold text-2xl text-ink shrink-0 overflow-hidden">
									{profile?.image ? (
										<Image
											src={profile.image}
											alt={profile.name || "User Avatar"}
											fill
											unoptimized
											className="object-cover"
										/>
									) : (
										<span>{handleInitial}</span>
									)}
								</div>

								{/* Details */}
								<div className="space-y-1">
									<h1 className="font-display font-semibold text-h2 text-ink">
										{profile?.name || "Your Name"}
									</h1>
									<p className="font-mono text-xs opacity-60">@{handleSlug}</p>
									<p className="font-mono text-xs opacity-80 text-ink">
										{profile?.email}
									</p>

									{/* Social & Contact Icons Strip */}
									<div className="flex items-center gap-3 pt-2 flex-wrap">
										{profile?.email && (
											<a
												href={`mailto:${profile.email}`}
												title={profile.email}
												className="text-ink opacity-60 hover:opacity-100 hover:text-stamp transition-colors flex items-center gap-1"
											>
												<svg
													aria-hidden="true"
													className="w-4 h-4"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<rect width="20" height="16" x="2" y="4" rx="2" />
													<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
												</svg>
												<span className="sr-only">Email: {profile.email}</span>
											</a>
										)}

										{profile?.instagram && (
											<a
												href={
													profile.instagram.startsWith("http")
														? profile.instagram
														: `https://instagram.com/${profile.instagram.replace("@", "")}`
												}
												target="_blank"
												rel="noopener noreferrer"
												title="Instagram"
												className="text-ink opacity-60 hover:opacity-100 hover:text-stamp transition-colors flex items-center gap-1"
											>
												<svg
													aria-hidden="true"
													className="w-4 h-4"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<rect
														width="20"
														height="20"
														x="2"
														y="2"
														rx="5"
														ry="5"
													/>
													<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
													<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
												</svg>
												<span className="sr-only">Instagram Profile</span>
											</a>
										)}

										{profile?.whatsapp && (
											<a
												href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`}
												target="_blank"
												rel="noopener noreferrer"
												title="WhatsApp"
												className="text-ink opacity-60 hover:opacity-100 hover:text-stamp transition-colors flex items-center gap-1"
											>
												<svg
													aria-hidden="true"
													className="w-4 h-4"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
												</svg>
												<span className="sr-only">WhatsApp Contact</span>
											</a>
										)}

										{profile?.twitter && (
											<a
												href={
													profile.twitter.startsWith("http")
														? profile.twitter
														: `https://x.com/${profile.twitter.replace("@", "")}`
												}
												target="_blank"
												rel="noopener noreferrer"
												title="X / Twitter"
												className="text-ink opacity-60 hover:opacity-100 hover:text-stamp transition-colors flex items-center gap-1"
											>
												<svg
													aria-hidden="true"
													className="w-4 h-4"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M4 4l11.733 16h4.267l-11.733 -16z" />
													<path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
												</svg>
												<span className="sr-only">X / Twitter Profile</span>
											</a>
										)}

										{profile?.linkedin && (
											<a
												href={
													profile.linkedin.startsWith("http")
														? profile.linkedin
														: `https://linkedin.com/in/${profile.linkedin}`
												}
												target="_blank"
												rel="noopener noreferrer"
												title="LinkedIn"
												className="text-ink opacity-60 hover:opacity-100 hover:text-stamp transition-colors flex items-center gap-1"
											>
												<svg
													aria-hidden="true"
													className="w-4 h-4"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
													<rect width="4" height="12" x="2" y="9" />
													<circle cx="4" cy="4" r="2" />
												</svg>
												<span className="sr-only">LinkedIn Profile</span>
											</a>
										)}
									</div>

									<p className="label text-xs opacity-70 pt-2 font-mono">
										Hosted: {profile?.totalHostedEvents ?? 0} Events
									</p>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex flex-wrap items-center gap-2.5">
								<button
									type="button"
									onClick={() => setIsBasicInfoOpen(true)}
									className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors cursor-pointer"
								>
									Edit Basic Info
								</button>
								<button
									type="button"
									onClick={() => setIsPasswordOpen(true)}
									className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors cursor-pointer"
								>
									Change Password
								</button>
								<button
									type="button"
									onClick={() => setIsSocialsOpen(true)}
									className="px-4 py-2 rounded-md border border-perforation bg-paper hover:border-ink/40 text-xs label text-ink transition-colors cursor-pointer"
								>
									Update Socials
								</button>
							</div>
						</div>

						{/* ──────────────── 2. Logged In Devices Section ──────────────── */}
						<div className="border border-perforation rounded-lg p-6 bg-paper/60 shadow-xs space-y-4">
							<div className="flex items-center justify-between border-b border-perforation pb-4">
								<h2 className="font-display font-semibold text-base text-ink">
									Logged in devices ({profile?.sessions?.length || 1})
								</h2>
								<button
									type="button"
									onClick={handleLogoutAllDevices}
									className="label text-xs text-alert hover:underline transition-opacity cursor-pointer"
								>
									Logout all devices
								</button>
							</div>

							<div className="space-y-3">
								{/* Current Device Session Card */}
								<div className="p-4 rounded-md border border-perforation bg-paper flex items-center justify-between gap-4">
									<div className="flex items-center gap-3.5">
										<div className="p-2.5 rounded-md bg-perforation/30 text-ink">
											<svg
												aria-hidden="true"
												className="w-5 h-5"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<rect width="20" height="14" x="2" y="3" rx="2" />
												<line x1="8" x2="16" y1="21" y2="21" />
												<line x1="12" x2="12" y1="17" y2="21" />
											</svg>
										</div>
										<div>
											<p className="font-medium text-sm text-ink">
												OpenEvents Web
											</p>
											<p className="text-xs font-mono opacity-60">
												Current Active Session • Web Browser
											</p>
										</div>
									</div>

									<span className="px-3 py-1 rounded bg-stamp/10 text-stamp label text-xs font-semibold">
										This Device
									</span>
								</div>

								{/* Additional Sessions */}
								{profile?.sessions && profile.sessions.length > 1
									? profile.sessions.slice(1).map((s) => (
											<div
												key={s.id}
												className="p-4 rounded-md border border-perforation bg-paper flex items-center justify-between gap-4"
											>
												<div className="flex items-center gap-3.5">
													<div className="p-2.5 rounded-md bg-perforation/20 text-ink opacity-70">
														<svg
															aria-hidden="true"
															className="w-5 h-5"
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
															strokeLinecap="round"
															strokeLinejoin="round"
														>
															<rect
																width="14"
																height="20"
																x="5"
																y="2"
																rx="2"
																ry="2"
															/>
															<path d="M12 18h.01" />
														</svg>
													</div>
													<div>
														<p className="font-medium text-sm text-ink">
															Mobile App / Browser
														</p>
														<p className="text-xs font-mono opacity-60">
															Expires:{" "}
															{new Date(s.expires).toLocaleDateString()}
														</p>
													</div>
												</div>

												<button
													type="button"
													onClick={() => handleLogoutAllDevices()}
													className="label text-xs text-alert border border-alert/30 px-3 py-1 rounded hover:bg-alert/10 transition-colors"
												>
													Logout
												</button>
											</div>
										))
									: null}
							</div>
						</div>
					</>
				)}
			</main>

			{/* ──────────────── MODAL 1: Edit Basic Info ──────────────── */}
			{isBasicInfoOpen && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4"
				>
					<div className="w-full max-w-md bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Edit Basic Info
							</h3>
							<button
								type="button"
								onClick={() => setIsBasicInfoOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								✕
							</button>
						</div>

						{basicInfoError && (
							<div className="p-3 text-xs text-alert bg-alert/10 border border-alert/20 rounded">
								{basicInfoError}
							</div>
						)}

						<form onSubmit={handleSaveBasicInfo} className="space-y-4">
							{/* Change Profile Picture */}
							<div className="flex items-center gap-4 p-3 rounded-md bg-perforation/15 border border-perforation">
								<div className="w-12 h-12 rounded-md bg-perforation/30 border border-perforation flex items-center justify-center text-ink font-semibold shrink-0 overflow-hidden">
									{imageInput ? (
										<Image
											src={imageInput}
											alt="Preview"
											width={48}
											height={48}
											unoptimized
											className="object-cover w-full h-full"
										/>
									) : (
										<span>{handleInitial}</span>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<label
										htmlFor="imageInput"
										className="label text-xs block mb-1"
									>
										Profile Picture URL
									</label>
									<input
										id="imageInput"
										type="url"
										value={imageInput}
										onChange={(e) => setImageInput(e.target.value)}
										placeholder="https://example.com/avatar.jpg"
										className="w-full bg-paper border border-perforation rounded px-2.5 py-1.5 text-xs text-body focus:outline-none focus:border-stamp"
									/>
									<p className="text-xs opacity-50 mt-1 font-mono">
										Square .jpg/.png image URL (max 200KB)
									</p>
								</div>
							</div>

							<div>
								<label
									htmlFor="nameInput"
									className="block label text-xs mb-1.5"
								>
									Full Name
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink opacity-40">
										👤
									</span>
									<input
										id="nameInput"
										type="text"
										required
										value={nameInput}
										onChange={(e) => setNameInput(e.target.value)}
										className="w-full bg-paper border border-perforation rounded-md pl-9 pr-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
									/>
								</div>
							</div>

							<div>
								<label
									htmlFor="emailInput"
									className="block label text-xs mb-1.5"
								>
									Email Address
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink opacity-40">
										✉️
									</span>
									<input
										id="emailInput"
										type="email"
										disabled
										value={profile?.email || ""}
										className="w-full bg-perforation/20 border border-perforation rounded-md pl-9 pr-3 py-2 text-xs text-body opacity-70 cursor-not-allowed"
									/>
								</div>
								<p className="text-xs opacity-50 mt-1 font-mono">
									Account email cannot be modified directly.
								</p>
							</div>

							<div>
								<label
									htmlFor="phoneInput"
									className="block label text-xs mb-1.5"
								>
									Phone Number
								</label>
								<div className="flex items-center rounded-md border border-perforation bg-paper overflow-hidden focus-within:border-stamp">
									<span className="px-2.5 py-2 text-xs font-mono bg-perforation/20 border-r border-perforation">
										+91
									</span>
									<input
										id="phoneInput"
										type="tel"
										value={phoneInput}
										onChange={(e) => setPhoneInput(e.target.value)}
										placeholder="9876543210"
										className="flex-1 bg-transparent px-3 py-2 text-xs text-body font-mono focus:outline-none"
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-3 pt-3 border-t border-perforation">
								<button
									type="button"
									onClick={() => setIsBasicInfoOpen(false)}
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={updateBasicInfoMutation.isPending}
									className="bg-stamp text-paper label text-xs px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
								>
									{updateBasicInfoMutation.isPending ? "Saving..." : "Save"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ──────────────── MODAL 2: Update Socials / Communication ──────────────── */}
			{isSocialsOpen && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4"
				>
					<div className="w-full max-w-lg bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Add Communication & Social Links
							</h3>
							<button
								type="button"
								onClick={() => setIsSocialsOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								✕
							</button>
						</div>

						{socialsError && (
							<div className="p-3 text-xs text-alert bg-alert/10 border border-alert/20 rounded">
								{socialsError}
							</div>
						)}

						<form onSubmit={handleSaveSocials} className="space-y-4">
							{/* Direct Communication Channels */}
							<div className="space-y-3">
								<p className="label text-xs text-stamp opacity-90">
									Direct Contact Channels
								</p>

								<div>
									<label
										htmlFor="whatsappInput"
										className="block text-xs font-mono opacity-70 mb-1"
									>
										WhatsApp Number
									</label>
									<input
										id="whatsappInput"
										type="text"
										value={whatsappInput}
										onChange={(e) => setWhatsappInput(e.target.value)}
										placeholder="+91 98765 43210"
										className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body font-mono focus:outline-none focus:border-stamp"
									/>
								</div>
							</div>

							{/* Social Media Links */}
							<div className="space-y-3 pt-3 border-t border-perforation">
								<p className="label text-xs text-stamp opacity-90">
									Social Media Links
								</p>

								<div>
									<label
										htmlFor="instagramInput"
										className="block text-xs font-mono opacity-70 mb-1"
									>
										Instagram Profile / Handle
									</label>
									<input
										id="instagramInput"
										type="text"
										value={instagramInput}
										onChange={(e) => setInstagramInput(e.target.value)}
										placeholder="https://instagram.com/yourhandle or @yourhandle"
										className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body font-mono focus:outline-none focus:border-stamp"
									/>
								</div>

								<div>
									<label
										htmlFor="twitterInput"
										className="block text-xs font-mono opacity-70 mb-1"
									>
										X / Twitter Profile
									</label>
									<input
										id="twitterInput"
										type="text"
										value={twitterInput}
										onChange={(e) => setTwitterInput(e.target.value)}
										placeholder="https://x.com/yourhandle or @yourhandle"
										className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body font-mono focus:outline-none focus:border-stamp"
									/>
								</div>

								<div>
									<label
										htmlFor="linkedinInput"
										className="block text-xs font-mono opacity-70 mb-1"
									>
										LinkedIn URL
									</label>
									<input
										id="linkedinInput"
										type="text"
										value={linkedinInput}
										onChange={(e) => setLinkedinInput(e.target.value)}
										placeholder="https://linkedin.com/in/yourprofile"
										className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body font-mono focus:outline-none focus:border-stamp"
									/>
								</div>

								<div>
									<label
										htmlFor="facebookInput"
										className="block text-xs font-mono opacity-70 mb-1"
									>
										Facebook URL
									</label>
									<input
										id="facebookInput"
										type="text"
										value={facebookInput}
										onChange={(e) => setFacebookInput(e.target.value)}
										placeholder="https://facebook.com/yourpage"
										className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body font-mono focus:outline-none focus:border-stamp"
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-3 pt-4 border-t border-perforation">
								<button
									type="button"
									onClick={() => setIsSocialsOpen(false)}
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={updateSocialsMutation.isPending}
									className="bg-stamp text-paper label text-xs px-6 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
								>
									{updateSocialsMutation.isPending ? "Submitting..." : "Submit"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ──────────────── MODAL 3: Change Password ──────────────── */}
			{isPasswordOpen && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4"
				>
					<div className="w-full max-w-md bg-paper border border-perforation rounded-lg p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-perforation pb-3">
							<h3 className="font-display font-semibold text-base text-ink">
								Change Password
							</h3>
							<button
								type="button"
								onClick={() => setIsPasswordOpen(false)}
								className="text-ink opacity-60 hover:opacity-100 p-1 text-sm cursor-pointer"
								aria-label="Close modal"
							>
								✕
							</button>
						</div>

						{passwordSuccess && (
							<div className="p-3 text-xs text-stamp bg-stamp/10 border border-stamp/20 rounded font-mono">
								✓ Password updated successfully!
							</div>
						)}

						{passwordError && (
							<div className="p-3 text-xs text-alert bg-alert/10 border border-alert/20 rounded">
								{passwordError}
							</div>
						)}

						<form onSubmit={handleChangePassword} className="space-y-4">
							{profile?.hasPassword && (
								<div>
									<label
										htmlFor="currentPassword"
										className="block label text-xs mb-1.5"
									>
										Current Password
									</label>
									<input
										id="currentPassword"
										type="password"
										required
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										placeholder="••••••••"
										className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
									/>
								</div>
							)}

							<div>
								<label
									htmlFor="newPassword"
									className="block label text-xs mb-1.5"
								>
									New Password
								</label>
								<input
									id="newPassword"
									type="password"
									required
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="At least 8 characters"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							<div>
								<label
									htmlFor="confirmPassword"
									className="block label text-xs mb-1.5"
								>
									Confirm New Password
								</label>
								<input
									id="confirmPassword"
									type="password"
									required
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Repeat new password"
									className="w-full bg-paper border border-perforation rounded-md px-3 py-2 text-xs text-body focus:outline-none focus:border-stamp"
								/>
							</div>

							<div className="flex items-center justify-end gap-3 pt-3 border-t border-perforation">
								<button
									type="button"
									onClick={() => setIsPasswordOpen(false)}
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={changePasswordMutation.isPending}
									className="bg-stamp text-paper label text-xs px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
								>
									{changePasswordMutation.isPending
										? "Updating..."
										: "Update Password"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
