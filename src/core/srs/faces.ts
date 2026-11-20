import { State } from 'ts-fsrs';

/**
 * Full set of card faces defined in docs/02-LEARNING-DESIGN.md §3.2,
 * plus production 'use' face alias.
 */
export const FACES = [
  'intro',
  'recog',
  'recall_meaning',
  'recall_cloze',
  'listen_spell',
  'col_gap',
  'para_match',
  'err_fix',
  'ltrap_replay',
  'dict_full',
  'tfng_retry',
  'head_retry',
  'use',
] as const;

export type Face = (typeof FACES)[number];

/** High-level pedagogical face family (brief & UI grouping). */
export type FaceFamily = 'recognize' | 'recall' | 'collocation' | 'listen' | 'use';

export type MasteryStage = 'new' | 'learning' | 'young' | 'mature' | 'mastered';

export const FACE_FAMILY: Record<Face, FaceFamily> = {
  intro: 'recognize',
  recog: 'recognize',
  para_match: 'recognize',
  tfng_retry: 'recognize',
  head_retry: 'recognize',
  recall_meaning: 'recall',
  recall_cloze: 'recall',
  col_gap: 'collocation',
  listen_spell: 'listen',
  ltrap_replay: 'listen',
  dict_full: 'listen',
  err_fix: 'use',
  use: 'use',
};

/** Difficulty ranking of faces (used to determine item mastery from hardest unlocked face). */
export const FACE_DIFFICULTY_RANK: Record<Face, number> = {
  intro: 0,
  recog: 1,
  para_match: 1,
  recall_meaning: 2,
  recall_cloze: 2,
  tfng_retry: 3,
  head_retry: 3,
  col_gap: 3,
  err_fix: 3,
  listen_spell: 4,
  ltrap_replay: 4,
  use: 5,
  dict_full: 5,
};

/** Faces that retire automatically after 3 successful repetitions (docs/02 §3.2). */
export const RETIRE_AFTER_REPS: Partial<Record<Face, number>> = {
  tfng_retry: 3,
  head_retry: 3,
};

export interface FaceCardSnapshot {
  id: string;
  itemId: string;
  face: Face;
  state: State;
  stability: number;
  reps: number;
  lapses: number;
  unlocked: boolean;
  lastReviewCorrect?: boolean;
}

/**
 * Determine which additional vocab faces should be unlocked based on current card stabilities.
 * Rules (docs/02-LEARNING-DESIGN.md §3.2):
 * 1. New vocab item starts with `recog`.
 * 2. When `recog` stability >= 3 days -> unlock `recall_meaning` and `recall_cloze`.
 * 3. When `recall_meaning` or `recall_cloze` stability >= 10 days -> unlock `listen_spell`.
 * 4. When `listen_spell` stability >= 21 days -> unlock `use`.
 */
export function getUnlockableVocabFaces(
  cardsForItem: readonly FaceCardSnapshot[],
): Face[] {
  const byFace = new Map<Face, FaceCardSnapshot>();
  for (const c of cardsForItem) {
    byFace.set(c.face, c);
  }

  const toUnlock: Face[] = [];
  const recog = byFace.get('recog');
  if (!recog || !recog.unlocked) {
    toUnlock.push('recog');
  }

  if (recog && recog.stability >= 3) {
    for (const nextFace of ['recall_meaning', 'recall_cloze'] as const) {
      const existing = byFace.get(nextFace);
      if (!existing || !existing.unlocked) {
        toUnlock.push(nextFace);
      }
    }
  }

  const recallMaxStability = Math.max(
    byFace.get('recall_meaning')?.stability ?? 0,
    byFace.get('recall_cloze')?.stability ?? 0,
  );
  if (recallMaxStability >= 10) {
    const ls = byFace.get('listen_spell');
    if (!ls || !ls.unlocked) {
      toUnlock.push('listen_spell');
    }
  }

  const listenStability = byFace.get('listen_spell')?.stability ?? 0;
  if (listenStability >= 21) {
    const useCard = byFace.get('use');
    if (!useCard || !useCard.unlocked) {
      toUnlock.push('use');
    }
  }

  return toUnlock;
}

/**
 * Check if a retry-only face (tfng_retry / head_retry) should be retired.
 */
export function isCardRetired(card: Pick<FaceCardSnapshot, 'face' | 'reps' | 'lastReviewCorrect'>): boolean {
  const limit = RETIRE_AFTER_REPS[card.face];
  if (limit === undefined) return false;
  return card.reps >= limit && card.lastReviewCorrect !== false;
}

/**
 * Compute MasteryStage for a single card (docs/02-LEARNING-DESIGN.md §2.1):
 * - new: reps === 0 or state === New
 * - learning: Learning/Relearning or stability < 1
 * - young: Review and stability < 21 days
 * - mature: Review and 21 <= stability < 90 days
 * - mastered: Review and stability >= 90 days and last review was correct
 */
export function getCardMastery(card: FaceCardSnapshot): MasteryStage {
  if (card.reps === 0 || card.state === State.New) {
    return 'new';
  }
  if (card.state === State.Learning || card.state === State.Relearning || card.stability < 1) {
    return 'learning';
  }
  if (card.stability >= 90 && card.lastReviewCorrect !== false) {
    return 'mastered';
  }
  if (card.stability >= 21) {
    return 'mature';
  }
  return 'young';
}

/**
 * Compute overall mastery stage of an item using its hardest unlocked face (docs/02 §3.2).
 */
export function getItemMastery(cardsForItem: readonly FaceCardSnapshot[]): MasteryStage {
  const unlocked = cardsForItem.filter((c) => c.unlocked && c.face !== 'intro');
  if (unlocked.length === 0) return 'new';

  let hardest = unlocked[0];
  for (let i = 1; i < unlocked.length; i++) {
    const curRank = FACE_DIFFICULTY_RANK[unlocked[i].face];
    const bestRank = FACE_DIFFICULTY_RANK[hardest.face];
    if (curRank > bestRank || (curRank === bestRank && unlocked[i].stability > hardest.stability)) {
      hardest = unlocked[i];
    }
  }
  return getCardMastery(hardest);
}

/**
 * Compute a smooth 0..100 mastery score for an item across its unlocked faces and stability.
 */
export function getItemMasteryScore(cardsForItem: readonly FaceCardSnapshot[]): number {
  const unlocked = cardsForItem.filter((c) => c.unlocked && c.face !== 'intro');
  if (unlocked.length === 0) return 0;

  let hardestRank = 0;
  let hardestCard = unlocked[0];
  for (const c of unlocked) {
    const rank = FACE_DIFFICULTY_RANK[c.face];
    if (rank > hardestRank || (rank === hardestRank && c.stability > hardestCard.stability)) {
      hardestRank = rank;
      hardestCard = c;
    }
  }

  // Face progression contributes up to 50 points, stability on hardest face contributes up to 50 points
  const faceProgress = Math.min(1, hardestRank / 4) * 50;
  const stabilityProgress = Math.min(1, Math.log1p(Math.max(0, hardestCard.stability)) / Math.log1p(90)) * 50;
  return Math.round(Math.min(100, faceProgress + stabilityProgress));
}
