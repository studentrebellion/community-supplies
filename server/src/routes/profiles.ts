import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../pool.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/profiles/me — get current user's full profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, name, role, vouched_at, vouched_by, intro_text, zip_code, signal_contact, created_at, updated_at FROM profiles WHERE id = $1',
      [req.user!.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({ profile: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PUT /api/profiles/me — update current user's profile
router.put('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, intro_text, zip_code, signal_contact } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE profiles SET
        name = COALESCE($1, name),
        intro_text = COALESCE($2, intro_text),
        zip_code = COALESCE($3, zip_code),
        signal_contact = COALESCE($4, signal_contact),
        updated_at = now()
       WHERE id = $5
       RETURNING id, username, name, role, vouched_at, intro_text, zip_code, signal_contact, updated_at`,
      [name, intro_text, zip_code, signal_contact, req.user!.id]
    );

    res.json({ profile: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/profiles/:id — get public profile info
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, username, vouched_at, zip_code, signal_contact FROM profiles WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({ profile: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PUT /api/profiles/me/password — change password
router.put('/me/password', requireAuth, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new passwords are required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT password_hash FROM profiles WHERE id = $1',
      [req.user!.id]
    );

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE profiles SET password_hash = $1, updated_at = now() WHERE id = $2',
      [newHash, req.user!.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
