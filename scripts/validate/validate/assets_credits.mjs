#!/usr/bin/env node
// scripts/validate/assets_credits.mjs
// Gate validator for public/assets and public/assets/CREDITS.md (docs/11-ASSETS.md §4 & M0 r-assets brief).
//
// Checks:
// 1. 100% of files in public/assets (except CREDITS.md) are listed in public/assets/CREDITS.md
// 2. Total size of public/assets (excluding sfx/ and music/) <= 2 MB
// 3. Every illustration SVG in public/assets/illustrations/*.svg <= 30 KB (and all 6 required exist)
// 4. Every icon SVG in public/assets/icons/ <= 8 KB (and all 12 games + 12 badges exist with currentColor & viewBox="0 0 512 512")
// 5. SFX sprite files (sfx.webm, sfx.mp3, sfx.json) exist, total <= 250 KB, with all 12 required cues
// 6. PWA icons (public/pwa-192.png, public/pwa-512.png, public/maskable-512.png) exist

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const CREDITS_PATH = path.join(ASSETS_DIR, 'CREDITS.md');

const REQUIRED_GAMES = ['v1', 'v2', 'v3', 'l1', 'l2', 'r1', 'r2', 'w1', 'w2', 's1', 's2', 'x1'];
const REQUIRED_BADGES = [
  'streak-7',
  'streak-30',
  'streak-100',
  'cards-100',
  'cards-500',
  'cards-1000',
  'band-65',
  'band-70',
  'band-75',
  'band-80',
  'first-essay',
  'first-speaking',
];
const REQUIRED_ILLUSTRATIONS = ['welcome', 'goals', 'devices', 'placement', 'empty-cards', 'offline'];
const REQUIRED_SFX_CUES = [
  'tap',
  'correct',
  'wrong',
  'streak',
  'sessionDone',
  'levelUp',
  'tick',
  'countdownEnd',
  'flip',
  'highlight',
  'recordStart',
  'recordStop',
];
const REQUIRED_PWA_ICONS = ['pwa-192.png', 'pwa-512.png', 'maskable-512.png'];

const MAX_ASSETS_NON_AUDIO_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ILLUSTRATION_BYTES = 30 * 1024; // 30 KB
const MAX_ICON_BYTES = 8 * 1024; // 8 KB
const MAX_SFX_TOTAL_BYTES = 250 * 1024; // 250 KB

function walkFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function toPosixRel(fullPath) {
  return path.relative(ROOT_DIR, fullPath).split(path.sep).join('/');
}

const errors = [];

if (!fs.existsSync(CREDITS_PATH)) {
  errors.push('Missing public/assets/CREDITS.md');
}

const creditsText = fs.existsSync(CREDITS_PATH) ? fs.readFileSync(CREDITS_PATH, 'utf8') : '';

const allAssetFiles = walkFiles(ASSETS_DIR).filter((p) => path.basename(p) !== 'CREDITS.md');
let nonAudioBytes = 0;
let sfxTotalBytes = 0;
let creditedCount = 0;

for (const filePath of allAssetFiles) {
  const rel = toPosixRel(filePath);
  const stat = fs.statSync(filePath);

  if (!creditsText.includes(rel)) {
    errors.push(`Uncredited asset file (missing from public/assets/CREDITS.md): ${rel}`);
  } else {
    creditedCount++;
  }

  const isAudioDir =
    rel.startsWith('public/assets/sfx/') || rel.startsWith('public/assets/music/');
  if (!isAudioDir) {
    nonAudioBytes += stat.size;
  }
  if (rel.startsWith('public/assets/sfx/')) {
    sfxTotalBytes += stat.size;
  }

  if (rel.startsWith('public/assets/illustrations/') && rel.endsWith('.svg')) {
    if (stat.size > MAX_ILLUSTRATION_BYTES) {
      errors.push(`Illustration exceeds 30 KB (${stat.size} B): ${rel}`);
    }
  }

  if (rel.startsWith('public/assets/icons/') && rel.endsWith('.svg')) {
    if (stat.size > MAX_ICON_BYTES) {
      errors.push(`Icon exceeds 8 KB (${stat.size} B): ${rel}`);
    }
    const svgText = fs.readFileSync(filePath, 'utf8');
    if (!svgText.includes('currentColor')) {
      errors.push(`Icon missing fill="currentColor": ${rel}`);
    }
    if (!svgText.includes('viewBox="0 0 512 512"')) {
      errors.push(`Icon missing viewBox="0 0 512 512": ${rel}`);
    }
  }
}

if (nonAudioBytes > MAX_ASSETS_NON_AUDIO_BYTES) {
  errors.push(
    `Total public/assets (excluding sfx/, music/) exceeds 2 MB: ${nonAudioBytes} bytes`
  );
}

for (const id of REQUIRED_GAMES) {
  const p = path.join(ASSETS_DIR, 'icons', 'games', `${id}.svg`);
  if (!fs.existsSync(p)) {
    errors.push(`Missing required game icon: public/assets/icons/games/${id}.svg`);
  }
}

for (const id of REQUIRED_BADGES) {
  const p = path.join(ASSETS_DIR, 'icons', 'badges', `${id}.svg`);
  if (!fs.existsSync(p)) {
    errors.push(`Missing required badge icon: public/assets/icons/badges/${id}.svg`);
  }
}

for (const id of REQUIRED_ILLUSTRATIONS) {
  const p = path.join(ASSETS_DIR, 'illustrations', `${id}.svg`);
  if (!fs.existsSync(p)) {
    errors.push(`Missing required illustration: public/assets/illustrations/${id}.svg`);
  } else {
    const content = fs.readFileSync(p, 'utf8');
    if (!content.toUpperCase().includes('#3B82F6')) {
      errors.push(`Illustration missing primary accent #3B82F6: public/assets/illustrations/${id}.svg`);
    }
  }
}

for (const sfxFile of ['sfx.webm', 'sfx.mp3', 'sfx.json']) {
  const p = path.join(ASSETS_DIR, 'sfx', sfxFile);
  if (!fs.existsSync(p)) {
    errors.push(`Missing required SFX file: public/assets/sfx/${sfxFile}`);
  }
}

if (sfxTotalBytes > MAX_SFX_TOTAL_BYTES) {
  errors.push(`Total SFX sprite size exceeds 250 KB: ${sfxTotalBytes} bytes`);
}

const sfxJsonPath = path.join(ASSETS_DIR, 'sfx', 'sfx.json');
if (fs.existsSync(sfxJsonPath)) {
  try {
    const sfxData = JSON.parse(fs.readFileSync(sfxJsonPath, 'utf8'));
    const sprite = sfxData.sprite || {};
    for (const cue of REQUIRED_SFX_CUES) {
      if (!Array.isArray(sprite[cue]) || sprite[cue].length < 2) {
        errors.push(`Missing or invalid SFX cue '${cue}' in public/assets/sfx/sfx.json`);
      }
    }
  } catch (err) {
    errors.push(`Failed to parse public/assets/sfx/sfx.json: ${err.message}`);
  }
}

for (const pwaFile of REQUIRED_PWA_ICONS) {
  const p = path.join(PUBLIC_DIR, pwaFile);
  if (!fs.existsSync(p)) {
    errors.push(`Missing required PWA icon: public/${pwaFile}`);
  }
}

console.log('=== Asset & Credits Validation Summary ===');
console.log(`Tracked files in public/assets/**: ${creditedCount}/${allAssetFiles.length} credited (100%)`);
console.log(
  `Non-audio assets size (excluding sfx/, music/): ${(nonAudioBytes / 1024).toFixed(2)} KB / 2048.00 KB`
);
console.log(`SFX sprite total size (webm + mp3 + json): ${(sfxTotalBytes / 1024).toFixed(2)} KB / 250.00 KB`);
console.log(
  `Icons & Illustrations: ${REQUIRED_GAMES.length} games, ${REQUIRED_BADGES.length} badges, ${REQUIRED_ILLUSTRATIONS.length} illustrations, ${REQUIRED_PWA_ICONS.length} PWA icons`
);

if (errors.length > 0) {
  console.error('\nValidation FAILED with errors:');
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log('PASS: All asset size budgets, SVG norms, SFX sprite cues, and CREDITS.md coverage verified.');
process.exit(0);
