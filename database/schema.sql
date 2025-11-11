-- Signature Kit Pro Database Schema
-- For Neon Postgres

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Store dashboard users (they log in, then get API keys)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- For dashboard login (bcrypt), NULL for OAuth users
  name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- ============================================
-- API KEYS TABLE
-- ============================================
-- Store API keys for users (users can have multiple keys)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_name VARCHAR(255), -- User-friendly name for the key
  api_key VARCHAR(255) UNIQUE NOT NULL, -- The actual API key (sk_...)
  api_key_hash VARCHAR(255) NOT NULL, -- Hashed version for verification (bcrypt)
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_active ON api_keys(active);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
-- Store documents from PDF Builder or Rich Text Builder
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('pdf', 'rich_text')),
  title VARCHAR(255) NOT NULL,
  data JSONB NOT NULL, -- Full document structure (pages, elements, etc.)
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
-- GIN index for JSONB queries
CREATE INDEX idx_documents_data ON documents USING GIN (data);

-- ============================================
-- SIGNING SESSIONS TABLE
-- ============================================
-- Store signing links with tokens for email links
CREATE TABLE signing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL, -- Secure token for signing link (use crypto.randomBytes)
  signer_email VARCHAR(255) NOT NULL,
  signer_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'opened', 'completed', 'expired', 'failed')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE, -- When signer first opened the link
  completed_at TIMESTAMP WITH TIME ZONE, -- When form was submitted
  form_data JSONB, -- Store completed form data (signatures, text fields, etc.)
  ip_address VARCHAR(45), -- Store IP for security/analytics
  user_agent TEXT, -- Store user agent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signing_sessions_token ON signing_sessions(token);
CREATE INDEX idx_signing_sessions_document_id ON signing_sessions(document_id);
CREATE INDEX idx_signing_sessions_status ON signing_sessions(status);
CREATE INDEX idx_signing_sessions_expires_at ON signing_sessions(expires_at);
CREATE INDEX idx_signing_sessions_signer_email ON signing_sessions(signer_email);

-- ============================================
-- WEBHOOK SUBSCRIPTIONS TABLE
-- ============================================
-- Store webhook subscriptions (for future use)
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE, -- Optional: link to specific API key
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE, -- NULL = all documents
  url TEXT NOT NULL, -- Webhook endpoint URL
  secret VARCHAR(255) NOT NULL, -- Secret for HMAC signature
  events TEXT[] NOT NULL, -- Array of event types to subscribe to
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_subscriptions_user_id ON webhook_subscriptions(user_id);
CREATE INDEX idx_webhook_subscriptions_document_id ON webhook_subscriptions(document_id);
CREATE INDEX idx_webhook_subscriptions_active ON webhook_subscriptions(active);

-- ============================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================
-- Store webhook delivery logs (for future use)
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  response_code INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_subscription_id ON webhook_deliveries(subscription_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at) WHERE status = 'pending';

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signing_sessions_updated_at BEFORE UPDATE ON signing_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_deliveries_updated_at BEFORE UPDATE ON webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
-- Function to clean up expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE signing_sessions
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW()
    AND status != 'expired';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
-- Example: Create a test user (you'll replace this with your actual auth system)
-- INSERT INTO users (email, password_hash, name, subscription_tier) VALUES
--   ('test@example.com', '$2b$10$hashed_password_here', 'Test User', 'pro');
--
-- Example: Generate API key for user (do this programmatically in your dashboard)
-- INSERT INTO api_keys (user_id, key_name, api_key, api_key_hash) VALUES
--   ('user-uuid-here', 'Test Key', 'sk_test_1234567890abcdef', '$2b$10$hashed_key_here');

