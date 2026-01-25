import Link from "next/link";

export function RestaurantDetails({ restaurant }: { restaurant: any }) {
  const a = restaurant?.address ?? {};
  const street = a?.street ?? "—";
  const city = a?.city ?? "—";

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-2 font-semibold">Details</h2>

      <p className="text-sm">
        <strong>Address:</strong> {street}, {city}
      </p>
      <p className="text-sm">
        <strong>Phone:</strong> {restaurant?.phone ?? "—"}
      </p>
      <p className="text-sm">
        <strong>Website:</strong>{" "}
        {restaurant?.website ? (
          <a className="text-primary hover:underline" href={restaurant.website} target="_blank" rel="noreferrer">
            {restaurant.website}
          </a>
        ) : (
          "—"
        )}
      </p>

      {restaurant?.description ? <p className="mt-2 text-sm text-muted-foreground">{restaurant.description}</p> : null}

      <Link href={`/admin/restaurants/${restaurant?.id}/edit`} className="mt-3 inline-block text-primary hover:underline">
        Edit Details →
      </Link>
    </div>
  );
}

