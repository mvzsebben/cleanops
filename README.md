# CleanOps Phase 1

This repository contains Phase 1 of CleanOps: auth, client/property settings, iCal sync, manual bookings, dashboard timeline, list view, and the today summary cards.

## Exact commands to run

1. `cp .env.example .env.local`
   Creates your local environment file. This is where you paste your Supabase keys and app URL.

2. Open `.env.local` and paste your real values.
   There is no terminal command for this because it is safest to paste them directly into the file.

3. Run the SQL in [supabase/migrations/20260311100000_phase_1_schema.sql](/Users/marcosviniciuszenatosebben/Documents/New project 5/supabase/migrations/20260311100000_phase_1_schema.sql) inside the Supabase SQL Editor.
   This creates all Phase 1 tables, future-phase tables, indexes, triggers, and row-level security policies.

4. `npm install`
   Installs all project dependencies from `package.json`.

5. `npm run lint`
   Checks the code for problems like invalid imports, unused variables, and JSX issues.

6. `npm run build -- --webpack`
   Creates a production build and runs TypeScript checks. I used `--webpack` because Next 16's default Turbopack build can fail inside restricted sandboxes even when the app code is correct.

7. `npm run dev`
   Starts the local development server at `http://localhost:3000`.

## Files and what they do

- [middleware.ts](/Users/marcosviniciuszenatosebben/Documents/New project 5/middleware.ts): Redirects unauthenticated users away from protected routes and sends logged-in users to the dashboard.
- [vercel.json](/Users/marcosviniciuszenatosebben/Documents/New project 5/vercel.json): Schedules the cron sync route every 30 minutes.
- [supabase/migrations/20260311100000_phase_1_schema.sql](/Users/marcosviniciuszenatosebben/Documents/New project 5/supabase/migrations/20260311100000_phase_1_schema.sql): Full database schema and security policies.
- [src/app/login/page.tsx](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/app/login/page.tsx): Login and signup screen.
- [src/app/dashboard/page.tsx](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/app/dashboard/page.tsx): Main dashboard entry.
- [src/app/settings/clients/page.tsx](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/app/settings/clients/page.tsx): Client and property management screen.
- [src/app/api/sync/route.ts](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/app/api/sync/route.ts): Manual sync endpoint for the UI button.
- [src/app/api/cron/sync/route.ts](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/app/api/cron/sync/route.ts): Cron-secured sync endpoint for Vercel.
- [src/app/api/bookings/route.ts](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/app/api/bookings/route.ts): Create manual bookings.
- [src/app/api/bookings/[bookingId]/route.ts](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/app/api/bookings/[bookingId]/route.ts): Edit and delete manual bookings only.
- [src/components/dashboard/dashboard-shell.tsx](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/components/dashboard/dashboard-shell.tsx): Timeline calendar, list view, filters, overview cards, booking modal, and booking detail panel.
- [src/components/settings/client-settings.tsx](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/components/settings/client-settings.tsx): Client/property CRUD UI and sync status display.
- [src/lib/ical/parser.ts](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/lib/ical/parser.ts): Fetches and parses iCal feeds.
- [src/lib/ical/sync.ts](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/lib/ical/sync.ts): Upserts synced bookings and writes sync logs.
- [src/lib/data.ts](/Users/marcosviniciuszenatosebben/Documents/New project 5/src/lib/data.ts): Shared server-side data access and starter-data bootstrap logic.

## Decisions the spec did not fully define

1. Starter property names:
   The spec listed counts of properties, but not their names. I used clear placeholders like `David Airbnb 1` and `David Regular 1`. This is the safest option because it preserves the required counts and is easy to rename later.

2. Cancelled iCal events:
   The spec said to handle them but did not define whether to delete or keep them. I recommend keeping them as bookings with status `cancelled` so the dashboard has an audit trail and sync changes are reversible.

3. Existing project mismatch:
   The folder you pointed me to was an empty git repo, not an existing Next.js app. I created the app in a temporary `cleanops/` folder and moved it into the repository root because that was faster and less error-prone than hand-scaffolding Next.js.

## What I tested

- `npm run lint`
- `npm run build -- --webpack`

These passed locally. Live authentication, Supabase reads/writes, and iCal fetches still require your real `.env.local` values and the migration to be applied in your Supabase project.
