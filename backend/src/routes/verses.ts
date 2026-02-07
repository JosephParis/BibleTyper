import express from 'express';
import { getRandomVerses, getVersesCount } from '../db';

const router = express.Router();

// Get random verses
router.get('/random', async (req, res) => {
  try {
    // Check if database has verses
    const versesCount = getVersesCount();
    if (versesCount === 0) {
      return res.status(503).json({
        error: 'Bible verses not yet loaded. Please run: npm run import-kjv'
      });
    }

    // Get count from query params, default to 3 if not provided
    const count = parseInt(req.query.count as string) || 3;

    // Ensure count is between 1 and 10
    const validCount = Math.min(Math.max(count, 1), 10);

    console.log(`Requesting ${validCount} random consecutive verses`);

    // Get random consecutive verses from database
    const verses = getRandomVerses(validCount);

    if (verses.length === 0) {
      return res.status(500).json({ error: 'No verses found' });
    }

    // Combine verses into a single response
    const combinedText = verses.map(v => v.text).join(' ');
    const firstVerse = verses[0];
    const lastVerse = verses[verses.length - 1];

    // Format reference (e.g., "Genesis 1:1" or "Genesis 1:1-5")
    const reference = verses.length === 1
      ? `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`
      : `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`;

    const response = {
      id: 1,
      text: combinedText,
      reference: reference,
      translation: 'KJV'
    };

    console.log(`Returning ${verses.length} verses: ${reference}`);
    res.json([response]);

  } catch (error) {
    console.error('Error in verses route:', error);
    res.status(500).json({
      error: 'Failed to fetch verses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const verseRoutes = router; 