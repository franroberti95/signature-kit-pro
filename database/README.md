# Database Setup and Authentication

This directory contains the SQL schema for your Neon Postgres database.

## Architecture Overview

**Flow:**
1. Users register/login to your dashboard (email + password)
2. Users subscribe/pay to get API access
3. Users generate API keys in the dashboard
4. Users use API keys in their backend integrations

## 1. Run the Schema

Execute the `schema.sql` file in your Neon Postgres database. This will create all necessary tables:
- `users` - Dashboard users (login credentials)
- `api_keys` - API keys for backend integrations
- `documents` - Documents created by users
- `signing_sessions` - Signing links with tokens
- `webhook_subscriptions` - Webhook endpoints
- `webhook_deliveries` - Webhook delivery logs

## 2. Authentication Options

### Option A: Use Neon Auth (Recommended for Dashboard)

**Enable Neon Auth** in your Neon dashboard. This provides:
- Built-in user registration/login
- Password hashing
- Session management
- User profiles synced to Postgres

**Then:**
- Neon Auth will automatically create users in your `users` table
- You'll need to sync the `users` table structure with Neon Auth's user schema
- Or use Neon Auth's user ID as a foreign key

### Option B: Custom Authentication (More Control)

Build your own auth system:

1. **User Registration/Login:**
   ```javascript
   // Example: Register a user
   const bcrypt = require('bcrypt');
   const password = 'user_password';
   const saltRounds = 10;
   
   bcrypt.hash(password, saltRounds, async (err, hash) => {
     // Insert into users table
     await db.query(
       'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)',
       ['user@example.com', hash, 'User Name']
     );
   });
   ```

2. **API Key Generation:**
   ```javascript
   // Generate API key when user subscribes
   const crypto = require('crypto');
   const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');
   const apiKeyHash = await bcrypt.hash(apiKey, 10);
   
   await db.query(
     'INSERT INTO api_keys (user_id, key_name, api_key, api_key_hash) VALUES ($1, $2, $3, $4)',
     [userId, 'Production Key', apiKey, apiKeyHash]
   );
   ```

## 3. Subscription Management

The `users` table includes subscription fields:
- `subscription_tier`: 'free', 'pro', 'enterprise'
- `subscription_status`: 'active', 'cancelled', 'expired'
- `subscription_expires_at`: When subscription expires

**Example:**
```sql
-- Update user subscription after payment
UPDATE users 
SET subscription_tier = 'pro',
    subscription_status = 'active',
    subscription_expires_at = NOW() + INTERVAL '1 month'
WHERE id = 'user-uuid-here';
```

## 4. API Key Management

Users can have multiple API keys (e.g., one for production, one for testing).

**Generate API Key:**
```sql
-- This should be done programmatically in your dashboard
INSERT INTO api_keys (user_id, key_name, api_key, api_key_hash)
VALUES (
  'user-uuid-here',
  'Production Key',
  'sk_live_abc123...',  -- Generated in your backend
  '$2b$10$hashed_version...'  -- Bcrypt hash
);
```

**Verify API Key (in your API middleware):**
```javascript
const apiKey = req.headers['x-api-key'];
const apiKeyHash = await db.query(
  'SELECT api_key_hash, user_id FROM api_keys WHERE api_key = $1 AND active = true',
  [apiKey]
);

if (!apiKeyHash.rows.length) {
  return res.status(401).json({ error: 'Invalid API key' });
}

const isValid = await bcrypt.compare(apiKey, apiKeyHash.rows[0].api_key_hash);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid API key' });
}

// Attach user_id to request
req.userId = apiKeyHash.rows[0].user_id;
```

## 5. Recommendation

**For MVP:** Use **Neon Auth** for dashboard login (faster to ship)
**For Production:** Consider custom auth for more control over subscription flow

Both approaches work with this schema!

## 6. Data Structure Examples

### PDF Document Data Structure

```json
{
  "pages": [
    {
      "id": "page-123",
      "format": "A4",
      "elements": [
        {
          "id": "element-456",
          "type": "signature",
          "x": 100,
          "y": 200,
          "width": 240,
          "height": 80,
          "properties": {
            "placeholder": "Patient Signature",
            "required": true,
            "fieldName": "patient_signature"
          },
          "preDefinedLabel": "Patient Signature",
          "pageIndex": 0
        }
      ],
      "backgroundImage": "blob:..." // or base64 or S3 URL
    }
  ],
  "selectedFormat": "A4"
}
```

### Rich Text Document Data Structure

```json
{
  "pages": [
    {
      "id": "page-123",
      "format": "A4",
      "richTextContent": "<p>Hello <span class=\"variable-embed\" data-variable=\"patient_name\">...</span></p>",
      "richTextVariables": [
        { "name": "patient_name", "type": "text" },
        { "name": "patient_signature", "type": "signature" }
      ],
      "elements": [
        {
          "id": "signature-456",
          "type": "signature",
          "x": 175,
          "y": 203,
          "width": 240,
          "height": 80,
          "name": "patient_signature",
          "label": "Patient Signature",
          "pageIndex": 0
        }
      ]
    }
  ],
  "selectedFormat": "A4",
  "isRichTextDocument": true
}
```

### Signing Session Form Data

```json
{
  "signature-456": "data:image/png;base64,iVBORw0KG...",
  "rich-text-patient_name": "John Doe",
  "rich-text-date_of_birth": "1990-01-01"
}
```

## 7. Common Queries

### Get all documents for a user
```sql
SELECT * FROM documents 
WHERE user_id = 'user-uuid-here' 
ORDER BY created_at DESC;
```

### Get active signing sessions
```sql
SELECT * FROM signing_sessions 
WHERE document_id = 'doc-uuid-here' 
  AND status = 'pending' 
  AND expires_at > NOW();
```

### Get completed signatures
```sql
SELECT * FROM signing_sessions 
WHERE document_id = 'doc-uuid-here' 
  AND status = 'completed'
ORDER BY completed_at DESC;
```

### Clean up expired sessions (run periodically)
```sql
SELECT cleanup_expired_sessions();
```

## 8. Security Notes

- **API Keys**: Store hashed versions, never plain text
- **Passwords**: Use bcrypt with 10+ salt rounds
- **Tokens**: Use crypto.randomBytes(32) for signing tokens
- **Secrets**: Use crypto.randomBytes(32) for webhook secrets
- **Expiration**: Always set expires_at for signing sessions
- **HTTPS**: Only accept API calls over HTTPS in production
