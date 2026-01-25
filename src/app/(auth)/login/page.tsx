"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/";

  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setFormError(error.message);
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  }

  async function signInWithGoogle() {
    setFormError(null);
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) setFormError(error.message);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Welcome back to AfriTable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {isGoogleAuthEnabled ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => startTransition(() => void signInWithGoogle())}
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
                Google sign-in will be enabled when you add your domain in Supabase.
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
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formError ? (
                <p className="text-sm font-medium text-destructive">{formError}</p>
              ) : null}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link className="font-medium underline underline-offset-4" href="/signup">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

