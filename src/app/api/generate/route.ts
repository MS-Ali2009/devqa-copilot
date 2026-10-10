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
import { saveHistoryItem } from '@/lib/db/history-repo';

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
      message: `Rate limit exceeded for client.`,
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

  // 3. Content-Type Validation (415)
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const errorBody: DevQAErrorResponse = {
      error: {
        code: 'INVALID_INPUT',
        message: 'Content-Type must be application/json.',
        requestId,
      },
    };
    return NextResponse.json(errorBody, { status: 415, headers: { 'X-Request-Id': requestId } });
  }

  // 4. Body Size Guard — reject oversized payloads before parsing (413)
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  const MAX_BODY_BYTES = 64 * 1024; // 64KB hard limit
  if (contentLength > MAX_BODY_BYTES) {
    const errorBody: DevQAErrorResponse = {
      error: {
        code: 'INVALID_INPUT',
        message: 'Request body is too large. Maximum allowed size is 64KB.',
        requestId,
      },
    };
    return NextResponse.json(errorBody, { status: 413, headers: { 'X-Request-Id': requestId } });
  }

  // 5. Payload Parsing & Schema Validation
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

  // 6. Secret Scanner Check — heuristic only, not a guarantee
  const secretScan = scanForSecrets(validatedData.rawInput);
  const warnings: string[] = [];

  if (secretScan.hasSecrets) {
    const typesFound = secretScan.detectedTypes.join(', ');
    warnings.push(
      `Potential sensitive credentials detected in input (${typesFound}). Remove secrets before sharing outputs.`
    );
    logger.warn({
      requestId,
      action: 'SECRET_DETECTED_IN_INPUT',
      message: `Detected sensitive pattern types: ${typesFound}`,
    });
  }

  // 7. Prompt Compilation
  const { userPrompt } = buildDevQAPrompt(validatedData);

  logger.info({
    requestId,
    action: 'GENERATION_STARTED',
    message: `Mode: ${validatedData.outputMode}, InputType: ${validatedData.inputType}`,
  });

  // 8. LLM Execution with server-side AbortController timeout
  const PROVIDER_TIMEOUT_MS = parseInt(process.env.PROVIDER_TIMEOUT_MS || '30000', 10);
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const provider = getLLMProvider();
    const result = await provider.generate(
      DEVQA_SYSTEM_PROMPT,
      userPrompt,
      validatedData.outputMode,
      abortController.signal
    );

    clearTimeout(timeoutHandle);

    if (result.isMock) {
      warnings.push('Running with Mock Provider (no real API key configured).');
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

    // 9. Save to Supabase devqa_history if authenticated and no secret detected
    const userId = req.headers.get('x-user-id');
    if (userId && !secretScan.hasSecrets) {
      try {
        await saveHistoryItem({
          userId,
          input: validatedData.rawInput,
          output: result.markdownOutput,
          inputType: validatedData.inputType,
          outputMode: validatedData.outputMode,
          platform: validatedData.platform,
          environment: validatedData.targetEnvironment,
          language: validatedData.outputLanguage,
        });
        logger.info({
          requestId,
          action: 'HISTORY_SAVED_TO_DB',
          message: `Saved to Supabase devqa_history for user: ${userId}`,
        });
      } catch (dbErr) {
        // Non-blocking error: do not break UX if DB is unavailable
        logger.error({
          requestId,
          action: 'DB_SAVE_FAILED',
          message: `Failed to persist to Supabase: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`,
        });
      }
    }

    logger.info({
      requestId,
      action: 'GENERATION_COMPLETED',
      message: `Completed in ${Date.now() - startTime}ms`,
    });

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutHandle);

    // Safe error category mapping — never expose raw internal error messages to clients
    let safeMessage = 'An unexpected error occurred. Please try again in a moment.';
    let statusCode = 500;

    if (err instanceof Error) {
      if (err.name === 'AbortError' || err.message.toLowerCase().includes('abort')) {
        safeMessage = 'Request timed out. The AI provider took too long to respond. Please try again.';
        statusCode = 504;
        logger.warn({ requestId, action: 'GENERATION_TIMEOUT', message: 'Provider request timed out.' });
      } else if (err.message.includes('quota') || err.message.includes('billing')) {
        safeMessage = 'AI provider quota exceeded. Please check the server configuration.';
        statusCode = 503;
        logger.error({ requestId, action: 'PROVIDER_QUOTA_EXCEEDED', message: 'OpenAI quota exceeded.' });
      } else if (err.message.includes('rate_limit')) {
        safeMessage = 'AI provider rate limit reached. Please wait a moment and try again.';
        statusCode = 503;
        logger.warn({ requestId, action: 'PROVIDER_RATE_LIMITED', message: 'OpenAI rate limit hit.' });
      } else if (err.message.includes('invalid_api_key') || err.message.includes('API key')) {
        safeMessage = 'Server AI configuration error. Please contact the administrator.';
        statusCode = 503;
        logger.error({ requestId, action: 'PROVIDER_AUTH_ERROR', message: 'Invalid or missing API key.' });
      } else {
        logger.error({ requestId, action: 'GENERATION_ERROR', message: 'Provider returned an error.' });
      }
    } else {
      logger.error({ requestId, action: 'GENERATION_ERROR', message: 'Unknown error type encountered.' });
    }

    const errorBody: DevQAErrorResponse = {
      error: {
        code: 'PROVIDER_ERROR',
        message: safeMessage,
        requestId,
      },
    };

    return NextResponse.json(errorBody, {
      status: statusCode,
      headers: { 'X-Request-Id': requestId },
    })
  }
}
