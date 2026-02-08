# UI/UX with shadcn/ui

## Description
Assist with designing clean, simple UI layouts using shadcn/ui, TailwindCSS, and best practices for dashboard structure.

## When to Activate
- User asks about UI design or layout
- User needs help with shadcn/ui components
- User wants to implement dashboard elements
- User asks about TailwindCSS styling
- Questions about responsive design or component composition
- User mentions "UI", "design", "shadcn", "dashboard", or "layout"

## Constraints
- Use shadcn/ui as the primary component library
- Follow the design style guide in CLAUDE.md:
  - Clean, simple, minimal distractions
  - Left side: SVG bike illustration (interactive)
  - Right side: statistics, progress bars, component details
- Use TailwindCSS for custom styling (no custom CSS unless necessary)
- Ensure responsive design (mobile-first with md/lg breakpoints)
- Use consistent spacing: Tailwind's spacing scale (p-4, gap-6, etc.)
- Color palette:
  - Primary: Strava orange (#fc4c02)
  - Background: Dark grey (#1a1a1a) or white
  - Text: Appropriate contrast ratios
- Prefer shadcn/ui components: Card, Button, Progress, Badge, Tabs, Dialog

## Output Format
When providing UI guidance:

1. **Component Structure** - JSX with shadcn/ui components
2. **Layout** - Grid/flex structure with Tailwind classes
3. **Responsiveness** - Mobile and desktop breakpoints
4. **Accessibility** - ARIA labels and keyboard support
5. **Variants** - Different states (loading, empty, error)

Example dashboard card:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

function ComponentWearCard({ component }) {
  const wearPercent = (component.currentDistance / component.replacementInterval) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {component.name}
        </CardTitle>
        <Badge variant={wearPercent > 80 ? "destructive" : "secondary"}>
          {Math.round(wearPercent)}%
        </Badge>
      </CardHeader>
      <CardContent>
        <Progress value={wearPercent} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {component.currentDistance.toLocaleString()} / {component.replacementInterval.toLocaleString()} km
        </p>
      </CardContent>
    </Card>
  );
}
```

Dashboard layout pattern:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
  {/* Left: Interactive SVG */}
  <div className="aspect-square lg:aspect-auto">
    <BikeSvg />
  </div>

  {/* Right: Stats and controls */}
  <div className="space-y-4">
    <StatsOverview />
    <ComponentList />
  </div>
</div>
```
