import { Skeleton } from "@/components/ui/skeleton";

export const LoginSkeleton = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Skeleton className="h-5 w-32 rounded-md" />
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6">
        <Skeleton className="mx-auto h-6 w-40 rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-4 w-2/5 rounded-md" />
      </div>
    </div>
  );
};
