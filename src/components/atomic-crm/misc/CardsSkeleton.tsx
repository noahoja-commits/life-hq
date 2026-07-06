import { Card } from "@/components/ui/card";

export const CardsSkeleton = ({
  count = 6,
  className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
}: {
  count?: number;
  className?: string;
}) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="h-24 skeleton-shimmer border-muted" />
    ))}
  </div>
);
