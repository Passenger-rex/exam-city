import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-dim rounded-lg ${className}`} />
  );
}

export function AppSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        {/* Hero Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
