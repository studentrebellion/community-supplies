import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../pool.js';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res: Response) => {
  const { username, password, name, signal_contact, signal_contact_type } = req.body;

  if (!username || !password || !name || !signal_contact) {
    res.status(400).json({ error: 'Username, password, name, and Signal contact are required' });
    return;
  }

  if (username.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters' });
    return;
  }

  if (/[^a-zA-Z0-9_.-]/.test(username)) {
    res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, dots, and hyphens' });
    return;
  }

  try {
    // Check if username already exists
    const existing = await pool.query('SELECT id FROM profiles WHERE username = $1', [username.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'This username is already taken' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO profiles (username, name, password_hash, signal_contact)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, name, role, vouched_at, signal_contact`,
      [username.toLowerCase(), name, passwordHash, signal_contact]
    );

    const user = rows[0];
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, name, role, vouched_at, signal_contact, password_hash FROM profiles WHERE username = $1',
      [username.toLowerCase()]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — get current user from token
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
