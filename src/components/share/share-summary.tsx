import { format } from "date-fns";
import { History } from "lucide-react";
import { DrivetrainIcon, SpokedWheelIcon } from "@/components/icons/component-icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { isContainerType } from "@/lib/components/containers";
import { COMPONENT_GROUPS, GROUPED_TYPES } from "@/lib/components/groups";
import { getBikeTypeIcon, getComponentIcon } from "@/lib/components/icons";
import { getBikeConfig, isComponentVisible } from "@/lib/components/visibility";
import type { Bike, Component, LubeType } from "@/lib/supabase/types";
import { calculateComponentWear, formatDistance, LUBE_LABELS } from "@/lib/wear/calculator";

/**
 * The read-only bike summary behind a share link. Pure presentation — no
 * store, no actions — so the transfer-preview screen (part 2 of the card) can
 * render the exact same view. Shows only what a buyer should see: the bike,
 * its parts, their wear, and the service history. No email, no Strava ids,
 * no activities, nothing from the parts bank.
 */

const CONFIG_LABELS: Record<string, string> = {
  disc: "Disc brakes",
  rim: "Rim brakes",
  mechanical: "Mechanical",
  electronic: "Electronic shifting",
  tubeless: "Tubeless",
  clincher: "Clincher",
  tubular: "Tubular",
};

interface ShareSummaryProps {
  bike: Bike;
  components: Component[];
  history: Component[];
}

export function ShareSummary({ bike, components, history }: ShareSummaryProps) {
  const config = getBikeConfig(bike);
  const visible = components.filter((c) => isComponentVisible(c.type, config));
  const wearing = visible.filter((c) => !isContainerType(c.type));
  const byType = new Map(visible.map((c) => [c.type, c]));

  const subtitle = [bike.brand_name, bike.model_name].filter(Boolean).join(" ");

  const configChips = [
    bike.brake_type && CONFIG_LABELS[bike.brake_type],
    bike.shifting_type && CONFIG_LABELS[bike.shifting_type],
    bike.drivetrain_speed && `${bike.drivetrain_speed}-speed`,
    bike.tire_system && CONFIG_LABELS[bike.tire_system],
    bike.weight != null && `${bike.weight.toFixed(1)} kg`,
  ].filter((v): v is string => typeof v === "string");

  // Service history rolled up per type: replaced how many times, last when.
  const historyByType = new Map<string, Component[]>();
  for (const c of history) {
    const list = historyByType.get(c.type) ?? [];
    list.push(c);
    historyByType.set(c.type, list);
  }

  return (
    <div className="space-y-6">
      {/* Bike header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bike.name}</h1>
        {subtitle && <p className="text-muted-foreground mt-0.5">{subtitle}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="font-medium">
            {formatDistance(bike.total_distance ?? 0)}
          </Badge>
          {configChips.map((chip) => (
            <Badge key={chip} variant="secondary" className="font-normal">
              {chip}
            </Badge>
          ))}
          <Badge variant="outline" className="font-normal text-muted-foreground">
            Tracked since {format(new Date(bike.created_at), "MMM yyyy")}
          </Badge>
        </div>
      </div>

      {/* Component groups */}
      <div className="space-y-3">
        {COMPONENT_GROUPS.map((group) => {
          const claimed = group.types
            .map((t) => byType.get(t))
            .filter((c): c is Component => c !== undefined);
          const groupComponents = group.isCatchAll
            ? [...claimed, ...wearing.filter((c) => !GROUPED_TYPES.has(c.type))]
            : claimed;

          if (groupComponents.length === 0) return null;

          const container = group.containerType ? (byType.get(group.containerType) ?? null) : null;
          const containerLabel = container
            ? [
                [container.brand, container.model].filter(Boolean).join(" ").trim(),
                container.notes?.trim(),
              ]
                .filter(Boolean)
                .join(" · ") || null
            : null;
          const description = containerLabel ?? (group.id === "frame" ? subtitle || null : null);

          const Icon =
            group.id === "drivetrain"
              ? DrivetrainIcon
              : group.id === "frame"
                ? getBikeTypeIcon(bike.bike_type, bike.frame_type)
                : SpokedWheelIcon;

          return (
            <Card key={group.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">{group.label}</span>
                </div>
                {description && (
                  <p className="mt-0.5 pl-[26px] text-xs text-muted-foreground">{description}</p>
                )}

                <div className="mt-3 space-y-3">
                  {groupComponents.map((component) => {
                    const wear = calculateComponentWear(component);
                    const indicatorColor =
                      wear.status === "critical"
                        ? "bg-status-critical"
                        : wear.status === "warning"
                          ? "bg-status-warning"
                          : "bg-status-healthy";
                    const meta = [component.brand, component.model]
                      .filter(Boolean)
                      .join(" ")
                      .trim();
                    const replacements = historyByType.get(component.type)?.length ?? 0;
                    const PartIcon = getComponentIcon(component.type, component.icon);

                    return (
                      <div key={component.id}>
                        <div className="flex items-baseline justify-between gap-3">
                          {/* div, not p: Badge renders a div and divs may not live inside p */}
                          <div className="flex min-w-0 items-center gap-1.5 truncate text-sm">
                            <PartIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {component.nickname ?? component.name}
                              {meta && <span className="text-muted-foreground"> — {meta}</span>}
                            </span>
                            {/* Spec rides the title row — it IS part of the part's identity */}
                            {component.spec && (
                              <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                                {component.spec}
                              </Badge>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDistance(component.current_distance ?? 0)} /{" "}
                            {formatDistance(component.recommended_distance)}
                          </span>
                        </div>
                        {/* Chain lube — a buyer's question in its own right */}
                        {component.lube_type && (
                          <div className="mt-1 flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-normal text-muted-foreground"
                            >
                              {LUBE_LABELS[component.lube_type as LubeType]}
                            </Badge>
                          </div>
                        )}
                        {component.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{component.notes}</p>
                        )}
                        <Progress
                          value={Math.min(wear.percentage, 100)}
                          className="mt-1.5 h-1.5"
                          indicatorClassName={indicatorColor}
                        />
                        {replacements > 0 && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/80">
                            <History aria-hidden="true" className="h-3 w-3" />
                            Replaced {replacements} time{replacements !== 1 ? "s" : ""} — last{" "}
                            {format(
                              new Date(
                                historyByType
                                  .get(component.type)!
                                  .reduce((a, b) =>
                                    (a.replaced_at ?? "") > (b.replaced_at ?? "") ? a : b
                                  ).replaced_at as string
                              ),
                              "MMM yyyy"
                            )}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
