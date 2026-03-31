"use client";

import Link from "next/link";
import { CheckCircle, Users, Image as ImageIcon, Heart } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ArtistProfileWithStats } from "@/types/artwork";

interface ArtistGridProps {
  artists: ArtistProfileWithStats[];
}

export function ArtistGrid({ artists }: ArtistGridProps) {
  if (artists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No artists found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}

interface ArtistCardProps {
  artist: ArtistProfileWithStats;
}

function ArtistCard({ artist }: ArtistCardProps) {
  const profile = artist.profile;
  const displayName = artist.artist_name || profile?.display_name || profile?.username || 'Unknown Artist';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="text-center pb-4">
        {/* Avatar */}
        <Link href={`/artists/profile/${artist.user_id}`} className="mx-auto mb-3">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg hover:scale-105 transition-transform">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Name and Badges */}
        <div className="space-y-2">
          <Link href={`/artists/profile/${artist.user_id}`}>
            <h3 className="font-bold text-lg hover:text-primary transition-colors flex items-center justify-center gap-2">
              {displayName}
              {artist.is_verified && (
                <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-500" />
              )}
            </h3>
          </Link>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {artist.is_featured && (
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
            )}
            {artist.commission_status === 'open' && (
              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                Commissions Open
              </Badge>
            )}
            {artist.commission_status === 'waitlist' && (
              <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400">
                Waitlist
              </Badge>
            )}
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {artist.bio}
          </p>
        )}

        {/* Specialties */}
        {artist.specialties && artist.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-3">
            {artist.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4 border-t">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <ImageIcon className="h-4 w-4" />
            </div>
            <p className="font-bold">{artist.artwork_count || 0}</p>
            <p className="text-xs text-muted-foreground">Artworks</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
            </div>
            <p className="font-bold">{artist.follower_count || 0}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Heart className="h-4 w-4" />
            </div>
            <p className="font-bold">{artist.total_views || 0}</p>
            <p className="text-xs text-muted-foreground">Views</p>
          </div>
        </div>

        {/* View Profile Button */}
        <Button asChild variant="outline" className="w-full">
          <Link href={`/artists/profile/${artist.user_id}`}>
            View Portfolio
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
