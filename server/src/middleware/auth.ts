import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../pool.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
  vouched_at: string | null;
  signal_contact: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Generate JWT token
export function generateToken(user: { id: string; username: string }): string {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

// Verify JWT and attach user to request
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };

    const { rows } = await pool.query(
      'SELECT id, username, name, role, vouched_at, signal_contact FROM profiles WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Require user to be vouched
export async function requireVouched(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (!req.user.vouched_at) {
    res.status(403).json({ error: 'You must be vouched by a steward to access this' });
    return;
  }
  next();
}

// Require user to be a steward
export async function requireSteward(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (req.user.role !== 'steward') {
    res.status(403).json({ error: 'Steward access required' });
    return;
  }
  next();
}

// Optional auth — attaches user if token present, but doesn't block
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };

    const { rows } = await pool.query(
      'SELECT id, username, name, role, vouched_at, signal_contact FROM profiles WHERE id = $1',
      [decoded.id]
    );

    if (rows.length > 0) {
      req.user = rows[0];
    }
  } catch {
    // Token invalid, just continue without user
  }

  next();
}
