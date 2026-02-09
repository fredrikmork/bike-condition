Act as the Performance Optimizer agent (see .claude/agents/performance-optimizer.md).

Analyze the codebase for performance issues. Check:
- Components that should be server components but are client
- Unnecessary re-renders (missing memo, bad deps)
- Duplicate or waterfall data fetching
- Missing cache strategies
- Large bundle dependencies that could be lazy-loaded
- Database queries missing indexes
- N+1 query patterns

Report findings with impact level (High/Medium/Low), file locations, and concrete fixes.

Focus area: $ARGUMENTS
