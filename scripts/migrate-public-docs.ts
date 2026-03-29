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
  console.log('Making documents.user_id nullable for public documents...');
  await sql`ALTER TABLE documents ALTER COLUMN user_id DROP NOT NULL`;
  console.log('Done! documents.user_id is now nullable (NULL = public document).');
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
