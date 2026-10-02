import { describe, it, expect } from 'vitest';
import { devQAGenerateRequestSchema } from '@/lib/schemas/request.schema';
import { historyItemV1Schema, localHistoryStorageV1Schema } from '@/lib/schemas/storage.schema';

describe('Zod Request Validation Schemas', () => {
  it('passes validation for valid request payload', () => {
    const valid = {
      rawInput: 'Valid input describing user login flow for QA tests',
      inputType: 'user_story',
      outputMode: 'full_analysis',
      outputLanguage: 'en',
    };

    const result = devQAGenerateRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('passes with all optional fields provided', () => {
    const fullPayload = {
      rawInput: 'Valid input describing user login flow for QA tests',
      inputType: 'user_story',
      outputMode: 'acceptance_criteria',
      projectContext: 'E-commerce platform',
      platform: 'web',
      techStack: 'Next.js, PostgreSQL',
      targetEnvironment: 'staging',
      outputLanguage: 'roman_urdu',
    };

    const result = devQAGenerateRequestSchema.safeParse(fullPayload);
    expect(result.success).toBe(true);
  });

  it('rejects input shorter than 5 characters', () => {
    const invalid = {
      rawInput: 'Hey',
      inputType: 'user_story',
      outputMode: 'full_analysis',
    };

    const result = devQAGenerateRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts exact boundary of 15,000 characters and rejects 15,001', () => {
    const exactMax = 'a'.repeat(15000);
    const resultMax = devQAGenerateRequestSchema.safeParse({
      rawInput: exactMax,
      inputType: 'user_story',
      outputMode: 'full_analysis',
    });
    expect(resultMax.success).toBe(true);

    const overMax = 'a'.repeat(15001);
    const resultOver = devQAGenerateRequestSchema.safeParse({
      rawInput: overMax,
      inputType: 'user_story',
      outputMode: 'full_analysis',
    });
    expect(resultOver.success).toBe(false);
  });

  it('rejects unsupported input types', () => {
    const invalid = {
      rawInput: 'Valid input description',
      inputType: 'unsupported_random_type',
      outputMode: 'full_analysis',
    };

    const result = devQAGenerateRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects unsupported output modes', () => {
    const invalid = {
      rawInput: 'Valid input description',
      inputType: 'user_story',
      outputMode: 'non_existent_mode',
    };

    const result = devQAGenerateRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects projectContext exceeding 2000 characters', () => {
    const invalid = {
      rawInput: 'Valid input description',
      inputType: 'user_story',
      outputMode: 'full_analysis',
      projectContext: 'x'.repeat(2001),
    };

    const result = devQAGenerateRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates historyItemV1Schema and localHistoryStorageV1Schema', () => {
    const item = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      version: 1 as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      title: 'Valid Story',
      rawInput: 'Raw input content',
      inputType: 'user_story' as const,
      outputMode: 'full_analysis' as const,
      outputLanguage: 'en' as const,
      markdownOutput: '# Output',
    };

    const itemResult = historyItemV1Schema.safeParse(item);
    expect(itemResult.success).toBe(true);

    const storagePayload = {
      version: 1 as const,
      items: [item],
      lastUpdated: '2026-01-01T00:00:00.000Z',
    };

    const storageResult = localHistoryStorageV1Schema.safeParse(storagePayload);
    expect(storageResult.success).toBe(true);
  });
});
