import "./globals.css";

import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {Suspense} from "react";

import {ThemeProvider} from "@/components/theme-provider";
import {TooltipProvider} from "@/components/ui/tooltip";
import {TanstackProvider} from "@/lib/tanstack";
import {PWAInstallPrompt} from "@/components/pwa/install-prompt";
import {ServiceWorkerRegistration} from "@/components/pwa/service-worker-registration";
import {MobileShell} from "@/components/layout/mobile-shell";
import {NavSidebar} from "@/components/layout/nav-sidebar";
import {MobileBottomNav} from "@/components/layout/mobile-bottom-nav";

const inter = Inter({subsets: ["latin"]});

const BASE_URL = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://velvetgalaxy.app"
).replace(/\/+$/, "");

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "Velvet Galaxy - Connect with Your Community",
        template: "%s | Velvet Galaxy",
    },
    description:
        "Velvet Galaxy is a social platform for meaningful connections, creator communities and local commerce: share posts, join events, explore the marketplace and meet people near you.",
    applicationName: "Velvet Galaxy",
    keywords: [
        "social network",
        "community",
        "local commerce",
        "marketplace",
        "creators",
        "events",
        "artists",
    ],
    manifest: "/manifest.json",
    alternates: {canonical: "/"},
    robots: {index: true, follow: true},
    openGraph: {
        type: "website",
        siteName: "Velvet Galaxy",
        title: "Velvet Galaxy - Connect with Your Community",
        description:
            "A social platform for meaningful connections, creator communities and local commerce.",
        url: BASE_URL,
    },
    twitter: {
        card: "summary_large_image",
        title: "Velvet Galaxy - Connect with Your Community",
        description:
            "A social platform for meaningful connections, creator communities and local commerce.",
    },
};

const WEBSITE_JSONLD = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": `${BASE_URL}/#organization`,
            name: "Nebula Forge Digital Studio",
            url: BASE_URL,
        },
        {
            "@type": "WebSite",
            "@id": `${BASE_URL}/#website`,
            name: "Velvet Galaxy",
            url: BASE_URL,
            publisher: {"@id": `${BASE_URL}/#organization`},
            potentialAction: {
                "@type": "SearchAction",
                target: `${BASE_URL}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
            },
        },
    ],
};

export {viewport} from './viewport';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
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
                type="application/ld+json"
                dangerouslySetInnerHTML={{__html: JSON.stringify(WEBSITE_JSONLD)}}
            />
        </head>
        <body className={inter.className}>
        <ServiceWorkerRegistration/>
        <PWAInstallPrompt/>
        <ThemeProvider defaultTheme="dark" storageKey="velvet_galaxy-theme">
            <TanstackProvider>
                <TooltipProvider>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-purple"/></div>}>
                        <MobileShell
                            sidebar={<NavSidebar />}
                            bottomNav={<MobileBottomNav />}
                        >
                            {children}
                        </MobileShell>
                    </Suspense>
                </TooltipProvider>
            </TanstackProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
