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
- Supabase database with RLS-protected tables: users, bikes, components, activities, user_tokens, sync_status
- Vercel hosting with automatic deployments from GitHub
- ESLint 9 flat config

### UI & Design
- shadcn/ui component library (New York style, CSS variables)
- Dashboard layout with bike selector and component detail view
- Component cards with color-coded wear progress bars (green → yellow → red)
- Collapsible component groups (Front Wheel, Rear Wheel, Drivetrain) with worst-status summary
- Two-column component grid at wider screen widths
- Sidebar: bike count with n+1 joke, total distance, collapsible Needs Attention section
- Dark theme

### Core Features
- Strava OAuth login/logout
- Activity sync from Strava (full history + incremental)
- Bike sync with automatic component distance updates
- Component wear tracking using `MAX(activity-based, gear-based)` distance calculation
- Default components auto-created for new bikes
- Add Component dialog with type dropdown (grouped by category, pre-filtered to missing types, distance auto-fill)
- Custom component support (add/delete) with icon picker
- Component replacement with date picker and history tracking
- Batch wheel replace: replace all wheel-mounted components at once from within the wheel group
- Full re-sync capability to rebuild activity data from scratch
- Electronic groupset tracker: km-since-charge chip for Di2/AXS/EPS bikes with per-system battery wear model (3 %/year degradation) and warning states

### Recent changes (2026-02-22)
- **Bike header metadata**: Frame type (Road/Mountain/Cross/Time Trial), dominant sport type (Ride/Virtual/MTB derived from activity history), and weight chips shown in the bike header. Outer Card wrapper removed for a flatter layout. Initial bike selection prefers Ride bikes over virtual-only bikes.
- **Mute components**: Components can be muted to hide them from the dashboard and suppress wear warnings. Accessible via a "X hidden components" link at the bottom of the component list.
- Sidebar redesign: StatsCards removed from dashboard; stats moved to sidebar (bike count, total distance, Needs Attention)
- Needs Attention list in sidebar: first 3 items shown, expandable, click navigates to bike
- n+1 bike joke as description text in sidebar Bikes section
- Component groups (Front Wheel, Rear Wheel, Drivetrain) as collapsible cards with worst-status summary
- Two-column grid inside groups and for ungrouped components at sm+ breakpoints
- Front/Rear prefix stripped from component names inside wheel group cards
- Batch "Replace whole wheel" dialog with checklist and shared date picker
- Electronic groupset charge chip with date dialog, battery health warnings, and tooltip
- Add Component dialog replaced free-text input with a category-grouped type dropdown; only non-installed types shown; recommended distance auto-fills for standard types
- Decorative icons removed from component card headers

### Recent Fixes (2026-02-16)
- Fixed activity sync gap that missed rides from Oct 2025 – Feb 2026 (page limit removed)
- Component distances now use activity data with gear-based fallback (MAX of both)
- Sync order: activities first, then bikes

## 3. What's next?

### v1 remaining
- Interactive SVG road bike illustration on the dashboard
- Click on SVG components to view wear details
- D3.js-based SVG highlighting, animations, and progress arcs

### v2
- Graphs and historical visualizations of component wear over time
- Handle cases where users edit past Strava activities (recalculate wear)
- Email notifications for component replacement reminders (Resend)
- User preferences for replacement intervals
- Manual bike selection as "featured" bike
