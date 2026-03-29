import { Router, Response } from 'express';
import pool from '../pool.js';
import { requireAuth, requireSteward, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/community — submit a community start request
router.post('/', async (req, res: Response) => {
  const { name, email, co_stewards, reason, questions } = req.body;

  if (!name || !email || !reason) {
    res.status(400).json({ error: 'Name, email, and reason are required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO community_steward_requests (name, email, co_stewards, reason, questions)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, email, JSON.stringify(co_stewards || []), reason, questions || null]
    );

    res.status(201).json({ request: rows[0] });
  } catch (err: any) {
    console.error('Error submitting community request:', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// GET /api/community — steward: view all community requests
router.get('/', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM community_steward_requests ORDER BY created_at DESC'
    );
    res.json({ requests: rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load community requests' });
  }
});

export default router;
