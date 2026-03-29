import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth, requireVouched, AuthRequest } from '../middleware/auth.js';
import { draftItemFromImage, scanBookshelf, generateIllustrationPrompt } from '../services/gemini.js';
import pool from '../pool.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/ai/draft-from-image — upload an image, get AI-drafted item data
router.post('/draft-from-image', requireAuth, requireVouched, upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image provided' });
    return;
  }

  try {
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const draft = await draftItemFromImage(base64, mimeType);

    res.json(draft);
  } catch (err: any) {
    console.error('AI draft error:', err);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// POST /api/ai/scan-bookshelf — upload a bookshelf photo, get detected books
router.post('/scan-bookshelf', requireAuth, requireVouched, upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image provided' });
    return;
  }

  try {
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const books = await scanBookshelf(base64, mimeType);

    res.json({ books });
  } catch (err: any) {
    console.error('Bookshelf scan error:', err);
    res.status(500).json({ error: 'Failed to scan bookshelf' });
  }
});

// POST /api/ai/generate-illustration — generate illustration prompt for a supply
router.post('/generate-illustration', requireAuth, async (req: AuthRequest, res: Response) => {
  const { supplyId, itemName, description } = req.body;

  if (!supplyId || !itemName) {
    res.status(400).json({ error: 'supplyId and itemName are required' });
    return;
  }

  try {
    const prompt = await generateIllustrationPrompt(itemName, description || '');

    // Store the prompt as a placeholder illustration_url
    // In production, you'd call an image generation API here
    await pool.query(
      'UPDATE supplies SET illustration_url = $1, updated_at = now() WHERE id = $2',
      [`gemini-prompt:${prompt}`, supplyId]
    );

    res.json({ prompt, message: 'Illustration prompt generated' });
  } catch (err: any) {
    console.error('Illustration generation error:', err);
    res.status(500).json({ error: 'Failed to generate illustration' });
  }
});

export default router;
