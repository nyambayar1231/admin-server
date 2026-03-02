import type { Context, Next } from 'hono';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js';

export type AuthenticatedContext = Context & {
  Variables: {
    user: AccessTokenPayload;
  };
};

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : c.req.header('Cookie')?.match(/accessToken=([^;]+)/)?.[1];

    if (!token) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const payload = await verifyAccessToken(token);
    c.set('user', payload);
    await next();
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid token type') {
      return c.json({ error: 'Invalid token' }, 401);
    }
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export function getUser(c: Context): AccessTokenPayload {
  return c.get('user') as AccessTokenPayload;
}
