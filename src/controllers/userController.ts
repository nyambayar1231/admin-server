import type { Context } from 'hono';
import { UserService } from '../services/userService.js';

const userService = new UserService();

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

      return c.json(result);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Invalid credentials') {
        return c.json({ error: errorMessage }, 401);
      }
      return c.json({ error: errorMessage }, 500);
    }
  }

  async getUserByUsername(c: Context) {
    try {
      console.log({ c });
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
