// Prints a PNG's size and exits 1 unless it matches --expect WxH.
// Usage: bun scripts/png-size.ts file.png --expect 1200x630
import { readFileSync } from "node:fs";

const [file, flag, expected] = process.argv.slice(2);
const buf = readFileSync(file);
const size = `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
console.log(`${file} ${size}`);
if (flag === "--expect" && size !== expected) process.exit(1);
