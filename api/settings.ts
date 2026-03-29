import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, requireAuth } from './_lib/auth';
import { getSettings, updateSetting } from './_lib/db';

const DEFAULT_SETTINGS = { versesPerPractice: 3, activeSourceText: 'bible' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const auth = getAuthUser(req);
      if (!auth) {
        return res.json(DEFAULT_SETTINGS);
      }
      const settings = await getSettings(auth.userId);
      return res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const auth = requireAuth(req);
      const updates = req.body;
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          await updateSetting(auth.userId, key, value as string | number);
        }
      }
      const settings = await getSettings(auth.userId);
      return res.json(settings);
    } catch (error: any) {
      if (error.statusCode === 401) {
        return res.status(401).json({ error: error.message });
      }
      console.error('Error updating settings:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
