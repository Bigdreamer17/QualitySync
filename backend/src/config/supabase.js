const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

// Validate required Supabase configuration
if (!config.supabase.url) {
  console.error('ERROR: SUPABASE_URL is not set');
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!config.supabase.anonKey) {
  console.error('ERROR: SUPABASE_ANON_KEY is not set');
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

if (!config.supabase.serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

console.log('Supabase configuration validated successfully');
console.log(`Supabase URL: ${config.supabase.url}`);
console.log(`Service Role Key present: ${config.supabase.serviceRoleKey ? 'Yes' : 'No'}`);

// Client for regular operations (respects RLS)
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// Admin client for operations that bypass RLS (user creation, etc.)
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = { supabase, supabaseAdmin };
