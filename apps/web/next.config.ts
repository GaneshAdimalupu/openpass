import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["intro-continually-showed-impossible.trycloudflare.com"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.supabase.co",
				pathname: "/storage/v1/object/public/**",
			},
		],
	},
};

export default nextConfig;
