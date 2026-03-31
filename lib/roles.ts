/**
 * Role-based access control utilities for Velvet Galaxy
 * Handles artist and admin role checks
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { ArtistProfile } from '@/types/artwork';

/**
 * User roles interface
 */
export interface UserRoles {
  isArtist: boolean;
  isAdmin: boolean;
  artistProfile: ArtistProfile | null;
}

/**
 * Check if a user is an artist (client-side)
 */
export async function isArtist(userId?: string): Promise<boolean> {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_artist')
    .eq('id', userId)
    .single();

  return data?.is_artist ?? false;
}

/**
 * Check if a user is an artist (server-side)
 */
export async function isArtistServer(userId?: string): Promise<boolean> {
  const supabase = await createServerClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_artist')
    .eq('id', userId)
    .single();

  return data?.is_artist ?? false;
}

/**
 * Check if a user is an admin (client-side)
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return data?.is_admin ?? false;
}

/**
 * Check if a user is an admin (server-side)
 */
export async function isAdminServer(userId?: string): Promise<boolean> {
  const supabase = await createServerClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return data?.is_admin ?? false;
}

/**
 * Get artist profile for a user (client-side)
 */
export async function getArtistProfile(userId?: string): Promise<ArtistProfile | null> {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return null;

  const { data } = await supabase
    .from('artist_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

/**
 * Get artist profile for a user (server-side)
 */
export async function getArtistProfileServer(userId?: string): Promise<ArtistProfile | null> {
  const supabase = await createServerClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return null;

  const { data } = await supabase
    .from('artist_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

/**
 * Get all roles for a user (client-side)
 */
export async function getUserRoles(userId?: string): Promise<UserRoles> {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) {
    return {
      isArtist: false,
      isAdmin: false,
      artistProfile: null,
    };
  }

  // Fetch profile and artist profile in parallel
  const [profileResult, artistProfileResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_artist, is_admin')
      .eq('id', userId)
      .single(),
    supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),
  ]);

  return {
    isArtist: profileResult.data?.is_artist ?? false,
    isAdmin: profileResult.data?.is_admin ?? false,
    artistProfile: artistProfileResult.data ?? null,
  };
}

/**
 * Get all roles for a user (server-side)
 */
export async function getUserRolesServer(userId?: string): Promise<UserRoles> {
  const supabase = await createServerClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) {
    return {
      isArtist: false,
      isAdmin: false,
      artistProfile: null,
    };
  }

  // Fetch profile and artist profile in parallel
  const [profileResult, artistProfileResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_artist, is_admin')
      .eq('id', userId)
      .single(),
    supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),
  ]);

  return {
    isArtist: profileResult.data?.is_artist ?? false,
    isAdmin: profileResult.data?.is_admin ?? false,
    artistProfile: artistProfileResult.data ?? null,
  };
}

/**
 * Check if current user can access artist features
 * Redirects to onboarding if not an artist
 */
export async function requireArtist(): Promise<boolean> {
  const isUserArtist = await isArtist();

  if (!isUserArtist) {
    // Redirect to artist onboarding
    if (typeof window !== 'undefined') {
      window.location.href = '/artists/become';
    }
    return false;
  }

  return true;
}

/**
 * Check if current user can access admin features
 * Redirects to home if not an admin
 */
export async function requireAdmin(): Promise<boolean> {
  const isUserAdmin = await isAdmin();

  if (!isUserAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/feed';
    }
    return false;
  }

  return true;
}

/**
 * React hook for getting user roles
 * Use this in client components
 */
export function useUserRoles() {
  const [roles, setRoles] = React.useState<UserRoles>({
    isArtist: false,
    isAdmin: false,
    artistProfile: null,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getUserRoles().then((userRoles) => {
      setRoles(userRoles);
      setLoading(false);
    });
  }, []);

  return { ...roles, loading };
}

// For the hook to work, import React
import React from 'react';
