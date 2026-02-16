# Architecture Overview

This document provides a comprehensive understanding of the codebase's architecture. Update this document as the codebase evolves.

## 1. Project Structure

```
bike-condition/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main dashboard (server component)
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── globals.css        # Global styles (dark theme)
│   │   ├── actions/
│   │   │   └── sync.ts       # Server action: syncStravaData
│   │   └── api/
│   │       └── auth/[...nextauth]/
│   │           └── route.ts   # Auth.js v5 route handler
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui primitives (auto-generated)
│   │   ├── BikeDashboard/    # Bike selector with client-side state
│   │   ├── selectedBike/     # Bike detail: ComponentCard, StatusBadge, etc.
│   │   ├── shared/           # SyncButton, AddComponentDialog, etc.
│   │   ├── StravaLoginButton/# OAuth login/logout
│   │   └── SessionProvider/  # Auth.js session wrapper
│   └── lib/
│       ├── auth/             # Auth.js v5 config (handlers, auth, signIn, signOut)
│       ├── strava/           # Strava API client, schemas, token management
│       ├── sync/             # Sync logic: activities.ts, bikes.ts
│       ├── components/       # Default component definitions
│       ├── supabase/         # Supabase client, types
│       └── utils.ts          # cn() utility
├── docs/                      # Project documentation
├── .claude/                   # Claude Code configuration & agents
├── public/                    # Static assets
└── package.json
```

## 2. System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   App Router (src/app/)                     ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  ││
│  │  │ Server       │  │ Client       │  │ API Routes       │  ││
│  │  │ Components   │  │ Components   │  │ (auth, actions)  │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
          │                                           │
          ▼                                           ▼
┌──────────────────────┐                 ┌──────────────────────┐
│   Supabase           │                 │   Strava API         │
│  ┌────────────────┐  │                 │  ┌────────────────┐  │
│  │ PostgreSQL     │  │                 │  │ OAuth 2.0      │  │
│  │ - users        │  │                 │  │ - /oauth/token │  │
│  │ - bikes        │  │                 │  │ - /athlete     │  │
│  │ - components   │  │                 │  │ - /activities  │  │
│  │ - history      │  │                 │  │ - /gear/{id}   │  │
│  ├────────────────┤  │                 │  └────────────────┘  │
│  │ Auth (RLS)     │  │                 └──────────────────────┘
│  └────────────────┘  │
└──────────────────────┘
```

## 3. Core Components

### 3.1 Frontend (Next.js App Router)

**Framework:** Next.js 16 with App Router
**UI Library:** React 19, shadcn/ui, TailwindCSS
**State Management:** Zustand (global), React state (local)
**Forms:** React Hook Form + Zod validation
**SVG Interaction:** D3.js
**Deployment:** Vercel

**Key Patterns:**
- Server components by default for data fetching
- Client components (`"use client"`) for interactivity
- Server actions for mutations
- Path alias: `@/*` → `./src/*`

### 3.2 Authentication

**Provider:** NextAuth.js with Strava OAuth
**Session Strategy:** JWT
**Token Storage:** Supabase (encrypted)

**Flow:**
1. User clicks "Sign in with Strava"
2. Redirect to Strava OAuth
3. Callback exchanges code for tokens
4. Tokens stored in Supabase
5. JWT session created

### 3.3 Backend Services

All backend logic runs as Next.js server components and server actions.

**Server Actions:** Handle mutations (create, update, delete)
**API Routes:** OAuth callbacks, webhooks (future)

## 4. Data Stores

### 4.1 Supabase (PostgreSQL)

**Purpose:** Primary database for all application data

**Tables:**
- `users` - User profiles linked to Strava
- `bikes` - User's bikes synced from Strava (includes `deleted_defaults`)
- `components` - Bike components with wear tracking (`current_distance`, `bike_distance_at_install`, `installed_at`, `replaced_at`)
- `activities` - Synced Strava cycling activities (linked to bike via `bike_id`)
- `user_tokens` - Strava access/refresh tokens with expiry
- `sync_status` - Last sync timestamps per user

**Security:**
- Row Level Security (RLS) on all tables
- Policies scope data to `auth.uid()`

### 4.2 Component Distance Calculation

Component wear distance uses the higher of two methods:

1. **Activity-based:** `SUM(activities.distance) WHERE bike_id = X AND start_date >= component.installed_at`
2. **Gear-based:** `bike.total_distance - component.bike_distance_at_install`

`current_distance = MAX(activity_based, gear_based)`

This ensures wear is never under-reported — if the gear API is stale, activity data wins; if activities are incomplete, gear data wins.

## 5. External Integrations

### 5.1 Strava API

**Purpose:** Authentication, bike data, activity tracking

**Endpoints Used:**
| Endpoint | Purpose |
|----------|---------|
| `POST /oauth/token` | Token exchange and refresh |
| `GET /athlete` | User profile and bikes |
| `GET /athlete/activities` | Activity list |
| `GET /gear/{id}` | Detailed bike info |

**Scopes Required:**
- `profile:read_all` - Athlete profile and bikes
- `activity:read_all` - Activity data for distance tracking

**Rate Limits:** 100 requests/15 min, 1000/day

**Known API Limitations:**
- `primary` field on `SummaryGear`/`DetailedGear` **always returns `false`** since Strava
  replaced the single "primary bike" concept with "default gear per sport type". The field
  still exists in the schema but is functionally dead. No API replacement exists for querying
  sport-specific gear defaults.
  ([Community Hub discussion](https://communityhub.strava.com/developers-api-7/unable-to-change-gear-for-an-activity-via-api-3180))
- **Workaround:** The app falls back to showing the most-ridden bike when no bike has
  `is_primary = true`. Future improvement: let users manually choose their featured bike.

### 5.2 Resend (Future)

**Purpose:** Email notifications for component replacement reminders

## 6. Deployment & Infrastructure

**Hosting:** Vercel
**Database:** Supabase (managed PostgreSQL)
**Domain:** Configured via Vercel
**CI/CD:** Vercel automatic deployments from GitHub

## 7. Security Considerations

**Authentication:** Strava OAuth 2.0 via NextAuth
**Authorization:** Supabase RLS policies
**Secrets:** Environment variables only, never committed
**Token Storage:** Refresh tokens in Supabase
**HTTPS:** Enforced by Vercel

**Strava Scopes:** Minimum required (least privilege)

## 8. Development Environment

**Local Setup:**
```bash
pnpm install
cp .env.example .env.local  # Add your keys
pnpm run dev
```

**Testing:** (To be implemented)
**Linting:** ESLint with next/core-web-vitals
**Type Checking:** TypeScript strict mode

## 9. Data Flow Examples

### Activity Sync Flow
```
syncStravaData(fullSync?)
    1. Sync activities (first, so bike sync has fresh data)
       → Full sync: delete existing activities, fetch all from epoch (no page limit)
       → Incremental: fetch since last sync (max 10 pages)
       → Insert new cycling activities into Supabase
    2. Sync bikes
       → Fetch athlete bikes from Strava
       → Update bike details (name, distance, etc.)
       → For each active component:
           activity_distance = SUM(activities since installed_at)
           gear_distance = bike.total_distance - bike_distance_at_install
           current_distance = MAX(activity_distance, gear_distance)
       → Add missing default components
    3. Revalidate dashboard
```

### Component Replacement Flow
```
User clicks "Replace" → Create history entry
    → Reset component.current_distance to 0
    → Set component.installed_at_distance = bike.total_distance
    → Save to Supabase
    → Revalidate UI
```

## 10. Project Identification

**Project Name:** Bike Condition
**Repository:** github.com/fredrikmork/bike-condition
**Hosting:** Vercel
**Database:** Supabase
**Last Updated:** 2026-02-16

## 11. Glossary

| Term | Definition |
|------|------------|
| Wear | Distance traveled since component installation |
| Replacement Interval | Recommended distance before replacing a component |
| Wear Percentage | (current_distance / replacement_interval) × 100 |
| RLS | Row Level Security - Supabase/PostgreSQL access control |
| Server Action | Next.js function that runs on the server for mutations |
