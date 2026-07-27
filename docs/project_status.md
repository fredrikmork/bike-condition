# Project status

## 1. What are the project milestones?

### MVP (minimum viable product):

Full Strava integration with a working Supabase database for authentication, bike data, and component tracking.

Basic distance‑based wear tracking for components.

### v1:

Users can edit the components on their bikes (recommended distances, replacement actions, resets).

Automatic updates to component wear after each new Strava activity.

Component replacement history is tracked and reflected in wear calculations.

### v2:

Clean UI using shadcn/ui.

Interactive SVG road bike on the left side of the dashboard.

Graphs, statistics, and progress bars on the right side.

Clickable SVG components showing detailed wear information.

## 2. What's been accomplished?

### Infrastructure
- Next.js 16 with App Router, React 19, TypeScript 5.9 (strict mode)
- Auth.js v5 with Strava OAuth (JWT session strategy)
- Supabase database with RLS-protected tables: users, bikes, components, activities, user_tokens, sync_status, notification_log
- Vercel hosting with automatic deployments from GitHub
- ESLint 9 flat config

### UI & Design
- shadcn/ui component library (New York style, CSS variables)
- Dashboard layout with bike selector and component detail view
- Component cards with color-coded wear progress bars (green → yellow → red)
- Collapsible component groups (Front Wheel, Rear Wheel, Drivetrain) with worst-status summary
- Two-column component grid at wider screen widths
- Sidebar: bike count with n+1 joke, total distance, collapsible Needs Attention section
- Header toolbar: manual sync button, notification bell, theme toggle
- Dark theme

### Core Features
- Strava OAuth login/logout
- **Strava webhook**: automatic activity sync triggered by Strava after every ride (no manual action needed)
- Activity sync from Strava (full history + incremental, 7-day overlap)
- Bike sync with automatic component distance updates
- Component wear tracking using `MAX(activity-based, gear-based)` distance calculation
- Default components auto-created for new bikes
- Add Component dialog with type dropdown (grouped by category, pre-filtered to missing types, distance auto-fill)
- Custom component support (add/delete) with icon picker
- Component replacement with date picker and history tracking
- Batch wheel replace: replace all wheel-mounted components at once from within the wheel group
- Full re-sync capability to rebuild activity data from scratch
- Electronic groupset tracker: km-since-charge chip for Di2/AXS/EPS bikes with per-system battery wear model (3 %/year degradation) and warning states
- **Email notifications**: wear alerts at 80 % (warn) and 100 % (critical) via Resend — deduped per component install, reset on replacement
- **Component rotation & parts bank**: parts move between bikes with their wear; wear sums over `component_mounts` periods
- **Containers**: wheels and drivetrain are parts that hold other parts (`parent_component_id`), carrying user-entered brand/model/notes shown as group descriptions; new Frame catch-all group
- **Public share links**: read-only bike summary at `/share/<token>` for sale listings — wear, service history, OG preview, revocable
- **Bike transfer**: hand a bike to another user with full history via an invite link; buyer links it to their own Strava afterwards, guided by an in-app banner

### Recent changes (2026-07-27)
- **Part-shaped icons** (Trello #14): hand-drawn SVGs per component type + bike silhouettes per bike type, replacing generic lucide placeholders. On cards, group headers, parts bank, share page, and sidebar.
- **Backdated replacement fix** (Trello #5): replacements dated in the past now freeze at the distance ridden by that date, not at click time; 27 historical rows repaired.

### Recent changes (2026-07-22)
- **Bike transfer** (Trello #21 part 2): `bike_transfers` table, transfer dialog behind the share dialog, public accept page at `/transfer/<token>`, unlinked-bike banner with live Strava gear picker, sync guards for unlinked/sold gear. `bikes.strava_gear_id` now nullable.
- **Share links for sale listings** (Trello #21 part 1): `bike_shares` table, share button beside +, public `force-dynamic` page reused as the transfer preview in part 2. Landing page gained the "Sell with proof" selling point.
- **Containers & Frame group** (Trello #24 part 1): wheels/drivetrain as container rows, explicit `TRAINER_PAUSE_TYPES` decoupled from grouping, muted-components entry moved beside the + button.

### Recent changes (2026-03-23)
- **Strava webhook**: POST `/api/strava/webhook` auto-syncs after each activity. Responds immediately, runs sync in background via `after()`. GET handler responds to Strava hub challenge for subscription setup.
- **Email notifications**: `checkAndSendNotifications(userId)` runs after each webhook sync. Sends warn/critical emails via Resend. `notification_log` table tracks sent notifications to avoid duplicates. Log cleared on component replacement.
- **Email settings**: Bell icon in dashboard header opens dialog to set notification email. BellOff + red dot when no email is configured.
- **Header toolbar**: Sync, bell, and theme toggle moved to dashboard header. Actions section removed from sidebar.

## 3. What's next?

### v1 remaining
- Interactive SVG road bike illustration on the dashboard
- Click on SVG components to view wear details
- D3.js-based SVG highlighting, animations, and progress arcs

### v2
- Graphs and historical visualizations of component wear over time
- Handle cases where users edit past Strava activities (recalculate wear)
- User preferences for replacement intervals
- Manual bike selection as "featured" bike
- Wheel swapping between bikes as a unit (Trello #25 — container model already in place)
