import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  variant?: "song" | "artist" | "wide";
  className?: string;
}

export const SongCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-col", className)}>
    <div className="aspect-square rounded-xl skeleton-shimmer mb-3" />
    <div className="h-3.5 w-3/4 rounded skeleton-shimmer mb-1.5" />
    <div className="h-3 w-1/2 rounded skeleton-shimmer mb-1.5" />
    <div className="h-2.5 w-1/3 rounded skeleton-shimmer" />
  </div>
);

export const ArtistCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-col items-center gap-2.5 p-2", className)}>
    <div className="h-28 w-28 md:h-32 md:w-32 rounded-full skeleton-shimmer" />
    <div className="h-3.5 w-20 rounded skeleton-shimmer" />
    <div className="h-3 w-16 rounded skeleton-shimmer" />
  </div>
);

export const WideCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3 p-3 rounded-xl", className)}>
    <div className="h-12 w-12 rounded-lg skeleton-shimmer flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="h-3.5 w-3/4 rounded skeleton-shimmer mb-1.5" />
      <div className="h-3 w-1/2 rounded skeleton-shimmer" />
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <div className="px-4 lg:px-6 pt-4 pb-3">
    <div className="rounded-3xl overflow-hidden min-h-[360px] md:min-h-[440px] skeleton-shimmer" />
  </div>
);

export const SectionSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="px-4 lg:px-6 py-6">
    <div className="h-5 w-40 rounded skeleton-shimmer mb-4" />
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <SongCardSkeleton key={i} className="w-[160px] flex-shrink-0" />
      ))}
    </div>
  </div>
);
