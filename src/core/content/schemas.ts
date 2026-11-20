import { z } from 'zod';

const CJK_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

const prefixedId = <P extends string>(prefix: P) =>
  z
    .string()
    .min(prefix.length + 1)
    .refine((v): v is `${P}${string}` => v.startsWith(prefix), {
      message: `ID must start with "${prefix}"`,
    });

// ---------------------------------------------------------------------------
// Common Types (docs/04-DATA-SPEC.md §2)
// ---------------------------------------------------------------------------

export const TOPICS = [
  'education',
  'environment',
  'technology',
  'health',
  'urban',
  'work',
  'crime',
  'media',
  'globalisation',
  'culture',
  'science',
  'transport',
  'family',
  'economy',
  'tourism',
  'food',
  'government',
  'arts',
  'sport',
  'animals',
  'history',
  'psychology',
  'space',
  'energy',
  'language',
] as const;

export const TopicSchema = z.enum(TOPICS);
export type Topic = z.infer<typeof TopicSchema>;

export const CEFRSchema = z.enum(['B1', 'B2', 'C1', 'C2']);
export type CEFR = z.infer<typeof CEFRSchema>;

export const ProvenanceSchema = z.object({
  createdBy: z.enum(['human', 'llm', 'llm+review', 'import']),
  source: z.string().min(1),
  license: z.string().min(1),
  attribution: z.string().optional(),
  qa: z.object({
    schema: z.literal('pass'),
    verifier: z.enum(['pass', 'fixed']).optional(),
    blindSolve: z.enum(['pass', 'na']).optional(),
    humanSpotCheck: z.string().optional(),
  }),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

// ---------------------------------------------------------------------------
// Vocabulary (docs/04-DATA-SPEC.md §3)
// ---------------------------------------------------------------------------

export const PosSchema = z.enum([
  'n',
  'v',
  'adj',
  'adv',
  'phr',
  'phr_v',
  'idiom',
  'prep',
  'conj',
]);
export type Pos = z.infer<typeof PosSchema>;

export const VocabListSchema = z.enum([
  'AWL1',
  'AWL2',
  'AWL3',
  'AWL4',
  'AWL5',
  'AWL6',
  'AWL7',
  'AWL8',
  'AWL9',
  'AWL10',
  'NAWL',
  'NGSL',
  'ANKI',
  'TOPIC',
]);

const IpaSlashStringSchema = z
  .string()
  .regex(/^\/.+\/$/, 'IPA must be enclosed in slashes /.../')
  .refine((v) => !CJK_REGEX.test(v), 'IPA must not contain CJK characters');

export const VocabExampleSchema = z.object({
  en: z.string().min(1),
  vi: z.string().optional(),
  ieltsContext: z.enum(['W2', 'W1', 'S', 'R', 'L']).optional(),
  clozeAccepted: z.array(z.string().min(1)).optional(),
});

export const VocabItemSchema = z.object({
  id: prefixedId('vocab:'),
  headword: z.string().min(1),
  pos: z.array(PosSchema).min(1),
  ipa: z.object({
    uk: IpaSlashStringSchema,
    us: IpaSlashStringSchema.optional(),
  }),
  syllables: z.string().optional(),
  meaningVi: z.string().min(1),
  definitionEn: z.string().min(1),
  examples: z.array(VocabExampleSchema).min(2),
  family: z.array(z.object({ form: z.string().min(1), pos: z.string().min(1) })).optional(),
  synonyms: z.array(z.object({ word: z.string().min(1), noteVi: z.string().optional() })).optional(),
  collocationIds: z.array(prefixedId('col:')),
  register: z.enum(['neutral', 'formal', 'informal']),
  topics: z.array(TopicSchema).min(1),
  lists: z.array(VocabListSchema).min(1),
  freqZipf: z.number().optional(),
  cefr: CEFRSchema.optional(),
  vnTrap: z.string().optional(),
  audio: z.object({
    uk: z.string().min(1),
    us: z.string().min(1).optional(),
  }),
  provenance: ProvenanceSchema,
});
export type VocabItem = z.infer<typeof VocabItemSchema>;

export const CollocationPatternSchema = z.enum([
  'V+N',
  'ADJ+N',
  'N+N',
  'N+PREP',
  'V+PREP',
  'ADJ+PREP',
  'ADV+ADJ',
  'V+ADV',
  'N+of+N',
  'PHRASE',
]);

export const CollocationItemSchema = z.object({
  id: prefixedId('col:'),
  headwordId: prefixedId('vocab:'),
  pattern: CollocationPatternSchema,
  phrase: z.string().min(1),
  gaps: z
    .array(
      z.object({
        display: z.string().min(1),
        answers: z.array(z.string().min(1)).min(1),
        primary: z.string().min(1),
      }),
    )
    .min(1),
  meaningVi: z.string().min(1),
  example: z.string().min(1),
  register: z.enum(['neutral', 'formal']),
  bandTarget: z.union([z.literal(7), z.literal(8), z.literal(9)]),
  l1Traps: z.array(
    z.object({
      wrong: z.string().min(1),
      whyVi: z.string().min(1),
    }),
  ),
  topics: z.array(TopicSchema).min(1),
  provenance: ProvenanceSchema,
});
export const CollocationSchema = CollocationItemSchema;
export type CollocationItem = z.infer<typeof CollocationItemSchema>;
export type Collocation = CollocationItem;

export const ParaphraseItemSchema = z.object({
  id: prefixedId('para:'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  questionPhrase: z.string().min(1),
  relation: z.enum(['equivalent', 'not_equivalent']),
  context: z.string().min(1),
  target: z.object({
    text: z.string().min(1),
    start: z.number().int().min(0),
    end: z.number().int().min(0),
  }),
  decoys: z
    .array(
      z.object({
        text: z.string().min(1),
        start: z.number().int().min(0),
        end: z.number().int().min(0),
        whyVi: z.string().min(1),
      }),
    )
    .min(1)
    .max(3),
  explanationVi: z.string().min(1),
  topics: z.array(TopicSchema).min(1),
  provenance: ProvenanceSchema,
});
export type ParaphraseItem = z.infer<typeof ParaphraseItemSchema>;

export const ErrorTagSchema = z.enum([
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
]);
export type ErrorTag = z.infer<typeof ErrorTagSchema>;

export const ErrorItemSchema = z.object({
  id: prefixedId('err:'),
  tag: ErrorTagSchema,
  wrong: z.string().min(1),
  correct: z.string().min(1),
  errorSpan: z.object({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
  }),
  ruleVi: z.string().min(1),
  provenance: ProvenanceSchema,
});
export const ErrorPatternSchema = ErrorItemSchema;
export type ErrorItem = z.infer<typeof ErrorItemSchema>;
export type ErrorPattern = ErrorItem;

export const PlacementVocabSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      headword: z.string().min(1),
      band: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
      ]),
      checkMeaningVi: z.string().min(1),
      foilsVi: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
    }),
  ),
});
export type PlacementVocab = z.infer<typeof PlacementVocabSchema>;

// ---------------------------------------------------------------------------
// Listening (docs/04-DATA-SPEC.md §4)
// ---------------------------------------------------------------------------

export const ListeningTrapSchema = z.enum([
  'self_correction',
  'changed_plan',
  'distractor_number',
  'spelling_out',
  'double_letter',
  'negation_shift',
  'option_mentioned_rejected',
  'synonym_paraphrase',
  'plural_singular',
  'word_limit',
  'homophone_minimal_pair',
  'signpost_skip',
  'map_direction',
]);
export type ListeningTrap = z.infer<typeof ListeningTrapSchema>;

export const ListeningQTypeSchema = z.enum([
  'form_completion',
  'note_completion',
  'table_completion',
  'flowchart_completion',
  'sentence_completion',
  'summary_completion',
  'short_answer',
  'mcq_single',
  'mcq_multi',
  'matching',
  'map_labelling',
  'diagram_labelling',
]);
export type ListeningQType = z.infer<typeof ListeningQTypeSchema>;

export const FormTemplateSchema = z.object({
  title: z.string().min(1),
  rows: z.array(
    z.object({
      label: z.string(),
      value: z.string().optional(),
      blankQid: z.string().optional(),
      suffix: z.string().optional(),
    }),
  ),
});
export type FormTemplate = z.infer<typeof FormTemplateSchema>;

export const MapSpecSchema = z.object({
  viewBox: z.string().min(1),
  shapes: z.array(
    z.object({
      id: z.string().min(1),
      kind: z.enum([
        'building',
        'road',
        'path',
        'water',
        'park',
        'parking',
        'entrance',
        'label',
      ]),
      d: z.string().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
      w: z.number().optional(),
      h: z.number().optional(),
      label: z.string().optional(),
    }),
  ),
  compass: z.boolean(),
  youAreHere: z.object({ x: z.number(), y: z.number() }).optional(),
  slots: z.array(
    z.object({
      key: z.string().min(1),
      x: z.number(),
      y: z.number(),
    }),
  ),
});
export type MapSpec = z.infer<typeof MapSpecSchema>;

export const WordLimitSchema = z.object({
  words: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  allowNumber: z.boolean(),
});
export type WordLimit = z.infer<typeof WordLimitSchema>;

export const ListeningQuestionSchema = z.object({
  qid: z.string().min(1),
  number: z.number().int().min(1),
  prompt: z.string().min(1),
  answer: z.object({
    accepted: z.array(z.string().min(1)),
    keys: z.array(z.string().min(1)).optional(),
  }),
  evidence: z.object({
    lineId: z.string().min(1),
    start: z.number().min(0),
    end: z.number().min(0),
  }),
  traps: z.array(
    z.object({
      type: ListeningTrapSchema,
      lineId: z.string().min(1),
      start: z.number().min(0),
      end: z.number().min(0),
      decoy: z.string().optional(),
      explanationVi: z.string().min(1),
    }),
  ),
});
export type ListeningQuestion = z.infer<typeof ListeningQuestionSchema>;

export const ListeningQuestionGroupSchema = z.object({
  groupId: z.string().min(1),
  type: ListeningQTypeSchema,
  instructions: z.string().min(1),
  wordLimit: WordLimitSchema.optional(),
  previewSec: z.number().min(0),
  template: FormTemplateSchema.optional(),
  map: MapSpecSchema.optional(),
  options: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) })).optional(),
  questions: z.array(ListeningQuestionSchema).min(1),
});
export type ListeningQuestionGroup = z.infer<typeof ListeningQuestionGroupSchema>;

export const ListeningEpisodeSchema = z.object({
  id: prefixedId('lep:'),
  part: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  reserved: z.boolean().optional(),
  title: z.string().min(1),
  contextEn: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
  speakers: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        role: z.string().min(1),
        voice: z.string().min(1),
        accent: z.enum(['uk', 'us', 'au', 'nz', 'ca']),
      }),
    )
    .min(1),
  channel: z.enum(['normal', 'phone']).optional(),
  script: z
    .array(
      z.object({
        lineId: z.string().min(1),
        speakerId: z.string().min(1),
        text: z.string().min(1),
        ttsText: z.string().optional(),
        start: z.number().min(0),
        end: z.number().min(0),
        pauseAfter: z.number().min(0).optional(),
      }),
    )
    .min(1),
  audio: z.object({
    path: z.string().min(1),
    durationSec: z.number().positive(),
    sha256: z.string().min(1),
    loudnessLUFS: z.number(),
  }),
  questionGroups: z.array(ListeningQuestionGroupSchema).min(1),
  provenance: ProvenanceSchema,
});
export type ListeningEpisode = z.infer<typeof ListeningEpisodeSchema>;

export const DictationFeatureSchema = z.enum([
  'linking',
  'weak_form',
  'final_consonant',
  'elision',
  'numbers',
  'names',
  'academic',
  'contraction',
]);

export const DictationItemSchema = z.object({
  id: prefixedId('dict:'),
  text: z.string().min(1),
  level: z.number().int().min(1).max(10),
  accent: z.enum(['uk', 'us', 'au']),
  voice: z.string().min(1),
  wpm: z.number().positive(),
  features: z.array(DictationFeatureSchema),
  focus: z.array(
    z.object({
      tokenIndex: z.number().int().min(0),
      feature: z.string().min(1),
      tipVi: z.string().min(1),
      ipaConnected: z.string().optional(),
    }),
  ),
  audio: z.string().min(1),
  acceptedVariants: z.array(z.string().min(1)).optional(),
  sourceEpisodeId: z.string().optional(),
  provenance: ProvenanceSchema,
});
export type DictationItem = z.infer<typeof DictationItemSchema>;

// ---------------------------------------------------------------------------
// Reading (docs/04-DATA-SPEC.md §5)
// ---------------------------------------------------------------------------

export const ReadingTrapSchema = z.enum([
  'qualifier',
  'comparison',
  'causation',
  'time_sequence',
  'number_date',
  'opinion_vs_fact',
  'partial_match',
  'keyword_echo',
  'extra_claim',
]);
export type ReadingTrap = z.infer<typeof ReadingTrapSchema>;

export const ReadingQTypeSchema = z.enum([
  'tfng',
  'ynng',
  'headings',
  'mcq_single',
  'mcq_multi',
  'matching_info',
  'matching_features',
  'sentence_endings',
  'sentence_completion',
  'summary_completion',
  'summary_wordlist',
  'table_completion',
  'flowchart_completion',
  'diagram_labelling',
  'short_answer',
]);
export type ReadingQType = z.infer<typeof ReadingQTypeSchema>;

export const SpanSchema = z.object({
  paragraph: z.string().min(1),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  quote: z.string(),
});
export type Span = z.infer<typeof SpanSchema>;

export const HeadingDistractorTypeSchema = z.enum([
  'detail_only',
  'too_broad',
  'keyword_match',
  'adjacent_paragraph',
  'opposite_stance',
]);

export const ReadingQuestionSchema = z.object({
  qid: z.string().min(1),
  number: z.number().int().min(1),
  prompt: z.string().min(1),
  answer: z.object({
    accepted: z.array(z.string().min(1)).optional(),
    key: z.string().min(1).optional(),
    keys: z.array(z.string().min(1)).optional(),
  }),
  evidence: z.array(SpanSchema),
  trapType: ReadingTrapSchema.optional(),
  headingDistractors: z
    .array(
      z.object({
        key: z.string().min(1),
        type: HeadingDistractorTypeSchema,
        whyVi: z.string().min(1),
      }),
    )
    .optional(),
  mainIdeaSpan: SpanSchema.optional(),
  explanationVi: z.string().min(1),
  steps: z.array(z.string().min(1)).optional(),
});
export type ReadingQuestion = z.infer<typeof ReadingQuestionSchema>;

export const ReadingQuestionGroupSchema = z.object({
  groupId: z.string().min(1),
  type: ReadingQTypeSchema,
  instructions: z.string().min(1),
  wordLimit: WordLimitSchema.optional(),
  options: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) })).optional(),
  headings: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) })).optional(),
  summaryText: z.string().optional(),
  questions: z.array(ReadingQuestionSchema).min(1),
});
export type ReadingQuestionGroup = z.infer<typeof ReadingQuestionGroupSchema>;

export const ReadingPassageSchema = z.object({
  id: prefixedId('rp:'),
  level: z.enum(['P1', 'P2', 'P3']),
  mini: z.boolean().optional(),
  reserved: z.boolean().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  topic: TopicSchema,
  paragraphs: z
    .array(
      z.object({
        label: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .min(1),
  wordCount: z.number().int().positive(),
  glossary: z
    .array(
      z.object({
        term: z.string().min(1),
        meaningVi: z.string().min(1),
      }),
    )
    .optional(),
  questionGroups: z.array(ReadingQuestionGroupSchema).min(1),
  provenance: ProvenanceSchema,
});
export const PassageSchema = ReadingPassageSchema;
export type ReadingPassage = z.infer<typeof ReadingPassageSchema>;
export type Passage = ReadingPassage;

// ---------------------------------------------------------------------------
// Writing (docs/04-DATA-SPEC.md §6)
// ---------------------------------------------------------------------------

export const EssayTypeSchema = z.enum([
  'opinion',
  'discussion',
  'adv_disadv',
  'problem_solution',
  'two_part',
  'positive_negative',
]);
export type EssayType = z.infer<typeof EssayTypeSchema>;

export const WritingTask2PromptSchema = z.object({
  id: prefixedId('w2:'),
  essayType: EssayTypeSchema,
  topic: TopicSchema,
  difficulty: z.number().int().min(1).max(10),
  prompt: z.string().min(1),
  partsToAddress: z.array(z.string().min(1)).min(1),
  ideaBank: z
    .array(
      z.object({
        side: z.enum(['for', 'against', 'cause', 'solution', 'neutral']),
        idea: z.string().min(1),
        develop: z.string().min(1),
      }),
    )
    .min(1),
  band8Model: z.object({
    text: z.string().min(1),
    wordCount: z.number().int().positive(),
    notes: z.array(
      z.object({
        start: z.number().int().min(0),
        end: z.number().int().min(0),
        noteVi: z.string().min(1),
        criterion: z.enum(['TR', 'CC', 'LR', 'GRA']),
      }),
    ),
  }),
  usefulCollocationIds: z.array(prefixedId('col:')),
  provenance: ProvenanceSchema,
});
export const Task2PromptSchema = WritingTask2PromptSchema;
export type WritingTask2Prompt = z.infer<typeof WritingTask2PromptSchema>;
export type Task2Prompt = WritingTask2Prompt;

export const ChartKindSchema = z.enum([
  'bar',
  'line',
  'pie',
  'table',
  'mixed',
  'process',
  'map',
]);
export type ChartKind = z.infer<typeof ChartKindSchema>;

export const ChartVisualSchema = z.object({
  title: z.string().min(1),
  unit: z.string(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  categories: z.array(z.string().min(1)).min(1),
  series: z
    .array(
      z.object({
        name: z.string().min(1),
        values: z.array(z.number()),
      }),
    )
    .min(1),
  pie: z.boolean().optional(),
});

export const TableVisualSchema = z.object({
  title: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  rows: z.array(z.array(z.union([z.string(), z.number()]))).min(1),
});

export const ProcessVisualSchema = z.object({
  title: z.string().min(1),
  steps: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        icon: z.string().optional(),
      }),
    )
    .min(1),
  edges: z.array(z.tuple([z.string().min(1), z.string().min(1)])),
  cyclic: z.boolean(),
});

export const MapsVisualSchema = z.object({
  before: MapSpecSchema.extend({ year: z.string().min(1) }),
  after: MapSpecSchema.extend({ year: z.string().min(1) }),
});

export const VisualSpecSchema = z.object({
  chart: ChartVisualSchema.optional(),
  table: TableVisualSchema.optional(),
  process: ProcessVisualSchema.optional(),
  maps: MapsVisualSchema.optional(),
});
export type VisualSpec = z.infer<typeof VisualSpecSchema>;

export const WritingTask1PromptSchema = VisualSpecSchema.extend({
  id: prefixedId('w1:'),
  kind: ChartKindSchema,
  topic: TopicSchema,
  difficulty: z.number().int().min(1).max(10),
  prompt: z.string().min(1),
  keyFeatures: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum([
          'overall_trend',
          'highest',
          'lowest',
          'comparison',
          'change',
          'stage',
          'grouping',
        ]),
        textEn: z.string().min(1),
        mustMention: z.boolean(),
      }),
    )
    .min(1),
  overviewModels: z.array(z.string().min(1)).min(1),
  overviewKeyPhrases: z.array(z.string().min(1)).optional(),
  band8Model: z.object({
    text: z.string().min(1),
    wordCount: z.number().int().positive(),
  }),
  provenance: ProvenanceSchema,
});
export const Task1VisualSchema = WritingTask1PromptSchema;
export type WritingTask1Prompt = z.infer<typeof WritingTask1PromptSchema>;
export type Task1Visual = WritingTask1Prompt;

// ---------------------------------------------------------------------------
// Speaking (docs/04-DATA-SPEC.md §7)
// ---------------------------------------------------------------------------

const RotationSchema = z.string().regex(/^\d{4}-(Q1|Q2|Q3)$/, 'Rotation must match YYYY-Q1|Q2|Q3');

export const SpeakingPart1TopicSchema = z.object({
  id: prefixedId('s1t:'),
  topic: z.string().min(1),
  rotation: RotationSchema,
  evergreen: z.boolean(),
  questions: z
    .array(
      z.object({
        qid: z.string().min(1),
        text: z.string().min(1),
        audio: z.string().min(1),
        ideaHintsEn: z.array(z.string().min(1)),
        areSample: z
          .object({
            answer: z.string().min(1),
            reason: z.string().min(1),
            example: z.string().min(1),
          })
          .optional(),
      }),
    )
    .min(1),
  provenance: ProvenanceSchema.optional(),
});
export type SpeakingPart1Topic = z.infer<typeof SpeakingPart1TopicSchema>;

export const SpeakingCueCardSchema = z.object({
  id: prefixedId('s2c:'),
  rotation: RotationSchema,
  evergreen: z.boolean(),
  category: z.enum(['person', 'place', 'object', 'event', 'experience', 'media', 'activity']),
  prompt: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1),
  finalBullet: z.string().min(1),
  audio: z.string().min(1),
  linkedPart3Id: prefixedId('s3s:'),
  sampleNotes: z.array(z.string().min(1)),
  band8Sample: z.object({
    text: z.string().min(1),
    estSeconds: z.number().positive(),
  }),
  roundingOffQs: z.array(z.string().min(1)),
  provenance: ProvenanceSchema.optional(),
});
export const Part2CueCardSchema = SpeakingCueCardSchema;
export type SpeakingCueCard = z.infer<typeof SpeakingCueCardSchema>;

export const SpeakingPart3QuestionSchema = z.object({
  qid: z.string().min(1),
  text: z.string().min(1),
  type: z.enum([
    'compare',
    'predict',
    'evaluate',
    'cause',
    'solution',
    'opinion',
    'hypothetical',
  ]),
  audio: z.string().min(1),
  followUps: z.array(
    z.object({
      text: z.string().min(1),
      audio: z.string().min(1),
    }),
  ),
});
export type SpeakingPart3Question = z.infer<typeof SpeakingPart3QuestionSchema>;

export const SpeakingPart3SetSchema = z.object({
  id: prefixedId('s3s:'),
  linkedCueCardId: prefixedId('s2c:'),
  questions: z.array(SpeakingPart3QuestionSchema).min(1),
  provenance: ProvenanceSchema.optional(),
});
export type SpeakingPart3Set = z.infer<typeof SpeakingPart3SetSchema>;

export const SpeakingPhraseSchema = z.object({
  id: prefixedId('sph:'),
  function: z.enum([
    'buy_time',
    'opinion',
    'contrast',
    'example',
    'speculate',
    'conclude',
    'clarify',
    'generalise',
  ]),
  phrase: z.string().min(1),
  ipa: z.string().optional(),
  band6Equivalent: z.string().min(1),
  usageVi: z.string().min(1),
  example: z.string().min(1),
  audio: z.string().min(1),
  provenance: ProvenanceSchema.optional(),
});
export type SpeakingPhrase = z.infer<typeof SpeakingPhraseSchema>;

// ---------------------------------------------------------------------------
// Exam & Manifest (docs/04-DATA-SPEC.md §8 & §9)
// ---------------------------------------------------------------------------

export const ExamTestSchema = z.object({
  id: prefixedId('xt:'),
  title: z.string().min(1),
  listening: z.tuple([
    prefixedId('lep:'),
    prefixedId('lep:'),
    prefixedId('lep:'),
    prefixedId('lep:'),
  ]),
  reading: z.tuple([prefixedId('rp:'), prefixedId('rp:'), prefixedId('rp:')]),
  reserved: z.literal(true),
});
export type ExamTest = z.infer<typeof ExamTestSchema>;

export const ManifestFileEntrySchema = z.object({
  sha256: z.string().min(1),
  count: z.number().int().min(0),
});
export type ManifestFileEntry = z.infer<typeof ManifestFileEntrySchema>;

export const ManifestSchema = z.object({
  version: z.string().min(1),
  builtAt: z.string().optional(),
  totals: z.record(z.string(), z.number().int().min(0)).optional(),
  files: z.record(z.string(), ManifestFileEntrySchema),
});
export type Manifest = z.infer<typeof ManifestSchema>;
