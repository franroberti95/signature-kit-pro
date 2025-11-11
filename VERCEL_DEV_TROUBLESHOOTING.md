# Vercel Dev Troubleshooting Guide

## The Problem

`vercel dev` is:
- ✅ Starting Vite (port 8080)
- ✅ Starting server on port 3000
- ❌ NOT detecting `api/` folder
- ❌ NOT executing serverless functions
- ❌ API routes hang with no logs

## Official Documentation

- **Vercel Functions**: https://vercel.com/docs/functions/serverless-functions
- **Vercel CLI Dev**: https://vercel.com/docs/cli/dev
- **Vercel Dev Issues**: https://github.com/vercel/vercel/discussions

## Common Causes

### 1. Vercel Dev Not Detecting API Folder

**Symptoms:**
- No "Detected X serverless functions" message
- No "Ready! Available at http://localhost:3000" message
- API routes hang

**Possible Causes:**
- `api/` folder not in root directory
- Files in `api/` not matching expected patterns
- TypeScript compilation errors (silent)
- Vercel dev bug with Vite projects

### 2. TypeScript Compilation Issues

**Check:**
```bash
cd api
npx tsc --noEmit
```

**Common Issues:**
- Missing `@vercel/node` types
- Import errors
- Module resolution issues

### 3. Module Import Errors at Runtime

**Check:**
- Files that throw errors at import time (like `_db.ts`, `_middleware.ts`)
- These should use lazy loading

### 4. Configuration Issues

**Check `vercel.json`:**
- Should NOT have `framework: null` (can cause issues)
- Should NOT have incorrect `functions` config
- Should have proper `buildCommand` and `devCommand`

## Solutions to Try

### Solution 1: Check for Hidden Errors

```bash
# Run with maximum verbosity
vercel dev --debug 2>&1 | tee vercel-debug.log

# Wait 30 seconds after Vite starts
# Check if you see any error messages
```

### Solution 2: Verify API Folder Structure

```bash
# Check if api folder exists and has files
ls -la api/
find api -name "*.ts" -type f

# Should see files like:
# api/test.ts
# api/example-hello.ts
# api/auth/login.ts
```

### Solution 3: Test with JavaScript First

Create `api/test-js.js` (no TypeScript):
```javascript
export default async function handler(req, res) {
  return res.json({ message: 'JS works!' });
}
```

If `.js` works but `.ts` doesn't → TypeScript compilation issue

### Solution 4: Check Vercel Dev Version

```bash
vercel --version
# Should be recent (48.2.0 or newer)

# Try updating:
npm install -g vercel@latest
```

### Solution 5: Clear Vercel Cache

```bash
# Remove .vercel folder (you'll need to relink)
rm -rf .vercel
vercel link
vercel dev
```

### Solution 6: Use Alternative Dev Setup

If `vercel dev` doesn't work, use Vite directly:

```bash
# Terminal 1: Run Vite
npm run dev

# Terminal 2: Run a simple Node server for API
# (Create a simple Express server that imports your API routes)
```

### Solution 7: Check for Blocking Operations

Look for:
- Synchronous file operations
- Database connections at import time
- Environment variable checks at module level

All should be lazy-loaded.

## Debugging Steps

1. **Check if port 3000 is actually Vercel dev:**
   ```bash
   lsof -i :3000
   # Should show node process
   ```

2. **Test with curl:**
   ```bash
   curl -v http://localhost:3000/api/test-js
   # Check if it connects but hangs
   ```

3. **Check Vercel dev logs:**
   - Look for any error messages
   - Check if functions are being compiled
   - See if there are TypeScript errors

4. **Test simplest possible route:**
   ```typescript
   // api/minimal.ts
   export default (req: any, res: any) => {
     res.json({ ok: true });
   };
   ```

## Known Issues

### Vercel Dev + Vite

There are known issues with `vercel dev` and Vite projects:
- Sometimes doesn't detect `api/` folder
- TypeScript compilation can be slow
- Functions might not hot-reload properly

**Workaround:** Use production/preview deployments for testing

### TypeScript ESM Issues

If using `"type": "module"` in package.json:
- Vercel dev might have issues with ESM imports
- Try using CommonJS for API routes

## Getting Help

1. **Vercel Community**: https://community.vercel.com
2. **GitHub Issues**: https://github.com/vercel/vercel/issues
3. **Vercel Discord**: https://vercel.com/discord

## Alternative: Deploy to Test

If local dev doesn't work:
1. Push to GitHub
2. Deploy to Vercel
3. Test in production/preview
4. Production usually works even if local dev doesn't

