import { z } from 'zod';
import {
  ChartKindSchema,
  ProvenanceSchema,
  TopicSchema,
  WritingTask1PromptSchema,
  WritingTask2PromptSchema,
  type WritingTask1Prompt,
  type WritingTask2Prompt,
} from '../../core/content/schemas';
import { loadContent, loadContentArray } from '../../core/content/loaders';
import type { SprintClicheEntry } from './engine';

const SprintClicheSchema = z.object({
  id: z.string().min(1),
  phrase: z.string().min(1),
  variants: z.array(z.string().min(1)).default([]),
  category: z.string().min(1),
  severity: z.enum(['high', 'medium', 'low']),
  betterAlternatives: z.array(z.string().min(1)).min(1),
  whyAvoidVi: z.string().min(1),
  provenance: ProvenanceSchema.optional(),
});

const SprintTask1IndexSchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  kind: ChartKindSchema,
  topic: TopicSchema,
  difficulty: z.number().int().min(1).max(10),
  title: z.string().min(1),
  promptPreview: z.string().min(1),
  keyFeatureCount: z.number().int().min(1),
  wordCount: z.number().int().positive(),
});

export type SprintTask1IndexEntry = z.infer<typeof SprintTask1IndexSchema>;

export async function loadSprintTask1Index(): Promise<SprintTask1IndexEntry[]> {
  return loadContentArray('data/writing/task1/index.json', SprintTask1IndexSchema);
}

export async function loadSprintTask1Prompt(filePath: string): Promise<WritingTask1Prompt> {
  return loadContent(filePath, WritingTask1PromptSchema);
}

export async function loadSprintTask2Prompts(): Promise<WritingTask2Prompt[]> {
  return loadContentArray('data/writing/task2_prompts.json', WritingTask2PromptSchema);
}

export async function loadSprintCliches(): Promise<SprintClicheEntry[]> {
  return loadContentArray('data/writing/cliches.json', SprintClicheSchema);
}
