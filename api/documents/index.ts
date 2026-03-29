import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
import { getDocuments } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = requireAuth(req);
    const documents = await getDocuments(auth.userId);
    res.json(documents);
  } catch (error: any) {
    if (error.statusCode === 401) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}
