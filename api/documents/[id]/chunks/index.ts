import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../../../_lib/auth';
import { getDocument, getDocumentChunks } from '../../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = getAuthUser(req);
    const userId = auth?.userId ?? null;
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const doc = await getDocument(id, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const chunks = await getDocumentChunks(id, userId);
    res.json(chunks);
  } catch (error: any) {
    console.error('Error fetching document chunks:', error);
    res.status(500).json({ error: 'Failed to fetch document chunks' });
  }
}
