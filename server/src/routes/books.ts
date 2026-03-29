import { Router, Response } from 'express';
import pool from '../pool.js';
import { requireAuth, requireVouched, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/books — browse all books with owner info
router.get('/', requireAuth, requireVouched, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        b.*,
        p.name AS owner_name,
        p.email AS owner_email
      FROM books b
      JOIN profiles p ON b.owner_id = p.id
      ORDER BY b.title ASC
    `);
    res.json({ books: rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load books' });
  }
});

// GET /api/books/my — current user's books
router.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM books WHERE owner_id = $1 ORDER BY title ASC',
      [req.user!.id]
    );
    res.json({ books: rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load your books' });
  }
});

// POST /api/books — add one or more books
router.post('/', requireAuth, requireVouched, async (req: AuthRequest, res: Response) => {
  const { books: newBooks } = req.body;

  if (!Array.isArray(newBooks) || newBooks.length === 0) {
    res.status(400).json({ error: 'Provide an array of books' });
    return;
  }

  try {
    const inserted = [];
    for (const book of newBooks) {
      const { rows } = await pool.query(
        `INSERT INTO books (title, author, genre, condition, house_rules, lender_notes, owner_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          book.title,
          book.author || null,
          book.genre || null,
          book.condition || 'good',
          book.house_rules || [],
          book.lender_notes || null,
          req.user!.id,
        ]
      );
      inserted.push(rows[0]);
    }

    res.status(201).json({ books: inserted });
  } catch (err: any) {
    console.error('Error adding books:', err);
    res.status(500).json({ error: 'Failed to add books' });
  }
});

// PUT /api/books/:id
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const existing = await pool.query('SELECT owner_id FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    if (existing.rows[0].owner_id !== req.user!.id) {
      res.status(403).json({ error: 'You can only edit your own books' });
      return;
    }

    const fields = Object.keys(updates).filter(k => !['id', 'owner_id', 'created_at'].includes(k));
    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`);
    setClauses.push('updated_at = now()');
    const values = fields.map(f => updates[f]);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE books SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    res.json({ book: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /api/books/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await pool.query('SELECT owner_id FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    if (existing.rows[0].owner_id !== req.user!.id) {
      res.status(403).json({ error: 'You can only delete your own books' });
      return;
    }

    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;
