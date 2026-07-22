#!/usr/bin/env node
/**
 * Generate favicon + platform icons from public/logo.png (Sankofa emblem crop).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const logo = path.join(root, "public/logo.png");
const work = path.join(root, ".icon-work");
const appDir = path.join(root, "src/app");
const publicDir = path.join(root, "public");

/** Emblem crop from full wordmark (px) — tight enough to exclude adjacent "A" letterform. */
const EMBLEM_CROP = 275;
/** Match crop size (no inner zoom) so the right edge stays clean. */
const EMBLEM_ZOOM = 275;

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed`);
  }
}

function sips(args) {
  run("sips", args);
}

function buildEmblemSource() {
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });

  const cropOffset = Math.floor((408 - EMBLEM_CROP) / 2);
  const emblem = path.join(work, "emblem-crop.png");
  sips(["-c", String(EMBLEM_CROP), String(EMBLEM_CROP), "--cropOffset", String(cropOffset), "0", logo, "--out", emblem]);

  const zoomOffset = Math.floor((EMBLEM_CROP - EMBLEM_ZOOM) / 2);
  const zoomed = path.join(work, "emblem-zoom.png");
  sips(["-c", String(EMBLEM_ZOOM), String(EMBLEM_ZOOM), "--cropOffset", String(zoomOffset), String(zoomOffset), emblem, "--out", zoomed]);

  return zoomed;
}

function resize(source, size, dest) {
  sips(["-z", String(size), String(size), source, "--out", dest]);
}

function buildFaviconIco(sizes) {
  const pngs = sizes.map((size) => {
    const dest = path.join(work, `favicon-${size}.png`);
    resize(path.join(work, "emblem-zoom.png"), size, dest);
    return dest;
  });

  const buildScript = path.join(root, "scripts/build-favicon-ico.mjs");
  const node = process.execPath;
  const result = spawnSync(node, [buildScript, ...pngs], {
    encoding: "buffer",
    cwd: root,
  });
  if (result.status !== 0) {
    throw new Error("build-favicon-ico.mjs failed");
  }
  fs.writeFileSync(path.join(appDir, "favicon.ico"), result.stdout);
}

function main() {
  if (!fs.existsSync(logo)) {
    console.error("Missing public/logo.png");
    process.exit(1);
  }

  const source = buildEmblemSource();

  const outputs = [
    { size: 512, dest: path.join(appDir, "icon.png") },
    { size: 180, dest: path.join(appDir, "apple-icon.png") },
    { size: 192, dest: path.join(publicDir, "icon-192.png") },
    { size: 512, dest: path.join(publicDir, "icon-512.png") },
  ];

  for (const { size, dest } of outputs) {
    resize(source, size, dest);
  }

  buildFaviconIco([16, 32, 48]);

  fs.rmSync(work, { recursive: true, force: true });
  console.log("Brand icons generated:");
  outputs.forEach(({ size, dest }) => console.log(`  ${size}x${size} -> ${path.relative(root, dest)}`));
  console.log("  favicon.ico -> src/app/favicon.ico");
}

main();
