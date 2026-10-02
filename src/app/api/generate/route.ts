import { NextRequest, NextResponse } from 'next/server';
import { devQAGenerateRequestSchema } from '@/lib/schemas/request.schema';
import { buildDevQAPrompt } from '@/lib/prompts/prompt-builder';
import { DEVQA_SYSTEM_PROMPT } from '@/lib/prompts/system-prompt';
import { getLLMProvider } from '@/lib/ai/client';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { scanForSecrets } from '@/lib/security/secret-scanner';
import { logger } from '@/lib/security/logger';
import { generateRequestId, generateUUID } from '@/lib/utils/id-generator';
import { DevQAGenerateResponse, DevQAErrorResponse } from '@/types/copilot';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // 1. Client IP Identification for Rate Limiting
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // 2. Rate Limit Verification
  const maxLimit = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '20', 10);
  const rateLimitStatus = checkRateLimit(clientIp, maxLimit);

  if (!rateLimitStatus.allowed) {
    logger.warn({
      requestId,
      action: 'RATE_LIMIT_BLOCKED',
      message: `Client IP ${clientIp} exceeded rate limit.`,
    });

    const errorBody: DevQAErrorResponse = {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Please wait ${rateLimitStatus.resetSeconds} seconds before generating again.`,
        requestId,
      },
    };

    return NextResponse.json(errorBody, {
      status: 429,
      headers: {
        'Retry-After': String(rateLimitStatus.resetSeconds),
        'X-Request-Id': requestId,
      },
    });
  }

  // 3. Payload Parsing & Schema Validation
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    const errorBody: DevQAErrorResponse = {
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid JSON payload received in request.',
        requestId,
      },
    };
    return NextResponse.json(errorBody, { status: 400, headers: { 'X-Request-Id': requestId } });
  }

  const validationResult = devQAGenerateRequestSchema.safeParse(bodyJson);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0]?.message || 'Input validation failed.';
    logger.warn({
      requestId,
      action: 'VALIDATION_FAILED',
      message: firstError,
    });

    const errorBody: DevQAErrorResponse = {
      error: {
        code: 'INVALID_INPUT',
        message: firstError,
        requestId,
        details: { issues: validationResult.error.format() },
      },
    };
    return NextResponse.json(errorBody, { status: 400, headers: { 'X-Request-Id': requestId } });
  }

  const validatedData = validationResult.data;

  // 4. Secret Scanner Check
  const secretScan = scanForSecrets(validatedData.rawInput);
  const warnings: string[] = [];

  if (secretScan.hasSecrets) {
    const typesFound = secretScan.detectedTypes.join(', ');
    warnings.push(`Warning: Potential sensitive credentials detected (${typesFound}). Ensure secrets are removed before sharing.`);
    logger.warn({
      requestId,
      action: 'SECRET_DETECTED_IN_INPUT',
      message: `Detected sensitive pattern types: ${typesFound}`,
    });
  }

  // 5. Prompt Compilation
  const { userPrompt } = buildDevQAPrompt(validatedData);

  logger.info({
    requestId,
    action: 'GENERATION_STARTED',
    message: `Mode: ${validatedData.outputMode}, InputType: ${validatedData.inputType}`,
  });

  // 6. LLM Execution
  try {
    const provider = getLLMProvider();
    const result = await provider.generate(
      DEVQA_SYSTEM_PROMPT,
      userPrompt,
      validatedData.outputMode
    );

    if (result.isMock) {
      warnings.push('Running with Mock Provider (OPENAI_API_KEY not configured or test environment active).');
    }

    const responsePayload: DevQAGenerateResponse = {
      id: generateUUID(),
      requestId,
      timestamp: new Date().toISOString(),
      outputMode: validatedData.outputMode,
      markdownOutput: result.markdownOutput,
      meta: {
        modelUsed: result.modelUsed,
        tokensUsed: result.tokensUsed,
        processingTimeMs: Date.now() - startTime,
        isMock: result.isMock,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    };

    logger.info({
      requestId,
      action: 'GENERATION_COMPLETED',
      message: `Completed in ${Date.now() - startTime}ms using ${result.modelUsed}`,
    });

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    logger.error({
      requestId,
      action: 'GENERATION_ERROR',
      message: errorMessage,
      error: err,
    });

    const errorBody: DevQAErrorResponse = {
      error: {
        code: 'PROVIDER_ERROR',
        message: errorMessage,
        requestId,
      },
    };

    return NextResponse.json(errorBody, {
      status: 500,
      headers: { 'X-Request-Id': requestId },
    });
  }
}
