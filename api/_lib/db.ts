import { neon, neonConfig, Pool } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

function getSQL() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
  return neon(databaseUrl);
}

function getPool() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
  return new Pool({ connectionString: databaseUrl });
}

// ─── Schema ─────────────────────────────────────────────────────────────────

export async function initializeDatabase() {
  const sql = getSQL();

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

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      UNIQUE(user_id, key)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS verses (
      id SERIAL PRIMARY KEY,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      UNIQUE(book, chapter, verse)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_book_chapter ON verses(book, chapter)`;

  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      chunk_count INTEGER NOT NULL DEFAULT 0,
      uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id SERIAL PRIMARY KEY,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      label TEXT NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id)`;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function createUser(email: string, passwordHash: string | null, googleId: string | null, name: string | null) {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO users (email, password_hash, google_id, name)
    VALUES (${email}, ${passwordHash}, ${googleId}, ${name})
    RETURNING id, email, name, created_at
  `;
  return rows[0];
}

export async function getUserByEmail(email: string) {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  return rows[0] || undefined;
}

export async function getUserByGoogleId(googleId: string) {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM users WHERE google_id = ${googleId}`;
  return rows[0] || undefined;
}

export async function getUserById(id: number) {
  const sql = getSQL();
  const rows = await sql`SELECT id, email, name, created_at FROM users WHERE id = ${id}`;
  return rows[0] || undefined;
}

export async function linkGoogleAccount(userId: number, googleId: string) {
  const sql = getSQL();
  await sql`UPDATE users SET google_id = ${googleId} WHERE id = ${userId}`;
}

// ─── Settings (per-user) ────────────────────────────────────────────────────

export async function getSettings(userId: number) {
  const sql = getSQL();
  const rows = await sql`SELECT key, value FROM settings WHERE user_id = ${userId}`;
  const settings: Record<string, any> = {
    versesPerPractice: 3,
    activeSourceText: 'bible',
  };
  rows.forEach(row => {
    const numValue = Number(row.value);
    settings[row.key] = isNaN(numValue) ? row.value : numValue;
  });
  return settings;
}

export async function updateSetting(userId: number, key: string, value: string | number) {
  const sql = getSQL();
  await sql`
    INSERT INTO settings (user_id, key, value) VALUES (${userId}, ${key}, ${String(value)})
    ON CONFLICT (user_id, key) DO UPDATE SET value = ${String(value)}
  `;
}

// ─── Verses (shared/public) ─────────────────────────────────────────────────

export async function getVersesCount(): Promise<number> {
  const sql = getSQL();
  const rows = await sql`SELECT COUNT(*) as count FROM verses`;
  return parseInt(rows[0].count);
}

export async function getRandomVerses(count: number) {
  const sql = getSQL();

  const chapterRows = await sql`
    SELECT book, chapter
    FROM verses
    GROUP BY book, chapter
    HAVING COUNT(*) >= ${count}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (chapterRows.length === 0) return [];

  const { book, chapter } = chapterRows[0];

  const allVerses = await sql`
    SELECT book, chapter, verse, text
    FROM verses
    WHERE book = ${book} AND chapter = ${chapter}
    ORDER BY verse
  `;

  if (allVerses.length < count) return allVerses;

  const maxStartIndex = allVerses.length - count;
  const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));
  return allVerses.slice(startIndex, startIndex + count);
}

export async function insertVerse(book: string, chapter: number, verse: number, text: string) {
  const sql = getSQL();
  await sql`INSERT INTO verses (book, chapter, verse, text) VALUES (${book}, ${chapter}, ${verse}, ${text}) ON CONFLICT DO NOTHING`;
}

// ─── Documents (per-user + public) ──────────────────────────────────────────

export async function insertDocumentWithChunks(
  userId: number | null,
  name: string,
  originalFilename: string,
  fileType: string,
  chunks: Array<{ text: string; label: string }>
): Promise<number> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'INSERT INTO documents (user_id, name, original_filename, file_type, chunk_count) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, name, originalFilename, fileType, chunks.length]
    );
    const docId = rows[0].id;

    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        'INSERT INTO document_chunks (document_id, chunk_index, text, label) VALUES ($1, $2, $3, $4)',
        [docId, i, chunks[i].text, chunks[i].label]
      );
    }

    await client.query('COMMIT');
    return docId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getDocuments(userId: number) {
  const sql = getSQL();
  return await sql`
    SELECT *, (user_id IS NULL) as is_public
    FROM documents
    WHERE user_id = ${userId} OR user_id IS NULL
    ORDER BY user_id IS NULL, uploaded_at DESC
  `;
}

export async function getDocument(id: number, userId: number | null) {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM documents
    WHERE id = ${id} AND (user_id = ${userId} OR user_id IS NULL)
  `;
  return rows[0] || undefined;
}

export async function deleteDocument(id: number, userId: number): Promise<boolean> {
  const sql = getSQL();
  await sql`DELETE FROM documents WHERE id = ${id} AND user_id = ${userId}`;
  return true;
}

export async function renameDocument(id: number, userId: number, newName: string): Promise<boolean> {
  const sql = getSQL();
  await sql`UPDATE documents SET name = ${newName} WHERE id = ${id} AND user_id = ${userId}`;
  return true;
}

export async function getDocumentChunks(documentId: number, userId: number | null) {
  const sql = getSQL();
  return await sql`
    SELECT dc.id, dc.chunk_index, dc.text, dc.label
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE dc.document_id = ${documentId} AND (d.user_id = ${userId} OR d.user_id IS NULL)
    ORDER BY dc.chunk_index
  `;
}

export async function updateChunk(chunkId: number, userId: number, newText: string): Promise<boolean> {
  const sql = getSQL();
  await sql`
    UPDATE document_chunks SET text = ${newText}
    WHERE id = ${chunkId}
    AND document_id IN (SELECT id FROM documents WHERE user_id = ${userId})
  `;
  return true;
}

export async function getRandomDocumentChunk(documentId: number, userId: number | null) {
  const sql = getSQL();
  const rows = await sql`
    SELECT dc.id, dc.text, dc.label, d.name as document_name
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE dc.document_id = ${documentId} AND (d.user_id = ${userId} OR d.user_id IS NULL)
    ORDER BY RANDOM()
    LIMIT 1
  `;
  return rows[0] || undefined;
}
