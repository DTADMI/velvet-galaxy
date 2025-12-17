import "./globals.css";

import type {Metadata} from "next";
import {Inter} from "next/font/google";
import type React from "react";

import {ThemeProvider} from "@/components/theme-provider";
import {TooltipProvider} from "@/components/ui/tooltip";
import {CacheProvider} from "@/lib/cache/provider";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Velvet Galaxy - Connect with Your Community",
    description: "A social platform for meaningful connections and local commerce",
    generator: 'v0.app'
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY;

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
              window.ENV = {
                SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
                SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)}
              };
            `,
                }}
            />
            <script
                dangerouslySetInnerHTML={{
                    __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('[v0] Service Worker registered:', reg.scope))
                    .catch(err => console.error('[v0] Service Worker registration failed:', err));
                });
              }
            `,
                }}
            />
        </head>
        <body className={inter.className}>
        <ThemeProvider defaultTheme="dark" storageKey="velvet_galaxy-theme">
            <CacheProvider>
                <TooltipProvider>{children}</TooltipProvider>
            </CacheProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
