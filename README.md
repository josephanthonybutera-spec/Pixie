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
- `lib/ai/` — Claude brief-parsing + thread routing with deterministic
  fallbacks (moves server-side in step 3).
- `components/` — UI (screens, surfaces, overlays).
- `app/` — App Router routes.

## Develop

```bash
npm install
npm run dev    # http://localhost:3000
npm test       # vitest — engine unit tests
npm run build  # production build
```
