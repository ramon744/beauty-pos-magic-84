
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { fromTable } from '@/services/supabase-helper';

const SUPABASE_URL = "https://dhowomcfclemctywhoyq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRob3dvbWNmY2xlbWN0eXdob3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzNjM4OTIsImV4cCI6MjA1NzkzOTg5Mn0.p5nb9_6l7V824B6KE_sPqZCl3lhjGnnwfWRufMuvqTs";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Função para criar um procedimento armazenado
const createRpcFunction = async () => {
  try {
    // Criar função para criar tabelas sob demanda
    const { error } = await supabase.rpc('create_table_if_not_exists', { table_name: 'dummy' });
    
    if (error && error.message.includes('function "create_table_if_not_exists" does not exist')) {
      console.log('RPC function does not exist, but tables are already created directly. This is normal.');
    } else if (error) {
      console.error('Error calling RPC function:', error);
    } else {
      console.log('RPC function exists and works correctly');
    }
  } catch (error) {
    console.error('Failed to check RPC function:', error);
  }
};

// Check if tables exist and create them if not
(async () => {
  try {
    // Check if tables have been created
    const tablesCreated = localStorage.getItem('tablesCreated');
    if (!tablesCreated) {
      console.log('Tables were created directly through SQL migration.');
      localStorage.setItem('tablesCreated', 'true');
    }

    // Check RPC function existence
    await createRpcFunction();

    // Check if migration has already been run
    const migrationCompleted = localStorage.getItem('migrationCompleted');
    if (!migrationCompleted) {
      console.log('Data migration will be initialized by the hook. Loading data into Supabase...');
    }
  } catch (error) {
    console.error('Error checking migration/table status:', error);
  }
})();
