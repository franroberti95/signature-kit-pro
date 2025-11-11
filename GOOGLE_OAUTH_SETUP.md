# Google OAuth Setup Guide

This guide will help you set up Google Sign-In for your application.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: "Signature Kit Pro"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Signature Kit Pro Web Client"
   - Authorized redirect URIs:
     - For local development: `http://localhost:3000/api/auth/google-callback` (when using `vercel dev`)
     - For production: `https://yourdomain.com/api/auth/google-callback`
     - For Vercel: `https://your-app.vercel.app/api/auth/google-callback`
7. Copy the **Client ID** and **Client Secret**

## Step 2: Update Environment Variables

### Local Development (`.env.local`)

Add these variables:

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
FRONTEND_URL=http://localhost:3000
```

### Production (Vercel)

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - `GOOGLE_CLIENT_ID` = Your Google Client ID
   - `GOOGLE_CLIENT_SECRET` = Your Google Client Secret
   - `FRONTEND_URL` = Your production URL (e.g., `https://your-app.vercel.app`)

## Step 3: Update Database Schema

If you already have a `users` table, run this migration:

```sql
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

Or if you're creating a fresh database, the schema in `database/schema.sql` already allows NULL `password_hash`.

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   vercel dev
   ```

2. Navigate to `/login`
3. Click the "Google" button
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

## How It Works

1. **User clicks "Sign in with Google"** → Redirects to `/api/auth/google-authorize`
2. **Backend generates OAuth URL** → Redirects user to Google
3. **User signs in with Google** → Google redirects to `/api/auth/google-callback?code=...`
4. **Backend exchanges code for token** → Gets user info from Google
5. **Backend creates/finds user** → Generates JWT token
6. **Backend redirects to frontend** → `/auth/callback?token=...`
7. **Frontend stores token** → User is logged in and redirected to dashboard

## Troubleshooting

### "redirect_uri_mismatch" Error

- Make sure the redirect URI in Google Console **exactly matches** the one in your code
- For local dev: `http://localhost:3000/api/auth/google-callback` (must match `FRONTEND_URL` in `.env.local` when using `vercel dev`)
- For production: `https://yourdomain.com/api/auth/google-callback` (must match `FRONTEND_URL` in Vercel env vars)
- **Important**: The redirect URI must match EXACTLY - no trailing slashes, correct protocol (http vs https)

### "invalid_client" Error

- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Make sure there are no extra spaces or quotes in the env variables

### User Not Created

- Check database connection
- Verify the `users` table allows NULL `password_hash`
- Check server logs for errors

### State Mismatch Warning

- This is CSRF protection working
- If you see this frequently, check that cookies are being set correctly
- The state cookie expires after 10 minutes

## Security Notes

- Never commit `GOOGLE_CLIENT_SECRET` to version control
- Use environment variables for all sensitive data
- The OAuth state parameter provides CSRF protection
- JWT tokens expire after 7 days
- OAuth users cannot use password login (they must use Google)

