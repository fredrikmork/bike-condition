# PROJECT-SPEC.md

## 1. Project Summary

The Cycling Component Wear Tracking App is a web application that integrates with Strava to track bicycle component wear based on ride distance. Users can view, edit, and manage components on their bikes, visualize wear progression, and interact with an SVG-based dashboard. The system uses Next.js 16, React 19, Supabase, TailwindCSS, shadcn/ui, and Zod for validation.

## 2. Core Objectives

- Provide accurate, distance-based wear tracking for bike components.
- Integrate seamlessly with Strava for authentication and ride data.
- Offer a clean, modern UI with interactive SVG elements and visualizations.
- Maintain a scalable architecture with strong type-safety and data validation.
- Support component editing, replacement history, and future notifications.

## 3. Functional Requirements

### 3.1 Authentication & User Management

- Users authenticate via Strava OAuth.
- Access tokens and refresh tokens are securely stored in Supabase.
- User sessions persist across visits.
- The system must refresh Strava tokens automatically when needed.

### 3.2 Bike & Activity Data

- Fetch user bikes from Strava.
- Fetch user activities and associate them with the correct bike.
- Recalculate bike distance and component wear after each activity.
- Handle edits to past Strava activities:
  - Recompute distances based on the activity’s date.
  - Update historical and current wear values.

### 3.3 Component Management

- Users can view all components on a selected bike.
- Users can edit:
  - Component name
  - Recommended replacement distance
  - Current distance
- Users can mark a component as replaced:
  - Reset wear
  - Create a historical entry
- System automatically updates component wear based on new rides.

### 3.4 Dashboard & Visualization

- Left side: interactive SVG road bike
  - Components are clickable
  - Selected components highlight or animate
- Right side: component details, progress bars, statistics
- Visual indicators for wear states:
  - Green → healthy
  - Yellow → approaching limit
  - Red → replacement recommended
- Graphs showing historical wear progression.

## 4. Non-Functional Requirements

### 4.1 Performance

- Dashboard should load within 1–2 seconds on modern devices.
- SVG interactions must feel smooth and responsive.

### 4.2 Security

- No secrets or `.env` files may be committed or suggested in code.
- All sensitive data must be stored in environment variables.
- Follow least-privilege principles for Strava scopes and Supabase policies.

### 4.3 Code Quality

- All commits must pass `npm run lint`.
- Code must follow consistent naming, modular structure, and idiomatic patterns.
- Zod validation must be used for all user input and external API responses.

### 4.4 Maintainability

- Architecture must support future features such as:
  - Email notifications
  - Multi-bike comparison
  - Strava webhooks
- Code should be easy to extend and refactor.

## 5. Technical Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TailwindCSS
- shadcn/ui
- D3.js (for SVG interactions)
- Zod (validation)

### Backend

- Supabase (PostgreSQL, Auth, Storage)
- Next.js Server Actions

### External Services

- Strava API (OAuth + activity data)

## 6. Data Model Overview

### Entities

- User
- Bike
- Component
- ComponentHistory
- Activity

### Key Relationships

- A user has many bikes.
- A bike has many components.
- A component has many historical entries.
- Activities belong to a user and optionally a bike.

## 7. User Flows

### 7.1 Login Flow

1. User clicks “Sign in with Strava”.
2. Redirect to Strava OAuth.
3. Next.js exchanges code for tokens.
4. Tokens stored in Supabase.
5. User redirected to dashboard.

### 7.2 Dashboard Flow

1. Fetch bikes from Supabase.
2. Fetch latest Strava activities.
3. Recalculate wear.
4. Render SVG + stats + progress bars.

### 7.3 Component Editing Flow

1. User selects a component.
2. Form opens (shadcn/ui dialog).
3. Zod validates input.
4. Server action updates Supabase.
5. UI refreshes with updated wear.

### 7.4 Component Replacement Flow

1. User clicks “Mark as replaced”.
2. System:
   - Creates history entry
   - Resets current distance
   - Updates wear calculations

## 8. Acceptance Criteria

### MVP

- User can log in with Strava.
- User can see their bikes and basic wear data.
- Wear updates based on Strava activities.
- Supabase stores all essential data.

### v1

- Component editing fully functional.
- Replacement history implemented.
- Wear recalculates correctly after each activity.

### v2

- Interactive SVG dashboard.
- Progress bars, graphs, and clean UI.
- Clickable components with detailed views.

## 9. Constraints

- No sensitive data may be logged or stored insecurely.
- No `.env` or secrets may be committed.
- Strava API rate limits must be respected.
- SVG interactions must remain performant.

## 10. Future Enhancements

- Email notifications for upcoming replacements.
- Strava webhooks for real-time updates.
- Mobile-optimized layout.
- Multi-bike comparison dashboard.
- Advanced analytics and predictive wear modeling.
