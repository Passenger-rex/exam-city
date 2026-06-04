-- Supabase Schema & Realtime Setup for Unrecognized Login Verifications

-- 1. Create the verification table
CREATE TABLE IF NOT EXISTS public.login_verifications (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  email TEXT NOT NULL,
  device_id TEXT NOT NULL,
  ip TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  used BOOLEAN DEFAULT FALSE
);

-- 2. Enable Realtime for the table so the frontend can auto-login when token is verified
ALTER PUBLICATION supabase_realtime ADD TABLE login_verifications;

-- 3. Row Level Security (RLS)
ALTER TABLE public.login_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since they are unauthenticated at the moment of challenge creation)
CREATE POLICY "Allow public inserts for verification tokens" ON public.login_verifications
  FOR INSERT WITH CHECK (true);

-- Allow public reads (so the verification page can check if token is valid without auth)
CREATE POLICY "Allow public select for verification tokens" ON public.login_verifications
  FOR SELECT USING (true);

-- Allow public updates (so the verification page can mark token as used)
CREATE POLICY "Allow public updates for verification tokens" ON public.login_verifications
  FOR UPDATE USING (true);

/*
 * ==========================================
 * HOW TO SEND THE ACTUAL EMAIL VIA SUPABASE
 * ==========================================
 * 
 * To actually send an email to the user when a new record is inserted here, 
 * you should use a Supabase Edge Function or a Postgres Trigger with pg_net.
 * 
 * Option A: Supabase Webhook (Easiest)
 * 1. Go to "Database" -> "Webhooks" in your Supabase Dashboard.
 * 2. Create a new Webhook.
 * 3. Table: login_verifications
 * 4. Events: Insert
 * 5. Type: HTTP Request
 * 6. Method: POST
 * 7. URL: Your email provider's API (e.g., Resend, SendGrid) or a Zapier/Make webhook.
 * 8. Headers: Add your Authorization/API keys.
 * 9. The payload sent will contain the 'id' (token) and 'email'. You can construct the 
 *    verification link as: https://yourdomain.com/verify-login?token=[id]
 *
 * Option B: Supabase Edge Function (Recommended for customized emails)
 * 1. Create an Edge Function: `supabase functions new send-verification-email`
 * 2. Configure a Database Webhook to hit this Edge Function on INSERT into `login_verifications`.
 * 3. Inside the Edge Function, use an email package (like npm:resend) to format and send the email
 *    containing the verification URL to `record.email`.
 */
