#!/usr/bin/env node
/**
 * Build a multi-size favicon.ico from PNG inputs (PNG-compressed ICO entries).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputs = process.argv.slice(2);

if (inputs.length === 0) {
  console.error("Usage: node scripts/build-favicon-ico.mjs <16.png> <32.png> ... > favicon.ico");
  process.exit(1);
}

const images = inputs.map((input) => {
  const abs = path.resolve(root, input);
  const data = fs.readFileSync(abs);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  return { data, width, height };
});

const count = images.length;
const headerSize = 6 + count * 16;
let offset = headerSize;

const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(count, 4);

images.forEach((image, index) => {
  const entryOffset = 6 + index * 16;
  header.writeUInt8(image.width >= 256 ? 0 : image.width, entryOffset);
  header.writeUInt8(image.height >= 256 ? 0 : image.height, entryOffset + 1);
  header.writeUInt8(0, entryOffset + 2);
  header.writeUInt8(0, entryOffset + 3);
  header.writeUInt16LE(1, entryOffset + 4);
  header.writeUInt16LE(32, entryOffset + 6);
  header.writeUInt32LE(image.data.length, entryOffset + 8);
  header.writeUInt32LE(offset, entryOffset + 12);
  offset += image.data.length;
});

process.stdout.write(Buffer.concat([header, ...images.map((image) => image.data)]));
