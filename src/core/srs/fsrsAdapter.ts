import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type FSRS,
  type FSRSParameters,
  type Grade,
} from 'ts-fsrs';
import type { Face } from './faces';

export { Rating, State };
export type { Grade };

export const DEFAULT_FSRS_PARAMS: Partial<FSRSParameters> = {
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: true,
};

export type CardSource =
  | 'curriculum'
  | 'placement'
  | 'essay_feedback'
  | 'speaking_feedback'
  | 'listening_trap'
  | 'reading_mistake'
  | 'dictation'
  | 'legacy_srs'
  | 'legacy_mistake'
  | 'user';

export interface SRSCard {
  /** Primary key: `${itemId}#${face}` */
  id: string;
  itemId: string;
  face: Face;
  /** Epoch ms when next review is due */
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  /** Epoch ms of last review */
  last_review?: number;
  unlocked: boolean;
  starred: boolean;
  source: CardSource;
  createdAt: number;
  /** Consecutive correct reviews (used by autoRate for Easy eligibility) */
  streak: number;
  lastReviewCorrect?: boolean;
}

export interface ReviewScheduleResult {
  card: SRSCard;
  rating: Grade;
  prevState: State;
  nextDue: number;
  scheduledDays: number;
}

export interface CreateCardOptions {
  now?: Date;
  unlocked?: boolean;
  starred?: boolean;
  source?: CardSource;
}

export function makeCardId(itemId: string, face: Face): string {
  return `${itemId}#${face}`;
}

export function createFSRSScheduler(overrides: Partial<FSRSParameters> = {}): FSRS {
  return fsrs(
    generatorParameters({
      ...DEFAULT_FSRS_PARAMS,
      ...overrides,
    }),
  );
}

const defaultScheduler = createFSRSScheduler();

export function toTsFsrsCard(card: SRSCard): Card {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps ?? 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review !== undefined ? new Date(card.last_review) : undefined,
  };
}

export function createNewCard(
  itemId: string,
  face: Face,
  options: CreateCardOptions = {},
): SRSCard {
  const now = options.now ?? new Date();
  const empty = createEmptyCard(now);
  return {
    id: makeCardId(itemId, face),
    itemId,
    face,
    due: empty.due.getTime(),
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsed_days: 0,
    scheduled_days: empty.scheduled_days,
    learning_steps: empty.learning_steps,
    reps: empty.reps,
    lapses: empty.lapses,
    state: empty.state,
    last_review: undefined,
    unlocked: options.unlocked ?? true,
    starred: options.starred ?? false,
    source: options.source ?? 'curriculum',
    createdAt: now.getTime(),
    streak: 0,
  };
}

export function scheduleCard(
  card: SRSCard,
  rating: Grade,
  now: Date = new Date(),
  scheduler: FSRS = defaultScheduler,
): ReviewScheduleResult {
  const prevState = card.state;
  const elapsedDays =
    card.last_review !== undefined
      ? Math.max(0, (now.getTime() - card.last_review) / 86_400_000)
      : 0;

  const { card: nextTsCard } = scheduler.next(toTsFsrsCard(card), now, rating);
  const wasCorrect = rating !== Rating.Again;

  const updated: SRSCard = {
    ...card,
    due: nextTsCard.due.getTime(),
    stability: nextTsCard.stability,
    difficulty: nextTsCard.difficulty,
    elapsed_days: elapsedDays,
    scheduled_days: nextTsCard.scheduled_days,
    learning_steps: nextTsCard.learning_steps,
    reps: nextTsCard.reps,
    lapses: nextTsCard.lapses,
    state: nextTsCard.state,
    last_review: nextTsCard.last_review ? nextTsCard.last_review.getTime() : now.getTime(),
    streak: wasCorrect ? (card.streak ?? 0) + 1 : 0,
    lastReviewCorrect: wasCorrect,
  };

  return {
    card: updated,
    rating,
    prevState,
    nextDue: updated.due,
    scheduledDays: updated.scheduled_days,
  };
}

/**
 * Compute estimated recall probability in [0, 1] at time `now`.
 */
export function getCardRetrievability(
  card: SRSCard,
  now: Date = new Date(),
  scheduler: FSRS = defaultScheduler,
): number {
  if (card.state === State.New || card.stability <= 0) {
    return 0;
  }
  return scheduler.retrievability(toTsFsrsCard(card), now);
}

/**
 * Preview next intervals for all four FSRS ratings without mutating the card.
 */
export function previewCardRatings(
  card: SRSCard,
  now: Date = new Date(),
  scheduler: FSRS = defaultScheduler,
): Record<Grade, { due: number; scheduledDays: number }> {
  const grades: Grade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
  const out = {} as Record<Grade, { due: number; scheduledDays: number }>;
  for (const g of grades) {
    const res = scheduleCard(card, g, now, scheduler);
    out[g] = { due: res.nextDue, scheduledDays: res.scheduledDays };
  }
  return out;
}
