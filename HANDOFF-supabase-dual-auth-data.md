# HoneyCombAI Frontend — Supabase Dual-Project Handoff (Auth vs Data)

## Context / Goal
We are connecting an existing Next.js frontend to a **new Supabase (data)** while keeping **Google OAuth auth** working (via the **old Supabase**).

Constraints:
- **Do not change `.env`** (user requested).
- **Do not run migrations** or change table definitions (no `ALTER TABLE`, no `DROP TABLE`).
- New Supabase has slightly different `contacts` schema (`headline`, `profile_picture_url`; no `title`, `state`, `profile_picture`).
- UI requirement: keep list views compact; add a “Full details” section in drawers that shows **all columns**.

---

## What was implemented

### 1) Drawer “Full details” (show all columns) — **Frontend**
**Goal:** Keep list RPC payloads small, but show every column in a “Full Details” section inside drawers.

**API changes**
- `app/api/contacts/[id]/route.ts`
  - Still uses `rpc('get_contact_details')` for rich drawer info.
  - Adds a second query: `from('contacts').select(<explicit list>).eq('id', contactId).single()` and returns it as `full_details`.
  - Adds strict interface `ContactFullDetails` (no `any`).
- `app/api/companies/[id]/route.ts`
  - Still uses `rpc('get_company_details')`.
  - Adds `full_details` via `from('companies').select(<explicit list>)...`.
  - Adds strict interface `CompanyFullDetails` (no `any`).

**UI changes**
- `components/dashboard/Contacts/ContactsDrawer.tsx`
  - Fetches `/api/contacts/:id` and stores `full_details`.
  - Renders a **Full Details** grid that prints every key/value (formats booleans, arrays, URLs, JSON).
- `components/dashboard/Company/CompaniesDrawer.tsx`
  - Same idea for company drawer.

---

### 2) Contacts RPC compatibility (new schema mapping) — **Supabase SQL**
**Problem:** New `public.contacts` table does NOT have:
- `title`
- `state`
- `profile_picture`

But the app and older RPCs expect those JSON keys.

**Mapping used (as requested)**
- `title` → `contacts.headline`
- `state` → `NULL`
- `profile_picture` → `contacts.profile_picture_url`

**SQL file added**
- `supabase/contacts-rpc-compat.sql`
  - Contains **only** `CREATE OR REPLACE FUNCTION ...` (no table DDL).
  - Updates contact RPCs so they return the *legacy JSON keys* but source from new columns.

---

### 3) Dual Supabase setup (Auth = old, Data = new) — **Frontend**
**Why:** Google OAuth provider is enabled on the **old** Supabase, but not enabled on the new one. User wants to keep auth as-is (old) while loading Contacts/Companies data from the new DB.

**New server-only data client**
- `lib/supabase/data-server.ts`
  - `createDataClient()` reads:
    - `NEXT_PUBLIC_DATA_SUPABASE_URL` / `NEXT_PUBLIC_DATA_SUPABASE_ANON_KEY` (preferred)
    - falls back to `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` if data vars aren’t present
    - optional `DATA_SUPABASE_SERVICE_ROLE_KEY` (server-only; bypasses RLS)

**API routes updated to use data client**
- Read-heavy list routes now use `createDataClient()`:
  - `app/api/contacts/route.ts`
  - `app/api/companies/route.ts`
- Drawer routes use:
  - **auth client** only for `auth.getUser()` / rate limiting
  - **data client** for RPC + table reads:
    - `app/api/contacts/[id]/route.ts`
    - `app/api/companies/[id]/route.ts`
- Supporting endpoint used by Add Contact UI:
  - `app/api/companies/list/route.ts` now reads from **data** Supabase (auth is still checked on old Supabase).

**Important note**
If the **new** Supabase enforces RLS using `auth.uid()` (very likely), and the API calls the new Supabase without a new-Supabase session/JWT, `auth.uid()` will be `NULL` → list results can be empty even when there is data.

---

## Current errors + root cause

### Error seen in dev logs
```
Failed to fetch contacts list:
Could not find the function public.get_contacts_list(input_user_email, page_limit, page_offset, sort_field, sort_order) in the schema cache
```

### Why this happens
We attempted an **email bridge** approach:
- Keep auth on old Supabase, but pass the user’s **email** into the new Supabase RPCs.
- The new Supabase RPCs would then map `email -> auth.users.id` inside the new Supabase, and use that as `acting_uid`.

This requires **new RPC signatures** that include an extra param:
- `input_user_email text DEFAULT NULL`

However:
- User ran `supabase/contacts-rpc-compat.sql` (compat mapping file).
- The new Supabase does **NOT** yet have `get_contacts_list(input_user_email, ...)` (or PostgREST schema cache hasn’t refreshed).
So when the frontend calls that signature, PostgREST rejects it with “could not find function in schema cache”.

### Mitigation added
`app/api/contacts/route.ts` now includes an RPC helper (`rpcWithEmailFallback`) that:
- tries the email-bridged signature first
- if PostgREST says the function signature doesn’t exist, it falls back to the legacy signature (no `input_user_email`)

This prevents hard 500s *during the transition*, but does **not** solve empty data if RLS uses `auth.uid()` and the data client is anonymous.

---

## “What to do next” (recommended options)

### Option A (Recommended): enable email-bridge RPCs (no table changes)
1) In **NEW Supabase**, run:
   - `supabase/dual-supabase-email-bridge-contacts.sql`
     - Adds/overrides these RPCs with optional `input_user_email` param:
       - `get_contacts_list(input_user_email, ...)`
       - `search_contacts(input_user_email, ...)`
       - `get_contact_details(input_user_email, input_contact_id)`
     - Internally uses:
       - `acting_uid := COALESCE(auth.uid(), (SELECT id FROM auth.users WHERE email = input_user_email LIMIT 1))`
       - replaces `auth.uid()` checks with `acting_uid`
2) Force PostgREST to refresh schema cache:
```sql
select pg_notify('pgrst', 'reload schema');
```
3) Verify the functions exist (NEW Supabase SQL editor):
```sql
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_contacts_list', 'search_contacts', 'get_contact_details')
order by p.proname, args;
```

If group-by views are used and still empty, extend the email-bridge to:
- `get_contacts_grouped_by_company`
- `get_contacts_grouped_by_location`
- `get_contacts_grouped_by_tags`

### Option B: use `DATA_SUPABASE_SERVICE_ROLE_KEY` server-side
If you want “just show the data” quickly and can accept bypassing RLS:
- Set `DATA_SUPABASE_SERVICE_ROLE_KEY` (server-only env var) to the new Supabase service role key.
- Then the data client bypasses RLS and all list RPCs/queries will return data even without a new-Supabase session.

**Security note:** service role bypasses RLS; only acceptable if API routes are already protected and you’re comfortable with that trust boundary.

### Option C: enable Google provider on the new Supabase (single-project auth/data)
If you want `auth.uid()` to work naturally in the new Supabase, you must enable Google provider there and move login to the new project. User currently asked to keep auth on old, so this is optional/not current direction.

---

## Files changed / added (high signal)

**Added**
- `lib/supabase/data-server.ts` — server-only “data Supabase” client
- `supabase/contacts-rpc-compat.sql` — RPC compatibility mapping for new contacts schema
- `supabase/dual-supabase-email-bridge-contacts.sql` — email-bridge versions of key contacts RPCs
- `HANDOFF-supabase-dual-auth-data.md` — this document

**Updated**
- `app/api/contacts/route.ts` — uses auth client to get email; uses data client for RPCs; has rpc fallback helper
- `app/api/contacts/[id]/route.ts` — auth client for session/rate-limit; data client for RPC + full_details
- `app/api/companies/route.ts` — data client for companies RPCs
- `app/api/companies/[id]/route.ts` — auth client for session/rate-limit; data client for RPC + full_details
- `app/api/companies/list/route.ts` — auth check on old; data query on new
- `components/dashboard/Contacts/ContactsDrawer.tsx` — renders Full Details section
- `components/dashboard/Company/CompaniesDrawer.tsx` — renders Full Details section

---

## Quick “what’s broken right now”
- Contacts can still 500 if the NEW Supabase does not have the email-bridged RPC signatures and PostgREST cache isn’t refreshed.
- Contacts can still show empty if RLS relies on `auth.uid()` and data client is anonymous.

---

## Next action for teammate
1) Confirm which env vars exist (no edits requested, just confirm they are present):
   - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Data: `NEXT_PUBLIC_DATA_SUPABASE_URL`, `NEXT_PUBLIC_DATA_SUPABASE_ANON_KEY`
2) In NEW Supabase, run `supabase/dual-supabase-email-bridge-contacts.sql`
3) Run `select pg_notify('pgrst', 'reload schema');`
4) Reload Contacts page (groupBy=none first), then test groupBy modes.


