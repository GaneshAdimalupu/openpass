import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["attribute-frost-organized-think.trycloudflare.com"],
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
