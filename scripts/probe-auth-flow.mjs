/**
 * Auth flow Tier-2 probe.
 *
 * Creates a throwaway test user via admin API, verifies the auto-created
 * profile, logs in as that user, and exercises the new RLS policies
 * (profiles_read_self, profiles_read_admin) plus the SECURITY DEFINER
 * current_user_role() helper.
 *
 * Hypotheses tested:
 *   A1 signup + handle_new_user trigger creates a profile row with sane defaults
 *   A2 the new user can SELECT their own profile via profiles_read_self
 *   A3 the new user CANNOT SELECT other users' profiles
 *   A4 current_user_role() returns 'diner' for the new user (proves SECURITY DEFINER fix)
 *   A5 role upgrade (diner → restaurant_owner) takes effect, visible to user's next query
 *   A6 admin delete cascades to public.profiles (no orphan)
 *
 * The test user uses a random uuid suffix so we don't collide with anything real.
 * Cleanup is best-effort in a `finally` block so a partial run still tidies up.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSION_ID = "fc91e6";
const RUN_ID = `auth-probe-${Date.now()}`;
const DEBUG_ENDPOINT = "http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2";

async function log(hypothesisId, location, message, data) {
  try {
    await fetch(DEBUG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": SESSION_ID },
      body: JSON.stringify({ sessionId: SESSION_ID, runId: RUN_ID, hypothesisId, location, message, data, timestamp: Date.now() }),
    });
  } catch {
    /* never block */
  }
}

function loadEnv() {
  const env = { ...process.env };
  try {
    const t = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of t.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {}
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const suffix = randomUUID().slice(0, 8);
const testEmail = `probe-auth-${suffix}@afritable.test`;
const testPassword = `Probe-${suffix}-${Date.now()}!`;
const testName = `Probe User ${suffix}`;

console.log(`Test user: ${testEmail}\n`);

let createdUserId = null;
let otherUserId = null;
let userClient = null;

try {
  // A1 — create the test user via admin API. email_confirm: true so we can log in immediately.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: testName },
  });
  if (createErr) throw new Error(`admin.createUser failed: ${createErr.message}`);
  createdUserId = created.user.id;

  // Verify profile was auto-created by handle_new_user trigger
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("id, full_name, role, phone, avatar_url, city, default_party_size, no_show_count, has_reset_password")
    .eq("id", createdUserId)
    .maybeSingle();

  await log("A1", "probe-auth-flow.mjs:A1", "signup + auto-profile", {
    userId: createdUserId,
    profileExists: Boolean(profile),
    profileError: profErr?.message ?? null,
    profileSnapshot: profile,
    verdict: profile && profile.role === "diner" ? "PASS" : "FAIL",
  });
  console.log(`A1 signup + auto-profile: userId=${createdUserId} profile=${profile ? "yes" : "NO"} role=${profile?.role ?? "?"}`);
  if (!profile) throw new Error("handle_new_user trigger did not create profile");

  // Pick an existing user (not our test user) for the cross-read negative test
  const { data: others } = await admin
    .from("profiles")
    .select("id")
    .neq("id", createdUserId)
    .limit(1);
  otherUserId = others?.[0]?.id ?? null;

  // Now log in AS the test user using anon key + password
  userClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInErr) throw new Error(`signInWithPassword failed: ${signInErr.message}`);

  // A2 — user can SELECT their own profile
  const { data: ownRow, error: ownErr } = await userClient
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", createdUserId)
    .maybeSingle();

  await log("A2", "probe-auth-flow.mjs:A2", "user SELECTs own profile", {
    rowReturned: Boolean(ownRow),
    error: ownErr?.message ?? null,
    matchesSelf: ownRow?.id === createdUserId,
    verdict: ownRow?.id === createdUserId ? "PASS" : "FAIL",
  });
  console.log(`A2 SELECT own profile: row=${ownRow ? "yes" : "NO"} err=${ownErr?.code ?? "none"}`);

  // A3 — user CANNOT SELECT another user's profile
  if (otherUserId) {
    const { data: otherRow, error: otherErr } = await userClient
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", otherUserId)
      .maybeSingle();
    await log("A3", "probe-auth-flow.mjs:A3", "user SELECTs OTHER profile", {
      otherIdTried: otherUserId,
      rowReturned: Boolean(otherRow),
      errorCode: otherErr?.code ?? null,
      verdict: !otherRow ? "PASS" : "FAIL — cross-user read still possible",
    });
    console.log(`A3 SELECT other profile: row=${otherRow ? "LEAK" : "denied"} err=${otherErr?.code ?? "none"}`);
  } else {
    console.log(`A3 SKIPPED: no other user available`);
  }

  // A4 — current_user_role() returns 'diner' (proves SECURITY DEFINER fix works for auth'd callers)
  const { data: roleViaRpc, error: roleErr } = await userClient.rpc("current_user_role");
  await log("A4", "probe-auth-flow.mjs:A4", "current_user_role() for auth'd user", {
    role: roleViaRpc,
    error: roleErr?.message ?? null,
    verdict: roleViaRpc === "diner" ? "PASS" : "FAIL",
  });
  console.log(`A4 current_user_role(): ${roleViaRpc ?? "(null)"} err=${roleErr?.code ?? "none"}`);

  // A5 — upgrade role to restaurant_owner via admin, then check user sees it on next read
  const { error: upgradeErr } = await admin
    .from("profiles")
    .update({ role: "restaurant_owner" })
    .eq("id", createdUserId);
  if (upgradeErr) throw new Error(`role upgrade failed: ${upgradeErr.message}`);

  const { data: afterUpgrade } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", createdUserId)
    .maybeSingle();
  const { data: roleViaRpcAfter } = await userClient.rpc("current_user_role");
  await log("A5", "probe-auth-flow.mjs:A5", "role upgrade visibility", {
    profileRowRole: afterUpgrade?.role,
    rpcRole: roleViaRpcAfter,
    verdict: afterUpgrade?.role === "restaurant_owner" && roleViaRpcAfter === "restaurant_owner" ? "PASS" : "FAIL",
  });
  console.log(`A5 role upgrade: profileRow=${afterUpgrade?.role ?? "?"} rpc=${roleViaRpcAfter ?? "?"}`);
} catch (err) {
  console.error(`PROBE ERROR: ${err?.message ?? err}`);
  await log("ERROR", "probe-auth-flow.mjs:catch", "probe threw", { error: String(err?.message ?? err) });
} finally {
  // A6 — cleanup. Delete test user; verify profile row also gone (FK cascade).
  if (createdUserId) {
    const { error: delErr } = await admin.auth.admin.deleteUser(createdUserId);
    const { data: profAfterDelete } = await admin
      .from("profiles")
      .select("id")
      .eq("id", createdUserId)
      .maybeSingle();
    await log("A6", "probe-auth-flow.mjs:A6", "cleanup cascade", {
      deleteUserError: delErr?.message ?? null,
      profileRowStillExists: Boolean(profAfterDelete),
      verdict: !delErr && !profAfterDelete ? "PASS" : "FAIL",
    });
    console.log(`A6 cleanup: deleteUser=${delErr ? "FAIL " + delErr.message : "OK"} profileGone=${!profAfterDelete}`);
  }
  console.log("\nProbe complete.");
}
