import { Suspense } from "react";
import Link from "next/link";
import { Palette, TrendingUp, Users, Sparkles } from "lucide-react";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { ArtworkGallery } from "@/components/artwork-gallery";
import { ArtistGrid } from "@/components/artist-grid";

export const metadata = {
  title: "Artists - Velvet Galaxy",
  description: "Discover talented artists and their creative works",
};

async function getFeaturedArtists() {
  const supabase = await createClient();

  const { data: artists } = await supabase
    .from("artist_profiles_with_stats")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("is_featured", true)
    .limit(6);

  return artists || [];
}

async function getRecentArtworks() {
  const supabase = await createClient();

  const { data: artworks } = await supabase
    .from("artworks_with_stats")
    .select(`
      *,
      artist:profiles!artworks_artist_id_fkey(*)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(12);

  return artworks || [];
}

async function getTrendingArtworks() {
  const supabase = await createClient();

  const { data: artworks } = await supabase
    .from("artworks_with_stats")
    .select(`
      *,
      artist:profiles!artworks_artist_id_fkey(*)
    `)
    .eq("visibility", "public")
    .order("like_count", { ascending: false })
    .order("view_count", { ascending: false })
    .limit(12);

  return artworks || [];
}

export default async function ArtistsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current user has an artist profile
  let hasArtistProfile = false;
  if (user) {
    const { data: artistProfile } = await supabase
      .from("artist_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    hasArtistProfile = !!artistProfile;
  }

  const [featuredArtists, recentArtworks, trendingArtworks] = await Promise.all([
    getFeaturedArtists(),
    getRecentArtworks(),
    getTrendingArtworks(),
  ]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <section className="mb-12 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Palette className="h-4 w-4" />
              <span className="text-sm font-medium">Artists Showcase</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Discover Amazing Art
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore original artwork, comics, animations, and more from talented artists in the Velvet Galaxy community.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/artists/browse">
                  <Palette className="mr-2 h-5 w-5" />
                  Browse Artworks
                </Link>
              </Button>

              {user && !hasArtistProfile && (
                <Button asChild size="lg" variant="outline">
                  <Link href="/artists/become">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Become an Artist
                  </Link>
                </Button>
              )}

              {user && hasArtistProfile && (
                <Button asChild size="lg" variant="outline">
                  <Link href={`/artists/profile/${user.id}`}>
                    <Users className="mr-2 h-5 w-5" />
                    My Profile
                  </Link>
                </Button>
              )}
            </div>
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{featuredArtists.length}+</p>
                    <p className="text-sm text-muted-foreground">Featured Artists</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Palette className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{recentArtworks.length}+</p>
                    <p className="text-sm text-muted-foreground">Artworks Shared</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {trendingArtworks.reduce((sum, art) => sum + (art.like_count || 0), 0)}+
                    </p>
                    <p className="text-sm text-muted-foreground">Total Likes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Featured Artists */}
          {featuredArtists.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                    Featured Artists
                  </h2>
                  <p className="text-muted-foreground">Handpicked talented creators</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/artists/browse?filter=artists">View All Artists</Link>
                </Button>
              </div>

              <Suspense fallback={<div className="text-center py-8">Loading artists...</div>}>
                <ArtistGrid artists={featuredArtists} />
              </Suspense>
            </section>
          )}

          {/* Artworks Tabs */}
          <section>
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
              </TabsList>

              <TabsContent value="recent">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Recently Added</h2>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/artists/browse?sort=recent">View All</Link>
                  </Button>
                </div>

                <Suspense fallback={<div className="text-center py-8">Loading artworks...</div>}>
                  <ArtworkGallery artworks={recentArtworks} />
                </Suspense>
              </TabsContent>

              <TabsContent value="trending">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Trending Now</h2>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/artists/browse?sort=popular">View All</Link>
                  </Button>
                </div>

                <Suspense fallback={<div className="text-center py-8">Loading artworks...</div>}>
                  <ArtworkGallery artworks={trendingArtworks} />
                </Suspense>
              </TabsContent>
            </Tabs>
          </section>

          {/* Categories Section */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Browse by Medium</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Digital Art", slug: "digital", icon: "🎨" },
                { name: "Traditional", slug: "traditional", icon: "🖌️" },
                { name: "Comics", slug: "comics", icon: "📖" },
                { name: "Animation", slug: "animation", icon: "🎬" },
                { name: "3D Art", slug: "3d", icon: "🗿" },
                { name: "Pixel Art", slug: "pixel-art", icon: "👾" },
                { name: "Character Design", slug: "character", icon: "🧑‍🎨" },
                { name: "Environment", slug: "environment", icon: "🌄" },
              ].map((category) => (
                <Link key={category.slug} href={`/artists/browse?medium=${category.slug}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="pt-6 text-center">
                      <div className="text-4xl mb-2">{category.icon}</div>
                      <p className="font-medium">{category.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          {user && !hasArtistProfile && (
            <section className="mt-12">
              <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl mb-2">Share Your Art with the World</CardTitle>
                  <CardDescription className="text-base">
                    Join our community of artists and showcase your creative work
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild size="lg">
                    <Link href="/artists/become">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Create Artist Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
