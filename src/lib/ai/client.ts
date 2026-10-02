import { LLMProvider } from './provider';
import { OpenAIProvider } from './openai-provider';
import { MockLLMProvider } from './mock-provider';

/**
 * Returns the configured LLM provider.
 * Falls back to MockLLMProvider if OPENAI_API_KEY is not set or during tests.
 */
export function getLLMProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (process.env.NODE_ENV === 'test' || !apiKey || apiKey.trim() === '') {
    return new MockLLMProvider();
  }

  return new OpenAIProvider(apiKey.trim(), model);
}
