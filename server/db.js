import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DB_URL;
const pgHost = process.env.PG_HOST;
const pgPort = process.env.PG_PORT;
const pgUser = process.env.PG_USER;
const pgPassword = process.env.PG_PASSWORD;
const pgDatabase = process.env.PG_DATABASE;
const pgCaPath = process.env.PG_CA_PATH;

let sslConfig = false;
if (dbUrl && dbUrl.includes('sslmode=require')) {
  sslConfig = { rejectUnauthorized: false };
} else if (pgCaPath) {
  try {
    const ca = fs.readFileSync(pgCaPath).toString();
    sslConfig = { rejectUnauthorized: true, ca };
  } catch {
    sslConfig = { rejectUnauthorized: false };
  }
} else if (pgHost?.includes('aivencloud.com')) {
  const caPath = path.join(__dirname, 'ca.pem');
  if (fs.existsSync(caPath)) {
    sslConfig = { rejectUnauthorized: true, ca: fs.readFileSync(caPath).toString() };
  } else {
    sslConfig = { rejectUnauthorized: false };
  }
}

const poolConfig = dbUrl
  ? {
      connectionString: dbUrl,
      ssl: sslConfig
    }
  : {
      host: pgHost || 'localhost',
      port: parseInt(pgPort || '5432', 10),
      user: pgUser || 'postgres',
      password: pgPassword || 'postgres',
      database: pgDatabase || 'kodbank',
      ssl: sslConfig
    };

const pool = new pg.Pool(poolConfig);

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "KodUser" (
        uid VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        balance BIGINT NOT NULL DEFAULT 100000,
        phone VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role = 'customer')
      );

      CREATE TABLE IF NOT EXISTS "UserToken" (
        tid SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        uid VARCHAR(100) NOT NULL REFERENCES "KodUser"(uid) ON DELETE CASCADE,
        expiry TIMESTAMP WITH TIME ZONE NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_usertoken_uid ON "UserToken"(uid);
      CREATE INDEX IF NOT EXISTS idx_usertoken_expiry ON "UserToken"(expiry);
    `);
  } finally {
    client.release();
  }
}

export { pool, initDb };
export default pool;
