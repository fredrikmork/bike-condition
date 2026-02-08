# MCP Server Configuration

This document describes the MCP (Model Context Protocol) servers configured for the bike-condition project.

## Overview

Claude Code has built-in tools for:
- **Filesystem**: Read, write, edit, glob, grep files
- **Git**: Commit, diff, status, branch operations
- **Shell**: Run npm, supabase CLI, and other commands
- **HTTP**: WebFetch for API calls

MCP servers extend these capabilities with specialized integrations.

## Configured MCP Servers

### Supabase MCP

**Description:**
Interacts with your Supabase database for schema inspection, safe queries, migrations, and RLS debugging.

**Capabilities:**
- Inspect database schema and tables
- Execute SQL queries (read-only by default)
- Generate and apply migrations with version tracking
- Generate TypeScript types from schema
- Fetch project configuration (URLs, API keys)
- Retrieve logs for debugging
- Manage database branches

**Safety Constraints:**
- Never modify or drop tables unless explicitly instructed
- Never expose secrets in responses
- Follow least-privilege principles

**When to Use:**
- Designing or updating database schema
- Validating data consistency
- Debugging Supabase/RLS behavior
- Generating migrations

**Example Interactions:**
- "Show me the structure of the components table"
- "Generate a migration to add a recommended_distance column"
- "List all RLS policies on the bikes table"
- "Generate TypeScript types for my schema"

**Installation:**
```bash
claude mcp add supabase -- npx -y @supabase/mcp-server@latest
```

On first use, you'll be redirected to authenticate with Supabase (no PAT required).

## Built-in Claude Code Tools (No MCP Required)

### Filesystem Operations
Claude Code natively handles file operations:
- Read files → `Read` tool
- Create files → `Write` tool
- Edit files → `Edit` tool
- Search files → `Glob`, `Grep` tools

### Git Operations
Claude Code natively handles git:
- View diffs → `git diff`
- Commit changes → `git commit`
- Check status → `git status`
- Branch management → standard git commands

### Shell Commands
Claude Code runs shell commands directly:
- `npm run lint` - Run linting
- `npm run dev` - Start dev server
- `npx shadcn@latest add <component>` - Add shadcn/ui components
- `supabase` CLI commands

### HTTP Requests
Claude Code can fetch web content:
- API documentation lookup
- Testing endpoints (with placeholder tokens)

## Adding More MCP Servers

To add additional MCP servers:

```bash
# Add an HTTP server
claude mcp add --transport http <name> <url>

# Add a stdio server
claude mcp add <name> -- <command> [args]

# List configured servers
claude mcp list

# Remove a server
claude mcp remove <name>
```

## Security Notes

- MCP servers run with your local permissions
- Supabase MCP authenticates via browser OAuth
- Never configure MCP servers to store or log secrets
- Review MCP server source code before adding untrusted servers

## Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Supabase MCP GitHub](https://github.com/supabase-community/supabase-mcp)
- [Claude Code MCP Guide](https://claude.ai/code)
