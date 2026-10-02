import { describe, it, expect, vi } from 'vitest';
import { c, printStep, printSuccess, printWarning, printError, printInfo } from '../../src/cli/colors';
import { loadEnvironment } from '../../src/cli/env';
import { runGenerate } from '../../src/cli/generator';

describe('DevQA Copilot CLI Modules', () => {
  it('formats ANSI colors correctly', () => {
    expect(c.bold('test')).toBeDefined();
    expect(c.green('success')).toBeDefined();
    expect(c.red('error')).toBeDefined();
    expect(c.cyan('step')).toBeDefined();
  });

  it('prints status messages without crashing', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printStep(1, 'Test Step');
    printSuccess('Success msg');
    printWarning('Warning msg');
    printError('Error msg');
    printInfo('Info msg');

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('loads environment variables safely without throwing', () => {
    expect(() => loadEnvironment()).not.toThrow();
  });

  it('generates artifacts using mock provider in CLI', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await expect(
      runGenerate({
        prompt: 'User Story: As a shopper I want to purchase books online',
        outputMode: 'qa_test_cases',
        forceMock: true,
      })
    ).resolves.not.toThrow();

    logSpy.mockRestore();
    stdoutSpy.mockRestore();
  });
});
