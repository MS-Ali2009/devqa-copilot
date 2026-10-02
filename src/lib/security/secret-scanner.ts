export interface SecretScanResult {
  hasSecrets: boolean;
  detectedTypes: string[];
}

const SECRET_PATTERNS: { type: string; regex: RegExp }[] = [
  { type: 'OpenAI API Key', regex: /sk-(?:proj-|live-)?[a-zA-Z0-9_\-]{20,}/g },
  { type: 'GitHub Personal Access Token', regex: /gh[pousr]_[a-zA-Z0-9]{36,}/g },
  { type: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { type: 'AWS Secret Key', regex: /(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*[A-Za-z0-9\/+=]{40}/gi },
  { type: 'JSON Web Token (JWT)', regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { type: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
  { type: 'Generic Bearer Token', regex: /bearer\s+[a-zA-Z0-9_\-\.]{25,}/gi },
  { type: 'Database Connection String', regex: /(?:mongodb|postgres|postgresql|mysql):\/\/[^\s:]+:[^\s@]+@[^\s\/]+/gi },
  { type: 'Hardcoded Password Field', regex: /(?:password|passwd|pwd|secret)\s*[:=]\s*["'][^"'\s]{6,}["']/gi },
];

/**
 * Scans untrusted input text for common secrets, tokens, and credentials.
 * This is a heuristic pre-flight check and not an absolute guarantee.
 */
export function scanForSecrets(text: string): SecretScanResult {
  if (!text || typeof text !== 'string') {
    return { hasSecrets: false, detectedTypes: [] };
  }

  const detected: Set<string> = new Set();

  for (const { type, regex } of SECRET_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(text)) {
      detected.add(type);
    }
  }

  return {
    hasSecrets: detected.size > 0,
    detectedTypes: Array.from(detected),
  };
}

/**
 * Checks whether the text contains any high-confidence secrets.
 */
export function hasHighConfidenceSecret(text: string): boolean {
  return scanForSecrets(text).hasSecrets;
}

/**
 * Redacts recognized secrets from a string for safe server logging.
 */
export function redactSecretsForLogging(text: string): string {
  if (!text) return '';
  let sanitized = text;

  for (const { regex } of SECRET_PATTERNS) {
    regex.lastIndex = 0;
    sanitized = sanitized.replace(regex, '[REDACTED_SECRET]');
  }

  return sanitized;
}

/**
 * Redacts recognized secrets before persistent browser storage.
 */
export function redactForStorage(text: string): string {
  if (!text) return '';
  let sanitized = text;

  for (const { regex } of SECRET_PATTERNS) {
    regex.lastIndex = 0;
    sanitized = sanitized.replace(regex, '[REDACTED_SECRET]');
  }

  return sanitized;
}
