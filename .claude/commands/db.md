Act as the Supabase Specialist agent (see .claude/agents/supabase-specialist.md).

You have access to the Supabase MCP tools (list_tables, execute_sql, apply_migration, generate_typescript_types, get_advisors, etc.). Use them to inspect the current schema before making changes.

Follow these rules:
- Always enable RLS on tables with user data
- Use UUIDs for primary keys
- Include created_at/updated_at on all tables
- Use snake_case for table and column names
- Never store secrets in plain text
- Use apply_migration for DDL, execute_sql for queries

Task: $ARGUMENTS
