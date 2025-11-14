import { memo } from 'react';

/**
 * Skeleton loading card with shimmer animation
 * Displays while problems are being loaded
 */
function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-6 h-full w-full flex flex-col gap-4 border border-slate-700/50 animate-pulse">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-6 bg-slate-700/50 rounded w-3/4 shimmer" />
        <div className="h-6 bg-slate-700/50 rounded w-1/2 shimmer" />
      </div>

      {/* Difficulty badge skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-20 bg-slate-700/50 rounded-full shimmer" />
      </div>

      {/* Tags skeleton */}
      <div className="flex flex-wrap gap-2 mt-auto">
        <div className="h-6 w-16 bg-slate-700/50 rounded-md shimmer" />
        <div className="h-6 w-20 bg-slate-700/50 rounded-md shimmer" />
        <div className="h-6 w-14 bg-slate-700/50 rounded-md shimmer" />
      </div>
    </div>
  );
}

export default memo(SkeletonCard);
