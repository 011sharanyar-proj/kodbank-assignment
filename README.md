# Kodbank

A banking app with user registration, login (JWT), and balance check. Uses Aiven PostgreSQL.

## Features

1. **Register** – Create account with uid, username, password, email, phone, role (customer only). Initial balance: ₹100,000.
2. **Login** – Username/password validation, JWT generation (subject: username, claim: role), token stored in `UserToken`, cookie set.
3. **Dashboard** – Check balance with JWT verification; displays balance with celebration animation.

## Database (Aiven PostgreSQL)

Tables:

- **KodUser**: uid, username, email, password, balance, phone, role
- **UserToken**: tid, token, uid, expiry

### Setup

1. Copy `.env.example` to `.env`
2. Set Aiven credentials:

```env
DB_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=your-secure-random-secret
```

Or use individual vars: `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`.

3. Optional: place `ca.pem` in `server/` for strict SSL, or set `PG_CA_PATH`.

## Stages

### Build

```bash
npm install
npm run build
```

### Test

```bash
# Terminal 1: start server
npm run server

# Terminal 2: run API tests
npm run test
```

### Deploy

**Docker**

```bash
docker build -t kodbank .
docker run -p 4000:4000 -e DB_URL="..." -e JWT_SECRET="..." kodbank
```

**Manual**

```bash
npm run deploy:prep   # builds frontend
NODE_ENV=production npm run server
```

Serve API + static files on port 4000. Set `PORT` if needed.

**Vercel**

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project root
3. Follow prompts (link to GitHub repo or deploy directly)
4. Set environment variables in Vercel dashboard:
   - `DB_URL` (or `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`)
   - `JWT_SECRET`
   - `ALLOW_ORIGIN` (optional, defaults to your Vercel domain)
5. Deploy: `vercel --prod`

Or connect your GitHub repo in [Vercel Dashboard](https://vercel.com) for automatic deployments.
