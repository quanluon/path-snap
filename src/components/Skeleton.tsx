"use client";

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export default function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-white/10 rounded';
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} mb-2 ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            style={index === lines - 1 ? { ...style, width: '75%' } : style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Predefined skeleton components for common use cases
export function ImageSkeleton({ className = '' }: { className?: string }) {
  return (
    <Skeleton 
      variant="rectangular" 
      className={`aspect-square ${className}`}
    />
  );
}

export function AvatarSkeleton({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <Skeleton 
      variant="circular" 
      width={size} 
      height={size} 
      className={className}
    />
  );
}

export function TextSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <Skeleton 
      variant="text" 
      lines={lines} 
      className={className}
    />
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-black/50 rounded-xl overflow-hidden ${className}`}>
      <ImageSkeleton />
      <div className="p-4">
        <TextSkeleton lines={2} className="mb-3" />
        <div className="flex items-center space-x-2 mb-2">
          <AvatarSkeleton size={24} />
          <Skeleton variant="text" width="60%" />
        </div>
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}

export function CarouselSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full bg-black ${className}`}>
      <div className="relative w-full h-screen flex flex-col">
        {/* Image skeleton with 4:3 aspect ratio */}
        <div className="flex-1 relative overflow-hidden bg-green flex items-center justify-center">
          <Skeleton variant="rectangular" className="w-full aspect-[4/3] max-w-full max-h-full" />
        </div>
        
        {/* Content skeleton */}
        <div className="bg-black p-6 flex-shrink-0">
          <Skeleton variant="text" width="80%" className="mb-4" />
          <div className="flex items-center space-x-4 mb-4">
            <AvatarSkeleton size={24} />
            <Skeleton variant="text" width="40%" />
          </div>
          <Skeleton variant="text" width="60%" className="mb-4" />
          <div className="flex space-x-4">
            <Skeleton variant="text" width="20%" />
            <Skeleton variant="text" width="20%" />
            <Skeleton variant="text" width="20%" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full bg-black/50 rounded-xl overflow-hidden ${className}`}>
      <div className="flex flex-col aspect-[4/3] mb-8">
        {/* Profile section skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AvatarSkeleton size={24} />
            <Skeleton variant="text" width="60px" />
          </div>
          <Skeleton variant="text" width="80px" />
        </div>
        
        {/* Image skeleton with 4:3 aspect ratio */}
        <div className="relative w-full mb-3">
          <Skeleton variant="rectangular" className="w-full aspect-[4/3]" />
        </div>
        
        {/* Reactions and views skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-4">
            <Skeleton variant="text" width="40px" />
            <Skeleton variant="text" width="40px" />
            <Skeleton variant="text" width="40px" />
          </div>
          <div className="flex items-center space-x-1">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" width="20px" />
          </div>
        </div>
        
        {/* Address skeleton */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" width="120px" />
          </div>
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="75%" />
        </div>
      </div>
    </div>
  );
}
