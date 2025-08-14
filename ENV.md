# Environment variables

Set these in your local environment (e.g., `.env.local`) and on your hosting provider (e.g., Vercel Project Settings → Environment Variables):

- NEXT_PUBLIC_SUPABASE_URL=
- NEXT_PUBLIC_SUPABASE_ANON_KEY=
- AUTH_PROTECT=false
- NEXT_PUBLIC_APP_URL=

Notes:
- Set `AUTH_PROTECT=true` to require login via middleware for all routes.
- Use Supabase → Project Settings → API for the URL and anon key.

