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
- Component icons (Lucide) and category grouping (drivetrain, wheels, braking, contact points)
- Dark theme

### Core Features
- Strava OAuth login/logout
- Activity sync from Strava (full history + incremental)
- Bike sync with automatic component distance updates
- Component wear tracking using `MAX(activity-based, gear-based)` distance calculation
- Default components auto-created for new bikes
- Custom component support (add/delete)
- Component replacement with date picker and history tracking
- Full re-sync capability to rebuild activity data from scratch

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
