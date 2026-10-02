import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getLocalHistory,
  saveHistoryItem,
  deleteHistoryItem,
  clearAllLocalHistory,
  searchLocalHistory,
  hasHighConfidenceSecret,
  redactForStorage,
} from '@/lib/storage/local-history';
import { HistoryItemV1 } from '@/types/history';

describe('Local History Storage', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    // @ts-expect-error mock window and localStorage
    global.window = {} as unknown;
    // @ts-expect-error mock localStorage
    global.localStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, val: string) => {
        mockStore[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };
  });

  afterEach(() => {
    // @ts-expect-error clean window
    delete global.window;
    // @ts-expect-error clean localStorage
    delete global.localStorage;
  });

  it('returns empty array when storage is empty', () => {
    const history = getLocalHistory();
    expect(history).toEqual([]);
  });

  it('saves and retrieves history items', () => {
    const item = {
      id: 'test-1',
      createdAt: new Date().toISOString(),
      title: 'Test Story',
      rawInput: 'As a user I want to test',
      inputType: 'user_story' as const,
      outputMode: 'full_analysis' as const,
      outputLanguage: 'en' as const,
      markdownOutput: '# Output Analysis',
    };

    const saved = saveHistoryItem(item);
    expect(saved.length).toBe(1);
    expect(saved[0].id).toBe('test-1');

    const retrieved = getLocalHistory();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].title).toBe('Test Story');
  });

  it('deletes history item by ID', () => {
    const item1 = {
      id: 'item-1',
      createdAt: new Date().toISOString(),
      title: 'Item 1',
      rawInput: 'Input 1',
      inputType: 'user_story' as const,
      outputMode: 'full_analysis' as const,
      outputLanguage: 'en' as const,
      markdownOutput: 'Output 1',
    };
    const item2 = {
      id: 'item-2',
      createdAt: new Date().toISOString(),
      title: 'Item 2',
      rawInput: 'Input 2',
      inputType: 'bug_report' as const,
      outputMode: 'bug_report' as const,
      outputLanguage: 'en' as const,
      markdownOutput: 'Output 2',
    };

    saveHistoryItem(item1);
    saveHistoryItem(item2);

    const afterDelete = deleteHistoryItem('item-1');
    expect(afterDelete.length).toBe(1);
    expect(afterDelete[0].id).toBe('item-2');
  });

  it('clears all local history', () => {
    saveHistoryItem({
      id: 'item-1',
      createdAt: new Date().toISOString(),
      title: 'Item 1',
      rawInput: 'Input 1',
      inputType: 'user_story' as const,
      outputMode: 'full_analysis' as const,
      outputLanguage: 'en' as const,
      markdownOutput: 'Output 1',
    });

    clearAllLocalHistory();
    expect(getLocalHistory()).toEqual([]);
  });

  it('searches history by query across title, rawInput, and outputMode', () => {
    const items: HistoryItemV1[] = [
      {
        id: '1',
        version: 1,
        createdAt: '2026-01-01',
        title: 'Authentication Flow',
        rawInput: 'Login ticket details',
        inputType: 'user_story',
        outputMode: 'qa_test_cases',
        outputLanguage: 'en',
        markdownOutput: 'Test cases',
      },
      {
        id: '2',
        version: 1,
        createdAt: '2026-01-02',
        title: 'Checkout Bug',
        rawInput: 'Cart error',
        inputType: 'bug_report',
        outputMode: 'bug_report',
        outputLanguage: 'en',
        markdownOutput: 'Crash log',
      },
    ];

    expect(searchLocalHistory(items, 'auth').length).toBe(1);
    expect(searchLocalHistory(items, 'cart').length).toBe(1);
    expect(searchLocalHistory(items, 'qa_test_cases').length).toBe(1);
    expect(searchLocalHistory(items, 'nonexistent').length).toBe(0);
    expect(searchLocalHistory(items, '').length).toBe(2);
  });

  it('re-exports secret scanner utilities accurately', () => {
    expect(hasHighConfidenceSecret('sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456')).toBe(true);
    expect(hasHighConfidenceSecret('normal text')).toBe(false);
    expect(redactForStorage('key sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456')).toContain('[REDACTED_SECRET]');
  });
});
