"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  className = ""
}: PullToRefreshProps) {
  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    canRefresh
  } = usePullToRefresh({
    onRefresh,
    disabled
  });

  const progress = Math.min(pullDistance / 80, 1);
  const rotation = progress * 180;

  return (
    <div className={`relative ${className}`}>
      {/* Pull to refresh indicator */}
      {isPulling && !isRefreshing && (
        <div
          className="absolute top-10 left-0 right-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          style={{
            height: `${Math.min(pullDistance, 80)}px`,
            transform: `translateY(-${Math.min(pullDistance, 80)}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="transition-transform duration-200"
              style={{
                transform: `rotate(${rotation}deg)`
              }}
            >
              <ArrowPathIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-sm font-medium">
              {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Full-screen refreshing overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center min-h-screen w-full">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-white mx-auto mb-6"></div>
            <p className="text-white text-xl font-semibold">Refreshing...</p>
            <p className="text-white/70 text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}

      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-auto"
        style={{
          transform: isPulling && !isRefreshing ? `translateY(${Math.min(pullDistance, 80)}px)` : 'none',
          transition: isPulling && !isRefreshing ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
