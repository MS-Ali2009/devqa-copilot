import { redactSecretsForLogging } from './secret-scanner';

export type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  requestId?: string;
  action: string;
  message?: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

/**
 * Safe production logger that redacts secrets and suppresses raw user input.
 */
export const logger = {
  info: (payload: LogPayload) => log('info', payload),
  warn: (payload: LogPayload) => log('warn', payload),
  error: (payload: LogPayload) => log('error', payload),
};

function log(level: LogLevel, payload: LogPayload) {
  const timestamp = new Date().toISOString();
  const reqTag = payload.requestId ? `[${payload.requestId}]` : '';

  // Sanitize any metadata before logging
  const safeData = payload.data ? sanitizeObject(payload.data) : undefined;
  const safeMessage = payload.message ? redactSecretsForLogging(payload.message) : '';

  const entry = {
    timestamp,
    level: level.toUpperCase(),
    requestId: payload.requestId,
    action: payload.action,
    message: safeMessage,
    ...(safeData ? { data: safeData } : {}),
    ...(payload.error ? { error: formatError(payload.error) } : {}),
  };

  const output = `[${timestamp}] [${level.toUpperCase()}] ${reqTag} ${payload.action}: ${safeMessage}`;

  if (level === 'error') {
    console.error(output, entry.error || '');
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    // Never log raw content or auth keys
    if (/key|secret|token|auth|password|rawInput/i.test(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof val === 'string') {
      result[key] = redactSecretsForLogging(val).substring(0, 100);
    } else {
      result[key] = val;
    }
  }
  return result;
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  return String(err);
}
