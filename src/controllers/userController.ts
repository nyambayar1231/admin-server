import type { Context } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { UserService } from '../services/userService.js';
import { getUser } from '../middleware/auth.js';

const userService = new UserService();

const isDevelopment = process.env.NODE_ENV !== 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: !isDevelopment,
  sameSite: 'Strict' as const,
  path: '/',
};

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

export class UserController {
  async createUser(c: Context) {
    try {
      const body = await c.req.json();

      if (!body.username || !body.password) {
        return c.json({ error: 'Username and password are required' }, 400);
      }

      const user = await userService.createUser({
        username: body.username,
        password: body.password,
      });

      return c.json({ message: 'User created successfully', user }, 201);
    } catch (error) {
      if ((error as Error).message.includes('duplicate key')) {
        return c.json({ error: 'Username already exists' }, 409);
      }
      return c.json({ error: (error as Error).message }, 400);
    }
  }

  async login(c: Context) {
    try {
      const body = await c.req.json();

      if (!body.username || !body.password) {
        return c.json({ error: 'Username and password are required' }, 400);
      }

      const result = await userService.login({
        username: body.username,
        password: body.password,
      });

      setCookie(c, ACCESS_TOKEN_COOKIE, result.tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60,
      });

      setCookie(c, REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60,
      });

      return c.json({
        message: result.message,
        userId: result.userId,
        username: result.username,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Invalid credentials') {
        return c.json({ error: errorMessage }, 401);
      }
      return c.json({ error: errorMessage }, 500);
    }
  }

  async logout(c: Context) {
    try {
      const user = getUser(c);
      await userService.logout(user.userId);

      deleteCookie(c, ACCESS_TOKEN_COOKIE, { path: '/' });
      deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: '/' });

      return c.json({ message: 'Logout successful' });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  }

  async refresh(c: Context) {
    try {
      const refreshToken = c.req.header('Cookie')?.match(/refreshToken=([^;]+)/)?.[1];

      if (!refreshToken) {
        return c.json({ error: 'Refresh token required' }, 401);
      }

      const result = await userService.refreshAccessToken(refreshToken);

      setCookie(c, ACCESS_TOKEN_COOKIE, result.tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60,
      });

      setCookie(c, REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60,
      });

      return c.json({ message: result.message });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Invalid or expired refresh token') {
        deleteCookie(c, ACCESS_TOKEN_COOKIE, { path: '/' });
        deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: '/' });
        return c.json({ error: errorMessage }, 401);
      }
      return c.json({ error: errorMessage }, 500);
    }
  }

  async me(c: Context) {
    try {
      const userPayload = getUser(c);
      const user = await userService.findById(userPayload.userId);

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      return c.json({ user });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  }

  async getUserByUsername(c: Context) {
    try {
      const username = c.req.param('username');
      const user = await userService.findByUsername(username);

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      return c.json({ user });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  }
}
