import { Router, Response } from 'express';
import pool from '../pool.js';
import { requireAuth, requireSteward, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/steward/members — list all members
router.get('/members', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, name, role, vouched_at, vouched_by, zip_code, signal_contact, created_at
       FROM profiles ORDER BY created_at DESC`
    );
    res.json({ members: rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load members' });
  }
});

// PUT /api/steward/vouch/:userId — directly vouch a user
router.put('/vouch/:userId', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const { rows } = await pool.query(
      `UPDATE profiles SET vouched_at = now(), vouched_by = $1, updated_at = now()
       WHERE id = $2 RETURNING id, username, name, role, vouched_at`,
      [req.user!.id, userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ member: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to vouch member' });
  }
});

// GET /api/steward/supplies — list all supplies
router.get('/supplies', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, p.name AS owner_name, p.username AS owner_username, p.signal_contact AS owner_signal_contact
      FROM supplies s
      JOIN profiles p ON s.owner_id = p.id
      ORDER BY s.created_at DESC
    `);
    res.json({ supplies: rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load supplies' });
  }
});

// GET /api/steward/requests — list all supply requests
router.get('/requests', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM supply_requests ORDER BY created_at DESC'
    );
    res.json({ requests: rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// GET /api/steward/site-config/:key
router.get('/site-config/:key', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT value FROM site_config WHERE key = $1', [req.params.key]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Config key not found' });
      return;
    }
    res.json({ value: rows[0].value });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load config' });
  }
});

// PUT /api/steward/site-config/:key
router.put('/site-config/:key', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  const { value } = req.body;
  try {
    await pool.query(
      `INSERT INTO site_config (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
      [req.params.key, JSON.stringify(value)]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

export default router;
