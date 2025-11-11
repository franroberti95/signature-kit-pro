# How Dependencies Work: Vite vs Vercel API Routes

## Current Setup (Monorepo)

All dependencies are in the root `package.json`:
- **Frontend packages**: React, UI components, etc.
- **Backend packages**: `@neondatabase/serverless`, `bcrypt`, `jsonwebtoken`, etc.

## How Vite Handles Dependencies

### ✅ Vite is Smart - It Only Bundles What's Imported

**Vite builds:**
- Only files in `src/` folder
- Only imports that are actually used
- **Backend packages are NOT imported in frontend code**, so Vite ignores them

**Example:**
```typescript
// src/pages/Dashboard.tsx
import { Button } from '@/components/ui/button'; // ✅ Bundled
// import { sql } from '@/api/_db'; // ❌ Never imported, so not bundled
```

**Result:**
- `@neondatabase/serverless`, `bcrypt`, `jsonwebtoken` are in `node_modules` but **NOT in the Vite bundle**
- Frontend bundle size is not affected
- Build time is not affected

### ⚠️ What Vite Does:

1. **Development (`npm run dev`)**:
   - Scans `src/` for imports
   - Pre-bundles dependencies (only what's imported)
   - Backend packages are ignored

2. **Production Build (`npm run build`)**:
   - Analyzes imports in `src/`
   - Bundles only what's used
   - Backend packages are not included

## How Vercel Handles API Routes

### ✅ Vercel Bundles Each API Route Separately

**Vercel builds:**
- Each file in `api/` folder separately
- Analyzes imports in each API route
- Only includes what's imported

**Example:**
```typescript
// api/auth/login.ts
import { sql } from '../_db'; // ✅ Bundled (uses @neondatabase/serverless)
import bcrypt from 'bcrypt'; // ✅ Bundled
// import React from 'react'; // ❌ Never imported, so not bundled
```

**Result:**
- Each API route gets its own optimized bundle
- Only backend packages are included
- React/React-DOM are NOT included (not imported)

## Dependency Flow

```
Root package.json
├── Frontend dependencies (React, UI, etc.)
│   └── Used by: Vite (src/ folder)
│   └── NOT used by: Vercel API routes
│
└── Backend dependencies (@neondatabase/serverless, bcrypt, etc.)
    └── Used by: Vercel API routes (api/ folder)
    └── NOT used by: Vite (not imported in src/)
```

## Build Process

### Local Development (`vercel dev`)

```
1. Vite starts
   └── Scans src/ for imports
   └── Pre-bundles frontend deps
   └── Ignores backend deps (not imported)

2. Vercel dev server starts
   └── Scans api/ for imports
   └── Bundles backend deps per route
   └── Ignores frontend deps (not imported)
```

### Production Build (Vercel)

```
1. Vite build (`npm run build`)
   └── Creates dist/ with frontend bundle
   └── Only includes frontend dependencies

2. Vercel deployment
   └── Detects api/ folder
   └── Bundles each API route separately
   └── Only includes backend dependencies per route
```

## Optimization (Optional)

If you want to be explicit, you can exclude backend packages from Vite:

**`vite.config.ts`:**
```typescript
export default defineConfig({
  // ... existing config
  optimizeDeps: {
    exclude: [
      '@neondatabase/serverless',
      '@vercel/node',
      'bcrypt',
      'jsonwebtoken',
    ],
  },
});
```

**But this is NOT necessary** - Vite already ignores them since they're not imported.

## Summary

| Package Type | Vite Bundle? | Vercel Bundle? | Reason |
|-------------|--------------|----------------|--------|
| `react`, `react-dom` | ✅ Yes | ❌ No | Imported in `src/`, not in `api/` |
| `@neondatabase/serverless` | ❌ No | ✅ Yes | Not imported in `src/`, imported in `api/` |
| `bcrypt`, `jsonwebtoken` | ❌ No | ✅ Yes | Not imported in `src/`, imported in `api/` |
| UI components | ✅ Yes | ❌ No | Imported in `src/`, not in `api/` |

## Answer to Your Question

**Q: Does Vite build all the new packages we added for the front?**
**A:** No - Vite only builds packages that are **imported** in `src/`. Backend packages (`@neondatabase/serverless`, `bcrypt`, etc.) are not imported in frontend code, so they're not bundled.

**Q: Does the back build the front packages?**
**A:** No - Vercel API routes only bundle packages that are **imported** in `api/`. Frontend packages (React, UI components) are not imported in API routes, so they're not bundled.

**Both are smart enough to only include what they need!** 🎯

