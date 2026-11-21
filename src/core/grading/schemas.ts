import { z } from 'zod';

// ---------------------------------------------------------------------------
// Prompt versions & compatibility registry (docs/07-GRADING-WITH-CLAUDE.md §2 & §5)
// ---------------------------------------------------------------------------

export type GradingFamily = 'writing' | 'speaking' | 'sprint';
export type WritingKind = 'task1' | 'task2';
export type SpeakingKind = 'speaking';
export type SprintKind = 'w2_overview' | 'w2_idea' | 's2';
export type GradingKind = WritingKind | SpeakingKind | SprintKind;

export const SUPPORTED_PROMPT_VERSIONS = {
  writing: ['w-1.0'] as const,
  speaking: ['s-1.0'] as const,
  sprint: ['sp-1.0'] as const,
};

/**
 * Extract `PROMPT_VERSION: <ver>` from the header of a `docs/grading/*.md` file.
 */
export function extractPromptVersion(rawPromptMarkdown: string): string {
  const match = rawPromptMarkdown.match(/^\s*PROMPT_VERSION:\s*([^\s\r\n]+)/m);
  return match?.[1]?.trim() ?? 'unknown';
}

export function getGradingFamily(kind: GradingKind): GradingFamily {
  if (kind === 'task1' || kind === 'task2') return 'writing';
  if (kind === 'speaking') return 'speaking';
  return 'sprint';
}

export function parseMajorPromptVersion(promptVersion: string | undefined): number {
  if (!promptVersion) return 1;
  const match = promptVersion.match(/^[a-z]+-(\d+)(?:\.\d+)?$/i);
  if (!match) return 1;
  return Number.parseInt(match[1], 10) || 1;
}

// ---------------------------------------------------------------------------
// Primitives & Shared Sub-schemas (v1)
// ---------------------------------------------------------------------------

export const BandScoreSchema = z
  .number()
  .min(3, 'Band tối thiểu là 3.0')
  .max(9, 'Band tối đa là 9.0')
  .refine((v) => Number.isFinite(v) && Math.abs(v * 2 - Math.round(v * 2)) < 1e-9, {
    message: 'Band phải theo bước 0.5 (vd: 6.0, 6.5, 7.0)',
  });

export const ERROR_TAGS = [
  'article',
  'plural',
  'sva',
  'tense',
  'word_form',
  'preposition',
  'run_on',
  'fragment',
  'l1_collocation',
  'register',
  'spelling',
  'cohesion',
  'relevance',
  'development',
  'repetition',
  'overgeneralisation',
  'pronunciation',
  'other',
] as const;

export const ErrorTagSchema = z.enum(ERROR_TAGS);
export type ErrorTag = z.infer<typeof ErrorTagSchema>;

export const SeveritySchema = z.enum(['high', 'medium', 'low']);
export type IssueSeverity = z.infer<typeof SeveritySchema>;

export const ConfidenceSchema = z.enum(['low', 'medium', 'high']);
export type GradingConfidence = z.infer<typeof ConfidenceSchema>;

export const GradingIssueSchema = z.object({
  quote: z.string(),
  problemVi: z.string().min(1),
  fix: z.string(),
  errorTag: ErrorTagSchema,
  severity: SeveritySchema,
});
export type GradingIssue = z.infer<typeof GradingIssueSchema>;

export const GradingStrengthSchema = z.object({
  quote: z.string(),
  whyVi: z.string().min(1),
});
export type GradingStrength = z.infer<typeof GradingStrengthSchema>;

export const CriterionFeedbackSchema = z.object({
  band: BandScoreSchema,
  summaryVi: z.string().min(1),
  strengths: z.array(GradingStrengthSchema).max(2),
  issues: z.array(GradingIssueSchema).max(6),
});
export type CriterionFeedback = z.infer<typeof CriterionFeedbackSchema>;

export const TopPrioritySchema = z.object({
  criterion: z.string().min(1),
  titleVi: z.string().min(1),
  actionVi: z.string().min(1),
});
export type TopPriority = z.infer<typeof TopPrioritySchema>;

export const UpgradeItemSchema = z.object({
  original: z.string().min(1),
  upgraded: z.string().min(1),
  criterion: z.string().min(1),
  noteVi: z.string().min(1),
});
export type UpgradeItem = z.infer<typeof UpgradeItemSchema>;

export const SrsFeedbackItemSchema = z.object({
  kind: z.enum(['collocation', 'vocab', 'error']),
  front: z.string().min(1),
  back: z.string().min(1),
  noteVi: z.string().min(1),
});
export type SrsFeedbackItem = z.infer<typeof SrsFeedbackItemSchema>;

const CommonGradingShape = {
  attemptId: z.string().min(1),
  promptVersion: z.string().min(1),
  topPriorities: z.array(TopPrioritySchema).length(3),
  upgrades: z.array(UpgradeItemSchema).max(6),
  srsItems: z.array(SrsFeedbackItemSchema).max(8),
  confidence: ConfidenceSchema,
};

// ---------------------------------------------------------------------------
// Writing Result Schema (v1 · PROMPT_VERSION: w-1.0)
// ---------------------------------------------------------------------------

export const WritingTask1DetailSchema = z.object({
  overviewPresent: z.boolean(),
  keyFeaturesCovered: z.array(z.string()),
  dataErrors: z.array(GradingIssueSchema),
});
export type WritingTask1Detail = z.infer<typeof WritingTask1DetailSchema>;

export const WritingTask2DetailSchema = z.object({
  positionClear: z.boolean(),
  partsAddressed: z.array(
    z.object({
      part: z.string().min(1),
      addressed: z.enum(['fully', 'partly', 'no']),
    }),
  ),
  mainIdeas: z.array(
    z.object({
      idea: z.string().min(1),
      developed: z.enum(['well', 'partly', 'no']),
    }),
  ),
});
export type WritingTask2Detail = z.infer<typeof WritingTask2DetailSchema>;

export const WritingRevisionSchema = z.object({
  resolvedIssueQuotes: z.array(z.string()),
});
export type WritingRevision = z.infer<typeof WritingRevisionSchema>;

export const WritingResultV1Schema = z.object({
  ...CommonGradingShape,
  kind: z.enum(['task1', 'task2']),
  criteria: z.object({
    TR_TA: CriterionFeedbackSchema,
    CC: CriterionFeedbackSchema,
    LR: CriterionFeedbackSchema,
    GRA: CriterionFeedbackSchema,
  }),
  relevance: z.enum(['on_topic', 'partly_off', 'off_topic']),
  task1: WritingTask1DetailSchema.nullable(),
  task2: WritingTask2DetailSchema.nullable(),
  revision: WritingRevisionSchema.nullable(),
});
export const WritingResultSchema = WritingResultV1Schema;
export type WritingResult = z.infer<typeof WritingResultV1Schema>;
export type WritingCriterionKey = keyof WritingResult['criteria'];

// ---------------------------------------------------------------------------
// Speaking Result Schema (v1 · PROMPT_VERSION: s-1.0)
// ---------------------------------------------------------------------------

export const SpeakingPartNoteSchema = z.object({
  part: z.enum(['1', '2', '3']),
  noteVi: z.string().min(1),
});
export type SpeakingPartNote = z.infer<typeof SpeakingPartNoteSchema>;

export const SpeakingResultV1Schema = z.object({
  ...CommonGradingShape,
  kind: z.literal('speaking'),
  criteria: z.object({
    FC: CriterionFeedbackSchema,
    LR: CriterionFeedbackSchema,
    GRA: CriterionFeedbackSchema,
    P: CriterionFeedbackSchema,
  }),
  partNotes: z.array(SpeakingPartNoteSchema),
  pronunciationConfidence: z.literal('low'),
});
export const SpeakingResultSchema = SpeakingResultV1Schema;
export type SpeakingResult = z.infer<typeof SpeakingResultV1Schema>;
export type SpeakingCriterionKey = keyof SpeakingResult['criteria'];

// ---------------------------------------------------------------------------
// Sprint Result Schema (v1 · PROMPT_VERSION: sp-1.0)
// ---------------------------------------------------------------------------

export const SprintBetterChunkSchema = z.object({
  original: z.string().min(1),
  better: z.string().min(1),
});

export const SprintItemResultSchema = z.object({
  ref: z.string().min(1),
  stars: z.number().int().min(0).max(3),
  checks: z.record(z.string(), z.boolean()),
  tipVi: z.string().min(1),
  betterChunk: SprintBetterChunkSchema.nullable(),
});
export type SprintItemResult = z.infer<typeof SprintItemResultSchema>;

export const SprintResultV1Schema = z.object({
  attemptId: z.string().min(1),
  promptVersion: z.string().min(1),
  kind: z.enum(['w2_overview', 'w2_idea', 's2']),
  items: z.array(SprintItemResultSchema).min(1),
});
export const SprintResultSchema = SprintResultV1Schema;
export type SprintResult = z.infer<typeof SprintResultV1Schema>;

// ---------------------------------------------------------------------------
// Union & Versioned Schema Registry (v1 / extensible v2+)
// ---------------------------------------------------------------------------

export const GradingResultSchema = z.union([
  WritingResultV1Schema,
  SpeakingResultV1Schema,
  SprintResultV1Schema,
]);
export type GradingResult = WritingResult | SpeakingResult | SprintResult;

export type AnyGradingZodSchema =
  | typeof WritingResultV1Schema
  | typeof SpeakingResultV1Schema
  | typeof SprintResultV1Schema;

export interface VersionedSchemaRegistry {
  writing: Record<number, typeof WritingResultV1Schema>;
  speaking: Record<number, typeof SpeakingResultV1Schema>;
  sprint: Record<number, typeof SprintResultV1Schema>;
}

/**
 * Registry keyed by family and major version number (e.g. w-1.x -> 1).
 * Future v2 schemas can be registered alongside v1 so archived attempts remain readable.
 */
export const GRADING_SCHEMA_REGISTRY: VersionedSchemaRegistry = {
  writing: {
    1: WritingResultV1Schema,
  },
  speaking: {
    1: SpeakingResultV1Schema,
  },
  sprint: {
    1: SprintResultV1Schema,
  },
};

export function resolveGradingSchema(
  family: GradingFamily,
  promptVersion?: string,
): AnyGradingZodSchema {
  const major = parseMajorPromptVersion(promptVersion);
  const bucket = GRADING_SCHEMA_REGISTRY[family];
  return bucket[major] ?? bucket[1];
}

export function isWritingResult(result: GradingResult): result is WritingResult {
  return result.kind === 'task1' || result.kind === 'task2';
}

export function isSpeakingResult(result: GradingResult): result is SpeakingResult {
  return result.kind === 'speaking';
}

export function isSprintResult(result: GradingResult): result is SprintResult {
  return result.kind === 'w2_overview' || result.kind === 'w2_idea' || result.kind === 's2';
}
