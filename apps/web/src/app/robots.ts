import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://makemyevent.org";
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/api/",
				"/dashboard",
				"/onboarding",
				"/profile",
				"/tickets",
				"/*/manage/",
			],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
