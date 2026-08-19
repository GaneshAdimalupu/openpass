"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { getClientDeviceId } from "@/lib/device";
import { trpc } from "@/lib/trpc";
import { X } from "lucide-react";
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
	} = trpc.users.getProfile.useQuery(undefined, { enabled: !!userId });

	const updateBasicInfoMutation = trpc.users.updateBasicInfo.useMutation();
	const updateSocialsMutation = trpc.users.updateSocials.useMutation();
	const changePasswordMutation = trpc.users.changePassword.useMutation();
	const logoutDeviceMutation = trpc.users.logoutDevice.useMutation();
	const logoutAllDevicesMutation = trpc.users.logoutAllDevices.useMutation();

	// Modal States
	const [isBasicInfoOpen, setIsBasicInfoOpen] = useState<boolean>(false);
	const [isSocialsOpen, setIsSocialsOpen] = useState<boolean>(false);
	const [isPasswordOpen, setIsPasswordOpen] = useState<boolean>(false);

	// Form States - Basic Info
	const [nameInput, setNameInput] = useState<string>("");
	const [usernameInput, setUsernameInput] = useState<string>("");
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

	// Current Client Device ID
	const [clientDeviceId, setClientDeviceId] = useState<string>("");
	useEffect(() => {
		setClientDeviceId(getClientDeviceId());
	}, []);

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
			setUsernameInput(profile.username || "");
			setPhoneInput(profile.phone || "");
			setImageInput(profile.image || "");
			setWhatsappInput(profile.whatsapp || "");
			setInstagramInput(profile.instagram || "");
			setTwitterInput(profile.twitter || "");
			setLinkedinInput(profile.linkedin || "");
			setFacebookInput(profile.facebook || "");
		}
	}, [profile]);

	const formatLastActive = (dateStr?: Date | string | null): string => {
		if (!dateStr) return "Active recently";
		const diffMs = Date.now() - new Date(dateStr).getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		if (diffMinutes < 3) return "Active now";
		if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) return `Active ${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays === 1) return "Active yesterday";
		return `Active ${diffDays}d ago`;
	};

	const currentSession =
		profile?.sessions?.find(
			(s) => clientDeviceId && s.deviceId === clientDeviceId,
		) || profile?.sessions?.[0];

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
				name: nameInput.trim(),
				username: usernameInput.trim() || null,
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

	const handleLogoutDevice = async (sessionId: string) => {
		try {
			await logoutDeviceMutation.mutateAsync({ sessionId });
			await refetch();
			showToast("Device session logged out");
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Failed to logout device";
			showToast(msg);
		}
	};

	const handleLogoutAllDevices = async () => {
		if (!userId) return;
		if (
			confirm(
				"Are you sure you want to log out all other active device sessions on your account?",
			)
		) {
			try {
				await logoutAllDevicesMutation.mutateAsync({
					exceptSessionId: currentSession?.id,
				});
				await refetch();
				showToast("Logged out all other device sessions");
			} catch (err: unknown) {
				showToast(
					err instanceof Error ? err.message : "Failed to logout other devices",
				);
			}
		}
	};

	const handleInitial =
		profile?.name?.charAt(0).toUpperCase() ||
		profile?.email?.charAt(0).toUpperCase() ||
		"U";

	// Generate clean handle from username, organizer slug, or email
	const handleSlug =
		profile?.username ||
		profile?.organizers?.[0]?.slug ||
		profile?.email?.split("@")[0];

	return (
		<div className="min-h-screen bg-paper flex flex-col">
			<SiteHeader />

			{/* Floating Toast Notification */}
			{toastMessage && (
				<div className="fixed bottom-6 right-6 z-50 bg-ink text-paper px-4 py-3 rounded-lg shadow-lg border border-perforation text-xs font-mono animate-in fade-in slide-in-from-bottom-2">
					{toastMessage}
				</div>
			)}

			<main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
				{isLoading ? (
					<div className="py-24 text-center">
						<div className="w-8 h-8 border-2 border-stamp border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<p className="text-xs font-mono opacity-60">
							Loading profile details...
						</p>
					</div>
				) : (
					<>
						{/* ──────────────── 1. Profile Overview Hero Card ──────────────── */}
						<div className="border border-perforation rounded-lg p-6 sm:p-8 bg-paper/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
								{/* Profile Avatar with fallback Initial */}
								<div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-perforation/40 border border-perforation flex items-center justify-center font-display font-semibold text-3xl text-ink shrink-0 overflow-hidden">
									{profile?.image ? (
										<Image
											src={profile.image}
											alt={profile.name || "Profile"}
											fill
											unoptimized
											className="object-cover"
										/>
									) : (
										<span>{handleInitial}</span>
									)}
								</div>

								{/* Name, Email, Handle & Communications */}
								<div className="space-y-1.5">
									<div className="flex items-center gap-3">
										<h1 className="font-display font-semibold text-h3 text-ink">
											{profile?.name || "Anonymous Organizer"}
										</h1>
										<span className="px-2.5 py-0.5 rounded text-[10px] font-semibold font-mono bg-perforation/40 border border-perforation text-ink opacity-80 uppercase">
											{profile?.role || "USER"}
										</span>
									</div>

									<p className="font-mono text-xs opacity-60">
										@{handleSlug} • {profile?.email}
									</p>

									{/* Contact & Social badges */}
									<div className="flex flex-wrap items-center gap-3 pt-2">
										{profile?.phone && (
											<span className="inline-flex items-center gap-1.5 text-xs text-ink opacity-80 font-mono">
												<svg
													aria-hidden="true"
													xmlns="http://www.w3.org/2000/svg"
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
												</svg>
												+91 {profile.phone}
											</span>
										)}
										{profile?.whatsapp && (
											<a
												href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-xs text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
											>
												<span className="font-mono text-[11px] flex items-center gap-1">
													<svg
														aria-hidden="true"
														xmlns="http://www.w3.org/2000/svg"
														width="12"
														height="12"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
													</svg>{" "}
													WhatsApp
												</span>
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
												className="inline-flex items-center gap-1 text-xs text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
											>
												<span className="font-mono text-[11px] flex items-center gap-1">
													<svg
														aria-hidden="true"
														xmlns="http://www.w3.org/2000/svg"
														width="12"
														height="12"
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
													</svg>{" "}
													@{profile.instagram.replace("@", "")}
												</span>
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
												className="inline-flex items-center gap-1 text-xs text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
											>
												<span className="font-mono text-[11px] flex items-center gap-1">
													<svg
														aria-hidden="true"
														xmlns="http://www.w3.org/2000/svg"
														width="12"
														height="12"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
													</svg>{" "}
													@{profile.twitter.replace("@", "")}
												</span>
											</a>
										)}
										{profile?.linkedin && (
											<a
												href={profile.linkedin}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-xs text-ink opacity-70 hover:opacity-100 hover:text-stamp transition-colors"
											>
												<span className="font-mono text-[11px] flex items-center gap-1">
													<svg
														aria-hidden="true"
														xmlns="http://www.w3.org/2000/svg"
														width="12"
														height="12"
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
													</svg>{" "}
													LinkedIn
												</span>
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
								<div>
									<h2 className="font-display font-semibold text-base text-ink">
										Logged in devices ({profile?.sessions?.length || 1})
									</h2>
									<p className="text-[11px] font-mono opacity-60">
										Track and manage active devices connected to your account
									</p>
								</div>
								{(profile?.sessions?.length || 0) > 1 && (
									<button
										type="button"
										onClick={handleLogoutAllDevices}
										className="label text-xs text-alert hover:underline transition-opacity cursor-pointer"
									>
										Log out other devices
									</button>
								)}
							</div>

							<div className="space-y-3">
								{profile?.sessions && profile.sessions.length > 0 ? (
									profile.sessions.map((s, index) => {
										const isCurrent =
											Boolean(
												clientDeviceId && s.deviceId === clientDeviceId,
											) ||
											(index === 0 &&
												!profile.sessions.some(
													(x) =>
														clientDeviceId && x.deviceId === clientDeviceId,
												));

										const isMobile = s.deviceType === "MOBILE";
										const isTablet = s.deviceType === "TABLET";

										return (
											<div
												key={s.id}
												className={`p-4 rounded-md border bg-paper flex items-center justify-between gap-4 transition-colors ${
													isCurrent
														? "border-stamp/40 bg-stamp/5 shadow-xs"
														: "border-perforation"
												}`}
											>
												<div className="flex items-center gap-3.5">
													<div
														className={`p-2.5 rounded-md ${
															isCurrent
																? "bg-stamp/15 text-stamp"
																: "bg-perforation/25 text-ink opacity-75"
														}`}
													>
														{isMobile ? (
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
																/>
																<path d="M12 18h.01" />
															</svg>
														) : isTablet ? (
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
																	width="16"
																	height="20"
																	x="4"
																	y="2"
																	rx="2"
																	ry="2"
																/>
																<line x1="12" x2="12.01" y1="18" y2="18" />
															</svg>
														) : (
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
																	width="20"
																	height="14"
																	x="2"
																	y="3"
																	rx="2"
																/>
																<line x1="8" x2="16" y1="21" y2="21" />
																<line x1="12" x2="12" y1="17" y2="21" />
															</svg>
														)}
													</div>
													<div>
														<div className="flex items-center gap-2">
															<p className="font-medium text-sm text-ink">
																{s.browser || "Web Browser"} on{" "}
																{s.os || "Unknown OS"}
															</p>
															{isCurrent && (
																<span className="px-2 py-0.5 rounded-full bg-stamp/15 text-stamp font-mono text-[10px] font-semibold">
																	Current Device
																</span>
															)}
														</div>
														<p className="text-xs font-mono opacity-60 mt-0.5">
															{isCurrent
																? "This Device • Active now"
																: formatLastActive(s.lastActive || s.createdAt)}
															{s.ipAddress && ` • ${s.ipAddress}`}
														</p>
													</div>
												</div>

												<div>
													{isCurrent ? (
														<span className="px-3 py-1 rounded bg-stamp/10 text-stamp label text-xs font-semibold">
															Active
														</span>
													) : (
														<button
															type="button"
															onClick={() => handleLogoutDevice(s.id)}
															className="label text-xs text-alert border border-alert/30 px-3 py-1 rounded hover:bg-alert/10 transition-colors cursor-pointer"
														>
															Log out
														</button>
													)}
												</div>
											</div>
										);
									})
								) : (
									<div className="p-4 rounded-md border border-perforation bg-paper flex items-center justify-between gap-4">
										<div className="flex items-center gap-3.5">
											<div className="p-2.5 rounded-md bg-stamp/10 text-stamp">
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
													Current Web Browser
												</p>
												<p className="text-xs font-mono opacity-60">
													Active Now
												</p>
											</div>
										</div>
										<span className="px-3 py-1 rounded bg-stamp/10 text-stamp label text-xs font-semibold">
											This Device
										</span>
									</div>
								)}
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
								<X className="w-4 h-4" />
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
										<svg
											aria-hidden="true"
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
											<circle cx="12" cy="7" r="4" />
										</svg>
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
									htmlFor="usernameInput"
									className="block label text-xs mb-1.5"
								>
									Username / Handle
								</label>
								<div className="flex items-center rounded-md border border-perforation bg-paper overflow-hidden focus-within:border-stamp">
									<span className="px-2.5 py-2 text-xs font-mono bg-perforation/20 border-r border-perforation text-ink/60">
										@
									</span>
									<input
										id="usernameInput"
										type="text"
										value={usernameInput}
										onChange={(e) =>
											setUsernameInput(
												e.target.value
													.toLowerCase()
													.replace(/[^a-z0-9_-]/g, ""),
											)
										}
										placeholder="your_handle"
										className="flex-1 bg-transparent px-3 py-2 text-xs text-body font-mono focus:outline-none placeholder:text-ink/30"
									/>
								</div>
								<p className="text-[11px] opacity-50 mt-1 font-mono">
									Unique handle for your public profile and event mentions.
								</p>
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
										<svg
											aria-hidden="true"
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
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
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={updateBasicInfoMutation.isPending}
									className="bg-stamp text-paper label text-xs px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
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
								<X className="w-4 h-4" />
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
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={updateSocialsMutation.isPending}
									className="bg-stamp text-paper label text-xs px-6 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
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
								<X className="w-4 h-4" />
							</button>
						</div>

						{passwordSuccess && (
							<div className="p-3 text-xs text-stamp bg-stamp/10 border border-stamp/20 rounded font-mono">
								Password updated successfully!
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
									className="px-4 py-2 rounded text-xs label text-ink opacity-70 hover:opacity-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={changePasswordMutation.isPending}
									className="bg-stamp text-paper label text-xs px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
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
