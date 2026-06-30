# Omega_Support_Deck
Omega Support Deck is a simple customer communication system for Omega Wi-Fi, built to manage customers and send or schedule SMS notifications for service updates and maintenance.

## Supabase setup

1. Open your Supabase project, then go to SQL Editor.
2. Run `backend/migrations/001_initial_schema.sql`.
3. In `.env`, replace:
   - `SUPABASE_URL` with Project Settings > API > Project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` with Project Settings > API > service_role key.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not add it to any `VITE_` variable.

Customers, SMS history, SMS recipients, scheduled messages, and SMS templates are stored in Supabase. CSV imports skip phone numbers that already exist and only insert new numbers.
