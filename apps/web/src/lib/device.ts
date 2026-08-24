export interface ParsedDeviceInfo {
	browser: string;
	os: string;
	deviceType: "MOBILE" | "DESKTOP" | "TABLET";
}

/**
 * Parses user agent string to extract clean Browser, OS, and Device Type
 */
export function parseUserAgent(ua?: string | null): ParsedDeviceInfo {
	if (!ua) {
		return {
			browser: "Web Browser",
			os: "Unknown OS",
			deviceType: "DESKTOP",
		};
	}

	const u = ua.toLowerCase();

	// 1. Determine Device Type
	let deviceType: "MOBILE" | "DESKTOP" | "TABLET" = "DESKTOP";
	if (
		u.includes("ipad") ||
		u.includes("tablet") ||
		u.includes("playbook") ||
		u.includes("silk")
	) {
		deviceType = "TABLET";
	} else if (
		u.includes("mobile") ||
		u.includes("iphone") ||
		u.includes("ipod") ||
		u.includes("android") ||
		u.includes("blackberry") ||
		u.includes("webos")
	) {
		deviceType = "MOBILE";
	}

	// 2. Determine Operating System
	let os = "Unknown OS";
	if (u.includes("iphone")) {
		os = "iOS";
	} else if (u.includes("ipad")) {
		os = "iPadOS";
	} else if (u.includes("android")) {
		os = "Android";
	} else if (u.includes("mac os x") || u.includes("macintosh")) {
		os = "macOS";
	} else if (u.includes("windows nt 10.0") || u.includes("windows nt 11.0")) {
		os = "Windows 11";
	} else if (u.includes("windows nt 6.3") || u.includes("windows nt 6.2")) {
		os = "Windows 8";
	} else if (u.includes("windows nt 6.1")) {
		os = "Windows 7";
	} else if (u.includes("windows")) {
		os = "Windows";
	} else if (u.includes("cros")) {
		os = "ChromeOS";
	} else if (u.includes("linux")) {
		os = "Linux";
	}

	// 3. Determine Browser
	let browser = "Web Browser";
	if (u.includes("edg/") || u.includes("edge/")) {
		browser = "Microsoft Edge";
	} else if (u.includes("opr/") || u.includes("opera/")) {
		browser = "Opera";
	} else if (u.includes("samsungbrowser/")) {
		browser = "Samsung Internet";
	} else if (
		u.includes("crios/") ||
		(u.includes("chrome/") && !u.includes("edg/"))
	) {
		browser = "Google Chrome";
	} else if (u.includes("fxios/") || u.includes("firefox/")) {
		browser = "Mozilla Firefox";
	} else if (
		u.includes("safari/") &&
		!u.includes("chrome/") &&
		!u.includes("crios/") &&
		!u.includes("android")
	) {
		browser = "Apple Safari";
	}

	return { browser, os, deviceType };
}

/**
 * Returns or initializes a persistent device ID on client-side
 */
export function getClientDeviceId(): string {
	if (typeof window === "undefined") {
		return "";
	}

	const KEY = "makemyevent_device_id";
	const LEGACY_KEY = "openevents_device_id";

	try {
		// 1. Try local storage
		let deviceId =
			localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
		if (!deviceId) {
			// 2. Try cookie
			const match = document.cookie.match(
				new RegExp(`(^| )(${KEY}|${LEGACY_KEY})=([^;]+)`),
			);
			if (match?.[2]) {
				deviceId = decodeURIComponent(match[2]);
			}
		}

		if (!deviceId) {
			deviceId = crypto.randomUUID();
		}

		// Persist to both localStorage and cookie
		localStorage.setItem(KEY, deviceId);
		const tenYearsInSeconds = 10 * 365 * 24 * 60 * 60;
		// biome-ignore lint/suspicious/noDocumentCookie: Cookie needed for cross-request device tracking
		document.cookie = `${KEY}=${encodeURIComponent(deviceId)}; path=/; max-age=${tenYearsInSeconds}; SameSite=Lax`;

		return deviceId;
	} catch {
		return "";
	}
}
