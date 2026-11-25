// main.ts — hands Warung Kilat in.
//
// It copies game/ and screenshots/ from this repository into the output
// directory and writes dossier.json there with buildDossier from the kit's
// vendor/makefun-game.ts. It runs under Node 22 with no flags, no build
// step and no dependencies beyond the standard library.
//
// Paths come from this file's own location, never from the working
// directory, so the grader can run it from anywhere. The output directory
// comes from MAKEFUN_OUTPUT_DIR first, then OUT_DIR, then /output.
// The output directory is created, never removed, and every file inside it
// is written fresh: a file is removed first and then written, so a second
// run over a populated output still succeeds even if the earlier files
// were staged read-only.
import { buildDossier } from './vendor/makefun-game.ts';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const GAME_DIR = join(HERE, 'game');
const SHOTS_DIR = join(HERE, 'screenshots');

function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR || process.env.OUT_DIR || '';
  if (fromEnv.trim().length > 0) return resolve(fromEnv);
  return '/output';
}

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function writeFresh(dest: string, bytes: Buffer): void {
  ensureDir(dirname(dest));
  // Remove first so a read-only file left by an earlier run cannot block us.
  if (existsSync(dest)) rmSync(dest, { force: true });
  writeFileSync(dest, bytes);
}

function copyTree(srcDir: string, destDir: string): void {
  ensureDir(destDir);
  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(src, dest);
    } else if (entry.isFile()) {
      // Read the bytes and write them out as a new file: the copy never
      // inherits the source file's mode, so a read-only staged source
      // still lands as an ordinary writable file in the output.
      writeFresh(dest, readFileSync(src));
    }
  }
}

function main(): void {
  const out = outputDir();
  ensureDir(out);
  if (!existsSync(GAME_DIR) || !statSync(GAME_DIR).isDirectory()) {
    throw new Error('game/ not found next to main.ts at ' + GAME_DIR);
  }
  if (!existsSync(SHOTS_DIR) || !statSync(SHOTS_DIR).isDirectory()) {
    throw new Error('screenshots/ not found next to main.ts at ' + SHOTS_DIR);
  }
  copyTree(GAME_DIR, join(out, 'game'));
  copyTree(SHOTS_DIR, join(out, 'screenshots'));
  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFresh(join(out, 'dossier.json'), Buffer.from(dossier));
  console.log('warung-kilat v2 handed in to ' + out);
}

main();
