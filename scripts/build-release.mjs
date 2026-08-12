/**
 * Assembles the shippable Foundry system package into system.zip at the
 * repo root — the file Foundry actually downloads via system.json's
 * `download` URL. Run via `npm run build:release` (chains build:packs
 * first, so the compendium packs are always fresh).
 *
 * Only ships what a running system needs: system.json, module/,
 * templates/, lang/, styles/, the *compiled* packs/ (not packs/_source/),
 * and LICENSE. Everything else in the repo (docs, the rulebook PDF, dev
 * tooling, node_modules) is repo-only and must not end up in the zip.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZipArchive } from 'archiver';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outputPath = path.join(rootDir, 'system.zip');

const SHIP_FILES = ['system.json', 'LICENSE'];
const SHIP_DIRS = ['module', 'templates', 'lang', 'styles'];

fs.rmSync(outputPath, { force: true });

const output = fs.createWriteStream(outputPath);
const closed = new Promise((resolve, reject) => {
  output.on('close', resolve);
  output.on('error', reject);
});

const archive = new ZipArchive({ zlib: { level: 9 } });
archive.on('warning', (err) => {
  throw err;
});
archive.on('error', (err) => {
  throw err;
});
archive.pipe(output);

for (const file of SHIP_FILES) {
  archive.file(path.join(rootDir, file), { name: file });
}
for (const dir of SHIP_DIRS) {
  archive.directory(path.join(rootDir, dir), dir);
}

// packs/: every compiled pack directory except the JSON source. Skip
// LevelDB's runtime-only LOCK/LOG files — not real pack data, and a
// stale LOG from this machine has no business shipping to users.
const RUNTIME_ONLY_FILES = new Set(['LOCK', 'LOG', 'LOG.old']);
const packsRoot = path.join(rootDir, 'packs');
for (const packEntry of fs.readdirSync(packsRoot, { withFileTypes: true })) {
  if (!packEntry.isDirectory() || packEntry.name === '_source') continue;
  const packDir = path.join(packsRoot, packEntry.name);
  for (const file of fs.readdirSync(packDir)) {
    if (RUNTIME_ONLY_FILES.has(file)) continue;
    archive.file(path.join(packDir, file), { name: path.join('packs', packEntry.name, file) });
  }
}

await archive.finalize();
await closed;
console.log(`Wrote ${outputPath} (${archive.pointer()} bytes)`);
