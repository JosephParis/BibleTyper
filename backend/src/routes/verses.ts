import express from 'express';
import axios from 'axios';
import YouVersion from '@glowstudent/youversion';

const router = express.Router();

interface YouVersionResponse {
  citation: string;
  passage: string;
}

// List of Bible books for random selection
const bibleBooks = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
  'Proverbs', 'Ecclesiastes', 'Song of Songs', 'Isaiah',
  'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
  'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke',
  'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter',
  '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

// Mock verses for fallback
const mockVerses = [
  {
    id: 1,
    text: "In the beginning God created the heavens and the earth.",
    reference: "Genesis 1:1",
    translation: "NIV"
  },
  {
    id: 2,
    text: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
    reference: "Genesis 1:2",
    translation: "NIV"
  },
  {
    id: 3,
    text: "And God said, \"Let there be light,\" and there was light.",
    reference: "Genesis 1:3",
    translation: "NIV"
  },
  {
    id: 4,
    text: "God saw that the light was good, and he separated the light from the darkness.",
    reference: "Genesis 1:4",
    translation: "NIV"
  },
  {
    id: 5,
    text: "God called the light \"day,\" and the darkness he called \"night.\" And there was evening, and there was morning—the first day.",
    reference: "Genesis 1:5",
    translation: "NIV"
  }
];

// Get random verses
router.get('/random', async (req, res) => {
  try {
    // Get count from query params, default to 3 if not provided
    const count = parseInt(req.query.count as string) || 3;
    
    // Ensure count is between 1 and 10
    const validCount = Math.min(Math.max(count, 1), 10);

    console.log(`Requesting ${validCount} verses`);

    // Try to fetch consecutive verses from YouVersion API
    try {
      // Randomly select a book
      const randomBook = bibleBooks[Math.floor(Math.random() * bibleBooks.length)];
      
      // Randomly select a chapter (1-50 for simplicity)
      const randomChapter = Math.floor(Math.random() * 50) + 1;
      
      // Randomly select a starting verse (1-20 to leave room for consecutive verses)
      const startVerse = Math.floor(Math.random() * 20) + 1;

      console.log(`Fetching consecutive verses: ${randomBook} ${randomChapter}:${startVerse}-${startVerse + validCount - 1}`);

      const verses = [];
      let allTexts = [];
      
      // Fetch consecutive verses
      for (let i = 0; i < validCount; i++) {
        const currentVerse = startVerse + i;
        
        try {
          const response = await YouVersion.getVerse(
            randomBook,
            randomChapter.toString(),
            currentVerse.toString(),
            'NIV'
          );
          
          if (response && response.passage) {
            // Clean up the text - ensure proper spacing
            const cleanText = response.passage.trim().replace(/\s+/g, ' ');
            allTexts.push(cleanText);
            console.log(`Fetched verse ${randomBook} ${randomChapter}:${currentVerse}`);
          }
        } catch (verseError) {
          console.error(`Error fetching verse ${randomBook} ${randomChapter}:${currentVerse}:`, verseError);
        }
      }

      if (allTexts.length > 0) {
        // Create a single combined verse entry with proper reference formatting
        const endVerse = startVerse + allTexts.length - 1;
        const reference = allTexts.length === 1 
          ? `${randomBook} ${randomChapter}:${startVerse}`
          : `${randomBook} ${randomChapter}:${startVerse}-${endVerse}`;

        const combinedVerse = {
          id: 1,
          text: allTexts.join(' '),
          reference: reference,
          translation: 'NIV'
        };

        console.log(`Returning ${allTexts.length} consecutive verses as single entry: ${reference}`);
        return res.json([combinedVerse]);
      } else {
        throw new Error('No verses returned from YouVersion API');
      }
    } catch (apiError) {
      console.error('YouVersion API error, falling back to mock verses:', apiError);
      // Fall through to mock verses
    }

    // Fallback to mock verses
    console.log('Using mock verses as fallback');
    const selectedVerses = mockVerses.slice(0, validCount);
    
    // Combine the selected mock verses into a single entry
    if (selectedVerses.length > 0) {
      const combinedText = selectedVerses.map(verse => verse.text).join(' ');
      const firstVerse = selectedVerses[0];
      const lastVerse = selectedVerses[selectedVerses.length - 1];
      
      // Extract verse numbers from references (e.g., "Genesis 1:1" -> "1")
      const firstVerseNum = firstVerse.reference.split(':')[1];
      const lastVerseNum = lastVerse.reference.split(':')[1];
      
      const combinedReference = selectedVerses.length === 1 
        ? firstVerse.reference
        : `${firstVerse.reference.split(':')[0]}:${firstVerseNum}-${lastVerseNum}`;
      
      const combinedVerse = {
        id: 1,
        text: combinedText,
        reference: combinedReference,
        translation: firstVerse.translation
      };
      
      console.log(`Returning ${selectedVerses.length} combined mock verses: ${combinedReference}`);
      return res.json([combinedVerse]);
    }

  } catch (error) {
    console.error('Error in verses route:', error);
    
    // Return combined mock verses as a last resort
    const validCount = Math.min(Math.max(parseInt(req.query.count as string) || 3, 1), 10);
    const selectedVerses = mockVerses.slice(0, validCount);
    
    if (selectedVerses.length > 0) {
      const combinedText = selectedVerses.map(verse => verse.text).join(' ');
      const firstVerse = selectedVerses[0];
      const lastVerse = selectedVerses[selectedVerses.length - 1];
      
      // Extract verse numbers from references
      const firstVerseNum = firstVerse.reference.split(':')[1];
      const lastVerseNum = lastVerse.reference.split(':')[1];
      
      const combinedReference = selectedVerses.length === 1 
        ? firstVerse.reference
        : `${firstVerse.reference.split(':')[0]}:${firstVerseNum}-${lastVerseNum}`;
      
      const combinedVerse = {
        id: 1,
        text: combinedText,
        reference: combinedReference,
        translation: firstVerse.translation
      };
      
      console.log(`Returning ${selectedVerses.length} combined mock verses as last resort: ${combinedReference}`);
      return res.json([combinedVerse]);
    }
    
    // If no verses available, return error
    return res.status(500).json({ error: 'No verses available' });
  }
});

export const verseRoutes = router; 