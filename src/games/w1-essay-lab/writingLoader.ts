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

export const ClicheEntrySchema = z.object({
  id: z.string().min(1),
  phrase: z.string().min(1),
  variants: z.array(z.string().min(1)).default([]),
  category: z.string().min(1),
  severity: z.enum(['high', 'medium', 'low']),
  betterAlternatives: z.array(z.string().min(1)).min(1),
  whyAvoidVi: z.string().min(1),
  provenance: ProvenanceSchema.optional(),
});
export type ClicheEntry = z.infer<typeof ClicheEntrySchema>;

export const Task1IndexEntrySchema = z.object({
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
export type Task1IndexEntry = z.infer<typeof Task1IndexEntrySchema>;

export async function loadTask2Prompts(): Promise<WritingTask2Prompt[]> {
  return loadContentArray('data/writing/task2_prompts.json', WritingTask2PromptSchema);
}

export async function loadTask1Index(): Promise<Task1IndexEntry[]> {
  return loadContentArray('data/writing/task1/index.json', Task1IndexEntrySchema);
}

export async function loadTask1Prompt(filePath: string): Promise<WritingTask1Prompt> {
  return loadContent(filePath, WritingTask1PromptSchema);
}

export async function loadCliches(): Promise<ClicheEntry[]> {
  return loadContentArray('data/writing/cliches.json', ClicheEntrySchema);
}
