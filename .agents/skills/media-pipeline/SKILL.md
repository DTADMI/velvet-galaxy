---
name: media-pipeline
description: Handle Velvet Galaxy upload validation, EXIF stripping, media viewer security, album management, ephemeral content, and spoiler functionality. Use when a task touches media upload, media display, media security, or multi-image handling.
---

# Media Pipeline

Use this skill for media upload and display work.

## Workflow

1. Identify the media surface: upload flow, media viewer, album management, ephemeral content, or spoiler display.
2. Enforce EXIF stripping on all photo uploads before storage.
3. Apply content-rating visibility rules to media based on uploader settings and viewer context.
4. Support multi-image batch uploads with drag-and-drop, miniature grid preview, and album auto-creation.
5. Implement secure media viewing: anti-download measures (right-click protection), spoiler overlays, and ephemeral (view-once) logic.
6. Verify sequential media navigation (Next/Prev) in detail views for multi-image posts.
7. Keep video player controls consistent: muted hover-previews, full controls (speed, volume, fullscreen).

## Guardrails

- Do not serve media without proper authorization checks (RLS policies on storage buckets).
- Do not allow metadata leakage on media that should have EXIF stripped.
- Keep ephemeral media logic server-enforced; do not rely on client-only restrictions.
