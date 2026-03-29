import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyGoogleToken, generateToken } from '../_lib/auth';
import { getUserByGoogleId, getUserByEmail, createUser, linkGoogleAccount } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    const { email, name, googleId } = await verifyGoogleToken(credential);

    // Check if user exists by Google ID
    let user = await getUserByGoogleId(googleId);

    if (!user) {
      // Check if user exists by email (link Google account)
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        await linkGoogleAccount(existingUser.id, googleId);
        user = existingUser;
      } else {
        // Create new user
        user = await createUser(email, null, googleId, name);
      }
    }

    const token = generateToken(user.id, user.email);

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
}
