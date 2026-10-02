import type {Metadata} from "next";

/**
 * `app/artists/browse/page.tsx` est un composant client : il ne peut pas exporter
 * de metadata. Ce layout serveur declare donc le canonical et les metadonnees de
 * la route, ce qui evite qu'elle herite d'un canonical global (retire du layout
 * racine).
 */
export const metadata: Metadata = {
    title: "Browse Artists",
    description: "Browse artist profiles and portfolios on Velvet Galaxy.",
    alternates: {canonical: "/artists/browse"},
    openGraph: {
        title: "Browse Artists",
        description: "Browse artist profiles and portfolios on Velvet Galaxy.",
        url: "/artists/browse",
    },
};

export default function BrowseArtistsLayout({children}: Readonly<{children: React.ReactNode}>): React.ReactElement {
    return <>{children}</>;
}
