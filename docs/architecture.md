# Architecture Overview

This document provides a comprehensive understanding of the codebase's architecture. Update this document as the codebase evolves.

## 1. Project Structure

```
bike-condition/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main dashboard page
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── globals.css        # Global styles
│   │   ├── getActivites.ts    # Strava API utilities
│   │   └── api/
│   │       └── auth/[...nextauth]/
│   │           └── route.ts   # NextAuth Strava OAuth
│   ├── components/            # React components
│   │   ├── StravaLoginButton/ # OAuth login/logout
│   │   ├── selectedBike/      # Bike display with SVG
│   │   ├── SessionProvider/   # NextAuth session wrapper
│   │   └── footer/            # Footer component
│   ├── types/                 # TypeScript interfaces
│   ├── enums/                 # Enums (e.g., ResourceState)
│   └── json/                  # Static mock data
├── docs/                      # Project documentation
├── .claude/                   # Claude Code configuration
│   └── skills/               # Custom Claude skills
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

**Tables (planned):**
- `users` - User profiles linked to Strava
- `bikes` - User's bikes synced from Strava
- `components` - Bike components with wear tracking
- `component_history` - Replacement history
- `activities` - Synced Strava activities
- `user_tokens` - Encrypted Strava refresh tokens

**Security:**
- Row Level Security (RLS) on all tables
- Policies scope data to `auth.uid()`

### 4.2 Static Data (Current)

**Location:** `src/json/detailedGear.json`
**Purpose:** Mock bike data for development
**Note:** Will be replaced by Supabase queries

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
npm install
cp .env.example .env.local  # Add your keys
npm run dev
```

**Testing:** (To be implemented)
**Linting:** ESLint with next/core-web-vitals
**Type Checking:** TypeScript strict mode

## 9. Data Flow Examples

### Activity Sync Flow
```
Strava Activity → Fetch via API → Calculate distance delta
    → Update bike.total_distance
    → Update each component.current_distance
    → Recalculate wear percentages
    → Save to Supabase
    → Revalidate dashboard
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
**Last Updated:** 2026-02-08

## 11. Glossary

| Term | Definition |
|------|------------|
| Wear | Distance traveled since component installation |
| Replacement Interval | Recommended distance before replacing a component |
| Wear Percentage | (current_distance / replacement_interval) × 100 |
| RLS | Row Level Security - Supabase/PostgreSQL access control |
| Server Action | Next.js function that runs on the server for mutations |
