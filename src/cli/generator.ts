import fs from 'fs';
import path from 'path';
import { getLLMProvider } from '../lib/ai/client';
import { MockLLMProvider } from '../lib/ai/mock-provider';
import { buildDevQAPrompt } from '../lib/prompts/prompt-builder';
import { DEVQA_SYSTEM_PROMPT } from '../lib/prompts/system-prompt';
import { scanForSecrets } from '../lib/security/secret-scanner';
import { OutputMode, InputType } from '@/types/copilot';
import { c, printError, printInfo, printSuccess, printWarning } from './colors';

export interface GenerateCliOptions {
  prompt: string;
  outputMode?: OutputMode;
  inputType?: InputType;
  platform?: string;
  techStack?: string;
  targetEnvironment?: string;
  projectContext?: string;
  language?: 'english' | 'roman_urdu';
  outputFile?: string;
  forceMock?: boolean;
}

export async function runGenerate(options: GenerateCliOptions): Promise<void> {
  const {
    prompt,
    outputMode = 'full_analysis',
    inputType = 'user_story',
    platform = 'web',
    techStack = '',
    targetEnvironment = 'staging',
    projectContext = '',
    language = 'english',
    outputFile,
    forceMock = false,
  } = options;

  if (!prompt || prompt.trim().length === 0) {
    printError('No prompt or input content provided.');
    process.exit(1);
  }

  // 1. Pre-flight Secret Scanner
  const scan = scanForSecrets(prompt);
  if (scan.hasSecrets) {
    printWarning(`Security Scanner detected sensitive credentials: [${scan.detectedTypes.join(', ')}]`);
    console.log(c.yellow('Please do NOT submit production secrets to AI models.\n'));
  }

  // 2. Select Provider
  const provider = forceMock ? new MockLLMProvider() : getLLMProvider();
  printInfo(`Using AI Provider: ${c.bold(provider.name)}`);
  printInfo(`Output Mode: ${c.bold(outputMode)} | Input Type: ${c.bold(inputType)}`);

  // 3. Build Structured Prompts
  const { userPrompt } = buildDevQAPrompt({
    rawInput: prompt,
    inputType,
    outputMode,
    platform: platform as any,
    targetEnvironment: targetEnvironment as any,
    techStack,
    projectContext,
    outputLanguage: language === 'roman_urdu' ? 'roman_urdu' : 'en',
  });

  process.stdout.write(`\n${c.cyan('⏳')} Generating engineering artifact... `);
  const startTime = Date.now();

  try {
    const result = await provider.generate(DEVQA_SYSTEM_PROMPT, userPrompt, outputMode);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    process.stdout.write(`${c.green('Done!')} (${duration}s)\n\n`);

    // 4. Save to file or output to stdout
    if (outputFile) {
      const resolvedPath = path.resolve(process.cwd(), outputFile);
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
      fs.writeFileSync(resolvedPath, result.markdownOutput, 'utf-8');
      printSuccess(`Artifact saved successfully to: ${c.bold(resolvedPath)}`);
    } else {
      console.log(c.dim('─'.repeat(70)));
      console.log(result.markdownOutput);
      console.log(c.dim('─'.repeat(70)));
    }

    console.log(`\n${c.dim(`Model: ${result.modelUsed} | Tokens: ${result.tokensUsed || 'N/A'} | Time: ${result.processingTimeMs}ms`)}`);
  } catch (error: any) {
    process.stdout.write(`${c.red('Failed!')}\n`);
    printError(error?.message || 'Failed to generate artifact.');
    process.exit(1);
  }
}
