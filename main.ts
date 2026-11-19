// main.ts — the grader's entry point for Palm Heat Cover Studio.
//
// What ships here is an offline cover maker that lives in app/:
// index.html, the ES modules under app/src/, Anton and Pacifico vendored
// as files, and eight sample photos. Six multi-panel layouts, four
// grades (gradient-map and poster-ink), an editor where every panel can
// be cropped and repositioned, undo/redo, and PNG export in 1920x1080,
// 1080x1350 and 1080x1080. screenshots/ holds renders the app drew
// itself — cover, editor, portrait cover, square cover, in that order.
//
// Plain Node 22 with no dependencies. This script copies app/ and
// screenshots/ from next to itself into the output directory and writes
// dossier.json there — the summary the judge reads — through the vendored
// make.fun library. That library file must never be edited; it has to
// stay byte-for-byte as shipped.
//
// Run it by hand with `node serve.ts` and http://localhost:8080. When
// there is no grader container, MAKEFUN_OUTPUT_DIR takes /output's place:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const base = fileURLToPath(new URL('./', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const appDir = join(base, 'app');
const shotDir = join(base, 'screenshots');

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotDir)) cpSync(shotDir, join(outDir, 'screenshots'), { recursive: true });

// Caps from the scorer's own reference/gate.json. text_max_bytes is the
// only one that shapes the byte count; the rest mirror refusals the
// scorer itself would make — over 4 screenshots, or any one over 256 KiB;
// over 993 files in app/, or 48 MiB of app files altogether; any path
// under app/ longer than 1000 bytes. app/ is counted next to /output's
// own 1000-entry cap, its screenshots/ and dossier.json.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
