import { OutputMode } from '@/types/copilot';

export interface LLMProviderResult {
  markdownOutput: string;
  modelUsed: string;
  tokensUsed?: number;
  processingTimeMs: number;
  isMock?: boolean;
}

export interface LLMProvider {
  name: string;
  generate(
    systemPrompt: string,
    userPrompt: string,
    outputMode: OutputMode,
    signal?: AbortSignal
  ): Promise<LLMProviderResult>;
}
