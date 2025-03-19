
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to safely access Supabase tables bypassing TypeScript limitations
 * when the Database type is not properly defined
 */
export function fromTable<T = any>(
  table: string
): ReturnType<SupabaseClient['from']> {
  // Using 'as any' to bypass TypeScript's type checking
  // This is necessary because our Database type definition is empty
  return supabase.from(table as any);
}

/**
 * Generic function to extract data from a Supabase response
 * and handle errors consistently
 */
export async function extractDataFromSupabase<T>(
  query: Promise<{ data: T | null; error: any }>,
  fallbackData: T
): Promise<T> {
  try {
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return fallbackData;
    }
    
    return (data as T) || fallbackData;
  } catch (err) {
    console.error('Error executing Supabase query:', err);
    return fallbackData;
  }
}
