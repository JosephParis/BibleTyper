import express from 'express';
import axios from 'axios';

const router = express.Router();
const BIBLE_API_KEY = process.env.BIBLE_API_KEY;

// Get random verses
router.get('/', async (req, res) => {
  try {
    // Get a random book and chapter
    const books = [
      { id: 'GEN', chapters: 50 },
      { id: 'EXO', chapters: 40 },
      { id: 'LEV', chapters: 27 },
      { id: 'NUM', chapters: 36 },
      { id: 'DEU', chapters: 34 },
      // Add more books as needed
    ];

    const randomBook = books[Math.floor(Math.random() * books.length)];
    const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;

    // Fetch verses from the Bible API
    const response = await axios.get(
      `https://api.scripture.api.bible/v1/bibles/9879dbb7cfe28e4d-01/chapters/${randomBook.id}.${randomChapter}`,
      {
        headers: {
          'api-key': BIBLE_API_KEY,
        },
      }
    );

    const verses = response.data.data.verses;
    const selectedVerses = [];

    // Select 5 random verses
    for (let i = 0; i < 5; i++) {
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      selectedVerses.push({
        text: randomVerse.text,
        reference: `${randomBook.id} ${randomChapter}:${randomVerse.verse}`,
      });
    }

    res.json(selectedVerses);
  } catch (error) {
    console.error('Error fetching verses:', error);
    res.status(500).json({ error: 'Failed to fetch verses' });
  }
});

export const verseRoutes = router; 