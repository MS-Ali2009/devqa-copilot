import { getSupabaseClient } from './supabase-client';

export interface HistoryRecord {
  id: string;
  user_id: string;
  input_text: string;
  output_text: string;
  input_type: string | null;
  output_mode: string | null;
  platform: string | null;
  environment: string | null;
  language: string | null;
  created_at: string;
}

export interface SaveHistoryParams {
  userId: string;
  input: string;
  output: string;
  inputType?: string;
  outputMode?: string;
  platform?: string;
  environment?: string;
  language?: string;
}

/**
 * Saves a generated artifact to Supabase devqa_history table.
 */
export async function saveHistoryItem(params: SaveHistoryParams): Promise<HistoryRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('devqa_history')
      .insert({
        user_id: params.userId,
        input_text: params.input,
        output_text: params.output,
        input_type: params.inputType || null,
        output_mode: params.outputMode || null,
        platform: params.platform || null,
        environment: params.environment || null,
        language: params.language || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[HistoryRepo] Error saving history item:', error);
      return null;
    }

    return data as HistoryRecord;
  } catch (err) {
    console.error('[HistoryRepo] Exception in saveHistoryItem:', err);
    return null;
  }
}

/**
 * Retrieves the most recent history records for a user.
 */
export async function getHistoryItems(userId: string, limit: number = 100): Promise<HistoryRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('devqa_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[HistoryRepo] Error fetching history items:', error);
      return [];
    }

    return (data || []) as HistoryRecord[];
  } catch (err) {
    console.error('[HistoryRepo] Exception in getHistoryItems:', err);
    return [];
  }
}

/**
 * Retrieves a single history record by ID.
 */
export async function getHistoryItem(id: string): Promise<HistoryRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('devqa_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[HistoryRepo] Error fetching item by ID:', error);
      return null;
    }

    return data as HistoryRecord;
  } catch (err) {
    console.error('[HistoryRepo] Exception in getHistoryItem:', err);
    return null;
  }
}

/**
 * Deletes a single history record by ID.
 */
export async function deleteHistoryItem(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('devqa_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[HistoryRepo] Error deleting item:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[HistoryRepo] Exception in deleteHistoryItem:', err);
    return false;
  }
}

/**
 * Clears all history for a specific user.
 */
export async function clearHistory(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('devqa_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[HistoryRepo] Error clearing history for user:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[HistoryRepo] Exception in clearHistory:', err);
    return false;
  }
}

/**
 * Searches a user's history by keyword in input_text, output_text, or output_mode.
 */
export async function searchHistory(userId: string, query: string): Promise<HistoryRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const trimmed = query.trim();
  if (!trimmed) {
    return getHistoryItems(userId);
  }

  try {
    const { data, error } = await supabase
      .from('devqa_history')
      .select('*')
      .eq('user_id', userId)
      .or(`input_text.ilike.%${trimmed}%,output_text.ilike.%${trimmed}%,output_mode.ilike.%${trimmed}%`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[HistoryRepo] Error searching history:', error);
      return [];
    }

    return (data || []) as HistoryRecord[];
  } catch (err) {
    console.error('[HistoryRepo] Exception in searchHistory:', err);
    return [];
  }
}
