/**
 * Probe whether Google OAuth is ready end-to-end (Supabase provider + app flag).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const text = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {}
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleFlag = env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

console.log(`H2 app flag NEXT_PUBLIC_ENABLE_GOOGLE_AUTH: ${googleFlag ? "true" : "false/unset"}`);

const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "http://localhost:3000/auth/callback",
    skipBrowserRedirect: true,
  },
});

if (error) {
  console.log(`H1 provider init error: ${error.message}`);
  process.exit(1);
}

const res = await fetch(data.url, { redirect: "manual" });
const location = res.headers.get("location");
if (res.status >= 300 && res.status < 400 && location?.includes("accounts.google.com")) {
  console.log("H1 Supabase Google provider: OK (redirects to Google)");
  console.log("H3 redirect allowlist: likely OK (authorize accepted)");
  process.exit(0);
}

const body = await res.text();
console.log(`H1 Supabase authorize status: ${res.status}`);
console.log(`H1 response: ${body.slice(0, 300)}`);
process.exit(1);
