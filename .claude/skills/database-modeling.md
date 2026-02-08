# Database Modeling (Supabase/Postgres)

## Description
Assist with designing normalized schemas, relationships, migrations, RLS policies, and best practices for Supabase/PostgreSQL.

## When to Activate
- User asks about database schema design
- User needs help with table relationships or foreign keys
- User asks about Supabase migrations or SQL
- User needs Row Level Security (RLS) policies
- Questions about indexes, constraints, or performance
- User mentions "database", "schema", "migration", "RLS", or "Supabase"

## Constraints
- Use Supabase conventions and best practices
- Always include RLS policies for user data isolation
- Use UUIDs for primary keys (Supabase default)
- Include created_at and updated_at timestamps on all tables
- Foreign keys should reference auth.users(id) for user ownership
- Normalize data appropriately but avoid excessive joins for read-heavy operations
- Consider Supabase's realtime capabilities when designing schemas
- Use snake_case for table and column names (Postgres convention)

## Output Format
When providing database guidance:

1. **Schema Design** - SQL CREATE TABLE statements with comments
2. **Relationships** - Explanation of foreign keys and constraints
3. **RLS Policies** - SQL for row-level security
4. **Indexes** - Recommended indexes for query performance
5. **Migration Notes** - Any migration considerations

Example schema format:
```sql
-- Table: components
-- Tracks individual bike components and their wear state
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'chain', 'tire_front', 'cassette'
  installed_at_distance INTEGER NOT NULL DEFAULT 0, -- meters
  replacement_interval INTEGER NOT NULL, -- meters
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policy: Users can only access their own components
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own components" ON components
  FOR ALL USING (auth.uid() = user_id);
```
