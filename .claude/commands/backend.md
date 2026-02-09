Act as the Backend Engineer agent (see .claude/agents/backend-engineer.md).

Implement server-side logic for this Next.js app. Follow these patterns:
- Server actions in src/app/actions/ with Zod validation
- Strava integration via src/lib/strava/
- Database access via src/lib/db/
- Always check authentication before data access
- Handle errors gracefully, never expose tokens
- Respect Strava rate limits (100/15min, 1000/day)

Task: $ARGUMENTS
