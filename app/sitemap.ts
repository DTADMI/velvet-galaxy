import type {MetadataRoute} from "next";

const BASE_URL = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://velvetgalaxy.app"
).replace(/\/+$/, "");

/**
 * Liste blanche des routes reellement accessibles sans session (voir
 * lib/supabase/middleware.ts). Les routes authentifiees (feed, marketplace,
 * discover, settings, messages, profil, recherche, etc.) ne doivent PAS figurer
 * ici : le middleware les redirige vers /auth/login et un moteur qui les suit
 * n'indexerait qu'une page de connexion.
 */
const PUBLIC_ROUTES: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
}> = [
    {path: "/", changeFrequency: "daily", priority: 1},
    {path: "/about", changeFrequency: "monthly", priority: 0.6},
    {path: "/download", changeFrequency: "monthly", priority: 0.6},
    {path: "/subscribe", changeFrequency: "monthly", priority: 0.5},
    {path: "/artists", changeFrequency: "weekly", priority: 0.7},
    {path: "/artists/browse", changeFrequency: "weekly", priority: 0.6},
    {path: "/events", changeFrequency: "weekly", priority: 0.7},
    {path: "/groups", changeFrequency: "weekly", priority: 0.7},
    {path: "/chat-rooms", changeFrequency: "weekly", priority: 0.6},
    {path: "/help", changeFrequency: "monthly", priority: 0.4},
    {path: "/policies/privacy", changeFrequency: "yearly", priority: 0.3},
    {path: "/policies/terms", changeFrequency: "yearly", priority: 0.3},
];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    return PUBLIC_ROUTES.map(({path, changeFrequency, priority}) => ({
        url: path === "/" ? BASE_URL : `${BASE_URL}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}
