import { describe, it, expect, vi } from 'vitest';
import { GroqProvider } from '@/lib/ai/groq-provider';

describe('GroqProvider Unit Tests', () => {
  it('instantiates GroqProvider with custom model', () => {
    const provider = new GroqProvider('gsk_test_key_123', 'llama-3.3-70b-versatile');
    expect(provider.name).toBe('GroqProvider');
  });

  it('handles generate() success cleanly', async () => {
    const provider = new GroqProvider('gsk_test_key_123', 'llama-3.3-70b-versatile');

    // Mock client.chat.completions.create
    (provider as unknown as { client: unknown }).client = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: '# Generated QA Test Plan\n\n| ID | Scenario |',
                },
              },
            ],
            usage: {
              total_tokens: 150,
            },
          }),
        },
      },
    };

    const result = await provider.generate('system prompt', 'user prompt', 'qa_test_cases');
    expect(result.isMock).toBe(false);
    expect(result.modelUsed).toBe('llama-3.3-70b-versatile');
    expect(result.tokensUsed).toBe(150);
    expect(result.markdownOutput).toContain('# Generated QA Test Plan');
  });

  it('maps rate limit errors to friendly user message', async () => {
    const provider = new GroqProvider('gsk_test_key_123', 'llama-3.3-70b-versatile');

    (provider as unknown as { client: unknown }).client = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('rate_limit_exceeded: 429 too many requests')),
        },
      },
    };

    await expect(
      provider.generate('system', 'user', 'bug_report')
    ).rejects.toThrow('Groq free tier rate limit exceeded');
  });

  it('maps invalid API key errors to configuration message', async () => {
    const provider = new GroqProvider('gsk_invalid_key', 'llama-3.3-70b-versatile');

    (provider as unknown as { client: unknown }).client = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('401 invalid_api_key')),
        },
      },
    };

    await expect(
      provider.generate('system', 'user', 'bug_report')
    ).rejects.toThrow('Invalid Groq API key configured on server.');
  });

  it('propagates AbortSignal cancellation', async () => {
    const provider = new GroqProvider('gsk_test_key', 'llama-3.3-70b-versatile');

    const abortError = new Error('Request was aborted');
    abortError.name = 'AbortError';

    (provider as unknown as { client: unknown }).client = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(abortError),
        },
      },
    };

    const controller = new AbortController();
    controller.abort();

    await expect(
      provider.generate('system', 'user', 'bug_report', controller.signal)
    ).rejects.toThrow('Request was aborted');
  });
});
