import { Router, Response } from 'express';
import pool from '../pool.js';
import { requireAuth, requireVouched, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/contact — send a contact message about a supply
router.post('/', requireAuth, requireVouched, async (req: AuthRequest, res: Response) => {
  const { supply_id, supply_name, supply_owner_id, sender_name, sender_contact, message } = req.body;

  if (!supply_id || !sender_name || !sender_contact || !message) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO supply_requests (supply_id, supply_name, supply_owner_id, sender_name, sender_contact, message)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [supply_id, supply_name, supply_owner_id, sender_name, sender_contact, message]
    );

    console.log(`Contact request for supply "${supply_name}" saved.`);

    res.status(201).json({ request: rows[0] });
  } catch (err: any) {
    console.error('Error sending contact message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
