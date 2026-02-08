# Architecture & System Design

## Description
Help with designing system architecture, data flow, component structure, and high-level technical decisions for a Next.js 16 + React 19 + Supabase + Strava integration project.

## When to Activate
- User asks about system architecture or design patterns
- User needs help structuring components or features
- User asks about data flow between client, server, and external APIs
- User wants to plan a new feature or module
- Questions about how different parts of the system should communicate

## Constraints
- Always consider the existing tech stack: Next.js 16, React 19, Supabase, Strava API
- Prefer server components where possible, use client components only when needed
- Follow Next.js App Router conventions
- Consider scalability but avoid over-engineering for MVP
- Align with project goals in CLAUDE.md (wear tracking, Strava integration, interactive SVG dashboard)
- Reference existing architecture in `docs/architecture.md` when relevant

## Output Format
When providing architecture guidance:

1. **Context** - Brief summary of the problem or feature
2. **Proposed Approach** - High-level design with rationale
3. **Data Flow** - How data moves through the system (use ASCII diagrams when helpful)
4. **Key Components** - List of components/modules involved
5. **Trade-offs** - Pros/cons of the approach
6. **Next Steps** - Actionable implementation steps

Example data flow diagram:
```
User Action → Server Action → Supabase → Response → UI Update
                    ↓
              Strava API (if needed)
```
