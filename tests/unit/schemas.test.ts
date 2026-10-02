import { describe, it, expect } from 'vitest';
import { devQAGenerateRequestSchema } from '@/lib/schemas/request.schema';

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

  it('rejects input shorter than 5 characters', () => {
    const invalid = {
      rawInput: 'Hey',
      inputType: 'user_story',
      outputMode: 'full_analysis',
    };

    const result = devQAGenerateRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
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
});
