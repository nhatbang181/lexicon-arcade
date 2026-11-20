import Dexie, { type EntityTable } from 'dexie';
import type { Grade, State } from 'ts-fsrs';
import type { SRSCard } from '../srs/fsrsAdapter';
import type { ConfidenceLevel, IeltsSkill, EvidenceMode } from '../band/estimator';
import type { StreakState } from '../gamification/streak';
import type { DailyPlan, GameId } from '../planner/today';

export interface UserProfile {
  id: 'me';
  createdAt: number;
  targetBands: Record<IeltsSkill, number>;
  estimatedBands: {
    L: number | null;
    R: number | null;
    W: number | null;
    S: number | null;
    overall: number | null;
    confidence: Record<IeltsSkill, ConfidenceLevel | null>;
  };
  skillLevels: Record<GameId, number>;
  dailyGoalMin: number;
  newCardsPerDay: number;
  streak: StreakState;
  xp: number;
  badges: string[];
  placementDoneAt: number | null;
  examDate: string | null;
  theme: 'light' | 'dark' | 'system';
  sfxVolume: number;
  musicVolume: number;
  legacyMigrated: boolean;
  writingBiasOffset: number;
}

export interface ReviewRecord {
  id?: number;
  cardId: string;
  rating: Grade;
  correct: boolean;
  hintUsed: boolean;
  durationMs: number;
  ts: number;
  gameId: GameId;
  prevState?: State;
}

export interface AttemptItem {
  itemId: string;
  correct: boolean;
  responseTimeMs?: number;
  trapType?: string;
}

export interface AttemptRecord {
  id?: number;
  gameId: GameId;
  mode: 'training' | 'exam' | 'sprint';
  startedAt: number;
  endedAt: number;
  score: number;
  total: number;
  xp: number;
  items: AttemptItem[];
}

export interface EssayRecord {
  id?: number;
  taskType: 'task1' | 'task2';
  promptId: string;
  text: string;
  wordCount: number;
  revisionOfId?: number;
  claudeResult?: {
    overallBand: number;
    criteria: Record<'TR_TA' | 'CC' | 'LR' | 'GRA', number>;
    promptVersion: string;
    rawJson: string;
  };
  officialBand?: number;
  createdAt: number;
  updatedAt: number;
}

export interface RecordingRecord {
  id?: number;
  part: 1 | 2 | 3 | 'full';
  promptId: string;
  durationSec: number;
  transcript: string;
  audioBlob?: Blob | null;
  audioBytes: number;
  metrics?: {
    wpm: number;
    pausesOver1s: number;
    pausesOver2s: number;
    avgRunLength: number;
    fillerCount: number;
  };
  claudeResult?: {
    overallBand: number;
    criteria: Record<'FC' | 'LR' | 'GRA' | 'P', number>;
    promptVersion: string;
    rawJson: string;
  };
  createdAt: number;
}

export interface BandSnapshotRecord {
  id?: number;
  skill: IeltsSkill;
  mode: EvidenceMode;
  ts: number;
  correct?: number;
  total?: number;
  band?: number;
  taskType?: 'task1' | 'task2';
  sourceGameId?: GameId;
}

export interface AppEventRecord {
  id?: number;
  type: string;
  ts: number;
  payload?: Record<string, unknown>;
}

export interface KvRecord {
  key: string;
  value: unknown;
}

export class LexiconV3DB extends Dexie {
  profile!: EntityTable<UserProfile, 'id'>;
  cards!: EntityTable<SRSCard, 'id'>;
  reviews!: EntityTable<ReviewRecord, 'id'>;
  attempts!: EntityTable<AttemptRecord, 'id'>;
  essays!: EntityTable<EssayRecord, 'id'>;
  recordings!: EntityTable<RecordingRecord, 'id'>;
  dailyPlans!: EntityTable<DailyPlan, 'date'>;
  bandSnapshots!: EntityTable<BandSnapshotRecord, 'id'>;
  events!: EntityTable<AppEventRecord, 'id'>;
  kv!: EntityTable<KvRecord, 'key'>;

  constructor(name = 'LexiconV3DB') {
    super(name);
    this.version(1).stores({
      profile: 'id',
      cards: 'id, itemId, face, due, state, starred, unlocked',
      reviews: '++id, cardId, ts, gameId',
      attempts: '++id, gameId, mode, startedAt',
      essays: '++id, taskType, promptId, createdAt',
      recordings: '++id, part, promptId, createdAt',
      dailyPlans: 'date',
      bandSnapshots: '++id, skill, ts',
      events: '++id, type, ts',
      kv: 'key',
    });
  }
}

export const db = new LexiconV3DB();
