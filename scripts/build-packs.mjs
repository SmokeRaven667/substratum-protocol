/**
 * Compiles JSON source under packs/_source/<name>/ into the LevelDB
 * compendium packs shipped in packs/<name>/ (per CLAUDE.md: packs are
 * distributed as LevelDB, not raw JSON — the JSON source is kept
 * separately so pack content is reviewable/diffable in git).
 *
 * Usage: node scripts/build-packs.mjs pack|unpack
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceRoot = path.join(rootDir, 'packs', '_source');
const packRoot = path.join(rootDir, 'packs');

const mode = process.argv[2];
if (!['pack', 'unpack'].includes(mode)) {
  console.error('Usage: node scripts/build-packs.mjs pack|unpack');
  process.exit(1);
}

const packNames = fs
  .readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const name of packNames) {
  const sourceDir = path.join(sourceRoot, name);
  const packDir = path.join(packRoot, name);

  if (mode === 'pack') {
    console.log(`Compiling ${name}...`);
    await compilePack(sourceDir, packDir, { log: true });
  } else {
    console.log(`Extracting ${name}...`);
    fs.mkdirSync(sourceDir, { recursive: true });
    await extractPack(packDir, sourceDir, { log: true, clean: true });
  }
}
