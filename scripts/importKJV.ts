import axios from 'axios';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('POSTGRES_URL or DATABASE_URL environment variable is required');
  console.error('Create a .env.local file with your Neon/Vercel Postgres connection string');
  process.exit(1);
}

const sql = neon(databaseUrl);

const bibleBooks = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1Samuel', '2Samuel',
  '1Kings', '2Kings', '1Chronicles', '2Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
  'Proverbs', 'Ecclesiastes', 'SongofSolomon', 'Isaiah',
  'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
  'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke',
  'John', 'Acts', 'Romans', '1Corinthians', '2Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1Thessalonians', '2Thessalonians', '1Timothy', '2Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1Peter',
  '2Peter', '1John', '2John', '3John', 'Jude', 'Revelation'
];

interface Verse {
  verse: string;
  text: string;
}

interface Chapter {
  chapter: string;
  verses: Verse[];
}

interface BibleBook {
  book: string;
  chapters: Chapter[];
}

async function initializeDatabase() {
  console.log('Initializing database tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
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

  await sql`INSERT INTO settings (key, value) VALUES ('versesPerPractice', '3') ON CONFLICT (key) DO NOTHING`;
  await sql`INSERT INTO settings (key, value) VALUES ('activeSourceText', 'bible') ON CONFLICT (key) DO NOTHING`;

  console.log('Database tables initialized.');
}

async function importKJV() {
  console.log('Starting KJV import...');

  await initializeDatabase();

  const countResult = await sql`SELECT COUNT(*) as count FROM verses`;
  const existingCount = parseInt(countResult[0].count);
  if (existingCount > 0) {
    console.log(`Database already contains ${existingCount} verses. Skipping import.`);
    return;
  }

  let totalVerses = 0;
  let successfulBooks = 0;
  const failedBooks: string[] = [];

  for (const bookName of bibleBooks) {
    try {
      console.log(`Fetching ${bookName}...`);

      const url = `https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/${bookName}.json`;
      const response = await axios.get<BibleBook>(url);
      const bookData = response.data;

      let versesInBook = 0;

      for (const chapter of bookData.chapters) {
        const chapterNum = parseInt(chapter.chapter);

        for (const verse of chapter.verses) {
          const verseNum = parseInt(verse.verse);
          await sql`
            INSERT INTO verses (book, chapter, verse, text)
            VALUES (${bookData.book}, ${chapterNum}, ${verseNum}, ${verse.text})
            ON CONFLICT DO NOTHING
          `;
          versesInBook++;
          totalVerses++;
        }
      }

      console.log(`  Imported ${versesInBook} verses from ${bookData.book}`);
      successfulBooks++;
    } catch (error) {
      console.error(`  Failed to import ${bookName}:`, error instanceof Error ? error.message : error);
      failedBooks.push(bookName);
    }
  }

  console.log('\n========================================');
  console.log('Import Summary:');
  console.log(`  Total verses imported: ${totalVerses}`);
  console.log(`  Successful books: ${successfulBooks}/${bibleBooks.length}`);
  if (failedBooks.length > 0) {
    console.log(`  Failed books: ${failedBooks.join(', ')}`);
  }
  console.log('========================================\n');
}

importKJV()
  .then(() => {
    console.log('Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
