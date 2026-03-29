import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../_lib/auth';
import { getUserById } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = getAuthUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await getUserById(auth.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
}
