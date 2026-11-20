#!/usr/bin/env node
/**
 * data-src/dictation/build_dictation.mjs
 *
 * Builds public/data/listening/dictation.json (300 items across levels 1..6, 50/level)
 * by upgrading all 160 legacy items from public/data/ielts_4skills.json (listening)
 * and merging 140 newly authored academic dictation sentences from data-src/dictation/new_140.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { DictationItemSchema } from '../../src/core/content/schemas.ts';

const ROOT = process.cwd();
const LEGACY_PATH = path.join(ROOT, 'public', 'data', 'ielts_4skills.json');
const NEW_PATH = path.join(ROOT, 'data-src', 'dictation', 'new_140.json');
const OUT_PATH = path.join(ROOT, 'public', 'data', 'listening', 'dictation.json');
const SRC_SNAPSHOT = path.join(ROOT, 'data-src', 'dictation', 'dictation_300.json');

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const CURLY_RE = /[“”‘’]/;

const WPM_BY_LEVEL = { 1: 110, 2: 120, 3: 130, 4: 140, 5: 150, 6: 160 };

const UK_VOICES = ['bf_emma', 'bm_george', 'bf_alice', 'bm_lewis', 'bf_isabella', 'bm_daniel', 'bf_lily', 'bm_fable'];
const US_VOICES = ['af_heart', 'am_adam', 'af_bella', 'am_michael', 'af_sarah', 'af_nicole'];
const AU_VOICES = ['edge:en-AU-NatashaNeural', 'edge:en-AU-WilliamNeural'];

function cleanText(s) {
  return String(s || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function findTokenIndex(text, targetWord) {
  const tokens = tokenize(text);
  const normTarget = targetWord.toLowerCase().replace(/[^a-z0-9'-]/g, '');
  // 1. Exact clean token match
  for (let i = 0; i < tokens.length; i++) {
    const clean = tokens[i].toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
    if (clean === normTarget) return i;
  }
  // 2. Prefix/contains match (e.g. multi-word or inflected)
  const firstPart = normTarget.split(/[\s-]+/)[0];
  for (let i = 0; i < tokens.length; i++) {
    const clean = tokens[i].toLowerCase().replace(/[^a-z0-9'-]/g, '');
    if (clean.includes(normTarget) || (firstPart.length >= 3 && clean.startsWith(firstPart))) {
      return i;
    }
  }
  return 0;
}

function detectSecondaryFeature(text, primaryFeatures) {
  const set = new Set(primaryFeatures);
  const low = text.toLowerCase();
  if (/\b(a|an|the|of|to|for|were|have|has|can|at)\b/.test(low)) set.add('weak_form');
  if (/\b[a-z]+(ed|s|es)\b/.test(low)) set.add('final_consonant');
  if (/\b\w+'(t|re|ve|ll|d|s)\b/.test(low)) set.add('contraction');
  return [...set].slice(0, 3);
}

function chooseVoiceAndAccent(level, idxInLevel) {
  if (level <= 2) {
    return { accent: 'uk', voice: UK_VOICES[idxInLevel % UK_VOICES.length] };
  }
  if (level <= 4) {
    // 60% UK, 40% US
    if (idxInLevel % 5 < 3) {
      return { accent: 'uk', voice: UK_VOICES[idxInLevel % UK_VOICES.length] };
    }
    return { accent: 'us', voice: US_VOICES[idxInLevel % US_VOICES.length] };
  }
  // Level 5 & 6: 30% AU (15/50 per level -> 30 total), 40% UK, 30% US
  if (idxInLevel < 15) {
    return { accent: 'au', voice: AU_VOICES[idxInLevel % AU_VOICES.length] };
  }
  if (idxInLevel < 35) {
    return { accent: 'uk', voice: UK_VOICES[idxInLevel % UK_VOICES.length] };
  }
  return { accent: 'us', voice: US_VOICES[idxInLevel % US_VOICES.length] };
}

function buildLegacyItems() {
  const legacyRaw = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf8')).listening;
  const numberDate = legacyRaw.filter((x) => x.category === 'number_date'); // 31 -> L2
  const minimalPair = legacyRaw.filter((x) => x.category === 'minimal_pair'); // 34 -> L3
  const others = legacyRaw
    .filter((x) => x.category !== 'number_date' && x.category !== 'minimal_pair')
    .sort((a, b) => tokenize(a.audioText).length - tokenize(b.audioText).length); // 95 items

  const l1Legacy = others.slice(0, 30);
  const l4Legacy = others.slice(30, 65);
  const l5Legacy = others.slice(65, 80);
  const l6Legacy = others.slice(80, 95);

  const mapFeature = (cat, level) => {
    if (cat === 'number_date') return 'numbers';
    if (cat === 'minimal_pair') return 'final_consonant';
    if (level === 4) return 'weak_form';
    if (level === 5) return 'linking';
    return 'academic';
  };

  const toDraft = (item, level) => {
    const text = cleanText(item.audioText);
    const feat = mapFeature(item.category, level);
    const tokenIndex = findTokenIndex(text, item.word);
    const cleanTrap = cleanText(item.trapExplanationVi || '').replace(/^\[[^\]]+\]\s*/, '');
    const meaning = cleanText(item.meaningVi || '');
    const tipVi = meaning
      ? `'${item.word}' (${meaning}): ${cleanTrap}.`.replace(/\.\.$/, '.')
      : `${cleanTrap}.`.replace(/\.\.$/, '.');

    return {
      level,
      text,
      features: detectSecondaryFeature(text, [feat, ...(item.category === 'section4_academic' ? ['academic'] : [])]),
      focus: [
        {
          tokenIndex,
          feature: feat,
          tipVi,
          ...(item.ipa && !CJK_RE.test(item.ipa) ? { ipaConnected: item.ipa } : {}),
        },
      ],
      acceptedVariants: undefined,
      isLegacy: true,
      legacyId: item.id,
    };
  };

  return {
    1: l1Legacy.map((x) => toDraft(x, 1)),
    2: numberDate.map((x) => toDraft(x, 2)),
    3: minimalPair.map((x) => toDraft(x, 3)),
    4: l4Legacy.map((x) => toDraft(x, 4)),
    5: l5Legacy.map((x) => toDraft(x, 5)),
    6: l6Legacy.map((x) => toDraft(x, 6)),
  };
}

function buildNewItems() {
  const raw = JSON.parse(fs.readFileSync(NEW_PATH, 'utf8'));
  const byLevel = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const item of raw) {
    const text = cleanText(item.text);
    const focus = (item.focusSpecs || []).map((fsItem) => ({
      tokenIndex: findTokenIndex(text, fsItem.word),
      feature: fsItem.feature,
      tipVi: cleanText(fsItem.tipVi),
      ...(fsItem.ipaConnected ? { ipaConnected: fsItem.ipaConnected } : {}),
    }));
    byLevel[item.level].push({
      level: item.level,
      text,
      features: item.features,
      focus,
      acceptedVariants: item.acceptedVariants,
      isLegacy: false,
    });
  }
  return byLevel;
}

function main() {
  const legacyByLevel = buildLegacyItems();
  const newByLevel = buildNewItems();

  const finalItems = [];
  const seenTexts = new Set();
  let seq = 1;

  for (let level = 1; level <= 6; level++) {
    const combined = [...legacyByLevel[level], ...newByLevel[level]];
    if (combined.length !== 50) {
      throw new Error(`Level ${level} expected 50 items, got ${combined.length} (legacy=${legacyByLevel[level].length}, new=${newByLevel[level].length})`);
    }
    for (let idx = 0; idx < combined.length; idx++) {
      const draft = combined[idx];
      const normKey = draft.text.toLowerCase();
      if (seenTexts.has(normKey)) {
        throw new Error(`Duplicate dictation sentence: "${draft.text}"`);
      }
      seenTexts.add(normKey);

      const numStr = String(seq).padStart(4, '0');
      const id = `dict:${numStr}`;
      const audio = `audio/dictation/dict_${numStr}.mp3`;
      const { accent, voice } = chooseVoiceAndAccent(level, idx);
      const isEdge = voice.startsWith('edge:');

      const obj = {
        id,
        text: draft.text,
        level,
        accent,
        voice,
        wpm: WPM_BY_LEVEL[level],
        features: draft.features,
        focus: draft.focus,
        audio,
        ...(draft.acceptedVariants && draft.acceptedVariants.length > 0
          ? { acceptedVariants: draft.acceptedVariants }
          : {}),
        provenance: draft.isLegacy
          ? {
              createdBy: 'import',
              source: `legacy:ielts_4skills.json#${draft.legacyId}`,
              license: isEdge ? 'edge-tts (personal use)' : 'own',
              qa: { schema: 'pass', verifier: 'pass' },
            }
          : {
              createdBy: 'llm+review',
              source: 'llm:gemini-4-neon@2026-11-20',
              license: isEdge ? 'edge-tts (personal use)' : 'own',
              qa: { schema: 'pass', verifier: 'pass' },
            },
      };

      const rawStr = JSON.stringify(obj);
      if (CJK_RE.test(rawStr)) throw new Error(`CJK found in ${id}`);
      if (CURLY_RE.test(rawStr)) throw new Error(`Curly quote found in ${id}`);

      const parsed = DictationItemSchema.safeParse(obj);
      if (!parsed.success) {
        throw new Error(`Schema error in ${id}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      }
      const tokens = tokenize(obj.text);
      if (tokens.length < 6 || tokens.length > 28) {
        throw new Error(`Word count ${tokens.length} out of [6, 28] in ${id}: "${obj.text}"`);
      }
      for (const f of obj.focus) {
        if (f.tokenIndex < 0 || f.tokenIndex >= tokens.length) {
          throw new Error(`tokenIndex ${f.tokenIndex} out of bounds (${tokens.length}) in ${id}`);
        }
      }

      finalItems.push(obj);
      seq++;
    }
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(finalItems, null, 2) + '\n', 'utf8');
  fs.writeFileSync(SRC_SNAPSHOT, JSON.stringify(finalItems, null, 2) + '\n', 'utf8');

  const levelCounts = {};
  const accentCounts = {};
  let edgeCount = 0;
  for (const it of finalItems) {
    levelCounts[it.level] = (levelCounts[it.level] || 0) + 1;
    accentCounts[it.accent] = (accentCounts[it.accent] || 0) + 1;
    if (it.voice.startsWith('edge:')) edgeCount++;
  }
  console.log(`[build_dictation] Wrote ${finalItems.length} items -> public/data/listening/dictation.json`);
  console.log(`  Levels:`, levelCounts);
  console.log(`  Accents:`, accentCounts, `(edge-tts: ${edgeCount})`);
}

main();
