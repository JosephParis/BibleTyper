import type { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

interface TokenPayload {
  userId: number;
  email: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(userId: number, email: string): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ userId, email } as TokenPayload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function getAuthUser(req: VercelRequest): TokenPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(req: VercelRequest): TokenPayload {
  const user = getAuthUser(req);
  if (!user) {
    const error: any = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  return user;
}

export async function verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; googleId: string }> {
  if (!GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID not configured');

  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token');
  }

  return {
    email: payload.email,
    name: payload.name || '',
    googleId: payload.sub,
  };
}
