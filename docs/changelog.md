# Changelog

All notable changes for this project in this file.

## 2026-07-22: Public share links for sale listings (Trello #21, part 1)

### New feature
- **Share a bike as a read-only page** — a `Share2` button beside the + opens a dialog that mints a public link (`/share/<token>`), made for pasting into a sale listing (Finn.no and the like). The page shows the bike, its config chips, every component group with wear bars, the owner's own notes, and the service history rolled up per part ("Replaced 3 times — last Jun 2026"), with a "Service history tracked with Bike Condition" footer.
- **One active link per bike** — sharing again returns the same URL, so a link already sitting in a listing never rotates behind the owner's back. Revoking flips the public page to "This listing is no longer available"; the row is kept, never deleted, so a revoked link answers rather than 404s.
- **What never leaves the house**: email, Strava ids, activities, parts in the bank, muted components. Notes are included deliberately — they are usually sale-relevant ("new bearings 2026").
- OG meta tags (`"GT GTR CARBON TEAM — 43 088 km"` / `"13 logged part replacements"`) for link previews, plus `noindex`.
- New landing-page selling point: "Sell with proof — share a read-only service-history link with any buyer."

### Implementation
- `bike_shares` table (token 128-bit base64url, unique; RLS on, service-role only). The token is the entire access control.
- `lib/db/shares.ts` + `app/actions/shares.ts` (create/get/revoke); public route `app/share/[token]/page.tsx` is `force-dynamic` so revocation and wear numbers are always current.
- `components/share/share-summary.tsx` is pure presentation by design — part 2 of the card (transferring a bike to another user) will reuse it as the buyer's preview screen.
- Verified end-to-end against the running dev server: valid token renders, bogus token and revoked share both answer "no longer available", OG tags present.

### Not included (part 2, separate step)
- Transferring a bike to another user with full history. Groundwork it needs from sync: skip-unlinked-bikes guard in `retireMissingBikes`, seller-side recreate guard, nullable `strava_gear_id`.

## 2026-07-22: Wheels as containers, Frame group (Trello #24, part 1 of 2)

### New feature
- **Wheels and the drivetrain are things of their own.** Every bike has a `wheel_front`, a `wheel_rear` and a `drivetrain` — ordinary component rows that hold the parts (tire/tube/rotor, chain/cassette/chainrings/BB/pulleys) rather than wearing out themselves. Give one a brand, model and note and it becomes the group's description. Containers take no nickname: brand and model already identify them.
- **Group summaries show what you entered**, not a wear readout: "Front Wheel — DT Swiss ARC 1100 · winter set" instead of "Tire — 87% · 640 km left". Notes trail brand and model so the identity reads first. The status dot and part count stay; the wear numbers live on the cards where they belong.
- **New Frame group** for everything bolted to the frame rather than to a wheel: brake pads (they sit in the caliper and stay behind when a wheel comes off), cables, cleats. It is also the catch-all — custom, legacy and unknown types land here instead of floating below the groups with no heading. The Frame group is described by the bike's own brand and model.

### Data model
- `components.parent_component_id` — self-referencing, `ON DELETE SET NULL`, so deleting a wheel leaves its parts on the bike rather than taking them with it.
- Containers are stored with `recommended_distance = 0`. That value is what keeps them out of the notification query, which already filtered `recommended_distance > 0`. Nothing may pass a container to `calculateComponentWear`: dividing by zero there reads as 100% and would show as a permanently critical component. The three call sites that iterate all components (both sidebar lists and the group summary) filter containers out explicitly.
- Parent links are resolved after the fact by `linkPartsToContainers(bikeId)` rather than threaded through each insert — the parent of a tire is fully determined by its type and its bike. Called from `createComponentsWithMounts` and after any mount, so a part moved to another bike picks up that bike's wheel; unmounting to the bank clears it.
- Backfill: 42 wheels and 21 drivetrains created across 21 bikes (retired ones included, or their groups would render without a heading), 189 existing parts linked, 0 left unlinked.
- Adding a container is a one-line change to `CHILDREN_OF_CONTAINER` in `lib/components/containers.ts` plus a backfill migration — `CONTAINER_TYPES`, the defaults for new bikes and the group plumbing all derive from that map.

### `TRAINER_PAUSE_TYPES` decoupled from grouping
The set of parts that skip indoor km used to be *derived from group membership*. Moving brake pads to Frame would have silently stopped excluding virtual rides from pad wear. It is now an explicit list of the same nine types, so where a part is shown and how its wear is counted are independent questions. All 58 tests pass unchanged, which is the check that the two sets are identical.
- The "Outdoor km only" badge follows the same split: it sits on the group only when every part in it skips indoor km, and on individual cards inside Frame, which mixes pads and cables (they do) with cleats and custom parts (they don't).

### Not included
- **Swapping wheels between bikes.** Deliberately deferred: the container model is the foundation, but moving a wheel means moving a set of parts without transactions, displacing the target bike's wheel and its parts, a disc/rim compatibility check, and a sync rule for a bike whose wheel sits in the bank. All of it is additive on top of this. Individual parts rotate exactly as before.

## 2026-07-21: Rotatable components — parts bank and mount periods (Trello #3)

### New feature
- A part is now an **independent thing**, not a property of one bike. Chains, cassettes and everything else can be moved between bikes and keep their accumulated wear.
- **Parts bank**: "Remove to bank" takes a part off without retiring it. Banked parts stop accumulating distance and are listed in a sidebar sheet with their wear, ready to be mounted again.
- **"Move to bike"** submenu on each component card. Mounting a part displaces whatever part of the same type was on that bike — it goes to the bank, exactly as the card describes.
- **Nicknames** (`components.nickname`) so two otherwise identical cassettes are distinguishable; shown instead of the component name.
- "Replace" keeps its old meaning — the part is worn out and goes to history. Moving is the separate action for parts that are still good.

### Data model
- New `component_mounts` table: one row per period a part sat on a bike (`mounted_at`/`unmounted_at`, `bike_distance_at_mount`/`bike_distance_at_unmount`). Wear is the sum over these periods rather than a function of one bike.
- `components.bike_id` is now nullable (NULL = in the bank) and `components.user_id` was added, so ownership no longer hangs off the bike. Every ownership check moved to `getOwnedComponent`, which also covers banked parts.
- A partial unique index (`idx_component_mounts_one_open`) enforces one open mount per part — the backstop against `components.bike_id` drifting from the mount rows. All transitions go through `lib/components/mounts.ts`, and all four component-creation sites now route through `createComponentsWithMounts`.
- `bike_distance_at_unmount` snapshots the bike's Strava total when a part comes off. Without it a moved part loses the gear-distance fallback that carries pre-app mileage, and its wear would visibly drop the first time it was moved.
- Backfill created one mount per existing component mirroring `installed_at`/`bike_distance_at_install`. A component with no mount rows falls back to that same synthetic shape, so a missed write degrades to the old behaviour instead of zeroing wear.

### Bug found while verifying: PostgREST's silent 1000-row cap
Verifying the migration surfaced a **pre-existing production bug**. PostgREST caps every response at 1000 rows without erroring, so wear calculations on bikes with more than 1000 activities were silently under-counting. Fredrik's GT GTR (2346 activities) had its components stored ~722 km too low; they correct upward on the next sync.
- New `lib/supabase/paginate.ts` (`fetchAllRows`) pages through the cap. Applied to the wear recomputation and to `getVirtualKmForBikes`, which had the same latent flaw.

### Implementation
- `computeComponentDistance` kept as the single-mount primitive; `computeComponentDistanceAcrossMounts` composes it per period. All 51 pre-existing tests still pass unchanged, plus 7 new ones for rotation.
- Sync restructured from a per-bike loop to one `recomputeComponentDistances(userId)` pass — a rotated part draws distance from several bikes and cannot be computed from one bike's data.
- **Equivalence verified**: for all 223 active components, the old and new algorithms produce identical results on the same data. The write path (mount, displace, bank, cascade) was verified end-to-end against the real database using throwaway parts that were deleted afterwards; components/mounts returned to 256/256 with zero drift.

### Not included
- Indoor/outdoor split per mount. The `usage_scope` column exists and is constrained to `all|indoor|outdoor`, but only `'all'` is ever written. Separate card.

## 2026-07-21: Read-only view of retired bikes (Trello #23)

### New feature
- **"Show retired bikes (n)"** toggle at the bottom of the sidebar's Bikes group, shown only when the user has retired bikes. Retired bikes render with an archive icon and muted text, and are excluded from the bike count and the "total" distance.
- Selecting one opens the normal detail view in **read-only mode**: a "Retired" badge next to the name, and no config button, no add-component, no batch replace, no edit/replace/mute/delete menu, no muted-components sheet, and no "sync to update" hints. Wear bars, distances, dates and replacement history stay fully visible.

### Strava: retirement is detected by absence
`/athlete` omits retired gear entirely, so `DetailedGear.retired` never comes back `true` through our sync path — the same dead-field trap as `primary`. A bike retired on Strava simply vanished from the sync loop and stayed `retired = false` forever, still showing as active.
- `retireMissingBikes()` in `lib/sync/bikes.ts` now marks any of the user's bikes absent from `athlete.bikes` as retired after a successful sync; bikes still present are un-retired, so bringing one back on Strava restores it. Guarded by the existing early-return on an empty gear list and scoped to `user_id`.
- The two `retired: gearDetails.retired ?? false` writes became explicit `retired: false` with comments; `StravaGearSchema.retired` carries a warning not to trust it.
- Historical bikes retired *before* first sync (6 on the author's account) are not backfilled — `activities` stores no `gear_id`, so their ids are unrecoverable without re-fetching activities from Strava.

### Implementation
- `getBikesWithComponents(userId, { retired })` replaces the hardcoded `retired = false` filter; `page.tsx` fetches both sets and resolves history/virtual km across all of them.
- `readOnly` threads from `Dashboard` → `BikeDetail` → `ComponentList` → `ComponentGroup` → `ComponentCard`. Retired bikes are never auto-selected unless they are all the user has.
- Server actions still do not check `bike.retired` — read-only is enforced in the UI only.

## 2026-06-20: Battery indicator with user-set warn distance (Trello #17)

### New feature
- **Phone-style battery glyph** on the electronic-drivetrain charge chip (`BatteryIcon`): a Lucide `Battery*` icon whose fill (full → medium → low → warning) reflects the remaining charge since the last top-up, depleting as you ride.
- **User-set warn distance**: a new "Warn after (km)" field in the charge dialog lets the rider set their expected km-per-charge; the battery indicator and the charge warning derive from it. Leaving it empty falls back to the age-based auto-estimate.

### Implementation
- DB migration `add_battery_range_km_to_bikes` — nullable `bikes.battery_range_km`.
- `lib/wear/battery.ts` — `getEffectiveChargeRange` honors the user range (skips age degradation); `getBatteryHealth` now returns `percent` (0–100) for the icon. New `battery.test.ts` (6 cases).
- `markChargedAction` persists the range; `bike-detail.tsx` renders the dynamic icon and the new field.

## 2026-06-20: Dead-code cleanup & dependency upgrades

### Removed (dead code, via knip + grep/Supabase cross-checks)
- Files: `components/shared/sync-button.tsx`, `app/actions/virtual-periods.ts`, `components/ui/scroll-area.tsx` — all had zero importers. The `useSyncStrava` hook and the live `getVirtualKmForBikes` query are unaffected.
- Packages: `@radix-ui/react-scroll-area`, `@supabase/ssr`, and the `shadcn` CLI devDep (invoked via `pnpm dlx`, not a build dep).
- Narrowed over-exported internal-only helpers to module scope: `calculateWear`, `getEffectiveChargeRange`, `BatteryStatus`, `WHEEL_TYPES`, `getBikesForUser`.

### Dependency upgrades (Renovate)
- `lucide-react` 0.577.0, `next-auth` 5.0.0-beta.31, plus in-range refresh of `postcss` 8.5.15, `tailwindcss` 4.3.1, `vitest` 4.1.9, `@biomejs/biome` 2.5.0.
- `biome.json`: `$schema` → 2.5.0; migrated deprecated `rules.recommended` to `rules.preset: "recommended"`.
- ~16 stale `renovate/*` branches (pre–Next 16 / React 19 / Auth.js v5) left unmerged — they would downgrade the app and should be closed.

### Flagged, not changed
- `getComponentIcon` (+ `ICON_MAP`/`CUSTOM_ICON_MAP`) in `lib/components/icons.ts` is unused, yet the icon **picker** (`CUSTOM_ICON_OPTIONS`) is live — a picked icon is stored but never rendered. Likely an unwired feature to either connect or remove deliberately.
- `bikes.pause_wheels_on_virtual` column exists but no code reads it (vestigial).

## 2026-06-20: Strava communication review — trainer flag, retired gear & resilient sync

Triggered by connecting `strava-mcp`, which let us verify the app's assumptions against live Strava data.

### New features / fixes

- **Indoor trainer rides excluded from wheel wear**: Strava marks stationary-trainer rides with `trainer: true` even when the sport type is a plain `Ride` (not `VirtualRide`). Previously only `VirtualRide` activities were excluded from wheel/cable wear, so trainer rides logged as `Ride` inflated tire/wheel distance. New nullable `activities.trainer` column stores the flag; `computeComponentDistance` now treats `trainer === true` OR `VirtualRide` as "indoor". The `VirtualRide` check is retained for activities synced before the flag existed.
  - **Backfill note**: existing activities default to `trainer = false`. A full re-sync (Sync → full) repopulates the flag for historical rides.
- **Retired bikes now synced**: The `bikes.retired` column existed but was never written. `StravaGearSchema` now captures Strava's `retired` field and `syncBikes` persists it on insert and update.
- **Resilient activity parsing**: `StravaClient.fetchArray` now parses each item independently with `safeParse` and skips (with a logged count) any malformed item, instead of letting a single bad activity abort the entire sync.
- **Schema coverage**: `StravaActivitySchema` gained `trainer` and `commute`; `StravaGearSchema` gained `retired`.
- **Removed dead `primary` logic**: Strava's `gear.primary` is permanently broken (always `false` — confirmed across all 21 bikes), so `is_primary` never drove any behaviour. Removed the column, the "Primary" badge, the selection branch, the query ordering, and the schema captures. Default-bike selection now relies on `default_sport_type` + distance ordering (unchanged in practice).

### Files changed
- `src/lib/sync/compute-distance.ts` — `isIndoorRide()` helper; indoor = trainer flag OR VirtualRide
- `src/lib/sync/compute-distance.test.ts` — trainer-flag test suite (4 new cases)
- `src/lib/sync/activities.ts` — stores `trainer` on insert
- `src/lib/sync/bikes.ts` — selects `trainer` for wear calc; persists `retired`
- `src/lib/strava/schemas.ts` — `trainer`/`commute` on activity, `retired` on gear
- `src/lib/strava/client.ts` — `fetchArray` skips unparseable items
- `src/lib/supabase/types.ts` — `activities.trainer` added; `bikes.is_primary` removed
- `src/components/dashboard/dashboard.tsx` — dropped `is_primary` from bike selection
- `src/components/dashboard/bike-detail.tsx` — removed "Primary" badge
- `src/lib/db/queries.ts` — removed `.order("is_primary")`
- DB migration `add_trainer_flag_to_activities` — `activities.trainer boolean NOT NULL DEFAULT false`
- DB migration `drop_unused_is_primary_from_bikes` — dropped `bikes.is_primary`

## 2026-06-07: Wheel components stuck at 0 km on first sync

### Bug fix

- **Wheels missing historical Strava distance**: When a user signed up with a bike that already had mileage on Strava but no rides logged in the app yet, wheel-type components (tires, inner tubes, brake pads, brake rotors, brake cables) showed 0 km while drivetrain components correctly inherited the bike's total distance. Root cause: `updateComponentDistancesFromActivities` skipped the gear-distance fallback unconditionally for `TRAINER_PAUSE_TYPES` to keep trainer km off road wheels — but this also blocked legitimate first-sync propagation. Fix: the fallback is now skipped only when the bike has at least one `VirtualRide` on record; otherwise wheels accumulate distance the same way as every other component.

### Files changed
- `src/lib/sync/bikes.ts` — `updateComponentDistancesFromActivities` computes `hasVirtualRides` per bike and uses it to gate the gear-distance fallback for wheel components

## 2026-03-23: Strava webhook, email notifications & header toolbar

### New features

- **Strava webhook**: `POST /api/strava/webhook` receives activity events from Strava and triggers an incremental sync automatically after every ride — no manual action required. `GET` handler responds to Strava's hub challenge for subscription verification. Sync runs in the background via Next.js `after()` so the response to Strava is always immediate.
- **Webhook subscription script**: `scripts/setup-strava-webhook.ts` registers, lists, and deletes Strava push subscriptions. Run once with `npx tsx --env-file=.env.local scripts/setup-strava-webhook.ts`.
- **Email notifications**: After each webhook-triggered sync, `checkAndSendNotifications(userId)` checks all active components and sends wear alerts via Resend — warn at ≥80 %, critical at ≥100 %. Deduplication via `notification_log` table ensures each threshold triggers only one email per component install. Log is cleared when a component is replaced.
- **Email settings UI**: Bell icon in the dashboard header opens a dialog to set the notification email address. Shows BellOff + red dot when no email is configured. Tooltip shows the current address when set.

### Changes

- **Header toolbar**: Sync button (↻), notification bell, and theme toggle consolidated in the dashboard header. Actions section removed from sidebar.
- **`notification_log` table**: `component_id`, `notification_type` (`warn`/`critical`), `sent_at`, `wear_pct_at_send`. Unique index on `(component_id, notification_type)` prevents duplicate sends.
- **`.env.example`**: Documents all required environment variables including `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STRAVA_WEBHOOK_VERIFY_TOKEN`, `NEXT_PUBLIC_APP_URL`, `STRAVA_WEBHOOK_SUBSCRIPTION_ID`.
- All UI text standardised to English.

### Files changed
- `src/app/api/strava/webhook/route.ts` — new: webhook GET/POST handler
- `src/lib/notifications/index.ts` — new: `checkAndSendNotifications`, `clearNotificationsForComponent`
- `src/lib/email/index.ts` — new: Resend client, `sendWarnEmail`, `sendCriticalEmail`
- `src/app/actions/user.ts` — new: `saveUserEmail`, `getUserEmail`
- `src/components/layout/email-settings-dialog.tsx` — new: email settings dialog
- `src/components/layout/dashboard-header.tsx` — sync button, bell icon, email dialog
- `src/components/layout/app-sidebar.tsx` — removed Actions section
- `src/app/actions/replace.ts` — clears notification log on component replace
- `src/lib/supabase/types.ts` — `notification_log` table types
- `src/lib/strava/schemas.ts` — `email` field added to `StravaAthleteSchema`
- `scripts/setup-strava-webhook.ts` — new: webhook subscription management script
- `.env.example` — new: documents all env vars
- `tsconfig.json` — `scripts/` excluded from Next.js compilation
- DB migration: `supabase/migrations/20260323_notification_log.sql`

## 2026-02-24: UX polish & trainer display fixes

### Enhancements

- **Needs Attention → focus component**: Clicking a Needs Attention sidebar item now scrolls to and highlights the corresponding ComponentCard with a status-coloured ring (`ring-status-warning` / `ring-status-critical`). Component groups auto-expand if the focused component is inside them. Focus clears automatically after 3 seconds. Implemented via `focusedComponentId` in the bike Zustand store.
- **"Tracking since" label**: Components without a replacement date now show "Tracking since [date]" instead of "Installed [date]", reflecting that the date is when tracking started in the app, not necessarily when the part was physically fitted.
- **Pointer cursor on dropdown items**: `cursor-default` changed to `cursor-pointer` in the `DropdownMenuItem` shadcn primitive — applies to all dropdown menus globally without per-item overrides.
- **Tooltips on component action menu**: Edit, Replace, Mute, View history and Delete each have a descriptive tooltip appearing to the right of the menu item.
- **Muted progress bar for paused components**: When a component is in an active trainer period (`trainerActive`), its wear progress bar renders in a neutral `bg-muted-foreground/40` instead of the status colour — wear percentage still shown correctly.
- **`brake_cables` replaces `shifter_cables` in `TRAINER_PAUSE_TYPES`**: Brake cables now receive the Trainer badge and muted bar; shifter cables no longer do.

### Bug fix

- **Paused components showing 0 km**: `TRAINER_PAUSE_TYPES` previously drove both the visual trainer indicator AND a sync-time exclusion of virtual-ride distance. This caused any component in the set to show 0 km if all rides since installation were virtual. The two concerns are now decoupled: `TRAINER_PAUSE_TYPES` controls only the visual display; all components accumulate distance from every activity using the standard `MAX(activity_sum, gear_distance)` formula. The `isDuringTrainerPeriod` helper and the conditional sync branch have been removed.

### Files changed
- `src/lib/stores/bike-store.ts` — added `focusedComponentId` + `setFocusedComponentId`
- `src/components/layout/sidebar-attention-items.tsx` — click sets both `selectedBikeId` and `focusedComponentId`
- `src/components/dashboard/component-card.tsx` — scroll-into-view + ring styling on focus; "Tracking since" label; muted indicator colour when `trainerActive`; tooltips on action menu items
- `src/components/dashboard/component-group.tsx` — auto-expand when focused component is a child
- `src/components/ui/dropdown-menu.tsx` — `cursor-default` → `cursor-pointer` in `DropdownMenuItem`
- `src/lib/components/groups.ts` — `brake_cables` replaces `shifter_cables` in `TRAINER_PAUSE_TYPES`
- `src/lib/sync/bikes.ts` — removed virtual-ride exclusion branch; all components use uniform `MAX(activity, gear)` distance calculation

## 2026-02-22: Trainer badge on affected wheel components

### Enhancement
- **Visual trainer indicator**: When a bike has an active trainer period (today falls within a configured date range), wheel component groups (Front Wheel / Rear Wheel) show a "Trainer" badge with a pause icon in the group header. Each individual wheel component card also shows the same badge next to the component name. Components remain fully editable.

### Files changed
- `src/components/dashboard/bike-detail.tsx` — fetch trainer periods on mount; compute `hasActiveTrainerPeriod`; pass to ComponentList
- `src/components/dashboard/component-list.tsx` — accept + forward `hasActiveTrainerPeriod` to wheel groups
- `src/components/dashboard/component-group.tsx` — accept `trainerActive`; show badge in group header; pass to ComponentCard
- `src/components/dashboard/component-card.tsx` — accept `trainerActive`; show badge next to component name

## 2026-02-22: Trainer period date ranges for wheel wear

### New feature
- **Trainer periods**: Users can define date ranges when a bike was on an indoor trainer. During those periods, VirtualRide activities are excluded from wheel component distance (tires, inner tubes, brake pads, rotors) — since the physical wheels stay on the real bike, not the trainer. The gear-based distance fallback is also skipped for wheel components when periods are configured (Strava's `total_distance` includes virtual distance). Periods are managed in the bike config dialog with native date inputs; end date is optional (leave empty for an ongoing period).
- Replaces the previous global "pause wheels on virtual rides" toggle with precise date-range control, so bikes used both outdoors and on a trainer are handled correctly.

### Files changed
- `src/app/actions/virtual-periods.ts` — new: `getVirtualPeriodsAction`, `addVirtualPeriodAction`, `removeVirtualPeriodAction`
- `src/lib/sync/bikes.ts` — per-activity filtering against trainer periods; no gear fallback for wheel components when periods exist
- `src/components/dashboard/bike-config-dialog.tsx` — trainer periods section with date inputs and list
- `src/lib/supabase/types.ts` — `VirtualPeriod` type
- `src/app/actions/bike-config.ts` — removed `setPauseWheelsOnVirtualAction`
- DB migration: `add_virtual_periods`

## 2026-02-22: Bike header metadata — sport type, frame type, weight

### New features
- **Frame type chip**: Road / Mountain / Cross / Time Trial label derived from Strava's `frame_type` field and shown as a chip below the bike title.
- **Sport type chip**: Most-used activity type per bike (e.g. "Ride", "Virtual", "MTB") derived from activity history and shown as a chip. Computed from the user's activity records and refreshed on every sync — not dependent on an undocumented Strava API field.
- **Weight chip**: Bike weight in kg shown as a chip when available from Strava's gear API.
- **Flat bike header**: Outer `<Card>` wrapper removed from `BikeDetail`; the content is now flush with the page for a cleaner layout.
- **Ride-first selection**: Initial bike selection now prefers bikes with `default_sport_type = "Ride"` over virtual-ride bikes, before falling back to the primary or most-ridden bike.

### Files changed
- `src/lib/sync/bikes.ts` — save `weight` from gear details; compute `default_sport_type` from activity history via `updateDominantSportTypes()`
- `src/lib/strava/schemas.ts` — `weight` field in `StravaGearSchema`
- `src/lib/supabase/types.ts` — `default_sport_type`, `weight` fields on Bike
- `src/components/dashboard/bike-detail.tsx` — remove outer Card; add frame/sport/weight chips
- `src/components/dashboard/dashboard.tsx` — prefer Ride bike in initial selection
- DB migration: `add_bike_sport_and_weight`

## 2026-02-22: Mute components

### New feature
- **Mute/unmute components**: Components can be muted to hide them from the dashboard and suppress wear warnings. A "X hidden components" link at the bottom of a bike's component list opens a slide-over sheet listing all muted components with individual Unmute buttons.

### Files changed
- `src/app/actions/components.ts` — added `muteComponentAction(componentId, muted)`
- `src/components/dashboard/component-card.tsx` — Mute option in the component actions menu
- `src/components/dashboard/muted-components-sheet.tsx` — new: sheet listing muted components
- `src/components/dashboard/bike-detail.tsx` — "X hidden components" button and `MutedComponentsSheet`
- `src/components/layout/sidebar-attention-items.tsx` — muted components excluded from Needs Attention
- `src/components/dashboard/component-list.tsx` — muted components filtered out
- `src/lib/supabase/types.ts` — `muted: boolean` on Component
- DB migration: `add_component_muted`

## 2026-02-22: Sidebar redesign — stats, n+1 joke & Needs Attention

### Changes
- **StatsCards removed**: The four stat cards (bikes, distance, attention, last sync) are removed from the main dashboard content area.
- **Sidebar — Bikes**: Label now shows `Bikes (n)` with the count. A description line below reads "The correct number of bikes is n+1. You currently have n = X." — hidden when the sidebar is collapsed. Total distance across all bikes shown below the list.
- **Sidebar — Needs Attention**: Components with warning or critical wear status appear under a dedicated "Needs Attention" group in the sidebar. Only the first 3 are shown; a "X more" toggle expands the rest. Clicking any item selects the relevant bike. Respects visibility rules (e.g. no cables shown for electronic shifting). Bike name shown as subtitle when user has multiple bikes.
- **Scrollbar layout fix**: `overflow-y: scroll` on the `html` element prevents layout shift when expanding cards causes a scrollbar to appear.

### Files changed
- `src/components/layout/app-sidebar.tsx` — bike count label, n+1 description, total distance, attention section
- `src/components/layout/sidebar-attention-items.tsx` — new: collapsible Needs Attention list
- `src/components/dashboard/dashboard.tsx` — removed StatsCards; simplified props to `lastSync`
- `src/components/dashboard/stats-cards.tsx` — deleted
- `src/app/page.tsx` — pass `lastSync` directly to Dashboard
- `src/app/globals.css` — `overflow-y: scroll` on `html`

## 2026-02-22: Component groups, batch replace & electronic groupset tracker

### New features
- **Component groups**: Front Wheel, Rear Wheel, and Drivetrain are now collapsible parent cards. Each group shows worst wear status and most-worn component in the collapsed state. Clicking expands to show all sub-components.
- **Two-column grid**: Components inside groups and ungrouped components display side-by-side at wider screen widths (`sm` breakpoint and above).
- **Front/Rear prefix stripping**: Component names inside wheel groups drop the redundant "Front"/"Rear" prefix and "(Front)"/"(Rear)" suffix from card headers.
- **Batch wheel replace**: Wheel groups have a "Replace whole wheel" button that opens a dialog to replace all wheel-mounted components at once (tire, inner tube, brake pads, rotor) with a shared date picker. Components can be unchecked to exclude from the batch.
- **Electronic groupset tracker**: For bikes configured with electronic shifting, a chip in the bike header shows the system type (Di2 / AXS / EPS) and km since last charge. Status colors turn amber ("Charge soon") at 80 % of the effective range and red ("Charge now") at 100 %.
- **Battery wear model**: Per-system recommended charging ranges (Di2 1 000 km, AXS 700 km, EPS 500 km) with 3 %/year Li-ion capacity degradation, floored at 50 % of rated range.
- **Charge dialog**: Tapping the charge chip opens a dialog with a date picker (defaults to today, can be back-dated). Charge date is stored and shown in the tooltip. The km counter resets optimistically to 0 on confirm.
- **Scrollbar layout fix**: `overflow-y: scroll` on the `html` element prevents layout shift when a scrollbar appears.

### Files changed
- `src/lib/components/groups.ts` — new: group definitions (`COMPONENT_GROUPS`, `GROUPED_TYPES`)
- `src/lib/wear/battery.ts` — new: battery health logic (per-system ranges, degradation, warning thresholds)
- `src/components/dashboard/component-group.tsx` — new: collapsible group card
- `src/components/dashboard/batch-replace-dialog.tsx` — new: batch wheel replace dialog
- `src/components/dashboard/component-list.tsx` — rewritten: group + ungrouped 2-col grid rendering
- `src/components/dashboard/component-card.tsx` — added optional `displayName` prop
- `src/components/dashboard/bike-detail.tsx` — charge chip, charge dialog with date picker, tooltip
- `src/app/actions/bike-config.ts` — added `markChargedAction(bikeId, chargedAt)`, `saveElectronicSystemAction`
- `src/components/dashboard/bike-config-dialog.tsx` — electronic system sub-selector (Di2/AXS/EPS/Other)
- `src/lib/supabase/types.ts` — new `ElectronicSystem` type; `electronic_system`, `last_charge_distance`, `last_charge_date` fields on Bike
- `src/app/globals.css` — `overflow-y: scroll` on `html`
- DB migrations: `add_electronic_groupset_fields`, `add_last_charge_date`

## 2026-02-22: Component type dropdown & remove card icons

### Enhancement
- **Add Component dialog**: replaced free-text name input with a `<Select>` dropdown showing only component types not already installed on the bike, grouped by category (Drivetrain / Wheels / Brakes / Other). Selecting a standard type auto-fills the recommended replacement distance. Name input and icon picker appear only when "Custom component" is chosen. Unconfigured bikes see only the custom option with a nudge to configure first.
- **Component cards**: removed the decorative icon from the card header for a cleaner layout.

### Files changed
- `src/lib/components/defaults.ts` — added `getAvailableComponentTypes(config, existingComponents)`
- `src/app/actions/components.ts` — added `addComponentAction` (unified action for standard + custom types)
- `src/components/dashboard/add-component-dialog.tsx` — full rewrite with type dropdown; accepts `bike` prop
- `src/components/dashboard/bike-detail.tsx` — pass `bike` instead of `bikeId` to `AddComponentDialog`
- `src/components/dashboard/component-card.tsx` — removed `Icon` render and `getComponentIcon` import

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
