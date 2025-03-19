
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to safely access Supabase tables bypassing TypeScript limitations
 * when the Database type is not properly defined
 */
export function fromTable(table: string) {
  // Using direct return with any type to completely bypass TypeScript's type checking
  return supabase.from(table) as any;
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
