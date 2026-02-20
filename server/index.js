import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, initDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-kodbank-key-change-in-production';
const JWT_EXPIRES_IN = '1h';

app.use(express.json());
app.use(cookieParser());

if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// CORS for frontend dev
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Health route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Register new user
app.post('/api/register', async (req, res) => {
  const { uid, uname, password, email, phone, role } = req.body ?? {};

  if (!uid || !uname || !password || !email || !phone) {
    return res.status(400).json({ message: 'uid, uname, password, email and phone are required' });
  }

  if (role && role !== 'customer') {
    return res.status(400).json({ message: 'Only role customer is allowed' });
  }

  try {
    const exists = await pool.query(
      'SELECT 1 FROM "KodUser" WHERE username = $1 OR uid = $2',
      [uname, uid]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'User with same uid/username exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO "KodUser" (uid, username, email, password, balance, phone, role)
       VALUES ($1, $2, $3, $4, 100000, $5, 'customer')`,
      [uid, uname, email, passwordHash, phone]
    );
    return res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { uname, password } = req.body ?? {};

  if (!uname || !password) {
    return res.status(400).json({ message: 'uname and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT uid, username, password, role FROM "KodUser" WHERE username = $1',
      [uname]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordOk = await bcrypt.compare(password, row.password);
    if (!passwordOk) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ role: row.role }, JWT_SECRET, {
      subject: row.username,
      expiresIn: JWT_EXPIRES_IN
    });

    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO "UserToken" (token, uid, expiry) VALUES ($1, $2, $3)',
      [token, row.uid, expiry]
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });

    return res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// JWT verification middleware
function verifyJwt(req, res, next) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    req.authToken = token;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Balance endpoint
app.get('/api/balance', verifyJwt, async (req, res) => {
  try {
    const username = req.auth?.sub;
    if (!username) {
      return res.status(400).json({ message: 'Invalid token subject' });
    }

    const result = await pool.query(
      'SELECT balance FROM "KodUser" WHERE username = $1',
      [username]
    );
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ balance: row.balance });
  } catch (err) {
    console.error('Balance error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// SPA fallback in production
if (isProduction) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Kodbank backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
