export function RestaurantCardSkeleton() {
  return (
    <div className="group overflow-hidden rounded-xl bg-white border border-slate-100 animate-pulse">
      {/* Image Skeleton */}
      <div className="relative w-full overflow-hidden aspect-[4/3] bg-white/5">
        <div className="absolute inset-0 bg-slate-200" />
      </div>

      {/* Content Skeleton */}
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-6 w-3/4 bg-slate-200 rounded" />
          <div className="h-5 w-12 bg-slate-200 rounded" />
        </div>

        <div className="mb-4">
          <div className="h-5 w-24 bg-slate-200 rounded-md" />
        </div>

        <div className="mb-6">
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>

        <div className="w-full h-10 bg-slate-200 rounded-lg" />
      </div>

      {/* Button Skeleton */}
      <div className="px-5 pb-5">
        <div className="w-full h-10 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}
