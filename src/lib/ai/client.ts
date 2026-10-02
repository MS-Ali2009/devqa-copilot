import { LLMProvider } from './provider';
import { GroqProvider } from './groq-provider';
import { OpenAIProvider } from './openai-provider';
import { MockLLMProvider } from './mock-provider';

/**
 * Returns the configured LLM provider.
 *
 * Priority order:
 * 1. NODE_ENV === 'test' → always MockLLMProvider
 * 2. FORCE_MOCK_PROVIDER === 'true' → MockLLMProvider (use for Preview and CI)
 * 3. AI_PROVIDER === 'openai':
 *    - Uses OpenAIProvider if OPENAI_API_KEY is present
 *    - Falls back to MockLLMProvider if OPENAI_API_KEY is missing
 * 4. Default / AI_PROVIDER === 'groq':
 *    - Uses GroqProvider if GROQ_API_KEY is present
 *    - Falls back to MockLLMProvider if GROQ_API_KEY is missing
 * 5. Fallback → MockLLMProvider
 *
 * SECURITY: Never use NEXT_PUBLIC_ prefix for any of these env vars.
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

  const providerType = (process.env.AI_PROVIDER || 'groq').toLowerCase().trim();

  // OpenAI Provider option
  if (providerType === 'openai') {
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

    if (openaiKey) {
      return new OpenAIProvider(openaiKey, model);
    }
    return new MockLLMProvider();
  }

  // Default: 100% Free Groq Provider
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const groqModel = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';

  if (groqKey) {
    return new GroqProvider(groqKey, groqModel);
  }

  // Safe fallback if no key is present
  return new MockLLMProvider();
}
