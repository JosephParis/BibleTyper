import Database from 'better-sqlite3';
import path from 'path';

// Create SQLite database instance
const dbPath = path.join(__dirname, '..', 'bibletyper.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with settings table
export function initializeDatabase() {
  try {
    console.log('Initializing SQLite database...');

    // Create settings table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      )
    `);

    // Create verses table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL,
        UNIQUE(book, chapter, verse)
      )
    `);

    // Create index for faster random queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_book_chapter
      ON verses(book, chapter)
    `);

    // Create documents table
    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        chunk_count INTEGER NOT NULL DEFAULT 0,
        uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create document_chunks table
    db.exec(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        text TEXT NOT NULL,
        label TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `);

    // Create index for document_chunks
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
      ON document_chunks(document_id)
    `);

    // Insert default settings if they don't exist
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('versesPerPractice', '3');
    stmt.run('activeSourceText', 'bible');

    console.log('Successfully initialized SQLite database!');
  } catch (error) {
    console.error('SQLite initialization error:', error);
    throw error;
  }
}

// Get settings
export function getSettings() {
  const stmt = db.prepare('SELECT key, value FROM settings');
  const rows = stmt.all() as Array<{ key: string; value: string }>;

  // Convert to object format
  const settings: Record<string, any> = {};
  rows.forEach(row => {
    // Try to parse as number if possible
    const numValue = Number(row.value);
    settings[row.key] = isNaN(numValue) ? row.value : numValue;
  });

  return settings;
}

// Update setting
export function updateSetting(key: string, value: string | number) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, String(value));
}

// Get count of verses in database
export function getVersesCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM verses');
  const result = stmt.get() as { count: number };
  return result.count;
}

// Get a random verse range
export function getRandomVerses(count: number): Array<{ book: string; chapter: number; verse: number; text: string }> {
  // First, get a random book and chapter that has enough consecutive verses
  const stmt = db.prepare(`
    SELECT book, chapter, verse, text
    FROM verses
    WHERE (book, chapter) IN (
      SELECT book, chapter
      FROM verses
      GROUP BY book, chapter
      HAVING COUNT(*) >= ?
      ORDER BY RANDOM()
      LIMIT 1
    )
    ORDER BY verse
  `);

  const allVersesInChapter = stmt.all(count) as Array<{ book: string; chapter: number; verse: number; text: string }>;

  if (allVersesInChapter.length < count) {
    // If we don't have enough verses, just return what we have
    return allVersesInChapter;
  }

  // Pick a random starting point that allows for 'count' consecutive verses
  const maxStartIndex = allVersesInChapter.length - count;
  const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));

  return allVersesInChapter.slice(startIndex, startIndex + count);
}

// Insert a verse (used during import)
export function insertVerse(book: string, chapter: number, verse: number, text: string) {
  const stmt = db.prepare('INSERT OR IGNORE INTO verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)');
  stmt.run(book, chapter, verse, text);
}

// Insert a document with its chunks (transactional)
export function insertDocumentWithChunks(
  name: string,
  originalFilename: string,
  fileType: string,
  chunks: Array<{ text: string; label: string }>
): number {
  const insertDoc = db.prepare(
    'INSERT INTO documents (name, original_filename, file_type, chunk_count) VALUES (?, ?, ?, ?)'
  );
  const insertChunk = db.prepare(
    'INSERT INTO document_chunks (document_id, chunk_index, text, label) VALUES (?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    const result = insertDoc.run(name, originalFilename, fileType, chunks.length);
    const docId = result.lastInsertRowid as number;

    for (let i = 0; i < chunks.length; i++) {
      insertChunk.run(docId, i, chunks[i].text, chunks[i].label);
    }

    return docId;
  });

  return transaction();
}

// Get all documents
export function getDocuments(): Array<{
  id: number;
  name: string;
  original_filename: string;
  file_type: string;
  chunk_count: number;
  uploaded_at: string;
}> {
  const stmt = db.prepare('SELECT * FROM documents ORDER BY uploaded_at DESC');
  return stmt.all() as any[];
}

// Get a single document by ID
export function getDocument(id: number): {
  id: number;
  name: string;
  original_filename: string;
  file_type: string;
  chunk_count: number;
  uploaded_at: string;
} | undefined {
  const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
  return stmt.get(id) as any;
}

// Delete a document (chunks cascade)
export function deleteDocument(id: number): boolean {
  const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// Rename a document
export function renameDocument(id: number, newName: string): boolean {
  const stmt = db.prepare('UPDATE documents SET name = ? WHERE id = ?');
  const result = stmt.run(newName, id);
  return result.changes > 0;
}

// Get all chunks for a document
export function getDocumentChunks(documentId: number): Array<{
  id: number;
  chunk_index: number;
  text: string;
  label: string;
}> {
  const stmt = db.prepare(
    'SELECT id, chunk_index, text, label FROM document_chunks WHERE document_id = ? ORDER BY chunk_index'
  );
  return stmt.all(documentId) as any[];
}

// Update a chunk's text
export function updateChunk(chunkId: number, newText: string): boolean {
  const stmt = db.prepare('UPDATE document_chunks SET text = ? WHERE id = ?');
  const result = stmt.run(newText, chunkId);
  return result.changes > 0;
}

// Get a random chunk from a document
export function getRandomDocumentChunk(documentId: number): {
  id: number;
  text: string;
  label: string;
  document_name: string;
} | undefined {
  const stmt = db.prepare(`
    SELECT dc.id, dc.text, dc.label, d.name as document_name
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE dc.document_id = ?
    ORDER BY RANDOM()
    LIMIT 1
  `);
  return stmt.get(documentId) as any;
}

// Close database connection
export function closeDatabase() {
  try {
    db.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

export default db;
