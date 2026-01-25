export default function SubmitRestaurantPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-10 md:py-14">
      <h1 className="mb-2 text-2xl font-bold">Submit an African Restaurant</h1>

      <p className="mb-6 text-muted-foreground">Know a great African restaurant? Help the community discover it.</p>

      <form action="/submit-restaurant/submit" method="post" className="space-y-4">
        <input name="name" required placeholder="Restaurant name" className="w-full rounded-md border bg-background px-3 py-2" />
        <input name="city" required placeholder="City" className="w-full rounded-md border bg-background px-3 py-2" />
        <input name="state" required placeholder="State" className="w-full rounded-md border bg-background px-3 py-2" />

        <input
          name="cuisine_types"
          placeholder="Cuisine (e.g. Nigerian, Ethiopian)"
          className="w-full rounded-md border bg-background px-3 py-2"
        />

        <input name="address" placeholder="Address (optional)" className="w-full rounded-md border bg-background px-3 py-2" />
        <input name="phone" placeholder="Phone (optional)" className="w-full rounded-md border bg-background px-3 py-2" />
        <input name="website" placeholder="Website or Instagram" className="w-full rounded-md border bg-background px-3 py-2" />

        <textarea
          name="notes"
          placeholder="Anything else we should know?"
          className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2"
        />

        <input
          name="submitted_by_email"
          type="email"
          placeholder="Your email (optional)"
          className="w-full rounded-md border bg-background px-3 py-2"
        />

        <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">
          Submit Restaurant
        </button>
      </form>
    </div>
  );
}

