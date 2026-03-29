import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../../../_lib/auth';
import { updateChunk } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = requireAuth(req);
    const chunkId = parseInt(req.query.chunkId as string);
    if (isNaN(chunkId)) {
      return res.status(400).json({ error: 'Invalid chunk ID' });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    await updateChunk(chunkId, auth.userId, text.trim());
    res.json({ success: true });
  } catch (error: any) {
    if (error.statusCode === 401) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Error updating chunk:', error);
    res.status(500).json({ error: 'Failed to update chunk' });
  }
}
