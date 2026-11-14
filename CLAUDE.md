# Group Project Manager (NYX)

A web app for student group assignments. Each project has members and four tabs: Tasks, Notes, Polls and Files.

Work is split between a backend agent and a frontend agent, following a shared spec. `HANDOFF.md` is the running log: what's done, open contract change requests, and the manual steps the user still has to run. Read it first.

## Stack
- Next.js 16 (App Router), React 18, TypeScript, Tailwind 3
- Clerk for auth (`@clerk/nextjs`). Supabase trusts Clerk tokens (third-party auth), and RLS reads the Clerk id via `public.requesting_user_id()`.
- Supabase: Postgres with RLS, plus Storage. Called from client components through `src/lib/db/*`.

## Commands
- `npm run dev`
- `npm run build`: the only check. There are no tests, and `npm run lint` is broken because Next 16 removed `next lint`.

## Env
- Copy `.env.example` to `.env.local`.

## Layout
- **Backend-owned:**
  - `supabase/migrations/` (numbered and idempotent; the user runs them in the SQL editor)
  - `supabase/verify.sql` (every row should be PASS)
  - `src/lib/types.ts` (the contract)
  - `src/lib/db/*` (data access)
  - `src/lib/api.ts` and `src/app/api/**` (routes that need Clerk server-side)
  - `src/lib/supabaseClient.tsx` (`useSupabase()` returns a stable client) and `supabaseServer.ts`
  - `src/proxy.ts`
- **Frontend-owned:**
  - `src/app/**` (except `api/`)
  - `src/components/**` (UI kit in `components/ui`)
  - `src/hooks/**` (mocks behind `NEXT_PUBLIC_USE_MOCKS=1`)
- The frontend never queries Supabase directly. It calls `src/lib/db/*`. Contract changes go through `HANDOFF.md`.

## Conventions
- Pages are `'use client'`. Read route params with `use(params)`.
- `db` functions take `sb` first. They throw `DbError { message, code }`, with `NOT_FOUND` when RLS hides or blocks the row.
- Use the design tokens from `tailwind.config.ts` (`nyx-*`). Don't add new colours.
- Never trust a client-sent `user_id`. The DB fills it from the token.
