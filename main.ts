// Warung Kilat v4 — entrypoint.
// Copies game/ and screenshots/ from this repository into the output
// directory and writes the dossier buildDossier makes from them.
// The output directory comes from MAKEFUN_OUTPUT_DIR first, then OUT_DIR,
// then /output. The output directory itself is never removed; its game/,
// screenshots/ and dossier.json are written fresh on every run.

import { buildDossier } from './vendor/makefun-game.ts';
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || process.env.OUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });

// Clear a previous run's output tree. The files there are this program's
// own earlier writes (copied with the source's read-only modes), so they are
// made writable first and then removed; the repository itself is never
// touched, and the output directory itself is never removed.
function clearTree(path) {
  if (!existsSync(path)) return;
  const st = lstatSync(path);
  if (st.isDirectory()) {
    chmodSync(path, 0o755);
    for (const entry of readdirSync(path)) clearTree(join(path, entry));
  } else {
    chmodSync(path, 0o644);
  }
  rmSync(path, { recursive: true, force: true });
}

const gameOut = join(outDir, 'game');
const shotsOut = join(outDir, 'screenshots');
clearTree(gameOut);
clearTree(shotsOut);
clearTree(join(outDir, 'dossier.json'));

cpSync(join(repoRoot, 'game'), gameOut, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsOut, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('Warung Kilat v4: wrote ' + outDir + ' (dossier ' + dossier.length + ' bytes)');
