import type {MetadataRoute} from "next";

const BASE_URL = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://velvetgalaxy.app"
).replace(/\/+$/, "");

/**
 * Zone privee / authentifiee : jamais indexee. Les routes publiques sont listees
 * explicitement dans app/sitemap.ts et dans lib/supabase/middleware.ts.
 */
const PRIVATE_PATHS = [
    "/admin",
    "/api/",
    "/auth",
    "/settings",
    "/messages",
    "/notifications",
    "/onboarding",
    "/portal",
    "/profile",
    "/upload",
    "/bookmarks",
    "/activity",
    "/actions",
    "/feed",
    "/relationships",
    "/subscription",
    "/discover",
    "/marketplace",
    "/search",
    "/network",
    "/gallery",
    "/media",
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: PRIVATE_PATHS,
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
