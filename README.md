# Boutique Inventory System

Tracks stitching work handed out to tailors: who is holding how many pieces, what has come back, and what is still in progress. Finished work is signed off with a printable handover receipt.

Full scope lives in [PRD.md](PRD.md). This README covers running the code.

## Stack

- Next.js 16 (App Router) with TypeScript
- Tailwind CSS v4 with hand-rolled shadcn-style primitives on Radix
- React Hook Form and Zod for form state and validation
- Supabase for Postgres, Auth, and Row Level Security

## Getting started

### 1. Create the database

In your Supabase project, open the SQL Editor and run [supabase/schema.sql](supabase/schema.sql) in full. It creates the tables, the `assignment_progress` view, the integrity triggers, RLS policies, the receipt and top-up functions, the employee ledger, and seeds the eight default stitching rates.

The file is safe to re-run after a schema change.

### 2. Create the admin user

In Supabase, go to Authentication → Users → Add user, and create one with an email and password. Turn off email confirmation, or confirm the address, so the account can sign in immediately. New accounts default to **Admin** — they can run day-to-day operations but cannot change article rates from the app.

To promote someone to **Super Admin** (full catalogue control plus everything Admin can do), run this in the SQL Editor after the user exists — replace the email with theirs:

```sql
update public.app_users
set role = 'super_admin'
where id = (
  select id from auth.users where email = 'owner@example.com'
);
```

Re-run [supabase/schema.sql](supabase/schema.sql) if your database was created before roles were added; it backfills `app_users` for existing Auth accounts.

### 3. Configure the app

```bash
cp .env.example .env.local
```

Fill in these values:

| Variable | Where to get it |
| --- | --- |
| `SUPABASE_URL` | Project Settings → API |
| `SUPABASE_PUBLISHABLE_KEY` | Same page (older projects: anon public key as `SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page — **service_role** secret (server-only; needed to create users from `/users`) |

Neither Supabase key is prefixed with `NEXT_PUBLIC_`, because every Supabase call happens on the server.

### 4. Run it

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000 and redirects to the login screen.

## How the data flows

- `src/proxy.ts` refreshes the Supabase session on every request and redirects signed-out visitors to `/login`.
- `src/app/(app)/layout.tsx` loads one snapshot of the data server-side and hands it to `InventoryProvider`.
- Components read that snapshot through `useInventory()` and call server actions in `src/lib/data/actions.ts` to change anything.
- Actions validate with the same Zod schemas the forms use, then revalidate, so a fresh snapshot streams back without any client-side cache to keep in sync.

Stitching rates are read-only for **Admin** users. **Super Admin** users can add articles and edit rates on `/articles`, create or manage platform users on `/users`, and open an employee's weekly earnings ledger from `/employees`.

### Adding admins (Super Admin)

1. Sign in as a Super Admin and open **Platform Users** (`/users`).
2. Click **Add admin**, enter an email, and optionally set a password (or leave blank to auto-generate one).
3. Copy the email and password shown on screen and share them over Slack, WhatsApp, or in person.
4. The new admin signs in at `/login` with those credentials.

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Admin sign-in |
| `/tracking` | Assignments grouped by employee, with completions and receipt generation |
| `/assign` | Create an assignment |
| `/employees` | Manage tailors (Super Admin also opens a weekly earnings ledger per employee) |
| `/articles` | Article catalogue (read-only for Admin; full management for Super Admin) |
| `/users` | Create admins and manage roles (Super Admin only) |
| `/receipts` | Receipt history |
| `/receipts/[id]/print` | Printable handover slip |

## Key rules, and where they are enforced

These are enforced in the database rather than only in the UI, so a bad request cannot corrupt the ledger.

| Rule | Enforced by |
| --- | --- |
| The stitching rate is copied onto an assignment at creation, so a later price change never rewrites past work | `assignments.unit_price`, read server-side in `createAssignmentAction` |
| Completions can never exceed the assigned quantity | `completion_entries_balance` trigger |
| An assigned quantity cannot drop below what is already completed | `assignments_touch` trigger |
| Completion entries are append-only; corrections post a negative reversal with a mandatory reason | `reverseCompletionAction` and the same balance trigger |
| Raising an assigned quantity always writes an audit record | `top_up_assignment()`, which does both in one transaction |
| A receipt only covers completions not already receipted, so nothing is counted twice | `generate_receipt()`, which stamps the entries it includes |
| Receipts show quantities and PKR totals using assignment snapshot rates | The receipt snapshot stores article, size, quantity, unit price, and line total |
| Every completion (and reversal) posts a priced row into `employee_ledger` | `completion_entries_ledger` trigger |

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```
