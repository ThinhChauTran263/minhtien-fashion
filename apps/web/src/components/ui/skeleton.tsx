import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-gradient-to-r from-primary-100 via-primary-200 to-primary-100 bg-[length:200%_100%]", className)} />;
}

