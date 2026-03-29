import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, requireAuth } from '../../_lib/auth';
import { getDocument, deleteDocument, renameDocument, getSettings, updateSetting } from '../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    if (req.method === 'GET') {
      const auth = getAuthUser(req);
      const doc = await getDocument(id, auth?.userId ?? null);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      return res.json(doc);
    }

    // DELETE and PATCH require auth and only work on user-owned docs
    const auth = requireAuth(req);

    if (req.method === 'DELETE') {
      const settings = await getSettings(auth.userId);
      if (settings.activeSourceText === String(id)) {
        await updateSetting(auth.userId, 'activeSourceText', 'bible');
      }
      await deleteDocument(id, auth.userId);
      return res.json({ success: true });
    }

    if (req.method === 'PATCH') {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }
      await renameDocument(id, auth.userId, name.trim());
      const doc = await getDocument(id, auth.userId);
      return res.json(doc);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    if (error.statusCode === 401) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Error handling document:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
