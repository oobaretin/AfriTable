"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const signupSchema = z.object({
  fullName: z.string().min(2, "Enter your full name."),
  phone: z.string().min(7, "Enter a valid phone number."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignupValues = z.infer<typeof signupSchema>;

const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

export default function SignupPage() {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", phone: "", email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          phone: values.phone,
          role: "diner",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    // Only write to `profiles` if a session exists (email confirmation disabled).
    // Otherwise auth.uid() is null and RLS will reject writes.
    if (data.session?.user) {
      await supabase
        .from("profiles")
        .upsert({
          id: data.session.user.id,
          full_name: values.fullName,
          phone: values.phone,
          role: "diner",
        })
        .throwOnError();
    }

    router.replace("/");
    router.refresh();
  }

  async function signUpWithGoogle() {
    setFormError(null);
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/")}`,
      },
    });
    if (error) setFormError(error.message);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Start booking tables with AfriTable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {isGoogleAuthEnabled ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => startTransition(() => void signUpWithGoogle())}
              disabled={isSubmitting}
            >
              Continue with Google
            </Button>
          ) : (
            <div className="grid gap-2">
              <Button type="button" variant="outline" disabled>
                Continue with Google (disabled)
              </Button>
              <p className="text-xs text-muted-foreground">
                Google sign-up will be enabled when you add your domain in Supabase.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Form {...form}>
            <form
              className="grid gap-4"
              onSubmit={form.handleSubmit((v) => startTransition(() => void onSubmit(v)))}
            >
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Adaeze Okafor" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +234..." autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" autoComplete="email" {...field} />
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

              {formError ? (
                <p className="text-sm font-medium text-destructive">{formError}</p>
              ) : null}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium underline underline-offset-4" href="/login">
              Log in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Want to list your restaurant?{" "}
            <Link className="font-medium underline underline-offset-4" href="/restaurant-signup">
              Restaurant owner onboarding
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

