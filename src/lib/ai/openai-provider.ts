import OpenAI from 'openai';
import { LLMProvider, LLMProviderResult } from './provider';
import { OutputMode } from '@/types/copilot';

export class OpenAIProvider implements LLMProvider {
  name = 'OpenAIProvider';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.client = new OpenAI({
      apiKey,
      timeout: 25000, // 25 seconds timeout
    });
    this.model = model;
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    _outputMode: OutputMode
  ): Promise<LLMProviderResult> {
    const startTime = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2, // Low temperature for high consistency and factual discipline
      });

      const choice = response.choices[0];
      const markdownOutput = choice?.message?.content || 'No output generated from model.';
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        markdownOutput,
        modelUsed: this.model,
        tokensUsed,
        processingTimeMs: Date.now() - startTime,
        isMock: false,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Safe mapping of common OpenAI error messages
        if (err.message.includes('insufficient_quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your OpenAI billing plan.');
        }
        if (err.message.includes('rate_limit_exceeded')) {
          throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
        }
        if (err.message.includes('invalid_api_key')) {
          throw new Error('Invalid OpenAI API key configured on server.');
        }
        throw new Error(`OpenAI Provider error: ${err.message}`);
      }
      throw new Error('An unexpected error occurred while communicating with OpenAI.');
    }
  }
}
