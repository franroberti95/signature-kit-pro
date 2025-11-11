# How to Access Your API Routes

## With Vercel Dev

When you run `vercel dev`, it:
1. Starts Vercel dev server (usually on port 3000)
2. Proxies your Vite frontend
3. Serves API routes from `api/` folder

### Access Points:

**Frontend:**
- `http://localhost:3000` - Vercel dev (recommended - includes API)
- `http://localhost:8081` - Direct Vite (frontend only, no API)

**API Routes:**
- `http://localhost:3000/api/*` - All API routes
- `http://localhost:3000/api/example-hello` - Example route
- `http://localhost:3000/api/auth/login` - Login endpoint
- `http://localhost:3000/api/documents` - Documents endpoint

## Testing API Routes

### Using curl:

```bash
# Test example route
curl http://localhost:3000/api/example-hello

# Test auth register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test auth login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using your frontend:

```typescript
// In your React components
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

## Available API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires JWT)

### API Keys
- `GET /api/api-keys` - List API keys (requires JWT)
- `POST /api/api-keys` - Create API key (requires JWT)
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

## Important Notes

1. **Use port 3000** - Vercel dev runs on 3000 and handles both frontend and API
2. **Port 8081** - Direct Vite, frontend only (no API routes)
3. **API routes are at `/api/*`** - All routes are prefixed with `/api/`
4. **CORS is configured** - API routes allow requests from any origin (for development)

## Production

In production (Vercel deployment):
- Frontend: `https://yourapp.vercel.app`
- API: `https://yourapp.vercel.app/api/*`

Same URLs, Vercel handles routing automatically!

