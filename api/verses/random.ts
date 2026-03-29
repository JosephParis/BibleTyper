import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRandomVerses, getVersesCount } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const versesCount = await getVersesCount();
    if (versesCount === 0) {
      return res.status(503).json({
        error: 'Bible verses not yet loaded. Please run the import script.',
      });
    }

    const count = parseInt(req.query.count as string) || 3;
    const validCount = Math.min(Math.max(count, 1), 10);

    const verses = await getRandomVerses(validCount);

    if (verses.length === 0) {
      return res.status(500).json({ error: 'No verses found' });
    }

    const combinedText = verses.map((v: any) => v.text).join(' ');
    const firstVerse = verses[0];
    const lastVerse = verses[verses.length - 1];

    const reference =
      verses.length === 1
        ? `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`
        : `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`;

    res.json([
      {
        id: 1,
        text: combinedText,
        reference,
        sourceText: 'Bible - KJV Translation',
      },
    ]);
  } catch (error) {
    console.error('Error in verses route:', error);
    res.status(500).json({
      error: 'Failed to fetch verses',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
