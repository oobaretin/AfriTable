"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
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
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { sanitizeRedirectPath } from "@/lib/auth/config";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

function authLink(path: string, redirectTo: string): string {
  if (redirectTo === "/") return path;
  return `${path}?redirectTo=${encodeURIComponent(redirectTo)}`;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = sanitizeRedirectPath(params.get("redirectTo"));
  const callbackError = params.get("error");

  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, startTransition] = React.useTransition();
  const [authState, setAuthState] = React.useState<"checking" | "guest" | "redirecting">("checking");

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthState("redirecting");
        router.replace(redirectTo);
      } else {
        setAuthState("guest");
      }
    });
  }, [router, redirectTo]);

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
    setAuthState("redirecting");
    router.replace(redirectTo);
    router.refresh();
  }

  if (authState !== "guest") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
        <Card className="w-full">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {authState === "redirecting" ? "Taking you to your account…" : "Loading…"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Welcome back to AfriTable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <AuthErrorBanner errorCode={callbackError} message={formError} />

          <GoogleAuthButton redirectTo={redirectTo} onError={setFormError} disabled={isSubmitting} />

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
                      <Input id="login-email" placeholder="you@example.com" type="email" autoComplete="email" {...field} />
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
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input id="login-password" type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link className="font-medium underline underline-offset-4" href={authLink("/signup", redirectTo)}>
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-16 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
