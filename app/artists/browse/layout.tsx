export const metadata = {
    title: "Browse artists",
    description: "Browse artists and their artworks on Velvet Galaxy.",
    alternates: {canonical: "/artists/browse"},
    openGraph: {
        title: "Browse artists",
        description: "Browse artists and their artworks on Velvet Galaxy.",
        url: "/artists/browse",
    },
};

export default function BrowseLayout({children}: { children: React.ReactNode }) {
    return children;
}
