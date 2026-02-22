import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WearStatus } from "@/lib/wear/calculator";

interface StatusIndicatorProps {
  status: WearStatus;
  isOverdue: boolean;
}

const gradients: Record<string, string> = {
  warning:  "linear-gradient(135deg, #fbbf24, #f97316)",
  critical: "linear-gradient(135deg, #f87171, #dc2626)",
};

export function StatusIndicator({ status, isOverdue }: StatusIndicatorProps) {
  if (status === "healthy") return null;

  return (
    <span className="inline-flex rounded-md p-px" style={{ background: gradients[status] }}>
      <Badge
        className={cn(
          "text-xs font-medium border-0 rounded-[5px]",
          status === "warning" && "bg-card text-status-warning",
          status === "critical" && "bg-card text-status-critical"
        )}
      >
        {isOverdue ? "Overdue" : "Due soon"}
      </Badge>
    </span>
  );
}
