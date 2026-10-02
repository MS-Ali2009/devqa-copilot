import { LLMProvider } from './provider';
import { OpenAIProvider } from './openai-provider';
import { MockLLMProvider } from './mock-provider';

/**
 * Returns the configured LLM provider.
 *
 * Priority order:
 * 1. NODE_ENV === 'test' → always MockLLMProvider
 * 2. FORCE_MOCK_PROVIDER === 'true' → MockLLMProvider (use for Preview and CI)
 * 3. OPENAI_API_KEY is set and non-empty → OpenAIProvider
 * 4. Fallback → MockLLMProvider
 *
 * SECURITY: Never use NEXT_PUBLIC_ prefix for any of these env vars.
 * Set FORCE_MOCK_PROVIDER=true in Vercel Preview and GitHub Actions CI.
 */
export function getLLMProvider(): LLMProvider {
  // Always use mock in test environment
  if (process.env.NODE_ENV === 'test') {
    return new MockLLMProvider();
  }

  // Explicit mock override — use for Preview env and CI
  if (process.env.FORCE_MOCK_PROVIDER === 'true') {
    return new MockLLMProvider();
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey || apiKey.trim() === '') {
    return new MockLLMProvider();
  }

  return new OpenAIProvider(apiKey.trim(), model);
}
