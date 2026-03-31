"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageSquare, Eye, Play } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ArtworkWithStats } from "@/types/artwork";

interface ArtworkGalleryProps {
  artworks: ArtworkWithStats[];
  columns?: 2 | 3 | 4;
  showArtist?: boolean;
}

export function ArtworkGallery({
  artworks,
  columns = 3,
  showArtist = true,
}: ArtworkGalleryProps) {
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  if (artworks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No artworks found</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", gridClasses[columns])}>
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          showArtist={showArtist}
        />
      ))}
    </div>
  );
}

interface ArtworkCardProps {
  artwork: ArtworkWithStats;
  showArtist?: boolean;
}

function ArtworkCard({ artwork, showArtist = true }: ArtworkCardProps) {
  const [imageError, setImageError] = useState(false);

  const isVideo = artwork.media_type === 'video' || artwork.media_type === 'animation';
  const displayUrl = imageError ? '/placeholder.svg' : (artwork.thumbnail_url || artwork.media_url);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all">
      <Link href={`/artists/artwork/${artwork.id}`}>
        {/* Artwork Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={displayUrl}
            alt={artwork.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
          />

          {/* Media Type Indicator */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="p-3 bg-black/50 rounded-full">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
          )}

          {/* Content Rating Badge */}
          {(artwork.is_mature || artwork.content_rating !== 'sfw') && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="text-xs">
                {artwork.content_rating.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Commission Badge */}
          {artwork.is_commission && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                Commission
              </Badge>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-4 text-white text-sm">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{artwork.like_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{artwork.comment_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{artwork.view_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <CardContent className="p-4">
        {/* Title */}
        <Link href={`/artists/artwork/${artwork.id}`}>
          <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors mb-2">
            {artwork.title}
          </h3>
        </Link>

        {/* Artist Info */}
        {showArtist && artwork.artist && (
          <Link
            href={`/artists/profile/${artwork.artist_id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={artwork.artist.avatar_url || undefined} />
              <AvatarFallback>
                {artwork.artist.display_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {artwork.artist.display_name || artwork.artist.username}
            </span>
          </Link>
        )}

        {/* Tags */}
        {artwork.tags && artwork.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {artwork.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {artwork.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{artwork.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
