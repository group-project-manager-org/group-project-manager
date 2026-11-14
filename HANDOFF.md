# Handoff log

## Backend
- [2026-11-14] B0 done. Contract scaffolding is in place:
  - `src/lib/types.ts`: exactly spec 3.1.
  - `src/lib/db/*.ts`: every 3.2 signature. Bodies throw `DbError` with code `'NOT_IMPLEMENTED'` until each module is implemented.
  - `src/lib/db/errors.ts`: `DbError { message, code }`, plus `toDbError()` and `notImplemented()` helpers.
  - `src/lib/db/files.ts`: also exports `MAX_FILE_BYTES` (25 MB), so the frontend can reject large files before uploading.
  - `src/lib/db/realtime.ts`: also exports `RealtimeTable`, the `onChange` argument type.
  - `src/lib/api.ts`: `addMemberByEmail`, `searchUsers` and `getMemberSummaries` are already implemented as fetch wrappers. On a non-2xx response they throw `ApiError { message, status }`, where `message` is the route's `{ error }` text (safe to show inline). The routes don't exist yet (B4/B9), so for now these calls return 404.
  - `src/lib/api.ts`: also exports the response types `UserSearchResult` and `MemberSummariesResponse`.
  - `src/lib/utils/dates.ts`: fully implemented. `formatDue` returns "Due 12 Dec" when the date is more than 14 days away.
  - `.env.example`: lists every env var.
- [2026-11-14] B1 done.
  - `supabase/migrations/0000_baseline.sql`: records the 5 existing tables (including `comments`). Every statement is `create table if not exists`, so it does nothing on the current database. It adds no RLS.
  - `supabase/README.md`: covers Clerk ↔ Supabase third-party auth setup, how to run migrations, exporting the current policies and columns, and a test that `requesting_user_id()` returns the Clerk id.
  - The baseline now matches the real columns from the user's export (README step 3): every table has `created_at`, `project_name` is `varchar`, most columns are nullable, and `projects.user_id` defaults to `auth.jwt()->>'sub'`.
  - Findings from the export (saved in `supabase/existing_policies.sql`):
    - All existing policies are "own rows only" (`user_id = auth.jwt()->>'sub'`). As a result, poll options and votes made by other users are invisible, so the vote counts on the polls page only show your own vote. 0001 fixes this.
    - There is no update or delete policy on `votes`.
    - An unexpected `comments` table already exists with RLS on. It has only a primary key: no foreign keys and no policies. Columns: `id`, `created_at`, `task_id bigint not null`, `user_id text not null`, `content text not null`, `user_name text` (nullable). B3 must not assume it is new. In 0002, use `alter`, not `create`:
      - add the FK to `tasks` (delete orphaned rows first),
      - set the `user_id` default to `requesting_user_id()`,
      - backfill `user_name`, then set it `not null`,
      - add the content length check.
    - `polls.project_id` has no foreign key, so deleting a project leaves orphaned polls behind. 0001 deletes the orphans and then adds the FK with `on delete cascade`.
    - `poll_options` and `votes` already have their foreign keys (`on update cascade on delete cascade`). There is no unique constraint on votes yet.
- Next: B2 (`0001_core.sql`: core schema and RLS, plus `verify.sql`), then B4.

## Frontend
- [2026-11-14] **F0 done.**
  - `src/components/ui/`: Button, Card, AddButton, Modal, Menu, Avatar, AvatarStack, Badge, StatusBadge (also a status dropdown when given `onChange`), PriorityTag, DueBadge, Spinner/LoadingBlock, EmptyState, ErrorBanner, ConfirmDialog. Import from `@/components/ui`.
  - `src/hooks/`: `useActor()` → `Actor | null`, `useAsync(fn, deps, enabled?)` → `{ data, error, loading, reload, setData }`, `useDismiss` (Esc / outside click).
  - Tailwind tokens added as `nyx-*` colours (`bg-nyx-card`, `text-nyx-violet`, …) and `font-geist-mono` now actually works (it was used across the app but never defined).
  - Removed the `alert()` calls on the add/edit pages (bug 3); they show a loading state while Clerk loads.
  - Uses `@/lib/types` and `@/lib/utils/dates` from B0 directly.
- [2026-11-14] **F1 done.** Mocks still used for: `getProject` (behind `NEXT_PUBLIC_USE_MOCKS=1`; mock project id `404` returns null to show "not found").
  - `src/app/project/[id]/layout.tsx` loads the project once via `useProject()` and renders header (back link, name, `DueBadge`, `AvatarStack`, Members button) + tab nav for every tab. AI Summary tab only shows when `NEXT_PUBLIC_FEATURE_AI_SUMMARY=1`.
  - Child pages read `{ project, members, myRole, reload }` with `useProjectContext()` from `src/components/project/ProjectContext.tsx`.
  - Removed the copied header/nav/fetch from the Tasks page (bugs 4, 5); Polls now gets the header too. Notes/Files are placeholders.
  - `GroupAssignment` delete / "+" / edit stop click propagation (bug 2).
  - Members button opens a read-only member list; add/remove/leave come in F3.

## Contract change requests

## Build blockers (frontend-owned, existed before B0)
Both fixed in F0; `npm run build` passes.
- `src/app/project/[id]/page.tsx:8` (bug 1): `TaskCard` now exports its temporary mock `Task` type so the page compiles. The real fix (TaskCard using `Task` from `@/lib/types`) comes with F4, because the mock shape differs (inline `comments` array).
- `src/app/project/[id]/files/page.tsx`: now a placeholder page until F7.

## Notes for backend
- `useSupabase()` creates a new Supabase client on **every render**. Any `useEffect` that lists the client as a dependency will refetch in a loop, and it also spawns many GoTrue/Realtime clients. Suggest wrapping `createClient(...)` in `useMemo(..., [getToken])` (or a module-level singleton whose `accessToken` reads the latest `getToken`). The frontend works around it for now by never using `sb` as a dependency.
- `npm run build` logs `Failed to set initial Realtime auth token ... clerk_runtime_not_browser` from `src/lib/supabaseClient.tsx` during prerender. Harmless, but the client probably shouldn't call `getToken()` on the server (e.g. skip `accessToken` when `typeof window === 'undefined'`).

## Manual steps for the user
- Set up Clerk third-party auth in Supabase. See `supabase/README.md` step 1; skip it if the app can already read data while signed in.
- Run `supabase/migrations/0000_baseline.sql`. It is safe on the existing database and does nothing there.
- ~~Before 0001: export policies and columns (README step 3).~~ Done 2026-11-14.
- `npm run lint` does not work: Next 16 removed `next lint`, and ESLint is not installed. Until that is fixed, `npm run build` is the only check. Proposed fix (needs agreement since `package.json` is shared): add `eslint` + `eslint-config-next` dev deps, an `eslint.config.mjs`, and change the script to `"lint": "eslint ."`.
