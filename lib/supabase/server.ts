import {createServerClient as createSupabaseServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

export async function createServerClient() {
    const cookieStore = await cookies();

    const supabaseUrl =
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
        process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("[v0] Missing Supabase server credentials. Falling back to placeholder client.");
        return createSupabaseServerClient("https://placeholder.supabase.co", "placeholder-anon-key", {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() {
                    // no-op fallback for build-time rendering when envs are absent
                },
            },
        });
    }

    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({name, value, options}) => cookieStore.set(name, value, options));
                } catch {
                    // The "setAll" method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    });
}

// Keep the original createClient for backward compatibility
export async function createClient() {
    return createServerClient();
}
