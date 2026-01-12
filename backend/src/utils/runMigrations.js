/**
 * Migration Runner
 *
 * This script reads SQL migration files and executes them against Supabase.
 *
 * Usage: npm run db:migrate
 *
 * Note: For production, it's recommended to run migrations directly
 * in the Supabase SQL Editor for better control.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { supabaseAdmin } = require('../config/supabase');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../supabase/migrations');

  console.log('Starting database migrations...\n');

  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

      if (error) {
        console.error(`Error running ${file}:`, error.message);
        console.log('\nPlease run migrations manually in Supabase SQL Editor.');
        console.log(`File location: ${path.join(migrationsDir, file)}`);
        process.exit(1);
      }

      console.log(`✓ ${file} completed\n`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
    console.log('\n---');
    console.log('To run migrations manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of each .sql file in order');
    console.log(`4. Migration files are located at: ${migrationsDir}`);
    process.exit(1);
  }
}

runMigrations();
