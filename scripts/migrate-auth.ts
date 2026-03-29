import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('POSTGRES_URL or DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function migrate() {
  console.log('Running auth migration...');

  // 1. Create users table
  console.log('Creating users table...');
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // 2. Add user_id column to documents (nullable first)
  console.log('Adding user_id to documents...');
  try {
    await sql`ALTER TABLE documents ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`;
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('  user_id column already exists on documents, skipping.');
    } else {
      throw e;
    }
  }

  // 3. Drop old settings table and recreate with user_id
  // (old settings were global with UNIQUE(key), new ones need UNIQUE(user_id, key))
  console.log('Recreating settings table with user_id...');
  await sql`DROP TABLE IF EXISTS settings CASCADE`;
  await sql`
    CREATE TABLE settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      UNIQUE(user_id, key)
    )
  `;

  // 4. Delete any orphaned documents (no user_id) since we can't assign them
  console.log('Cleaning up orphaned documents...');
  await sql`DELETE FROM documents WHERE user_id IS NULL`;

  // 5. Make user_id NOT NULL on documents
  console.log('Making user_id NOT NULL on documents...');
  try {
    await sql`ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL`;
  } catch (e: any) {
    console.log('  Could not set NOT NULL (may already be set):', e.message);
  }

  console.log('Migration complete!');
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
