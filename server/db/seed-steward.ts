import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function createSteward() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const hash = await bcrypt.hash('TempPass123!', 12);

  const { rows } = await client.query(
    `INSERT INTO profiles (username, name, password_hash, role, vouched_at, signal_contact)
     VALUES ('andrew', 'Andrew', $1, 'steward', now(), 'pir2.67')
     ON CONFLICT (username)
     DO UPDATE SET role = 'steward', vouched_at = now(), signal_contact = 'pir2.67'
     RETURNING id, username, name, role, vouched_at`,
    [hash]
  );

  console.log('✅ Steward account ready:', JSON.stringify(rows[0], null, 2));
  console.log('');
  console.log('Login with:');
  console.log('  Username: andrew');
  console.log('  Password: TempPass123!');
  console.log('');
  console.log('⚠️  Change your password after first login!');

  await client.end();
}

createSteward();
