import Database from 'better-sqlite3';
import path from 'path';

// Create SQLite database instance
const dbPath = path.join(__dirname, '..', 'bibletyper.db');
const db = new Database(dbPath);

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

    // Insert default settings if they don't exist
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('versesPerPractice', '3');

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
