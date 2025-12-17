-- Add media columns to marketplace_items
alter table public.marketplace_items
    add column if not exists images text[], -- Array of image URLs
    add column if not exists videos text[], -- Array of video URLs
    add column if not exists audio_url text;
-- Single audio URL

-- Add coordinates for location-based features (if not already added)
alter table public.marketplace_items
    add column if not exists latitude numeric,
    add column if not exists longitude numeric;

-- Create index for location-based queries
create index if not exists idx_marketplace_items_location
    on public.marketplace_items(latitude, longitude);

-- Update the image_url column to be nullable since we now have images array
alter table public.marketplace_items
    alter column image_url drop not null;
