# SVG & D3.js Interaction

## Description
Help with building interactive SVG components, mapping bike parts to SVG groups, and implementing D3.js animations, highlighting, and event handling.

## When to Activate
- User asks about SVG manipulation or interaction
- User needs help with D3.js animations or transitions
- User wants to implement click handlers on SVG elements
- User asks about highlighting or selecting bike components
- Questions about SVG structure, groups, or paths
- User mentions "SVG", "D3", "animation", "highlight", or "interactive"

## Constraints
- Use semantic SVG group IDs for bike components (e.g., `#chain`, `#front-tire`, `#cassette`)
- Keep SVG manipulation in client components (`"use client"`)
- Use D3.js for complex animations, but prefer CSS transitions for simple effects
- Ensure accessibility: include ARIA labels and keyboard navigation
- Maintain separation between SVG structure and interaction logic
- Use consistent color coding for wear states:
  - Green (#22c55e): < 50% wear
  - Yellow (#eab308): 50-80% wear
  - Orange (#f97316): 80-95% wear
  - Red (#ef4444): > 95% wear
- Optimize for performance: avoid re-rendering entire SVG on state changes

## Output Format
When providing SVG/D3 guidance:

1. **SVG Structure** - Required SVG groups and IDs
2. **D3 Selection** - How to select and manipulate elements
3. **Event Handling** - Click, hover, and keyboard events
4. **Animation** - Transition code with timing
5. **State Management** - How to sync with React state

Example D3 interaction pattern:
```typescript
"use client";
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

function BikeComponentHighlight({ selectedComponent, wearPercentage }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Reset all components
    svg.selectAll('.bike-component')
      .transition()
      .duration(200)
      .attr('stroke-width', 1)
      .attr('opacity', 0.7);

    // Highlight selected component
    if (selectedComponent) {
      svg.select(`#${selectedComponent}`)
        .transition()
        .duration(200)
        .attr('stroke-width', 3)
        .attr('opacity', 1)
        .attr('stroke', getWearColor(wearPercentage));
    }
  }, [selectedComponent, wearPercentage]);

  return <svg ref={svgRef}>{/* SVG content */}</svg>;
}

function getWearColor(percentage: number): string {
  if (percentage < 50) return '#22c55e';
  if (percentage < 80) return '#eab308';
  if (percentage < 95) return '#f97316';
  return '#ef4444';
}
```
