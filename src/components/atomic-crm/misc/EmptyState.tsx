import { type LucideIcon, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
      className,
    )}
  >
    <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
      <Icon className="size-6 text-muted-foreground" strokeWidth={1.5} />
    </div>
    <div className="max-w-xs space-y-1">
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    {(action || secondaryAction) && (
      <div className="flex gap-2 pt-1">
        {action && (
          <Button size="sm" onClick={action.onClick} className="btn-press h-8 text-xs">
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={secondaryAction.onClick}
            className="btn-press h-8 text-xs"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    )}
  </div>
);
