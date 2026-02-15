import { Bike, Route, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance } from "@/lib/wear/calculator";

interface StatsCardsProps {
  stats: {
    totalBikes: number;
    totalDistance: number;
    componentsNeedingAttention: number;
    lastSync: string | null;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const lastSyncLabel = stats.lastSync
    ? new Date(stats.lastSync).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  const cards = [
    {
      title: "Bikes",
      value: stats.totalBikes.toString(),
      icon: Bike,
    },
    {
      title: "Total Distance",
      value: formatDistance(stats.totalDistance),
      icon: Route,
    },
    {
      title: "Needs Attention",
      value: stats.componentsNeedingAttention.toString(),
      icon: AlertTriangle,
      highlight: stats.componentsNeedingAttention > 0,
    },
    {
      title: "Last Sync",
      value: lastSyncLabel,
      icon: Clock,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon
              className={`h-4 w-4 ${
                card.highlight
                  ? "text-status-warning"
                  : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                card.highlight ? "text-status-warning" : ""
              }`}
            >
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
