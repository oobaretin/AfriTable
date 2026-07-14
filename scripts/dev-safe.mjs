#!/usr/bin/env node
/**
 * Kill port (if needed), remove stale .next, start Next dev.
 * Use when dev 500s after `next build` or webpack chunks 404 (Cannot find module './8948.js').
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  return v && !v.startsWith("--") ? v : fallback;
}

const port = Number(parseArg("--port", "3000"));
if (!Number.isFinite(port) || port <= 0) {
  console.error("dev:safe: invalid --port");
  process.exit(1);
}

const nodeCandidates = [
  "/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node",
  process.env.NODE_BIN,
  "node",
].filter(Boolean);

const nodeBin = nodeCandidates.find((candidate) => {
  if (candidate === "node") return true;
  return fs.existsSync(candidate);
});

if (!nodeBin) {
  console.error("dev:safe: no Node binary found. Install Node 20+ or open the project in Cursor.");
  process.exit(1);
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextBin)) {
  console.error("dev:safe: missing node_modules. Run: npm install");
  process.exit(1);
}

try {
  const lsof = spawnSync("lsof", ["-ti", `tcp:${port}`], { encoding: "utf8" });
  const pids = (lsof.stdout || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (pids.length) {
    console.log(`dev:safe: killing processes on port ${port}: ${pids.join(", ")}`);
    spawnSync("kill", ["-9", ...pids], { stdio: "inherit" });
  }
} catch {
  // Ignore if lsof/kill aren't available.
}

const nextDir = path.join(root, ".next");
if (fs.existsSync(nextDir)) {
  console.log("dev:safe: removing .next");
  fs.rmSync(nextDir, { recursive: true, force: true });
}

console.log(`dev:safe: using ${nodeBin}`);
console.log(`dev:safe: http://localhost:${port}`);

const child = spawn(nodeBin, [nextBin, "dev", "--port", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
