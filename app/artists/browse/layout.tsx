import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Browse Artists",
    description:
        "Discover artists and creators on Velvet Galaxy by craft, style and community.",
    alternates: {canonical: "/artists/browse"},
};

export default function BrowseArtistsLayout({children}: {children: React.ReactNode}) {
    return <>{children}</>;
}
