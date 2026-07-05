import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export interface MetricCardProps {
  /** Large display value */
  value: string | number;
  /** Label below the value */
  label: string;
  /** Optional icon (lucide-react) */
  icon?: LucideIcon;
  /** Trend direction */
  trend?: "up" | "down" | "flat";
  /** Trend label (e.g. "+12%", "-3 this week") */
  trendLabel?: string;
  /** Accent color class (e.g. "text-primary", "text-success") */
  colorClass?: string;
  /** Click handler — makes the card interactive */
  onClick?: () => void;
  /** Optional className */
  className?: string;
}

const trendIcon = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
};

const trendColor = {
  up: "text-success",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

export const MetricCard = ({
  value,
  label,
  icon: Icon,
  trend,
  trendLabel,
  colorClass,
  onClick,
  className,
}: MetricCardProps) => {
  const TrendIcon = trend ? trendIcon[trend] : null;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "metric-tile text-left",
        onClick && "card-interactive",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("metric-value", colorClass)}>{value}</span>
        {Icon && (
          <Icon
            className={cn(
              "size-5 shrink-0",
              colorClass ?? "text-muted-foreground",
            )}
            strokeWidth={1.5}
          />
        )}
      </div>
      <span className="metric-label">{label}</span>
      {trendLabel && TrendIcon && (
        <div
          className={cn(
            "mt-1 flex items-center gap-0.5 text-xs font-medium",
            trendColor[trend ?? "flat"],
          )}
        >
          <TrendIcon className="size-3" />
          {trendLabel}
        </div>
      )}
    </button>
  );
};
