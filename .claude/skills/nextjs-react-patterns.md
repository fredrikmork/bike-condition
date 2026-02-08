# Next.js 16 + React 19 Patterns

## Description
Offer best practices for server components, client components, server actions, caching, routing, and performance optimization.

## When to Activate
- User asks about Next.js or React patterns
- User needs help with server vs client components
- User wants to implement server actions
- User asks about caching or data fetching
- Questions about routing, layouts, or middleware
- User mentions "server component", "client component", "server action", or "Next.js"

## Constraints
- Default to server components; use `"use client"` only when needed:
  - Event handlers (onClick, onChange, etc.)
  - React hooks (useState, useEffect, etc.)
  - Browser-only APIs
- Use server actions for mutations (forms, data updates)
- Follow Next.js 16 App Router conventions
- Leverage React 19 features:
  - `use()` hook for promises
  - Actions and transitions
  - Improved Suspense
- Avoid client-side data fetching; prefer server components with async/await
- Use proper caching strategies:
  - `unstable_cache` for expensive computations
  - `revalidatePath` / `revalidateTag` for cache invalidation
- Keep sensitive logic (API keys, database queries) in server components/actions

## Output Format
When providing Next.js/React guidance:

1. **Component Type** - Server or client, with rationale
2. **Code Example** - Full component implementation
3. **Data Fetching** - How to fetch and cache data
4. **Error Handling** - Error boundaries and fallbacks
5. **Performance** - Loading states and optimizations

Example patterns:

Server component with data fetching:
```tsx
// app/dashboard/page.tsx (Server Component - no directive needed)
import { getBikes } from '@/lib/strava';
import { BikeList } from '@/components/bike-list';

export default async function DashboardPage() {
  const bikes = await getBikes(); // Runs on server

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Bikes</h1>
      <BikeList bikes={bikes} />
    </main>
  );
}
```

Client component for interactivity:
```tsx
// components/bike-selector.tsx
"use client";

import { useState } from 'react';

export function BikeSelector({ bikes, onSelect }) {
  const [selected, setSelected] = useState(bikes[0]?.id);

  const handleSelect = (id: string) => {
    setSelected(id);
    onSelect(id);
  };

  return (
    <div className="flex gap-2">
      {bikes.map(bike => (
        <button
          key={bike.id}
          onClick={() => handleSelect(bike.id)}
          className={selected === bike.id ? 'bg-primary' : 'bg-muted'}
        >
          {bike.name}
        </button>
      ))}
    </div>
  );
}
```

Server action for mutations:
```tsx
// app/actions/components.ts
"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  bikeId: z.string().uuid(),
  name: z.string().min(1),
  replacementInterval: z.coerce.number().positive(),
});

export async function addComponent(formData: FormData) {
  const result = schema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('components')
    .insert(result.data);

  if (error) {
    return { error: { _form: ['Failed to add component'] } };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
```

Composition pattern (server + client):
```tsx
// Server component fetches data
async function BikeDetails({ bikeId }: { bikeId: string }) {
  const bike = await getBike(bikeId);
  const components = await getComponents(bikeId);

  return (
    <div>
      <h2>{bike.name}</h2>
      {/* Client component handles interaction */}
      <InteractiveComponentList components={components} />
    </div>
  );
}
```
