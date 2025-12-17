import type {NextRequest} from "next/server";

import {defaultLocale, locales} from "@/lib/i18n/config";
import {updateSession} from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
    const locale = request.cookies.get("NEXT_LOCALE")?.value || defaultLocale;

    // Validate locale
    const validLocale = locales.includes(locale as any) ? locale : defaultLocale;

    // Get Supabase session response
    const response = await updateSession(request);

    // Set locale cookie if not present or invalid
    if (!request.cookies.get("NEXT_LOCALE") || locale !== validLocale) {
        response.cookies.set("NEXT_LOCALE", validLocale, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: "lax",
        });
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
