---
name: content-moderation-review
description: Handle Velvet Galaxy reports, content rating (SFW/NSFW), moderation queues, admin review workflows, and report lifecycle. Use when a task touches report handling, content flagging, moderation UI, or admin moderation tools.
---

# Content Moderation Review

Use this skill for moderation workflows and content safety.

## Workflow

1. Identify the moderation surface: user reporting, admin review queue, content rating enforcement, or automated flagging.
2. Follow the report-dismiss-review lifecycle: report intake, admin review, action (warn/suspend/remove), and resolution.
3. Respect user privacy throughout the moderation flow. Do not expose reporter identity to the reported user.
4. Apply content-rating (SFW/NSFW) visibility rules consistently across feed, search, and discovery surfaces.
5. Keep moderation actions auditable: log admin actions with timestamp, admin ID, and reason.
6. Verify that moderated content is properly hidden or removed from public surfaces while preserving evidence for review.

## Guardrails

- Do not implement auto-moderation that overrides human review for content removal decisions.
- Do not expose internal moderation notes to non-admin users.
- Keep report categories aligned with the report table schema.
