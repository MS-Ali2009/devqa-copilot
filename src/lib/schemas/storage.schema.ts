import { z } from 'zod';
import { inputTypeSchema, outputModeSchema, platformSchema, environmentSchema, outputLanguageSchema } from './request.schema';

export const historyItemV1Schema = z.object({
  id: z.string().uuid(),
  version: z.literal(1),
  createdAt: z.string().datetime(),
  title: z.string().min(1).max(200),
  rawInput: z.string(),
  inputType: inputTypeSchema,
  outputMode: outputModeSchema,
  projectContext: z.string().optional(),
  platform: platformSchema,
  techStack: z.string().optional(),
  targetEnvironment: environmentSchema,
  outputLanguage: outputLanguageSchema,
  markdownOutput: z.string(),
});

export const localHistoryStorageV1Schema = z.object({
  version: z.literal(1),
  items: z.array(historyItemV1Schema),
  lastUpdated: z.string().datetime(),
});
