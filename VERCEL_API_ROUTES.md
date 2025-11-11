# Vercel Serverless API Routes Guide

## What are Serverless Functions?

**Traditional Server:**
```
Your app runs 24/7 on a server
- Always consuming resources
- You pay for uptime
- One process handles all requests
```

**Serverless Functions:**
```
Each API endpoint = separate function
- Only runs when called
- Auto-scales (0 to thousands)
- Pay per request
- Each request = fresh execution
```

## How Vercel API Routes Work

Vercel automatically detects API routes in your project:

```
your-project/
├── api/                    # Vercel auto-detects this!
│   ├── auth/
│   │   └── login.ts        # → /api/auth/login
│   ├── documents.ts        # → /api/documents
│   └── webhooks.ts         # → /api/webhooks
├── src/                    # Your Vite frontend
└── vercel.json             # Optional config
```

**Each `.ts` file = one API endpoint**

## Setup for Your Vite App

### 1. Create API Folder Structure

```
signature-kit-pro/
├── api/                    # NEW - Vercel API routes
│   ├── auth/
│   │   ├── login.ts
│   │   └── register.ts
│   ├── api-keys/
│   │   ├── index.ts        # GET, POST /api/api-keys
│   │   └── [id].ts         # DELETE /api/api-keys/:id
│   ├── documents/
│   │   ├── index.ts
│   │   └── [id].ts
│   └── sessions/
│       └── [token].ts
├── src/                    # Your existing frontend
└── vercel.json             # Vercel config
```

### 2. Install Dependencies

```bash
npm install @vercel/node
npm install @neondatabase/serverless  # For Neon DB
npm install bcrypt                     # For password hashing
npm install jsonwebtoken              # For JWT tokens
npm install zod                       # For validation
```

### 3. Example API Route

**`api/auth/login.ts`:**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user from database
    const user = await sql`
      SELECT id, email, password_hash, name, subscription_tier
      FROM users
      WHERE email = ${email} AND active = true
    `;

    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await sql`
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = ${user[0].id}
    `;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user[0].id, email: user[0].email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    return res.status(200).json({
      token,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        subscriptionTier: user[0].subscription_tier,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 4. Dynamic Routes

**`api/documents/[id].ts`** (handles `/api/documents/:id`):

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query; // Vercel automatically parses [id]

  if (req.method === 'GET') {
    // Get document
    const doc = await sql`
      SELECT * FROM documents
      WHERE id = ${id} AND user_id = ${req.userId}  // From auth middleware
    `;
    return res.json(doc[0]);
  }

  if (req.method === 'DELETE') {
    // Delete document
    await sql`
      DELETE FROM documents
      WHERE id = ${id} AND user_id = ${req.userId}
    `;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

### 5. Create vercel.json (Optional)

**`vercel.json`** at root:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  }
}
```

### 6. Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=production
```

Or create `.env.local` for local development:

```bash
# .env.local
DATABASE_URL=postgresql://...
JWT_SECRET=dev-secret-key
```

### 7. Local Development

Install Vercel CLI:

```bash
npm install -g vercel
```

Run locally:

```bash
vercel dev
```

This will:
- Start your Vite frontend
- Start API routes
- Simulate Vercel environment

## Request/Response Flow

```
Frontend (Vite)          Vercel API Route
     |                          |
     |  POST /api/auth/login    |
     |------------------------->|
     |                          |  Query Neon DB
     |                          |  Hash password
     |                          |  Generate JWT
     |  { token, user }         |
     |<-------------------------|
     |                          |
```

## Pros & Cons

### ✅ Pros:
- **Zero config** - Just create files
- **Auto-scaling** - Handles traffic spikes
- **Pay per use** - Free tier is generous
- **Fast cold starts** - Usually <100ms
- **Deploy together** - Frontend + API in one deploy

### ❌ Cons:
- **Cold starts** - First request can be slower
- **10s timeout** (30s on Pro) - Not good for long operations
- **No persistent connections** - Each request is isolated
- **Webhooks tricky** - Need queue for retries

## For Your Use Case

**Good for:**
- ✅ Dashboard API (login, documents, API keys)
- ✅ Signing session creation
- ✅ Quick CRUD operations

**Consider separate server for:**
- ⚠️ Webhook delivery (needs retries, queue)
- ⚠️ Long-running PDF generation
- ⚠️ Background jobs

## Hybrid Approach (Recommended)

```
Vercel (Serverless):
  - Frontend
  - Dashboard API routes
  - Session creation

Railway/Render (Traditional):
  - Webhook delivery service
  - Background jobs
  - Long-running tasks
```

## Example: Full API Structure

```
api/
├── auth/
│   ├── login.ts           # POST /api/auth/login
│   ├── register.ts        # POST /api/auth/register
│   └── me.ts              # GET /api/auth/me (with auth middleware)
├── api-keys/
│   ├── index.ts           # GET, POST /api/api-keys
│   └── [id].ts            # DELETE /api/api-keys/:id
├── documents/
│   ├── index.ts           # GET, POST /api/documents
│   └── [id].ts            # GET, PUT, DELETE /api/documents/:id
├── sessions/
│   ├── index.ts           # POST /api/sessions (create)
│   └── [token].ts         # GET, POST /api/sessions/:token
└── _middleware.ts         # Shared auth middleware
```

## Next Steps

1. Create `/api` folder
2. Install `@vercel/node`
3. Create first route (`api/auth/login.ts`)
4. Test locally with `vercel dev`
5. Deploy to Vercel (auto-detects API routes!)

Want me to scaffold the initial API structure?

