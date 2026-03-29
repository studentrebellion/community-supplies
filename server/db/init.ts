import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env');
    console.error('   1. Create a PostgreSQL database on Railway');
    console.error('   2. Copy the DATABASE_URL from the Variables tab');
    console.error('   3. Paste it into your .env file');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('railway') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📋 Running schema.sql...');
    await client.query(schema);
    console.log('✅ Schema created successfully!');
    console.log('');
    console.log('Your database is ready. Next steps:');
    console.log('  1. Fill in JWT_SECRET and GEMINI_API_KEY in .env');
    console.log('  2. Run: npm run dev');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('⚠️  Some objects already exist (schema may have been run before).');
      console.log('   This is usually fine — your database is probably already set up.');
    } else {
      console.error('❌ Error running schema:', err.message);
    }
  } finally {
    await client.end();
  }
}

initDatabase();
