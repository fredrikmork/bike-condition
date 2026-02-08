# Zod Validation

## Description
Provide Zod schemas, validation patterns, and safe parsing strategies for forms, server actions, and external API responses.

## When to Activate
- User asks about validation or data parsing
- User needs Zod schemas for forms or APIs
- User wants to validate server action inputs
- User asks about type safety for external data
- Questions about error handling for invalid data
- User mentions "Zod", "validation", "schema", or "parsing"

## Constraints
- Always use Zod for runtime validation of external data
- Validate ALL data crossing trust boundaries:
  - Form inputs
  - Server action parameters
  - External API responses (Strava, etc.)
  - URL parameters and search params
- Use `.safeParse()` instead of `.parse()` for graceful error handling
- Infer TypeScript types from Zod schemas (avoid duplication)
- Provide meaningful error messages for user-facing validation
- Keep schemas close to where they're used (co-location)
- Use `z.coerce` for form data that comes as strings

## Output Format
When providing Zod guidance:

1. **Schema Definition** - The Zod schema with comments
2. **Type Inference** - How to extract TypeScript types
3. **Validation Usage** - How to use safeParse
4. **Error Handling** - How to handle and display errors
5. **Integration** - How it fits with forms/server actions

Example patterns:

```typescript
import { z } from 'zod';

// Schema for bike component
const componentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(['chain', 'cassette', 'tire_front', 'tire_rear', 'brake_pads']),
  replacementInterval: z.coerce.number().min(100).max(100000),
  installedAtDistance: z.coerce.number().min(0).default(0),
});

// Infer type from schema
type Component = z.infer<typeof componentSchema>;

// Safe parsing with error handling
function validateComponent(data: unknown): Component | null {
  const result = componentSchema.safeParse(data);

  if (!result.success) {
    console.error('Validation failed:', result.error.flatten());
    return null;
  }

  return result.data;
}

// Strava API response validation
const stravaGearSchema = z.object({
  id: z.string(),
  name: z.string(),
  primary: z.boolean(),
  distance: z.number(), // meters
  brand_name: z.string().nullable(),
  model_name: z.string().nullable(),
});

// Server action with validation
async function updateComponent(formData: FormData) {
  'use server';

  const rawData = Object.fromEntries(formData);
  const result = componentSchema.safeParse(rawData);

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  // Proceed with validated data
  await saveComponent(result.data);
  return { success: true };
}
```

Form integration with react-hook-form:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<Component>({
  resolver: zodResolver(componentSchema),
  defaultValues: { name: '', type: 'chain', replacementInterval: 3000 },
});
```
