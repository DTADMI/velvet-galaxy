# Content Moderation Review Docs

Load these docs when they match the moderation task:

- `sql/seed.sql`: seed data structures, including report categories.
- `scripts/036_create_reports_table.sql`: report table schema and RLS policies.
- `app/admin/`: admin dashboard and moderation interfaces.
- `lib/admin.ts`: admin role checking and access control.
- `components/report-dialog.tsx`: user-facing report submission UI.
