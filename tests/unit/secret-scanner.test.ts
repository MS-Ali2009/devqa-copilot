import { describe, it, expect } from 'vitest';
import {
  scanForSecrets,
  redactSecretsForLogging,
  hasHighConfidenceSecret,
  redactForStorage,
} from '@/lib/security/secret-scanner';

describe('Secret Scanner & Redactor', () => {
  it('detects OpenAI API keys accurately', () => {
    const text = 'Here is my secret sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456 for testing';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('OpenAI API Key');
    expect(hasHighConfidenceSecret(text)).toBe(true);
  });

  it('detects GitHub Personal Access Tokens', () => {
    const text = 'Token is ghp_1234567890abcdefghijklmnopqrstuvwxyzAB';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('GitHub Personal Access Token');
    expect(hasHighConfidenceSecret(text)).toBe(true);
  });

  it('detects AWS Access Keys and Secret Keys', () => {
    const text = 'Found AKIAIOSFODNN7EXAMPLE in code';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('AWS Access Key ID');
  });

  it('detects Private Key Blocks', () => {
    const text = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('Private Key Block');
  });

  it('detects Database Connection Strings', () => {
    const text = 'connect to postgresql://admin:superSecretPass123@db.prod.internal:5432/core';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('Database Connection String');
  });

  it('detects JSON Web Tokens (JWT)', () => {
    const text =
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozGz6ePqT1x_test_signature_long_part';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(true);
    expect(result.detectedTypes).toContain('JSON Web Token (JWT)');
  });

  it('returns false for ordinary engineering input without credentials', () => {
    const text =
      'As a user, I want to login with email and password so I can access my dashboard.';
    const result = scanForSecrets(text);
    expect(result.hasSecrets).toBe(false);
    expect(result.detectedTypes.length).toBe(0);
    expect(hasHighConfidenceSecret(text)).toBe(false);
  });

  it('handles empty or non-string gracefully', () => {
    expect(scanForSecrets('').hasSecrets).toBe(false);
    // @ts-expect-error test non-string runtime guard
    expect(scanForSecrets(null).hasSecrets).toBe(false);
    expect(hasHighConfidenceSecret('')).toBe(false);
  });

  it('redacts sensitive tokens from log messages', () => {
    const raw = 'Config sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456 loaded';
    const redacted = redactSecretsForLogging(raw);
    expect(redacted).not.toContain('sk-proj-');
    expect(redacted).toContain('[REDACTED_SECRET]');
  });

  it('redacts sensitive tokens for storage', () => {
    const raw = 'ghp_1234567890abcdefghijklmnopqrstuvwxyzAB in note';
    const redacted = redactForStorage(raw);
    expect(redacted).not.toContain('ghp_');
    expect(redacted).toContain('[REDACTED_SECRET]');
  });
});
