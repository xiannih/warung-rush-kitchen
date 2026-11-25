// Warung Kilat v5 — entrypoint: hands the game in to /output.
// Resolves the game from this file's own location, never the cwd.
// Output dir: MAKEFUN_OUTPUT_DIR, else OUT_DIR, else /output.
// Creates the output dir without ever removing it, and writes every
// output file fresh (read-only leftovers are made writable first).
import { buildDossier } from './vendor/makefun-game.ts';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || process.env.OUT_DIR || '/output';

function listTree(dir: string): string[] {
  const names = readdirSync(dir).sort();
  const out: string[] = [];
  for (const name of names) {
    const p = join(dir, name);
    const st = lstatSync(p);
    if (st.isDirectory()) {
      for (const sub of listTree(p)) out.push(join(name, sub));
    } else if (st.isFile()) {
      out.push(name);
    }
  }
  return out;
}

function copyTree(srcDir: string, dstDir: string): void {
  mkdirSync(dstDir, { recursive: true });
  for (const rel of listTree(srcDir)) {
    const src = join(srcDir, rel);
    const dst = join(dstDir, rel);
    mkdirSync(dirname(dst), { recursive: true });
    if (existsSync(dst)) {
      // A previous run may have left a read-only file behind; make it
      // writable so the fresh write below cannot fail on permissions.
      try { chmodSync(dst, 0o644); } catch { /* keep going */ }
    }
    const bytes = readFileSync(src);
    writeFileSync(dst, bytes);
    chmodSync(dst, 0o644);
  }
}

function main(): void {
  mkdirSync(outDir, { recursive: true });
  copyTree(join(repoRoot, 'game'), join(outDir, 'game'));
  copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 48 * 1024 * 1024,
    game_path_max_bytes: 1000,
  });
  const dossierPath = join(outDir, 'dossier.json');
  if (existsSync(dossierPath)) {
    try { chmodSync(dossierPath, 0o644); } catch { /* keep going */ }
  }
  writeFileSync(dossierPath, dossier);
  console.log('Warung Kilat v5: wrote ' + outDir + ' (dossier ' + dossier.length + ' bytes)');
}

main();
