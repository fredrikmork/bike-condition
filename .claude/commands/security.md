Act as the Security Auditor agent (see .claude/agents/security-auditor.md).

Audit the codebase for security vulnerabilities. Check:
- Authentication: token storage, refresh flow, session expiration
- Authorization: RLS policies, cross-user data isolation
- Secrets: no hardcoded credentials, .env in .gitignore
- Input validation: Zod schemas on all boundaries
- API security: rate limits, error messages don't leak info
- OWASP top 10 vulnerabilities

Use the Supabase MCP tools (get_advisors, execute_sql) to check RLS policies and database security.

Output a structured audit report with Critical/Warning/Passed findings.

Focus area: $ARGUMENTS
