# Code Quality & Linting

## Description
Ensure all generated code follows project linting rules, passes `npm run lint`, and uses consistent naming and modular structure.

## When to Activate
- Before finalizing any code generation
- User asks about code style or conventions
- User reports linting errors
- When reviewing or refactoring code
- Always apply these standards to generated code

## Constraints
- All code must pass `npm run lint` (ESLint with next/core-web-vitals)
- Follow TypeScript strict mode requirements
- Use consistent naming conventions:
  - Components: PascalCase (`BikeSelector.tsx`)
  - Functions/variables: camelCase (`getBikeData`)
  - Constants: UPPER_SNAKE_CASE (`MAX_WEAR_THRESHOLD`)
  - Files: kebab-case for non-components (`strava-client.ts`)
  - Database columns: snake_case (`created_at`)
- Import organization:
  1. React/Next.js imports
  2. Third-party libraries
  3. Internal aliases (@/...)
  4. Relative imports
  5. Types (separate with blank line if type-only)
- Prefer named exports over default exports (except pages)
- Use explicit return types for exported functions
- Avoid `any` type; use `unknown` and type guards instead
- Keep components under 200 lines; extract logic to hooks/utils
- Use path aliases (`@/`) instead of deep relative imports

## Output Format
When generating or reviewing code:

1. **Lint Check** - Verify code passes ESLint rules
2. **Type Safety** - Ensure strict TypeScript compliance
3. **Structure** - Modular, single-responsibility components
4. **Naming** - Consistent with project conventions
5. **Imports** - Properly organized and aliased

Example of well-structured code:
```typescript
// lib/strava/client.ts
import { z } from 'zod';

import { env } from '@/lib/env';

import type { StravaAthlete, StravaBike } from './types';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

const bikeSchema = z.object({
  id: z.string(),
  name: z.string(),
  distance: z.number(),
  primary: z.boolean(),
});

export async function getAthleteBikes(accessToken: string): Promise<StravaBike[]> {
  const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Strava API error: ${response.status}`);
  }

  const data = await response.json();
  const bikes = z.array(bikeSchema).parse(data.bikes);

  return bikes;
}
```

Common lint fixes:
```typescript
// Bad: unused variable
const unused = 'value';

// Bad: any type
function process(data: any) { ... }

// Good: explicit types
function process(data: unknown): ProcessedData {
  if (!isValidData(data)) {
    throw new Error('Invalid data');
  }
  return transform(data);
}

// Bad: inconsistent quotes
const mixed = "double" + 'single';

// Good: consistent quotes (prefer single in this project)
const consistent = 'always' + 'single';
```
