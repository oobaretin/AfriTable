#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  return v && !v.startsWith("--") ? v : fallback;
}

const port = Number(parseArg("--port", "3000"));
if (!Number.isFinite(port) || port <= 0) {
  // eslint-disable-next-line no-console
  console.error("dev:safe: invalid --port");
  process.exit(1);
}

// Best-effort kill existing processes on port (mac/linux).
try {
  const lsof = spawnSync("lsof", ["-ti", `tcp:${port}`], { encoding: "utf8" });
  const pids = (lsof.stdout || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (pids.length) {
    // eslint-disable-next-line no-console
    console.log(`dev:safe: killing processes on port ${port}: ${pids.join(", ")}`);
    spawnSync("kill", ["-9", ...pids], { stdio: "inherit" });
  }
} catch {
  // Ignore if lsof/kill aren’t available.
}

// Clean .next safely before dev starts.
const nextDir = path.join(process.cwd(), ".next");
if (fs.existsSync(nextDir)) {
  // eslint-disable-next-line no-console
  console.log("dev:safe: removing .next");
  fs.rmSync(nextDir, { recursive: true, force: true });
}

// Start dev server.
const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev", "--port", String(port)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));

