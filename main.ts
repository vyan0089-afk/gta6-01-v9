// ARUNIKA: Golden Hour — entry program for the make.fun GTA 6 bounty.
// Copies game/ and screenshots/ to the output directory and writes the
// dossier with the kit's buildDossier library. Node 22, standard library only.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function handIn(outDir: string): void {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync('game', join(outDir, 'game'), { recursive: true });
  cpSync('screenshots', join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`ARUNIKA handed in: ${outDir} (dossier ${dossier.length} bytes)`);
}

handIn(OUT);
