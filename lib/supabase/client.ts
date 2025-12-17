import {createBrowserClient as createSupabaseBrowserClient} from "@supabase/ssr";

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function createClient() {
    // Return cached client if it exists
    if (client) {
        return client;
    }

    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.VITE_PUBLIC_SUPABASE_URL ||
        (typeof window !== "undefined" && (window as any).ENV?.SUPABASE_URL);

    const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
        (typeof window !== "undefined" && (window as any).ENV?.SUPABASE_ANON_KEY);

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[v0] Missing Supabase credentials");
        throw new Error("Missing Supabase environment variables");
    }

    console.log("[v0] Creating Supabase client with URL:", supabaseUrl.substring(0, 30) + "...");

    // Create client with proper cookie handling for @supabase/ssr
    client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                if (typeof document === "undefined") {
                    return undefined;
                }
                const value = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith(`${name}=`))
                    ?.split("=")[1];
                return value ? decodeURIComponent(value) : undefined;
            },
            set(name: string, value: string, options: any) {
                if (typeof document === "undefined") {
                    return;
                }
                let cookie = `${name}=${encodeURIComponent(value)}`;
                if (options?.maxAge) {
                    cookie += `; max-age=${options.maxAge}`;
                }
                if (options?.path) {
                    cookie += `; path=${options.path}`;
                }
                if (options?.domain) {
                    cookie += `; domain=${options.domain}`;
                }
                if (options?.sameSite) {
                    cookie += `; samesite=${options.sameSite}`;
                }
                if (options?.secure) {
                    cookie += "; secure";
                }
                document.cookie = cookie;
            },
            remove(name: string, options: any) {
                if (typeof document === "undefined") {
                    return;
                }
                let cookie = `${name}=; max-age=0`;
                if (options?.path) {
                    cookie += `; path=${options.path}`;
                }
                if (options?.domain) {
                    cookie += `; domain=${options.domain}`;
                }
                document.cookie = cookie;
            },
        },
    });

    return client;
}

export const createBrowserClient = createClient;
export const createSupabaseClient = createClient;
