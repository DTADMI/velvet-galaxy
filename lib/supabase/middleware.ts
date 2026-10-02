import {createServerClient} from "@supabase/ssr";
import {type NextRequest, NextResponse} from "next/server";

/**
 * Routes accessibles SANS session. Sans cette liste, le middleware redirigeait
 * vers /auth/login tout ce qui n'etait ni "/" ni "/auth/*", y compris les pages
 * publiques (about, policies, help, download, subscribe...), robots.txt et
 * sitemap.xml : Googlebot ne pouvait donc rien indexer (307 vers la connexion).
 *
 * Les routes volontairement authentifiees (feed, marketplace, discover, settings,
 * messages, profil, etc.) restent hors de cette liste et redirigent vers /auth/login.
 */
const PUBLIC_PATHS = [
    "/",
    "/auth",
    "/about",
    "/help",
    "/policies",
    "/download",
    "/subscribe",
    "/offline",
    "/artists",
    "/events",
    "/groups",
    "/chat-rooms",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/sw.js",
] as const;

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({name, value, options}) => supabaseResponse.cookies.set(name, value, options));
            },
        },
    });

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user && !isPublicPath(request.nextUrl.pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
