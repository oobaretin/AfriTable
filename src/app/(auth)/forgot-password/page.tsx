"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildAuthCallbackUrl } from "@/lib/auth/config";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: buildAuthCallbackUrl(window.location.origin, "/reset-password"),
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your account email and we&apos;ll send a link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {sent ? (
            <p className="text-sm text-muted-foreground">
              If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.
            </p>
          ) : (
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
                        <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {formError ? <p className="text-sm font-medium text-destructive">{formError}</p> : null}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            </Form>
          )}

          <p className="text-sm text-muted-foreground">
            <Link className="font-medium underline underline-offset-4" href="/login">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
