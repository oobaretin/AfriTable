/**
 * Audit which repo migrations are actually applied to the prod database.
 *
 * Why this exists
 *   Migration history has drifted: 007 (profiles.city), 034 (RLS) and likely
 *   others were never applied to prod despite being committed. Until now we
 *   discovered drift one bug at a time. This script gives us a single readout.
 *
 * How it works
 *   1. One mgmt-API call snapshots prod schema state (columns/tables/functions
 *      /policies/views/indexes) into a single JSON object.
 *   2. For each .sql file in supabase/migrations/, regex-extract DDL signatures:
 *        create table X            → expect table X
 *        alter table X add column Y → expect column Y on X
 *        create [or replace] function X(...) → expect function X
 *        create policy "Y" on X    → expect policy Y on table X
 *        create [or replace] view X → expect view X
 *   3. For each migration, classify as APPLIED / MISSING / PARTIAL based on
 *      whether all/none/some of its signatures exist in the snapshot.
 *
 * Limitations
 *   - Regex parsing of SQL isn't perfect. Comments containing DDL-shaped
 *     text or multi-line statements with unusual whitespace may be missed.
 *     If a migration shows MISSING, eyeball the .sql file before applying.
 *   - We can't detect REVERSE drift (things in prod not in any migration).
 *
 * Usage
 *   node scripts/audit-migration-drift.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const text = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {
    // .env.local optional
  }
  return env;
}

function extractProjectRef(supabaseUrl) {
  const m = supabaseUrl?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!m) throw new Error(`Cannot extract project ref from ${supabaseUrl}`);
  return m[1];
}

async function runSql(projectRef, accessToken, sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`mgmt API ${r.status}: ${text}`);
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// 1. Snapshot prod schema state
// ---------------------------------------------------------------------------
const env = loadEnv();
const projectRef = extractProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
const accessToken = env.SUPABASE_ACCESS_TOKEN;
if (!accessToken) {
  console.error("ERROR: SUPABASE_ACCESS_TOKEN not set in .env.local");
  process.exit(1);
}

const snapshotSql = `
select jsonb_build_object(
  'columns', (
    select jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name))
    from information_schema.columns where table_schema = 'public'
  ),
  'tables', (
    select jsonb_agg(table_name)
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
  ),
  'functions', (
    select jsonb_agg(routine_name)
    from information_schema.routines
    where routine_schema = 'public' and routine_type = 'FUNCTION'
  ),
  'policies', (
    select jsonb_agg(jsonb_build_object('table', tablename, 'policy', policyname))
    from pg_policies where schemaname = 'public'
  ),
  'views', (
    select jsonb_agg(table_name)
    from information_schema.views where table_schema = 'public'
  )
) as snap;
`;

console.log(`Querying prod schema snapshot for project ${projectRef}...`);
const snapshotResp = await runSql(projectRef, accessToken, snapshotSql);
const snap = snapshotResp[0].snap;

// Build fast lookups
const colSet = new Set((snap.columns || []).map((c) => `${c.table}.${c.column}`));
const tableSet = new Set(snap.tables || []);
const funcSet = new Set(snap.functions || []);
const policySet = new Set((snap.policies || []).map((p) => `${p.table}.${p.policy}`));
const viewSet = new Set(snap.views || []);

console.log(
  `Snapshot: ${tableSet.size} tables, ${colSet.size} columns, ${funcSet.size} functions, ${policySet.size} policies, ${viewSet.size} views\n`
);

// ---------------------------------------------------------------------------
// 2. Extract signatures from each migration file
// ---------------------------------------------------------------------------
const migrationsDir = resolve(__dirname, "..", "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

function extractSignatures(sql) {
  const sigs = [];
  const clean = stripComments(sql);

  // create table [if not exists] public.X (   |   create table X (
  for (const m of clean.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi)) {
    sigs.push({ kind: "table", name: m[1].toLowerCase() });
  }

  // alter table public.X add column [if not exists] Y type
  for (const m of clean.matchAll(/alter\s+table\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+([\s\S]*?);/gi)) {
    const table = m[1].toLowerCase();
    const body = m[2];
    for (const am of body.matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?([a-z_][a-z0-9_]*)/gi)) {
      sigs.push({ kind: "column", table, name: am[1].toLowerCase() });
    }
  }

  // create [or replace] function public.X(
  for (const m of clean.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi)) {
    sigs.push({ kind: "function", name: m[1].toLowerCase() });
  }

  // create policy "Y" on public.X
  for (const m of clean.matchAll(/create\s+policy\s+"([^"]+)"\s+on\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)) {
    sigs.push({ kind: "policy", table: m[2].toLowerCase(), name: m[1] });
  }

  // create [or replace] view public.X
  for (const m of clean.matchAll(/create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)) {
    sigs.push({ kind: "view", name: m[1].toLowerCase() });
  }

  return sigs;
}

function signaturePresent(sig) {
  switch (sig.kind) {
    case "table":
      return tableSet.has(sig.name);
    case "column":
      return colSet.has(`${sig.table}.${sig.name}`);
    case "function":
      return funcSet.has(sig.name);
    case "policy":
      return policySet.has(`${sig.table}.${sig.name}`);
    case "view":
      return viewSet.has(sig.name);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// 3. Compare and report
// ---------------------------------------------------------------------------
const results = [];
for (const file of files) {
  const sql = readFileSync(resolve(migrationsDir, file), "utf8");
  const sigs = extractSignatures(sql);
  const missing = sigs.filter((s) => !signaturePresent(s));
  const present = sigs.filter((s) => signaturePresent(s));
  let status;
  if (sigs.length === 0) status = "NO-SIG";
  else if (missing.length === 0) status = "APPLIED";
  else if (present.length === 0) status = "MISSING";
  else status = "PARTIAL";
  results.push({ file, status, sigCount: sigs.length, missingCount: missing.length, missing });
}

const colWidths = { file: 56, status: 8, sigs: 5, missing: 6 };
console.log(
  `${"FILE".padEnd(colWidths.file)} ${"STATUS".padEnd(colWidths.status)} SIGS  MISSING`
);
console.log("-".repeat(colWidths.file + colWidths.status + 14));
for (const r of results) {
  console.log(
    `${r.file.padEnd(colWidths.file)} ${r.status.padEnd(colWidths.status)} ${String(r.sigCount).padEnd(5)} ${r.missingCount}`
  );
}

console.log("\nDetail of MISSING/PARTIAL migrations:\n");
for (const r of results.filter((x) => x.status === "MISSING" || x.status === "PARTIAL")) {
  console.log(`  ${r.file}  (${r.status}, missing ${r.missingCount}/${r.sigCount})`);
  for (const s of r.missing) {
    const where = s.table ? `${s.table}.${s.name}` : s.name;
    console.log(`     ${s.kind.padEnd(8)} ${where}`);
  }
  console.log("");
}

const summary = {
  applied: results.filter((r) => r.status === "APPLIED").length,
  missing: results.filter((r) => r.status === "MISSING").length,
  partial: results.filter((r) => r.status === "PARTIAL").length,
  nosig: results.filter((r) => r.status === "NO-SIG").length,
  total: results.length,
};
console.log(`SUMMARY: ${summary.applied} applied, ${summary.missing} missing, ${summary.partial} partial, ${summary.nosig} no-sig (out of ${summary.total})`);
