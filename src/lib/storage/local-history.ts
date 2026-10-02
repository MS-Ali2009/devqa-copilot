import { HistoryItemV1, LocalHistoryStorageV1 } from '@/types/history';

const STORAGE_KEY = 'devqa_copilot_history_v1';
const CURRENT_VERSION = 1;

/**
 * Reads and parses history items from browser localStorage safely.
 */
export function getLocalHistory(): HistoryItemV1[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === CURRENT_VERSION && Array.isArray(parsed.items)) {
      return parsed.items;
    }

    // If future migration needed, handle here
    return [];
  } catch (err) {
    console.error('Failed to read local history from localStorage:', err);
    return [];
  }
}

/**
 * Saves a new history item to the front of the local history array.
 */
export function saveHistoryItem(item: Omit<HistoryItemV1, 'version'>): HistoryItemV1[] {
  if (typeof window === 'undefined') return [];

  try {
    const existing = getLocalHistory();
    const fullItem: HistoryItemV1 = {
      ...item,
      version: CURRENT_VERSION,
    };

    // Keep up to 100 most recent items to avoid localStorage quota issues
    const updated = [fullItem, ...existing.filter((i) => i.id !== fullItem.id)].slice(0, 100);

    const storagePayload: LocalHistoryStorageV1 = {
      version: CURRENT_VERSION,
      items: updated,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storagePayload));
    return updated;
  } catch (err) {
    console.error('Failed to save history item to localStorage:', err);
    return getLocalHistory();
  }
}

/**
 * Deletes a single history item by ID.
 */
export function deleteHistoryItem(id: string): HistoryItemV1[] {
  if (typeof window === 'undefined') return [];

  try {
    const existing = getLocalHistory();
    const updated = existing.filter((item) => item.id !== id);

    const storagePayload: LocalHistoryStorageV1 = {
      version: CURRENT_VERSION,
      items: updated,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storagePayload));
    return updated;
  } catch (err) {
    console.error('Failed to delete history item:', err);
    return getLocalHistory();
  }
}

/**
 * Clears all local history completely.
 */
export function clearAllLocalHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear local history:', err);
  }
}

/**
 * Filters history items by keyword matching title, rawInput, or markdownOutput.
 */
export function searchLocalHistory(items: HistoryItemV1[], query: string): HistoryItemV1[] {
  if (!query || query.trim() === '') return items;
  const q = query.toLowerCase().trim();

  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.rawInput.toLowerCase().includes(q) ||
      item.outputMode.toLowerCase().includes(q) ||
      item.inputType.toLowerCase().includes(q) ||
      (item.projectContext && item.projectContext.toLowerCase().includes(q))
  );
}
