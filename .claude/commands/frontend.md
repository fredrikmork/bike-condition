Act as the Frontend Specialist agent (see .claude/agents/frontend-specialist.md).

Build UI using shadcn/ui components, Tailwind CSS, and lucide-react icons. Follow these rules:
- Default to server components; use "use client" only when needed
- ALL UI must use shadcn/ui primitives (Button, Card, Badge, Progress, etc.)
- Use cn() from src/lib/utils for conditional classes
- Use the shadcn MCP tools to search/view/install components
- Mobile-first responsive design (md/lg breakpoints)
- Never fetch data in client components; pass from server
- Keep components under 200 lines

Task: $ARGUMENTS
