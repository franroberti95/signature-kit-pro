# Backend Structure Recommendation

## Recommended: Monorepo (Same Repo, Separate Folder)

```
signature-kit-pro/
├── src/                    # Frontend (Vite React app)
│   ├── pages/
│   ├── components/
│   └── ...
├── api/                    # Backend API (NEW)
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── routes/
│   │   │   ├── auth.ts     # Login, register
│   │   │   ├── users.ts    # User management
│   │   │   ├── apiKeys.ts  # API key CRUD
│   │   │   ├── documents.ts # Document CRUD
│   │   │   ├── sessions.ts # Signing sessions
│   │   │   └── webhooks.ts # Webhook management
│   │   ├── middleware/
│   │   │   ├── auth.ts     # Auth middleware
│   │   │   └── apiKey.ts   # API key validation
│   │   ├── db/
│   │   │   └── client.ts   # Database connection (Neon)
│   │   ├── utils/
│   │   │   ├── crypto.ts   # Key generation, hashing
│   │   │   └── webhooks.ts # Webhook delivery
│   │   └── types/
│   │       └── index.ts    # Shared types
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── schema.sql
└── package.json            # Root package.json (optional workspace)
```

## Backend Framework Options

### Option 1: Hono (Recommended - Fast, Modern)
```bash
cd api
npm init -y
npm install hono @hono/node-server
npm install -D @types/node typescript
```

**Pros:**
- Very fast (Edge-ready)
- TypeScript-first
- Simple API
- Works with serverless

### Option 2: Express (Traditional)
```bash
cd api
npm init -y
npm install express
npm install -D @types/express @types/node typescript
```

**Pros:**
- Most popular
- Lots of middleware
- Easy to find help

### Option 3: Fastify (Fast Alternative)
```bash
cd api
npm install fastify
```

**Pros:**
- Very fast
- TypeScript support
- Plugin ecosystem

## Database Connection

Use `@neondatabase/serverless` or `pg`:

```bash
npm install @neondatabase/serverless
# or
npm install pg
```

## Environment Variables

Create `.env` in root:
```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# JWT (for dashboard sessions)
JWT_SECRET=your-secret-key

# API
API_PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Development Scripts

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "dev:api": "cd api && npm run dev",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:api\"",
    "build": "vite build",
    "build:api": "cd api && npm run build"
  }
}
```

## Deployment Options

### Option 1: Vercel (Recommended for MVP)
- Deploy frontend + API routes together
- Serverless functions
- Easy setup

### Option 2: Railway/Render
- Full Node.js app
- Persistent connections
- Good for webhooks

### Option 3: Separate Services
- Frontend: Vercel/Netlify
- Backend: Railway/Render
- More complex but flexible

## API Routes Structure

```
/api/auth/login          POST   - Dashboard login
/api/auth/register       POST   - Dashboard registration
/api/auth/me             GET    - Get current user

/api/api-keys            GET    - List user's API keys
/api/api-keys            POST   - Create new API key
/api/api-keys/:id        DELETE - Revoke API key

/api/documents            GET    - List documents (dashboard)
/api/documents            POST   - Create document (API)
/api/documents/:id        GET    - Get document
/api/documents/:id        PUT    - Update document
/api/documents/:id        DELETE - Delete document

/api/sessions             POST   - Create signing session
/api/sessions/:token      GET    - Get session (public)
/api/sessions/:token      POST   - Submit form data (public)

/api/webhooks             GET    - List webhooks
/api/webhooks             POST   - Create webhook
/api/webhooks/:id         DELETE - Delete webhook
```

## When to Split Later

Consider separate repo if:
- Different teams work on frontend/backend
- Different deployment schedules
- Different tech stacks needed
- Scale requires separate infrastructure

For MVP: **Keep together!**

