"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Ensure there is a session (password recovery link should have created one via /auth/callback)
  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const { data } = await supabase.auth.getSession();
      setReady(true);
      if (!data.session) setError("Your reset link is missing or expired. Please request a new one.");
    })();
  }, []);

  async function onSubmit(values: Values) {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setError("You are not signed in. Please use the link from your email again.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Mark flag for gating logic
      await supabase.from("profiles").update({ has_reset_password: true }).eq("id", user.id);

      setSuccess(true);
      form.reset();
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10 md:py-14">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set your password</CardTitle>
          <CardDescription>Create a password so you can manage your restaurant listing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {success ? (
            <Alert>
              <AlertTitle>Password updated</AlertTitle>
              <AlertDescription>
                You can now <Link className="text-primary hover:underline" href="/login">sign in</Link> with your email and new password.
              </AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Reset failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {!ready ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={submitting || Boolean(error && !success)}>
                  {submitting ? "Saving…" : "Save password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

