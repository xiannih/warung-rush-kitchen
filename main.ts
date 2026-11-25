import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || process.env.OUT_DIR || "/output");

function copyFresh(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });
  for (const name of readdirSync(srcDir).sort()) {
    const src = join(srcDir, name);
    const dest = join(destDir, name);
    const st = statSync(src);
    if (st.isDirectory()) {
      copyFresh(src, dest);
    } else if (st.isFile()) {
      // Fresh write, never a mode-preserving copy: the grader stages
      // the source read-only, and a copied file would stay read-only.
      writeFileSync(dest, readFileSync(src), { mode: 0o644 });
    }
  }
}

mkdirSync(outDir, { recursive: true });
copyFresh(join(here, "game"), join(outDir, "game"));
copyFresh(join(here, "screenshots"), join(outDir, "screenshots"));
writeFileSync(
  join(outDir, "dossier.json"),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log("Warung Kilat v3: wrote game, screenshots and dossier.json to " + outDir);
