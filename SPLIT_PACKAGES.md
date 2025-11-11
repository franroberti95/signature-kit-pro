# Split Package.json Setup

## Structure

```
signature-kit-pro/
├── package.json          # Frontend dependencies only
├── api/
│   ├── package.json     # Backend dependencies only
│   └── tsconfig.json    # TypeScript config for API
```

## Installation

### First Time Setup

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd api && npm install
```

### Or use the helper script:

```bash
npm run install:all
```

The `postinstall` hook will automatically install API dependencies when you run `npm install` in the root.

## Benefits

✅ **Faster Vite builds** - No backend packages to scan  
✅ **Smaller node_modules** - Frontend only  
✅ **Clear separation** - Frontend vs Backend  
✅ **Faster installs** - Less to download for frontend  

## Dependencies

### Frontend (`package.json`)
- React, UI components, Vite, etc.
- No backend packages

### Backend (`api/package.json`)
- `@neondatabase/serverless`
- `@vercel/node`
- `bcrypt`
- `jsonwebtoken`
- TypeScript types

## Development

```bash
# Frontend dev
npm run dev

# Backend (via Vercel)
vercel dev  # Handles both frontend and API routes
```

## Deployment

Vercel automatically:
1. Installs root `package.json` for frontend
2. Detects `api/` folder
3. Installs `api/package.json` for API routes
4. Builds frontend with Vite
5. Bundles API routes separately

No changes needed! 🎯

