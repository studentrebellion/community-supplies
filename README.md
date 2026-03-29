# Community Supplies (Railway + Gemini)

A neighborhood supply-sharing library — rebuilt for Railway and Google Gemini.

Originally based on [Community Supplies](https://github.com/relational-tech-project/community-supplies), but re-architected to run on **Railway** (Express + PostgreSQL) instead of Supabase, and uses **Google Gemini** instead of OpenAI for AI features.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js (TypeScript)
- **Database**: PostgreSQL (Railway addon)
- **AI**: Google Gemini 2.0 Flash (image analysis, bookshelf scanning)
- **Auth**: Custom JWT (bcrypt + jsonwebtoken)

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or Railway)
- Google Gemini API key

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Set up environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Initialize the database

```bash
psql $DATABASE_URL < server/db/schema.sql
```

### 4. Run in development

```bash
npm run dev
```

This starts both the Express server (port 3001) and Vite dev server (port 5173) with API proxying.

### 5. Deploy to Railway

1. Create a new Railway project
2. Add a PostgreSQL addon
3. Connect your repo
4. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `NODE_ENV=production`
5. Deploy

## Key Differences from Original

| Feature | Original (Supabase) | This Version (Railway) |
|---|---|---|
| Auth | Supabase Auth | Custom JWT |
| Database | Supabase PostgreSQL | Railway PostgreSQL |
| Serverless Functions | Supabase Edge Functions | Express API routes |
| Storage | Supabase Storage | Multer + memory |
| AI | OpenAI | Google Gemini |
| Client SDK | @supabase/supabase-js | Custom fetch API client |
