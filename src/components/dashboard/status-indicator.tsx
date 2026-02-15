import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WearStatus } from "@/lib/wear/calculator";

interface StatusIndicatorProps {
  status: WearStatus;
  isOverdue: boolean;
}

export function StatusIndicator({ status, isOverdue }: StatusIndicatorProps) {
  if (status === "healthy") return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        status === "warning" &&
          "border-status-warning/50 bg-status-warning/10 text-status-warning",
        status === "critical" &&
          "border-status-critical/50 bg-status-critical/10 text-status-critical"
      )}
    >
      {isOverdue ? "Overdue" : "Due soon"}
    </Badge>
  );
}
