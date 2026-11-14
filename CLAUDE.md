# Group Project Manager

A web app for student group assignments. Users create projects (assignments with a due date). Each project has tabs for Tasks, Notes, Polls and Files.

## Stack
- Next.js 16 (App Router), React 18, TypeScript, Tailwind 3
- Clerk for auth (`@clerk/nextjs`)
- Supabase for the database (`@supabase/supabase-js`). It is called directly from client components; there are no API routes.
- `react-icons` for icons

## Commands
- `npm run dev`: start the dev server
- `npm run build`: production build (the only type check; there are no tests)
- `npm run lint`

## Env
`.env.local` at the repo root must define `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the Clerk keys. `.env*` files are gitignored.

## Structure
- `src/proxy.ts`: Clerk middleware (Next 16 calls it `proxy`). Every route except `/sign-in` and `/sign-up` requires login.
- `src/lib/supabaseClient.tsx`: `useSupabase()` hook. It creates a Supabase client that sends the Clerk session token as `accessToken`. Use it in every component that touches the DB.
- `src/app/page.tsx`: the home page. Lists projects sorted by due date, with delete.
- `src/app/add-group-assignment/`, `src/app/edit-group-assignment/[id]/`: the project create and edit forms.
- `src/app/project/[id]/page.tsx`: the Tasks tab. It still renders hardcoded mock tasks.
- `src/app/project/[id]/polls/`: polls. Fully wired to Supabase.
- `src/app/project/[id]/notes/`, `files/`: stubs.
- `src/components/`: `GroupAssignment` (the project card on home), `TaskCard` (task UI with a status menu and comments; not wired to the DB), `UseNav.tsx` (exports `UserNav`, the Clerk sign-in and user button).

## Supabase tables (inferred from the code)
- `projects`: `id`, `user_id`, `project_name`, `due_date`
- `polls`: `id`, `project_id`, `question`, `user_id`
- `poll_options`: `id`, `poll_id`, `option_name`, `user_id`
- `votes`: `poll_id`, `poll_option_id`, `user_id`

`user_id` is the Clerk user id. The RLS policies are not stored in this repo.

## Conventions
- Pages are client components (`'use client'`). They fetch in `useEffect` and get route params with `use(params)`.
- Dark theme with hardcoded hex colors:
  - Background: `#0B0817`
  - Cards: `#161229` / `#13102A`
  - Borders: `#2C2650`
  - Accent: `#8B6FFF`, with a gradient from `#8B6FFF` to `#6a4ee0`
  - Warning: `#FF8A65`
  - Highlight: `#F4D58D`
  - Mono font: `font-geist-mono`
- The page header and nav markup is copy-pasted into each page; there is no shared layout yet.

## Known gaps / TODO
- Tasks: add CRUD, status updates and comments in Supabase. `TaskCard` does not export its `Task` type, but `project/[id]/page.tsx` imports it.
- Group members: the form field is never saved, and the avatars and the "10%" progress on `GroupAssignment` are hardcoded.
- On `GroupAssignment`, the delete and "+" buttons need `stopPropagation`, because the parent card navigates on click.
- The add and edit pages call `alert()` during render when `user` is not loaded yet.
- The home query does not filter by `user_id`, so it relies on RLS.
- The Polls page lacks the project header and tab nav.
- Notes and Files pages are not built.
