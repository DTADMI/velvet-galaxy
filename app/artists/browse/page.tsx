"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, Grid, List, X } from "lucide-react";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArtworkGallery } from "@/components/artwork-gallery";
import { ArtistGrid } from "@/components/artist-grid";
import { createClient } from "@/lib/supabase/client";
import type { ArtworkWithStats, ArtistProfileWithStats } from "@/types/artwork";
import { ART_MEDIUMS, COMMON_ART_TAGS } from "@/types/artwork";

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [artworks, setArtworks] = useState<ArtworkWithStats[]>([]);
  const [artists, setArtists] = useState<ArtistProfileWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'artworks' | 'artists'>(
    (searchParams.get('filter') as any) || 'artworks'
  );

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedMedium, setSelectedMedium] = useState(searchParams.get('medium') || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [contentRating, setContentRating] = useState(searchParams.get('rating') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');

  useEffect(() => {
    loadData();
  }, [view, selectedMedium, selectedTags, contentRating, sortBy]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    if (view === 'artworks') {
      let query = supabase
        .from('artworks_with_stats')
        .select(`
          *,
          artist:profiles!artworks_artist_id_fkey(*)
        `)
        .eq('visibility', 'public');

      // Apply filters
      if (selectedMedium !== 'all') {
        query = query.eq('medium', selectedMedium);
      }

      if (selectedTags.length > 0) {
        query = query.contains('tags', selectedTags);
      }

      if (contentRating !== 'all') {
        query = query.eq('content_rating', contentRating);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('like_count', { ascending: false });
          break;
        case 'views':
          query = query.order('view_count', { ascending: false });
          break;
        case 'likes':
          query = query.order('like_count', { ascending: false });
          break;
      }

      const { data } = await query.limit(50);
      setArtworks(data || []);
    } else {
      let query = supabase
        .from('artist_profiles_with_stats')
        .select(`
          *,
          profile:profiles(*)
        `);

      if (searchTerm) {
        query = query.or(`artist_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
      }

      // Sort artists
      if (sortBy === 'popular') {
        query = query.order('follower_count', { ascending: false });
      } else {
        query = query.order('artwork_count', { ascending: false });
      }

      const { data } = await query.limit(50);
      setArtists(data || []);
    }

    setLoading(false);
  }

  function handleSearch() {
    loadData();
  }

  function clearFilters() {
    setSelectedMedium('all');
    setSelectedTags([]);
    setContentRating('all');
    setSortBy('recent');
    setSearchTerm('');
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }

  const hasActiveFilters = selectedMedium !== 'all' || selectedTags.length > 0 || contentRating !== 'all' || searchTerm;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">Browse {view === 'artworks' ? 'Artworks' : 'Artists'}</h1>
            <p className="text-muted-foreground">Discover amazing creative works from the community</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={view === 'artworks' ? 'default' : 'outline'}
                onClick={() => setView('artworks')}
              >
                <Grid className="h-4 w-4 mr-2" />
                Artworks
              </Button>
              <Button
                variant={view === 'artists' ? 'default' : 'outline'}
                onClick={() => setView('artists')}
              >
                <List className="h-4 w-4 mr-2" />
                Artists
              </Button>
            </div>

            {/* Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      {[selectedMedium !== 'all' ? 1 : 0, selectedTags.length, contentRating !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search with filters
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {/* Sort By */}
                  <div>
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="views">Most Viewed</SelectItem>
                        <SelectItem value="likes">Most Liked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {view === 'artworks' && (
                    <>
                      {/* Medium */}
                      <div>
                        <Label>Medium</Label>
                        <Select value={selectedMedium} onValueChange={setSelectedMedium}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Mediums</SelectItem>
                            {ART_MEDIUMS.map(medium => (
                              <SelectItem key={medium} value={medium}>
                                {medium.charAt(0).toUpperCase() + medium.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Content Rating */}
                      <div>
                        <Label>Content Rating</Label>
                        <Select value={contentRating} onValueChange={setContentRating}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Ratings</SelectItem>
                            <SelectItem value="sfw">SFW</SelectItem>
                            <SelectItem value="nsfw">NSFW</SelectItem>
                            <SelectItem value="explicit">Explicit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tags */}
                      <div>
                        <Label className="mb-2 block">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {COMMON_ART_TAGS.map(tag => (
                            <Badge
                              key={tag}
                              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : view === 'artworks' ? (
            <ArtworkGallery artworks={artworks} columns={4} />
          ) : (
            <ArtistGrid artists={artists} />
          )}
        </div>
      </main>
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
