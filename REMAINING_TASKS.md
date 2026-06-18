# Remaining Implementation Tasks

## Completed ✅

1. Fixed new node not displaying with selected color (line 992 in network-visualization.tsx)
2. Updated node edit dialog to use RelationshipTypeSelector component
3. Edge click detection and EdgeEditDialog integration (lines 1389-1431)
4. Map Legend card with collapsible node types, relationship types, and custom types (lines 2231-2341)
5. Immediate custom type creation (private or public pending approval)
6. Auto-selection of newly created types
7. Admin approval updates labels everywhere
8. TypeScript `ignoreBuildErrors: true` removed from next.config.mjs
9. i18n server layer (`server.ts`, `server-provider.tsx`, `index.ts`) created
10. Migration rollout + rollback files created for 046, 047, 048

## Database Migrations to Run

1. `scripts/046_fix_external_profiles_node_color.sql` ✅ (already run)
2. `scripts/047_add_more_line_styles.sql` ⏳ (needs to be run)
3. `scripts/048_immediate_custom_types.sql` ⏳ (needs to be run)

## Summary

The system now supports:

- ✅ Immediate custom type creation (private or public pending approval)
- ✅ Auto-selection of newly created types
- ✅ Admin approval updates labels everywhere
- ✅ Node colors display correctly
- ✅ Node edit dialog uses RelationshipTypeSelector
- ✅ Edge click detection with distance-to-line-segment algorithm
- ✅ Map legend card with dynamic custom type loading
- ✅ EdgeEditDialog for modifying relationships on edges
- ✅ 8 line style options per migration 047
- ✅ i18n server-layer locale resolution (cookie → Accept-Language → default)
- ✅ Security: TypeScript errors now block builds
