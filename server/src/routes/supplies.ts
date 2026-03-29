import { Router, Response } from 'express';
import pool from '../pool.js';
import { requireAuth, requireVouched, AuthRequest } from '../middleware/auth.js';
import { generateIllustration } from '../services/gemini.js';

const router = Router();

// GET /api/supplies — browse all supplies (with owner info)
router.get('/', requireAuth, requireVouched, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.*,
        p.name AS owner_name,
        p.zip_code AS owner_zip_code,
        p.signal_contact AS owner_signal_contact
      FROM supplies s
      JOIN profiles p ON s.owner_id = p.id
      WHERE s.illustration_url IS NOT NULL AND s.lent_out = false
      ORDER BY s.created_at DESC
    `);

    res.json({ supplies: rows });
  } catch (err: any) {
    console.error('Error fetching supplies:', err);
    res.status(500).json({ error: 'Failed to load supplies' });
  }
});

// GET /api/supplies/my — get current user's supplies
router.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM supplies WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json({ supplies: rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load your supplies' });
  }
});

// POST /api/supplies — add a new supply
router.post('/', requireAuth, requireVouched, async (req: AuthRequest, res: Response) => {
  const {
    name, description, category, condition,
    neighborhood, cross_streets, contact_email,
    images, image_url, house_rules, lender_notes
  } = req.body;

  if (!name || !description || !category) {
    res.status(400).json({ error: 'Name, description, and category are required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO supplies (
        name, description, category, condition,
        neighborhood, cross_streets, contact_email,
        images, image_url, house_rules, lender_notes, owner_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        name, description, category, condition || 'good',
        neighborhood, cross_streets, contact_email,
        images, image_url, house_rules, lender_notes, req.user!.id
      ]
    );

    res.status(201).json({ supply: rows[0] });

    // Generate illustration in the background (only if an image was provided)
    const supplyId = rows[0].id;
    if (images && images.length > 0) {
      generateIllustration(name, description)
        .then(async (illustrationUrl) => {
          if (illustrationUrl) {
            await pool.query(
              'UPDATE supplies SET illustration_url = $1 WHERE id = $2',
              [illustrationUrl, supplyId]
            );
            console.log(`✅ Illustration generated for "${name}"`);
          }
        })
        .catch(err => console.error(`Illustration generation failed for "${name}":`, err.message));
    } else {
      // Mark as 'none' so it appears immediately without waiting for an image
      await pool.query(
        "UPDATE supplies SET illustration_url = 'none' WHERE id = $1",
        [supplyId]
      );
    }

  } catch (err: any) {
    console.error('Error adding supply:', err);
    res.status(500).json({ error: 'Failed to add supply' });
  }
});

// PUT /api/supplies/:id — update a supply
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Verify ownership
    const existing = await pool.query('SELECT owner_id FROM supplies WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Supply not found' });
      return;
    }
    if (existing.rows[0].owner_id !== req.user!.id && req.user!.role !== 'steward') {
      res.status(403).json({ error: 'You can only edit your own supplies' });
      return;
    }

    // Build dynamic update query
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'owner_id' && k !== 'created_at');
    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`);
    setClauses.push(`updated_at = now()`);
    const values = fields.map(f => updates[f]);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE supplies SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    res.json({ supply: rows[0] });
  } catch (err: any) {
    console.error('Error updating supply:', err);
    res.status(500).json({ error: 'Failed to update supply' });
  }
});

// DELETE /api/supplies/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  console.log(`[DELETE] Supply ${id} requested by user ${req.user!.id} (role: ${req.user!.role})`);

  try {
    const existing = await pool.query('SELECT owner_id FROM supplies WHERE id = $1', [id]);
    console.log(`[DELETE] Found ${existing.rows.length} rows for supply ${id}`);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Supply not found' });
      return;
    }
    console.log(`[DELETE] Owner: ${existing.rows[0].owner_id}, Requester: ${req.user!.id}, Is steward: ${req.user!.role === 'steward'}`);
    if (existing.rows[0].owner_id !== req.user!.id && req.user!.role !== 'steward') {
      res.status(403).json({ error: 'You can only delete your own supplies' });
      return;
    }

    // Delete related supply_requests first (in case CASCADE is not set on existing DB)
    await pool.query('DELETE FROM supply_requests WHERE supply_id = $1', [id]);
    console.log(`[DELETE] Cleared supply_requests for ${id}`);

    await pool.query('DELETE FROM supplies WHERE id = $1', [id]);
    console.log(`[DELETE] Successfully deleted supply ${id}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE] Error deleting supply:', err);
    res.status(500).json({ error: 'Failed to delete supply: ' + err.message });
  }
});

export default router;
