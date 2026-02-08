# Security Best Practices

## Description
Prevent leaking secrets, ensure safe handling of environment variables, and enforce least-privilege principles for Strava scopes and Supabase policies.

## When to Activate
- When generating code that handles secrets or tokens
- When designing authentication or authorization
- When creating database schemas or RLS policies
- When integrating with external APIs
- Always apply these checks before finalizing code
- User asks about security, authentication, or permissions

## Constraints
- NEVER include real secrets, API keys, or tokens in code
- NEVER commit `.env` files or credentials
- NEVER log sensitive data (tokens, passwords, PII)
- Always use environment variables for secrets:
  - Access via `process.env` on server only
  - Use `NEXT_PUBLIC_` prefix only for truly public values
- Strava OAuth scopes - request minimum required:
  - `profile:read_all` for athlete and bikes
  - `activity:read_all` only if syncing activities
  - Never request `activity:write` unless needed
- Supabase RLS - always enable and verify:
  - Every table with user data must have RLS enabled
  - Policies must use `auth.uid()` to scope access
  - Test policies prevent cross-user data access
- Input validation:
  - Validate all user inputs with Zod
  - Sanitize any data rendered in HTML
  - Use parameterized queries (Supabase handles this)
- Token handling:
  - Store refresh tokens encrypted in database
  - Never expose tokens to client-side code
  - Implement proper token refresh flow

## Output Format
When providing security guidance:

1. **Threat Model** - What could go wrong
2. **Mitigation** - How to prevent it
3. **Implementation** - Secure code example
4. **Verification** - How to test the security measure

Example secure patterns:

Environment variable handling:
```typescript
// lib/env.ts - Validate env vars at startup
import { z } from 'zod';

const envSchema = z.object({
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});

// This will throw at build time if env vars are missing
export const env = envSchema.parse(process.env);
```

Secure token storage:
```typescript
// NEVER do this:
console.log('Token:', accessToken); // Leaks to logs
localStorage.setItem('token', accessToken); // Exposed to XSS

// DO this instead:
// Store in HTTP-only cookie (NextAuth handles this)
// Or store encrypted in Supabase
async function storeRefreshToken(userId: string, token: string) {
  const supabase = await createClient();
  await supabase
    .from('user_tokens')
    .upsert({
      user_id: userId,
      refresh_token: token, // Consider encryption at rest
      updated_at: new Date().toISOString(),
    });
}
```

RLS policy verification:
```sql
-- Enable RLS (required)
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bikes
CREATE POLICY "Users can view own bikes" ON bikes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own bikes
CREATE POLICY "Users can insert own bikes" ON bikes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Test: Verify policy works (run as different user)
-- Should return empty if user doesn't own any bikes
SELECT * FROM bikes;
```

Security checklist before deployment:
- [ ] No secrets in code or git history
- [ ] All tables have RLS enabled
- [ ] Environment variables validated
- [ ] Tokens stored securely (not in localStorage)
- [ ] Minimum OAuth scopes requested
- [ ] No sensitive data in logs
- [ ] HTTPS enforced
