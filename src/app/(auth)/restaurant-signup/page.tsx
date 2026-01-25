"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/auth/slug";

const addressSchema = z.object({
  street: z.string().min(2, "Street is required."),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  zip: z.string().min(2, "ZIP is required."),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

const restaurantSignupSchema = z.object({
  // Step 1
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  contactName: z.string().min(2, "Contact name is required."),
  contactPhone: z.string().min(7, "Contact phone is required."),

  // Step 2
  restaurantName: z.string().min(2, "Restaurant name is required."),
  cuisineTypes: z.string().min(2, "Enter at least one cuisine type."),
  restaurantPhone: z.string().min(7, "Restaurant phone is required."),
  priceRange: z.enum(["1", "2", "3", "4"]),
  description: z.string().min(10, "Add a short description (min 10 chars)."),
  address: addressSchema,

  // Step 3
  imageUrls: z.string().optional(),
  operatingHoursJson: z.string().optional(),
});

type RestaurantSignupValues = z.infer<typeof restaurantSignupSchema>;

const defaultHoursJson = JSON.stringify(
  [
    { day_of_week: 1, open_time: "10:00", close_time: "22:00" },
    { day_of_week: 2, open_time: "10:00", close_time: "22:00" },
    { day_of_week: 3, open_time: "10:00", close_time: "22:00" },
    { day_of_week: 4, open_time: "10:00", close_time: "22:00" },
    { day_of_week: 5, open_time: "10:00", close_time: "23:00" },
    { day_of_week: 6, open_time: "12:00", close_time: "23:00" },
    { day_of_week: 0, open_time: "12:00", close_time: "21:00" },
  ],
  null,
  2,
);

function parseCuisineTypes(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseImages(input?: string): string[] {
  if (!input) return [];
  return input
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOperatingHours(input?: string): any[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function RestaurantSignupPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"account" | "restaurant" | "photos">("account");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, startTransition] = React.useTransition();
  const [info, setInfo] = React.useState<string | null>(null);

  const form = useForm<RestaurantSignupValues>({
    resolver: zodResolver(restaurantSignupSchema),
    defaultValues: {
      email: "",
      password: "",
      contactName: "",
      contactPhone: "",
      restaurantName: "",
      cuisineTypes: "",
      restaurantPhone: "",
      priceRange: "2",
      description: "",
      address: { street: "", city: "", state: "", zip: "", lat: "", lng: "" },
      imageUrls: "",
      operatingHoursJson: defaultHoursJson,
    },
    mode: "onSubmit",
  });

  // If a user verifies email and returns later, complete onboarding using saved draft.
  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const key = "afritable_owner_onboarding_draft";

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return;

      const raw = window.localStorage.getItem(key);
      if (!raw) return;

      try {
        const draft = JSON.parse(raw) as RestaurantSignupValues;
        setInfo("Finishing your onboarding…");

        const cuisineTypes = parseCuisineTypes(draft.cuisineTypes);
        const images = parseImages(draft.imageUrls);
        const operatingHours = parseOperatingHours(draft.operatingHoursJson);
        const address = {
          street: draft.address.street,
          city: draft.address.city,
          state: draft.address.state,
          zip: draft.address.zip,
          coordinates:
            draft.address.lat && draft.address.lng
              ? { lat: Number(draft.address.lat), lng: Number(draft.address.lng) }
              : null,
        };

        const baseSlug = slugify(draft.restaurantName);
        const insertRestaurant = async (slug: string) =>
          supabase
            .from("restaurants")
            .insert({
              owner_id: session.user.id,
              name: draft.restaurantName,
              slug,
              cuisine_types: cuisineTypes,
              address: address as any,
              phone: draft.restaurantPhone,
              price_range: Number(draft.priceRange),
              description: draft.description,
              images,
              hours: operatingHours as any,
              is_active: true,
            })
            .select("id")
            .single();

        let { data: restaurant, error } = await insertRestaurant(baseSlug);
        if (error) {
          const fallbackSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
          const retry = await insertRestaurant(fallbackSlug);
          restaurant = retry.data ?? null;
          error = retry.error ?? null;
        }
        if (error) throw error;
        if (!restaurant) throw new Error("Failed to create restaurant.");

        await supabase
          .from("availability_settings")
          .insert({ restaurant_id: restaurant.id, operating_hours: operatingHours })
          .throwOnError();

        window.localStorage.removeItem(key);
        router.replace("/dashboard");
        router.refresh();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Could not complete onboarding.";
        setFormError(message);
      } finally {
        setInfo(null);
      }
    })();
  }, [router]);

  async function validateStep(next: typeof step) {
    const fieldsByStep: Record<typeof step, (keyof RestaurantSignupValues | `address.${keyof RestaurantSignupValues["address"]}`)[]> = {
      account: ["email", "password", "contactName", "contactPhone"],
      restaurant: [
        "restaurantName",
        "cuisineTypes",
        "restaurantPhone",
        "priceRange",
        "description",
        "address.street",
        "address.city",
        "address.state",
        "address.zip",
      ],
      photos: [],
    };

    const fields = fieldsByStep[next] ?? [];
    const ok = await form.trigger(fields as never);
    return ok;
  }

  async function createRestaurantOwner(values: RestaurantSignupValues) {
    setFormError(null);
    setInfo(null);
    const supabase = createSupabaseBrowserClient();

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.contactName, phone: values.contactPhone, role: "restaurant_owner" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signupError) throw signupError;
    if (!signupData.user) throw new Error("Signup failed: missing user.");

    const session = signupData.session;

    // If email confirmation is enabled, there is no session yet => cannot create restaurants due to RLS.
    // Persist the draft and ask the user to confirm email, then return to complete onboarding.
    if (!session) {
      window.localStorage.setItem("afritable_owner_onboarding_draft", JSON.stringify(values));
      setInfo("Check your email to confirm your account. After confirming, log in to finish onboarding.");
      router.replace("/login?redirectTo=/restaurant-signup");
      return;
    }

    const baseSlug = slugify(values.restaurantName);
    const cuisineTypes = parseCuisineTypes(values.cuisineTypes);
    const images = parseImages(values.imageUrls);
    const operatingHours = parseOperatingHours(values.operatingHoursJson);

    const address = {
      street: values.address.street,
      city: values.address.city,
      state: values.address.state,
      zip: values.address.zip,
      coordinates:
        values.address.lat && values.address.lng
          ? { lat: Number(values.address.lat), lng: Number(values.address.lng) }
          : null,
    };

    const insertRestaurant = async (slug: string) =>
      supabase
        .from("restaurants")
        .insert({
          owner_id: session.user.id,
          name: values.restaurantName,
          slug,
          cuisine_types: cuisineTypes,
          address: address as any,
          phone: values.restaurantPhone,
          price_range: Number(values.priceRange),
          description: values.description,
          images,
          hours: operatingHours as any,
          is_active: true,
        })
        .select("id, slug")
        .single();

    // Try base slug first, then suffix if collision.
    let { data: restaurant, error: restaurantError } = await insertRestaurant(baseSlug);
    if (restaurantError) {
      const fallbackSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const retry = await insertRestaurant(fallbackSlug);
      restaurant = retry.data ?? null;
      restaurantError = retry.error ?? null;
    }

    if (restaurantError) throw restaurantError;
    if (!restaurant) throw new Error("Failed to create restaurant.");

    // Optional: create default availability settings
    await supabase
      .from("availability_settings")
      .insert({
        restaurant_id: restaurant.id,
        operating_hours: operatingHours as any,
      })
      .throwOnError();

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Restaurant owner onboarding</CardTitle>
          <CardDescription>Create an owner account and list your restaurant on AfriTable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Step 1: Account</TabsTrigger>
              <TabsTrigger value="restaurant">Step 2: Restaurant</TabsTrigger>
              <TabsTrigger value="photos">Step 3: Photos & Hours</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form
                className="grid gap-6"
                onSubmit={form.handleSubmit((v) => startTransition(() => void createRestaurantOwner(v).catch((e: unknown) => {
                  const message = e instanceof Error ? e.message : "Something went wrong.";
                  setFormError(message);
                })))}
              >
                <TabsContent value="account" className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" autoComplete="email" placeholder="owner@restaurant.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Kofi Mensah" autoComplete="name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact phone</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. +233..." autoComplete="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={async () => {
                        const ok = await validateStep("account");
                        if (ok) setStep("restaurant");
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="restaurant" className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="restaurantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Jollof & Co." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="restaurantPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant phone</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. +234..." autoComplete="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cuisineTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuisine types</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Nigerian, Ghanaian, Continental" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priceRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price range</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select price range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 - Budget</SelectItem>
                              <SelectItem value="2">2 - Casual</SelectItem>
                              <SelectItem value="3">3 - Upscale</SelectItem>
                              <SelectItem value="4">4 - Luxury</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell diners what makes your place special…" className="min-h-24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Allen Ave" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Ikeja" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Lagos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP</FormLabel>
                          <FormControl>
                            <Input placeholder="100001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="address.lat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="6.5244" inputMode="decimal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.lng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="3.3792" inputMode="decimal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="secondary" onClick={() => setStep("account")}>
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        const ok = await validateStep("restaurant");
                        if (ok) setStep("photos");
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="photos" className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="imageUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URLs (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={"One per line:\nhttps://...\nhttps://..."}
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="operatingHoursJson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating hours (JSON)</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-52 font-mono text-xs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {info ? <p className="text-sm font-medium text-muted-foreground">{info}</p> : null}
                  {formError ? <p className="text-sm font-medium text-destructive">{formError}</p> : null}

                  <div className="flex justify-between">
                    <Button type="button" variant="secondary" onClick={() => setStep("restaurant")}>
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating…" : "Create owner & restaurant"}
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

