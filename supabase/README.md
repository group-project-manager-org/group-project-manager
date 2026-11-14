# Supabase setup

NYX uses **Clerk** for sign-in and **Supabase** for data. Supabase trusts Clerk's session token. Row Level Security (RLS) reads the Clerk user id from that token, as `auth.jwt()->>'sub'`, wrapped in the `public.requesting_user_id()` helper. The app never uses Supabase Auth users.

## 1. Connect Clerk to Supabase (once per project)

Do both halves. The order doesn't matter.

**In the Clerk Dashboard**
1. Go to **Integrations → Supabase** (or open <https://dashboard.clerk.com/setup/supabase>) and pick your application and instance.
2. Click **Activate Supabase integration**. This adds the `role: "authenticated"` claim to Clerk session tokens, which Supabase needs.
3. Copy the **Clerk domain** shown there (for example, `your-app.clerk.accounts.dev`).

**In the Supabase Dashboard**
1. Go to **Authentication → Sign In / Providers → Third-party auth** (older dashboards: **Authentication → Third-party auth**).
2. Click **Add provider → Clerk**, paste the Clerk domain, and save.

**In the app**
- Nothing to change. `useSupabase()` in `src/lib/supabaseClient.tsx` already sends `getToken()` as the Supabase `accessToken`.
- The required env vars are listed in `.env.example`. Copy it to `.env.local` and fill it in.

Do this setup separately for each Clerk instance (development and production), because each has its own domain.

## 2. Run the migrations

The migrations live in `supabase/migrations/` and are numbered. Run them **in order**. Every file is idempotent, so running one twice is harmless.

**Option A: SQL editor (no CLI needed)**
1. Open Supabase Dashboard → **SQL Editor** → **New query**.
2. Paste the whole file, then click **Run**. Repeat for each file in number order.

**Option B: Supabase CLI**
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

`HANDOFF.md` lists which files you still need to run.

## 3. Before running `0001_core.sql`: back up the existing schema and policies

`0001` replaces the RLS policies. First save the current ones, and send the column list to the backend agent so it can check `0000_baseline.sql`.

**Policies**: run this in the SQL editor and save the output to `supabase/existing_policies.sql`:
```sql
select format(
  'create policy %I on %I.%I as %s for %s to %s%s%s;',
  policyname, schemaname, tablename, permissive, cmd,
  array_to_string(roles, ', '),
  case when qual is not null then ' using (' || qual || ')' else '' end,
  case when with_check is not null then ' with check (' || with_check || ')' else '' end
) as policy_sql
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```
If this returns no rows, there are no policies yet. Save an empty file with a comment saying so.

**Columns**: paste the output of this query to the backend agent:
```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('projects', 'polls', 'poll_options', 'votes')
order by table_name, ordinal_position;
```


**RLS status**: shows whether RLS is currently on for each table:
```sql
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;
```


## 4. Check that Supabase sees the Clerk user id

The SQL editor runs without a user token, so `auth.jwt()` is empty there. Test from the app instead.

1. Run `0001_core.sql`. It creates `public.requesting_user_id()`.
2. Sign in to the app with `npm run dev`. Then, in any client component that already calls `useSupabase()`, temporarily add:
   ```ts
   supabase.rpc('requesting_user_id').then(console.log)
   ```
3. The browser console should log `{ data: 'user_…', error: null }`, and the value should match your Clerk user id (Clerk Dashboard → Users).
   - If `data` is `null`, the token isn't being accepted. Re-check step 1, especially that the Clerk domain matches your instance.
   - A `401` or `JWT` error means third-party auth isn't set up in Supabase.
4. Remove the temporary line.

## 5. Verify the database

Once `supabase/verify.sql` exists (it's added with `0001`), run it in the SQL editor after each migration. Any `FAIL` row names what's missing.
