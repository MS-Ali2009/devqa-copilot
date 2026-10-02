import Groq from 'groq-sdk';
import { LLMProvider, LLMProviderResult } from './provider';
import { OutputMode } from '@/types/copilot';

export class GroqProvider implements LLMProvider {
  name = 'GroqProvider';
  private client: Groq;
  private model: string;

  constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
    this.client = new Groq({
      apiKey,
      timeout: 28000,
    });
    this.model = model;
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    _outputMode: OutputMode,
    signal?: AbortSignal
  ): Promise<LLMProviderResult> {
    const startTime = Date.now();

    try {
      const response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2, // Low temperature for high consistency and factual discipline
          max_tokens: 4096,
        },
        { signal }
      );

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
        if (err.name === 'AbortError' || err.message.toLowerCase().includes('abort')) {
          throw err;
        }
        if (err.message.includes('rate_limit') || err.message.includes('429')) {
          throw new Error('Groq free tier rate limit exceeded. Please wait a moment before trying again.');
        }
        if (err.message.includes('invalid_api_key') || err.message.includes('401')) {
          throw new Error('Invalid Groq API key configured on server.');
        }
        throw new Error(`Groq Provider error: ${err.message}`);
      }
      throw new Error('An unexpected error occurred while communicating with Groq.');
    }
  }
}
