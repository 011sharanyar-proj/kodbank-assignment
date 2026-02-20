import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool, initDb } from '../server/db.js';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-kodbank-key-change-in-production';
const JWT_EXPIRES_IN = '1h';

app.use(express.json());
app.use(cookieParser());

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin || process.env.ALLOW_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize DB on first request
let dbInitialized = false;
app.use(async (_req, _res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (err) {
      console.error('DB init error:', err);
    }
  }
  next();
});

// Health route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Register new user
app.post('/register', async (req, res) => {
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

    const passwordHash = bcrypt.hashSync(password, 10);
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
app.post('/login', async (req, res) => {
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

    const passwordOk = bcrypt.compareSync(password, row.password);
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
      sameSite: 'none',
      secure: true,
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
app.get('/balance', verifyJwt, async (req, res) => {
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

// Vercel serverless function handler
export default app;
