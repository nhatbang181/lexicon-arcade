import { State } from 'ts-fsrs';
import { createNewCard, makeCardId, type SRSCard } from '../srs/fsrsAdapter';
import { slugifyWord } from '../text/normalize';
import { db as defaultDb, type LexiconV3DB } from './db';
import { createDefaultProfile } from './repos/profileRepo';

export const LEGACY_KEYS = {
  SRS: 'lexicon_quest_srs_v1',
  PLAYER: 'lexicon_quest_player_v1',
  MUTED: 'lexicon_quest_muted',
  IOE_MISTAKES: 'ioe_mistakes',
  IOE_MISTAKE_BANK: 'ioe_mistake_bank',
  SNAKE_HIGHSCORE: 'lexicon_snake_highscore', // intentionally ignored
} as const;

interface LegacyWordSRS {
  box?: number;
  streak?: number;
  mistakes?: number;
  lastReviewed?: number;
  nextReview?: number;
  isNemesis?: boolean;
}

interface LegacyPlayerState {
  exp?: number;
  level?: number;
  streak?: number;
  maxStreak?: number;
}

interface LegacyMistakeEntry {
  word?: string;
  correctAnswer?: string;
  id?: string;
}

export interface MigrateLegacyOptions {
  storage?: Pick<Storage, 'getItem'> | null;
  database?: LexiconV3DB;
  now?: Date;
}

export interface MigrateLegacyResult {
  skipped: boolean;
  srsCardsMigrated: number;
  mistakeCardsMigrated: number;
  xpMigrated: number;
  streakMigrated: number;
  mutedMigrated: boolean;
}

const BOX_STABILITY_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 18,
  5: 45,
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function estimateStabilityFromLegacy(entry: LegacyWordSRS): number {
  const box = Math.min(5, Math.max(1, Math.round(entry.box ?? 1)));
  const base = BOX_STABILITY_DAYS[box] ?? 1;
  const streakBonus = Math.min(20, Math.max(0, (entry.streak ?? 0) - 1) * 1.5);
  const penalty = entry.isNemesis ? 0.5 : 1;
  return Math.max(0.5, (base + streakBonus) * penalty);
}

/**
 * One-time, idempotent migration from V1/V2 localStorage into LexiconV3DB (docs/03 §7).
 * - Converts `lexicon_quest_srs_v1` entries into FSRS `recog` cards (unlocking `recall_meaning` if stability >= 3).
 * - Converts `ioe_mistakes` / `ioe_mistake_bank` into immediately due `recall_meaning` cards.
 * - Migrates reasonable XP & streak from `lexicon_quest_player_v1` (ignoring RPG stats).
 * - Migrates `lexicon_quest_muted` into `profile.sfxVolume` / `musicVolume`.
 * - Sets `profile.legacyMigrated = true` and `kv['migrated_v3'] = true`.
 * - NEVER deletes or modifies any localStorage key so legacy games stay intact.
 */
export async function migrateLegacyStorage(
  options: MigrateLegacyOptions = {},
): Promise<MigrateLegacyResult> {
  const database = options.database ?? defaultDb;
  const storage =
    options.storage !== undefined
      ? options.storage
      : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
        ? globalThis.localStorage
        : null;
  const now = options.now ?? new Date();
  const nowMs = now.getTime();

  const existingProfile = await database.profile.get('me');
  const migratedFlag = await database.kv.get('migrated_v3');

  if (existingProfile?.legacyMigrated === true || migratedFlag?.value === true) {
    return {
      skipped: true,
      srsCardsMigrated: 0,
      mistakeCardsMigrated: 0,
      xpMigrated: 0,
      streakMigrated: 0,
      mutedMigrated: false,
    };
  }

  const profile = existingProfile ?? createDefaultProfile(nowMs);
  const cardsToPut = new Map<string, SRSCard>();

  let srsCardsMigrated = 0;
  let mistakeCardsMigrated = 0;
  let xpMigrated = 0;
  let streakMigrated = 0;
  let mutedMigrated = false;

  if (storage) {
    // 1. Migrate legacy SRS map
    const rawSrs = safeJsonParse<Record<string, LegacyWordSRS>>(
      storage.getItem(LEGACY_KEYS.SRS),
    );
    if (rawSrs && typeof rawSrs === 'object') {
      for (const [wordKey, entry] of Object.entries(rawSrs)) {
        if (!entry || typeof entry !== 'object') continue;
        const slug = slugifyWord(wordKey);
        if (!slug) continue;

        const itemId = `vocab:${slug}`;
        const stability = estimateStabilityFromLegacy(entry);
        const reps = Math.max(1, entry.streak ?? 0, entry.box ?? 1);
        const lapses = Math.max(0, entry.mistakes ?? 0);
        const lastReview =
          typeof entry.lastReviewed === 'number' && entry.lastReviewed > 0
            ? entry.lastReviewed
            : nowMs - 86_400_000;
        const nextDue =
          typeof entry.nextReview === 'number' && entry.nextReview > 0
            ? entry.nextReview
            : nowMs + Math.round(stability * 86_400_000);

        const recogCard: SRSCard = {
          ...createNewCard(itemId, 'recog', { now, source: 'legacy_srs' }),
          state: stability >= 1 ? State.Review : State.Learning,
          stability,
          difficulty: entry.isNemesis ? 7.5 : 5.0,
          scheduled_days: Math.max(1, Math.round(stability)),
          reps,
          lapses,
          last_review: lastReview,
          due: nextDue,
          streak: Math.max(0, entry.streak ?? 0),
          lastReviewCorrect: !entry.isNemesis,
        };
        cardsToPut.set(recogCard.id, recogCard);
        srsCardsMigrated++;

        // Unlock recall_meaning automatically for well-known words (docs/02 §3.2)
        if (stability >= 3) {
          const recallCard = createNewCard(itemId, 'recall_meaning', {
            now,
            unlocked: true,
            source: 'legacy_srs',
          });
          cardsToPut.set(recallCard.id, recallCard);
        }
      }
    }

    // 2. Migrate IOE mistake bank (support both key names)
    const mistakesA = safeJsonParse<Array<string | LegacyMistakeEntry>>(
      storage.getItem(LEGACY_KEYS.IOE_MISTAKES),
    );
    const mistakesB = safeJsonParse<Array<string | LegacyMistakeEntry>>(
      storage.getItem(LEGACY_KEYS.IOE_MISTAKE_BANK),
    );
    const allMistakes = [
      ...(Array.isArray(mistakesA) ? mistakesA : []),
      ...(Array.isArray(mistakesB) ? mistakesB : []),
    ];

    const seenMistakeSlugs = new Set<string>();
    for (const item of allMistakes) {
      const rawWord =
        typeof item === 'string'
          ? item
          : item && typeof item === 'object'
            ? item.word ?? item.correctAnswer ?? ''
            : '';
      const slug = slugifyWord(rawWord);
      if (!slug || seenMistakeSlugs.has(slug)) continue;
      seenMistakeSlugs.add(slug);

      const itemId = `vocab:${slug}`;
      const cardId = makeCardId(itemId, 'recall_meaning');
      const base =
        cardsToPut.get(cardId) ??
        createNewCard(itemId, 'recall_meaning', {
          now,
          unlocked: true,
          source: 'legacy_mistake',
        });

      const dueCard: SRSCard = {
        ...base,
        due: nowMs,
        state: State.Relearning,
        lapses: Math.max(1, base.lapses + 1),
        reps: Math.max(1, base.reps),
        difficulty: Math.max(6.5, base.difficulty || 6.5),
        stability: Math.min(1, base.stability > 0 ? base.stability : 0.5),
        last_review: nowMs - 3_600_000,
        lastReviewCorrect: false,
        source: 'legacy_mistake',
      };
      cardsToPut.set(cardId, dueCard);
      mistakeCardsMigrated++;
    }

    // 3. Migrate player XP & streak (drop RPG stats)
    const rawPlayer = safeJsonParse<LegacyPlayerState>(
      storage.getItem(LEGACY_KEYS.PLAYER),
    );
    if (rawPlayer && typeof rawPlayer === 'object') {
      const level = Math.max(1, Math.min(100, Math.floor(rawPlayer.level ?? 1)));
      const exp = Math.max(0, Math.min(50_000, Math.floor(rawPlayer.exp ?? 0)));
      xpMigrated = Math.min(25_000, (level - 1) * 100 + exp);
      if (xpMigrated > 0) {
        profile.xp = Math.max(profile.xp, xpMigrated);
      }

      const legacyStreak = Math.max(0, Math.min(365, Math.floor(rawPlayer.streak ?? 0)));
      const legacyMaxStreak = Math.max(
        legacyStreak,
        Math.min(365, Math.floor(rawPlayer.maxStreak ?? 0)),
      );
      if (legacyStreak > 0 || legacyMaxStreak > 0) {
        streakMigrated = legacyStreak;
        profile.streak = {
          ...profile.streak,
          count: Math.max(profile.streak.count, legacyStreak),
          longest: Math.max(profile.streak.longest, legacyMaxStreak),
        };
      }
    }

    // 4. Migrate mute preference
    const mutedRaw = storage.getItem(LEGACY_KEYS.MUTED);
    if (mutedRaw === 'true') {
      profile.sfxVolume = 0;
      profile.musicVolume = 0;
      mutedMigrated = true;
    }
  }

  profile.legacyMigrated = true;

  await database.transaction(
    'rw',
    [database.profile, database.cards, database.kv],
    async () => {
      await database.profile.put(profile);
      if (cardsToPut.size > 0) {
        await database.cards.bulkPut(Array.from(cardsToPut.values()));
      }
      await database.kv.put({ key: 'migrated_v3', value: true });
    },
  );

  return {
    skipped: false,
    srsCardsMigrated,
    mistakeCardsMigrated,
    xpMigrated,
    streakMigrated,
    mutedMigrated,
  };
}
