# Pixie

Pixie — an AI Disney vacation companion. Production port of the single-file
React prototype (`pixie.jsx`, kept at the repo root as the reference source)
to Next.js 15 (App Router) + TypeScript + Tailwind CSS.

## Structure

- `lib/engine/` — deterministic core (pure functions, no React): budget
  allocator, itinerary builder, time re-flow, storm replan, dates, missions,
  memory. The engine does all math — the LLM only writes words.
- `lib/catalog/` — illustrative demo ground truth: `ATTR`, `DINING`,
  `RESORTS`, `PRICE`, `PARKS`, companions.
- `lib/ai/` — browser-side callers for the AI routes, prompts, and the
  deterministic fallbacks.
- `app/api/brief` + `app/api/thread` — the Claude layer, server-side. The
  `ANTHROPIC_API_KEY` lives only in server env; the browser never sees it.
  When the key is absent or a call fails, the client falls back to the
  deterministic engine (the "Offline mode" footer state).
- `lib/supabase/` — auth client, pure row serializers, and best-effort
  persistence (save the trip when the plan is generated, load it on return).
- `components/` — UI (screens, surfaces, overlays).
- `app/` — App Router routes (`/auth/callback` completes Google sign-in).
- `supabase/migrations/` — SQL schema: profiles, trips, itineraries,
  itinerary_items, booking_tasks, missions, family_memory, events_log.
  Row Level Security is enabled on every table and keyed to `auth.uid()` —
  a user can only ever read/write their own rows.

## Develop

```bash
npm install
npm run dev    # http://localhost:3000
npm test       # vitest — engine unit tests
npm run build  # production build
```

Without Supabase env vars the app runs in the original no-account demo mode.
Without `ANTHROPIC_API_KEY` (server-only — set it in `.env.local` and in
Vercel → Project Settings → Environment Variables) the AI layer is skipped
and the deterministic engine handles everything.

## Supabase setup

1. Create a Supabase project, then copy `.env.example` to `.env.local` and
   fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Project settings → API).
2. Apply the migrations, either with the CLI
   (`supabase link && supabase db push`) or by running the files in
   `supabase/migrations/` in order in the SQL editor.
3. Enable the Google provider (Authentication → Providers → Google) with an
   OAuth client from Google Cloud Console, and add
   `https://<your-domain>/auth/callback` (and
   `http://localhost:3000/auth/callback` for dev) to Authentication → URL
   Configuration → Redirect URLs.

Sign-in flow: the landing page's "Continue with Google" starts Supabase
OAuth → `/auth/callback` exchanges the code for a session → first-time users
land on profile capture, returning users are restored straight into their
saved trip.
