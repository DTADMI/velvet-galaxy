import "./globals.css";

import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {Suspense, type ReactNode} from "react";

import {ThemeProvider} from "@/components/theme-provider";
import {TooltipProvider} from "@/components/ui/tooltip";
import {TanstackProvider} from "@/lib/tanstack";
import {PWAInstallPrompt} from "@/components/pwa/install-prompt";
import {ServiceWorkerRegistration} from "@/components/pwa/service-worker-registration";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Velvet Galaxy - Connect with Your Community",
    description: "A social platform for meaningful connections and local commerce",
    generator: 'v0.app',
    manifest: '/manifest.json',
};

export {viewport} from './viewport';

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
        </head>
        <body className={inter.className}>
        <ServiceWorkerRegistration/>
        <PWAInstallPrompt/>
        <ThemeProvider defaultTheme="dark" storageKey="velvet_galaxy-theme">
            <TanstackProvider>
                <TooltipProvider>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-purple"/></div>}>
                        {children}
                    </Suspense>
                </TooltipProvider>
            </TanstackProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
