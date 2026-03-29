import { Router, Response } from 'express';
import pool from '../pool.js';
import { requireAuth, requireSteward, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/join-requests — submit a join request (with signup)
router.post('/', async (req, res: Response) => {
  const { name, email, cross_streets, referral_source, phone_number, user_id } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO join_requests (user_id, name, email, cross_streets, referral_source, phone_number)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user_id || null, name, email || null, cross_streets, referral_source, phone_number || null]
    );

    res.status(201).json({ request: rows[0] });
  } catch (err: any) {
    console.error('Error submitting join request:', err);
    res.status(500).json({ error: 'Failed to submit join request' });
  }
});

// GET /api/join-requests — steward: view all join requests
router.get('/', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM join_requests ORDER BY requested_at DESC'
    );
    res.json({ requests: rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load join requests' });
  }
});

// PUT /api/join-requests/:id/vouch — steward: vouch for a member
router.put('/:id/vouch', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Update the join request
    const { rows: requestRows } = await pool.query(
      `UPDATE join_requests SET status = 'vouched', reviewed_by = $1, reviewed_at = now()
       WHERE id = $2 RETURNING *`,
      [req.user!.id, id]
    );

    if (requestRows.length === 0) {
      res.status(404).json({ error: 'Join request not found' });
      return;
    }

    const request = requestRows[0];

    // If the join request is linked to a user, vouch that user's profile
    if (request.user_id) {
      await pool.query(
        `UPDATE profiles SET vouched_at = now(), vouched_by = $1, updated_at = now()
         WHERE id = $2`,
        [req.user!.id, request.user_id]
      );
    }

    res.json({ request: requestRows[0], message: 'Member vouched successfully' });
  } catch (err: any) {
    console.error('Error vouching member:', err);
    res.status(500).json({ error: 'Failed to vouch member' });
  }
});

// PUT /api/join-requests/:id/reject — steward: reject a request
router.put('/:id/reject', requireAuth, requireSteward, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `UPDATE join_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = now()
       WHERE id = $2 RETURNING *`,
      [req.user!.id, id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Join request not found' });
      return;
    }

    res.json({ request: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

export default router;
