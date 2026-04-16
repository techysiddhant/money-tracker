// import type { NextConfig } from "next";
// @ts-expect-error next-pwa doesn't have proper types for ES modules
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	register: true,
	skipWaiting: true,
});

const nextConfig = {
	webpack: (config, { isServer }) => {
		// Suppress warnings about these packages being externalized or missing
		config.ignoreWarnings = [
			{ module: /node_modules\/@vercel\/og/ },
		];
		
		// Map unused heavy dependencies to false so they are pruned from the bundle
		config.resolve.alias = {
			...config.resolve.alias,
			"@vercel/og": false,
		};
		return config;
	},
	experimental: {
		// Additional safety to prevent bundling it server-side if it leaks
		serverExternalPackages: ["@vercel/og"],
	},
};

export default withPWA(nextConfig);

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
