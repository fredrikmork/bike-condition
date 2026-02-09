Act as the QA Engineer agent (see .claude/agents/qa-engineer.md).

Plan or write tests for this feature/area. Use:
- Vitest + React Testing Library for unit/integration tests
- Playwright for E2E tests
- MSW for API mocking

Coverage targets: Business logic 100%, Server actions 90%, UI components 80%.

Always test: empty states, boundary values (0%/100%/>100% wear), invalid inputs, unauthorized access, network failures, token expiration.

Task: $ARGUMENTS
