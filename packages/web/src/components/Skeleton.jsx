/**
 * Reusable skeleton loading components.
 */

export function SkeletonLine({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-800 p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-800 rounded w-1/3" />
          <div className="h-4 bg-gray-800 rounded w-2/3" />
        </div>
      </div>
      <div className="h-3 bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-800 rounded w-4/5" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden animate-pulse">
      <div className="bg-gray-900/50 p-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-800 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-3 flex gap-4 border-t border-gray-800/50">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-gray-800/60 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-800 rounded w-40 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-800 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-2.5 bg-gray-800 rounded w-1/2" />
                  <div className="h-5 bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonBenchmarks() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 animate-pulse">
        <div className="h-9 bg-gray-800 rounded-lg w-28" />
        <div className="h-9 bg-gray-800 rounded-lg w-28" />
      </div>
      <SkeletonTable rows={8} cols={5} />
    </div>
  );
}
