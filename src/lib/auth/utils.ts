import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@db/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getUser() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireAuth(redirectTo = "/login") {
  const user = await getUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function getUserProfile() {
  const supabase = createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return null;
  return data;
}

/**
 * Server Action: signs out the current user and redirects to /.
 */
export async function signOut() {
  "use server";
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

