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

## 2. What’s been accomplished?

Strava integration is partially implemented and functioning at a basic level.

Vercel hosting is set up and the application is deployed.

Next.js project is established, but the framework and dependencies have not been updated for ~1.5 years.

## 3. What’s next?

Set up Supabase to store users, bikes, components, wear states, and historical data.

Update Next.js and all dependencies to current versions.

Implement a logged‑in user flow that fetches Strava data and updates component wear after each workout.

Add functionality for marking components as replaced, resetting wear, and updating historical records.

Implement historical views of component wear over time.

Handle cases where users edit past Strava activities:

Recalculate bike distance based on the date of the change

Update current and historical component wear accordingly

Sending email as notification so that users know when to change parts. Check out possibilities with "Resend".
