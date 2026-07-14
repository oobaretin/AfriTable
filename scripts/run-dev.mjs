#!/usr/bin/env node
/**
 * Start Next.js dev when system `npm`/`node` aren't on PATH (e.g. Cursor-only Node).
 * Uses Cursor's bundled Node, then falls back to `node` on PATH.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.argv.includes("--port")
  ? process.argv[process.argv.indexOf("--port") + 1] || "3000"
  : "3000";

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
  console.error("run-dev: no Node binary found. Install Node 20+ or open the project in Cursor.");
  process.exit(1);
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextBin)) {
  console.error("run-dev: missing node_modules. Run: npm install");
  process.exit(1);
}

console.log(`run-dev: using ${nodeBin}`);
console.log(`run-dev: http://localhost:${port}`);

const child = spawn(nodeBin, [nextBin, "dev", "--port", port], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));
