import { getSupabaseClient } from './supabase-client';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: 'owner' | 'user';
  created_at: string;
}

/**
 * Creates a new user record in Supabase devqa_users table.
 */
export async function createUser(
  email: string,
  passwordHash: string,
  role: 'owner' | 'user' = 'user'
): Promise<UserRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('devqa_users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error('[UserRepo] Error creating user:', error);
      return null;
    }

    return data as UserRecord;
  } catch (err) {
    console.error('[UserRepo] Exception in createUser:', err);
    return null;
  }
}

/**
 * Retrieves a user record by email.
 */
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('devqa_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      return null;
    }

    return data as UserRecord;
  } catch (err) {
    console.error('[UserRepo] Exception in getUserByEmail:', err);
    return null;
  }
}

/**
 * Retrieves a user record by ID.
 */
export async function getUserById(id: string): Promise<UserRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('devqa_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data as UserRecord;
  } catch (err) {
    console.error('[UserRepo] Exception in getUserById:', err);
    return null;
  }
}

/**
 * Returns total number of registered users.
 * Used to designate the very first user as 'owner'.
 */
export async function getUserCount(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from('devqa_users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return 0;
    }

    return count || 0;
  } catch {
    return 0;
  }
}
