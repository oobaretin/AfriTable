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
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { buildAuthCallbackUrl } from "@/lib/auth/config";

const signupSchema = z.object({
  fullName: z.string().min(2, "Enter your full name."),
  phone: z.string().min(7, "Enter a valid phone number."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = React.useState(false);
  const [isSubmitting, startTransition] = React.useTransition();
  const [authState, setAuthState] = React.useState<"checking" | "guest" | "redirecting">("checking");

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthState("redirecting");
        router.replace("/");
      } else {
        setAuthState("guest");
      }
    });
  }, [router]);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", phone: "", email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    setConfirmationSent(false);
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
        emailRedirectTo: buildAuthCallbackUrl(window.location.origin, "/"),
      },
    });

    if (error) {
      setFormError(error.message);
      return;
    }

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
      setAuthState("redirecting");
      router.replace("/");
      router.refresh();
      return;
    }

    setConfirmationSent(true);
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
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Start booking tables with AfriTable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <AuthErrorBanner message={formError} />

          {confirmationSent ? (
            <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Check your email to confirm your account, then{" "}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                log in
              </Link>
              .
            </p>
          ) : null}

          <GoogleAuthButton label="Sign up with Google" onError={setFormError} disabled={isSubmitting} />

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
                      <Input placeholder="e.g. +1 713 555 0100" autoComplete="tel" {...field} />
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

              <Button type="submit" disabled={isSubmitting || confirmationSent}>
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
