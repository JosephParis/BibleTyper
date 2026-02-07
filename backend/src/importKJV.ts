import axios from 'axios';
import { initializeDatabase, insertVerse, getVersesCount } from './db';

// List of all Bible books in order
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

async function importKJV() {
  console.log('Starting KJV import...');

  // Initialize database
  initializeDatabase();

  // Check if data already exists
  const existingCount = getVersesCount();
  if (existingCount > 0) {
    console.log(`Database already contains ${existingCount} verses. Skipping import.`);
    console.log('To re-import, delete the database file and run this script again.');
    return;
  }

  let totalVerses = 0;
  let successfulBooks = 0;
  let failedBooks: string[] = [];

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
          insertVerse(bookData.book, chapterNum, verseNum, verse.text);
          versesInBook++;
          totalVerses++;
        }
      }

      console.log(`  ✓ Imported ${versesInBook} verses from ${bookData.book}`);
      successfulBooks++;

    } catch (error) {
      console.error(`  ✗ Failed to import ${bookName}:`, error instanceof Error ? error.message : error);
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

  if (totalVerses > 0) {
    console.log('✓ KJV import complete! You can now use the application.');
  } else {
    console.error('✗ No verses were imported. Please check your internet connection and try again.');
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importKJV().catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });
}

export { importKJV };
