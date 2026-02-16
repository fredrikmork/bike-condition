# Changelog

All notable changes for this project in this file.

## 2026-02-16: Fix activity sync gap & activity-based component distances

### Bug fix
- **Activity sync gap**: Full sync was capped at 50 pages (5,000 activities), causing rides from Oct 2025 – Feb 2026 to never be fetched. Removed the page limit (safety cap at 200 pages / 20,000 activities).
- **Full re-sync support**: When `fullSync` is true, existing activities are deleted and rebuilt from scratch to clear stale data.

### Enhancement
- **Activity-based component distances**: Component wear is now calculated as `MAX(activity_sum, gear_formula)` instead of relying solely on `bike.total_distance - bike_distance_at_install`. This prevents under-reporting when either the gear API or activity data is incomplete.
- **Sync order changed**: Activities sync before bikes so the component distance calculation has fresh activity data.

### Files changed
- `src/lib/strava/client.ts` — `maxPages` default 10 → 200
- `src/lib/sync/activities.ts` — full re-sync deletes existing activities; no page limit for full sync
- `src/lib/sync/bikes.ts` — `updateComponentDistances` → `updateComponentDistancesFromActivities` with MAX fallback
- `src/app/actions/sync.ts` — `fullSync` parameter, activities-first sync order

## 2026-02-15: Component icons, category grouping, default deletion

- Added Lucide icons for each component type
- Components grouped by category (drivetrain, wheels, braking, contact points)
- Users can delete default components (tracked via `deleted_defaults` on bikes table)

## 2026-02-14: Component system rethink

- New default components with reliable distance tracking
- Custom component support via AddComponentDialog
- `bike_distance_at_install` field for accurate wear calculation

## 2026-02-12: Component distance tracking & replacement

- Component distance tracking based on `bike.total_distance - bike_distance_at_install`
- ReplaceDialog with date picker for recording replacements
- Fixed hydration mismatch issues

## 2026-02-10: Dashboard redesign

- Sidebar dashboard layout with light/dark theme
- Migrated all components to shadcn/ui

## 2026-02-09: Major dependency upgrade

- Next.js 16.1.6, React 19.2.4, TypeScript 5.9.3
- Auth.js v5 (replaced NextAuth v4)
- ESLint 9 with flat config

## 2026-02-08: Initial shadcn/ui setup & Supabase integration

- shadcn/ui initialized (New York style, CSS variables, Lucide icons)
- Supabase database with users, bikes, components, activities tables
- Strava OAuth login and activity sync
