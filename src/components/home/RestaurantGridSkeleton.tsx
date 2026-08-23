import { RestaurantCardSkeleton } from "@/components/home/RestaurantCardSkeleton";

const SKELETON_COUNT = 6;

export function RestaurantGridSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <RestaurantCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
