---
name: social-graph-management
description: Manage Velvet Galaxy relationships, custom labels, privacy scoping, consent flows, and network visualization data. Use when a task touches friending, following, relationship types, custom relationship labels, connection privacy, or the 3D/2D network graph.
---

# Social Graph Management

Use this skill for relationship and social graph work.

## Workflow

1. Identify which relationship type is affected: friend, follow, custom label, or organization connection.
2. Enforce mutual consent for relationship creation: both parties must accept before the relationship is visible.
3. Respect privacy settings: users can mute follow feeds, limit message reception, and control who sees their connections.
4. Keep the relationship label system extensible: custom labels must go through the mutual permission request flow.
5. Verify immediate UI counter updates on profiles when connections change (friend count, follower count).
6. Ensure the 3D/2D network visualization uses filtered connection data that respects privacy settings.
7. Keep organization/moral-person accounts restricted to follow-only (no friending).

## Guardrails

- Do not expose private relationship data in public profiles or APIs.
- Do not allow one-sided relationship creation without consent for mutual types.
- Keep the custom relationship label table aligned with the consent request flow.
