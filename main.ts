// Warung Kilat — make.fun hand-in program (Node 22, standard library only).
//
// Copies the game and its screenshots from this repository into the output
// directory and writes dossier.json there with the kit's buildDossier.
// The output directory comes from MAKEFUN_OUTPUT_DIR, then OUT_DIR, then
// /output. Paths resolve from this file's own location, never from the
// working directory. The output directory is created, never removed, and
// every file is written fresh so a re-run into a populated directory works
// even when the staged source is read-only.

import { mkdirSync, readdirSync, readFileSync, writeFileSync, chmodSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));

function outputDir(): string {
  return process.env.MAKEFUN_OUTPUT_DIR || process.env.OUT_DIR || '/output';
}

function copyTreeFresh(srcDir: string, dstDir: string): number {
  mkdirSync(dstDir, { recursive: true });
  let copied = 0;
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copied += copyTreeFresh(src, dst);
    } else if (entry.isFile()) {
      // Fresh bytes every time: a copied read-only file is never overwritten
      // in place, so the grader's read-only staging cannot break a re-run.
      writeFileSync(dst, readFileSync(src));
      chmodSync(dst, 0o644);
      copied += 1;
    }
  }
  return copied;
}

function main(): void {
  const out = outputDir();
  mkdirSync(out, { recursive: true });

  const gameFiles = copyTreeFresh(join(REPO_ROOT, 'game'), join(out, 'game'));
  const shotFiles = copyTreeFresh(join(REPO_ROOT, 'screenshots'), join(out, 'screenshots'));

  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(out, 'dossier.json'), dossier);
  chmodSync(join(out, 'dossier.json'), 0o644);

  const size = statSync(join(out, 'dossier.json')).size;
  console.log(`warung-kilat: ${gameFiles} game files, ${shotFiles} screenshots, dossier.json ${size} bytes -> ${out}`);
}

main();
