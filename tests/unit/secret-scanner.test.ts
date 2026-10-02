import { describe, it, expect } from 'vitest';
import { scanForSecrets, redactSecretsForLogging } from '@/lib/security/secret-scanner';

describe('Secret Scanner & Redactor', () => {
  it('detects OpenAI API keys accurately', () => {
    const text = 'Here is my secret sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456 for testing';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('OpenAI API Key');
  });

  it('detects GitHub Personal Access Tokens', () => {
    const text = 'Token is ghp_1234567890abcdefghijklmnopqrstuvwxyzAB';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('GitHub Personal Access Token');
  });

  it('detects JSON Web Tokens (JWT)', () => {
    const text = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozGz6ePqT1x_test_signature_long_part';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('JSON Web Token (JWT)');
  });

  it('returns false for ordinary engineering input without credentials', () => {
    const text = 'As a user, I want to login with email and password so I can access my dashboard.';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(false);
    expect(result.detectedTypes.length).toBe(0);
  });

  it('redacts sensitive tokens from log messages', () => {
    const raw = 'Config sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456 loaded';
    const redacted = redactSecretsForLogging(raw);
    expect(redacted).not.toContain('sk-proj-');
    expect(redacted).toContain('[REDACTED_SECRET]');
  });
});
