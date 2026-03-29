import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import authRoutes from './routes/auth.js';
import suppliesRoutes from './routes/supplies.js';
import booksRoutes from './routes/books.js';
import profilesRoutes from './routes/profiles.js';
import joinRequestsRoutes from './routes/join-requests.js';
import communityRoutes from './routes/community.js';
import contactRoutes from './routes/contact.js';
import stewardRoutes from './routes/steward.js';
import aiRoutes from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || true
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/supplies', suppliesRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/join-requests', joinRequestsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/steward', stewardRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production, serve the built React app
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
