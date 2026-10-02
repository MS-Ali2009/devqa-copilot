import { describe, it, expect } from 'vitest';
import { MockLLMProvider } from '@/lib/ai/mock-provider';

describe('Mock LLM Provider', () => {
  const provider = new MockLLMProvider();

  it('generates structured Markdown table for qa_test_cases', async () => {
    const result = await provider.generate('System prompt', 'User prompt', 'qa_test_cases');
    expect(result.markdownOutput).toContain('| ID | Scenario | Preconditions | Steps | Test data | Expected result | Priority | Test type |');
    expect(result.markdownOutput).toContain('TC-001');
    expect(result.isMock).toBe(true);
    expect(result.modelUsed).toBe('mock-gpt-4o-mini');
  });

  it('generates suggested severity and priority for bug_report', async () => {
    const result = await provider.generate('System prompt', 'User prompt', 'bug_report');
    expect(result.markdownOutput).toContain('# Suggested Severity');
    expect(result.markdownOutput).toContain('# Suggested Priority');
    expect(result.markdownOutput).toContain('# Steps to Reproduce');
  });

  it('generates Given/When/Then scenarios for acceptance_criteria', async () => {
    const result = await provider.generate('System prompt', 'User prompt', 'acceptance_criteria');
    expect(result.markdownOutput).toContain('Given');
    expect(result.markdownOutput).toContain('When');
    expect(result.markdownOutput).toContain('Then');
  });

  it('generates developer checklist for developer_checklist mode', async () => {
    const result = await provider.generate('System prompt', 'User prompt', 'developer_checklist');
    expect(result.markdownOutput).toContain('## Frontend / UI');
    expect(result.markdownOutput).toContain('## Backend / API');
    expect(result.markdownOutput).toContain('## Testing Target');
  });

  it('generates API test matrix for api_test_matrix mode', async () => {
    const result = await provider.generate('System prompt', 'User prompt', 'api_test_matrix');
    expect(result.markdownOutput).toContain('# API Test Matrix: Endpoint Specification');
    expect(result.markdownOutput).toContain('| Test Category | Request Scenario |');
  });

  it('generates default full analysis for other modes', async () => {
    const result = await provider.generate('System prompt', 'User prompt', 'full_analysis');
    expect(result.markdownOutput).toContain('# Requirement Summary');
    expect(result.markdownOutput).toContain('# Confirmed Facts');
    expect(result.markdownOutput).toContain('# Assumptions');
  });
});
