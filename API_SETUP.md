# API Setup Guide

## Neon Auth vs DATABASE_URL

### ❌ Don't Enable Neon Auth (for now)

**Neon Auth** is for dashboard user authentication (login/register). Since we're building custom auth with JWT, you don't need it.

### ✅ You DO Need DATABASE_URL

**DATABASE_URL** is required for your API routes to connect to Neon database.

## Quick Setup

### 1. Get DATABASE_URL from Neon

1. Go to your Neon dashboard
2. Select your project
3. Click "Connection String" or "Connection Details"
4. Copy the connection string (starts with `postgresql://`)

### 2. Set Environment Variables

**For Local Development:**

Create `.env.local` in the root:

```bash
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**For Vercel Deployment:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `DATABASE_URL` = Your Neon connection string
   - `JWT_SECRET` = Random secret (use `openssl rand -base64 32`)
   - `FRONTEND_URL` = Your production URL (e.g., `https://yourapp.vercel.app`)
   - `NODE_ENV` = `production`

### 3. Install Dependencies

```bash
npm install
```

This will install:
- `@neondatabase/serverless` - Neon database client
- `@vercel/node` - Vercel serverless functions
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT tokens

### 4. Run Database Schema

Execute `database/schema.sql` in your Neon SQL editor to create all tables.

### 5. Test Locally

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Run locally (starts both frontend and API)
vercel dev
```

This will:
- Start Vite frontend on `http://localhost:5173`
- Start API routes on `http://localhost:3000/api/*`

## API Endpoints

### Authentication (Dashboard)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires JWT)

### API Keys
- `GET /api/api-keys` - List user's API keys (requires JWT)
- `POST /api/api-keys` - Create new API key (requires JWT)
- `DELETE /api/api-keys/:id` - Revoke API key (requires JWT)

### Documents
- `GET /api/documents` - List documents (JWT or API key)
- `POST /api/documents` - Create document (JWT or API key)
- `GET /api/documents/:id` - Get document (JWT or API key)
- `PUT /api/documents/:id` - Update document (JWT or API key)
- `DELETE /api/documents/:id` - Delete document (JWT or API key)

### Signing Sessions
- `POST /api/sessions` - Create signing session (JWT or API key)
- `GET /api/sessions/:token` - Get session info (public)
- `POST /api/sessions/:token` - Submit form data (public)

## Testing the API

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Use JWT Token

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create API Key

```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyName": "Production Key"}'
```

### Use API Key

```bash
curl http://localhost:3000/api/documents \
  -H "X-API-Key: sk_YOUR_API_KEY"
```

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically:
- Detect `/api` folder
- Deploy each file as a serverless function
- Handle routing

## Summary

- ✅ **DATABASE_URL** - Required (from Neon dashboard)
- ❌ **Neon Auth** - Not needed (we use custom JWT auth)
- ✅ **JWT_SECRET** - Required (generate random string)
- ✅ **FRONTEND_URL** - Required (for CORS and signing links)

