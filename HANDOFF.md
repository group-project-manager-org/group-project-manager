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
- Next: B1 (baseline migration and auth README), then B2 (core schema and RLS), then B4.

## Frontend

## Contract change requests

## Build blockers (frontend-owned, existed before B0)
`npm run build` fails on 2 errors, neither of them in `src/lib`:
- `src/app/project/[id]/page.tsx:8`: imports `Task` from `TaskCard`, which doesn't export it. This is bug 1; fix it by importing from `@/lib/types`.
- `src/app/project/[id]/files/page.tsx` is an empty file, so it is "not a module". It needs a default-export page (F7, or a stub for now).

## Manual steps for the user
- `npm run lint` does not work: Next 16 removed `next lint`, and ESLint is not installed. Until that is fixed, `npm run build` is the only check.
