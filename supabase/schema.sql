-- Boutique Inventory System — database schema
--
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- It is written to be re-runnable: existing objects are left alone.
--
-- Access model: authenticated users with an app_users row get Admin or Super
-- Admin capabilities. Anonymous users get nothing. Super Admin alone can
-- mutate article_types from the app.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'article_size') then
    create type public.article_size as enum ('S', 'M', 'L', 'XL');
  end if;
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'super_admin');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'admin',
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.app_users add column if not exists invited_by uuid references auth.users (id) on delete set null;
alter table public.app_users add column if not exists invited_at timestamptz;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  phone text check (phone is null or char_length(phone) <= 20),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists employees_name_key
  on public.employees (lower(btrim(name)));

create table if not exists public.article_types (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  stitching_price numeric(10, 2) not null check (stitching_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists article_types_name_key
  on public.article_types (lower(btrim(name)));

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  employee_id uuid not null references public.employees (id) on delete restrict,
  -- Frozen copy of the printed lines so a re-print always matches the original.
  snapshot jsonb not null,
  total_pieces integer not null check (total_pieces > 0),
  created_at timestamptz not null default now()
);

create index if not exists receipts_employee_id_idx
  on public.receipts (employee_id);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  article_type_id uuid not null references public.article_types (id) on delete restrict,
  size public.article_size not null,
  quantity_assigned integer not null check (quantity_assigned >= 1),
  -- Rate copied from article_types at creation time. Never recalculated, so a
  -- later price change cannot rewrite historical work.
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  notes text check (notes is null or char_length(notes) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assignments_employee_id_idx
  on public.assignments (employee_id);
create index if not exists assignments_article_type_id_idx
  on public.assignments (article_type_id);
create index if not exists assignments_updated_at_idx
  on public.assignments (updated_at desc);

create table if not exists public.completion_entries (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  -- Negative only for admin reversals, which correct a mistaken hand-in.
  quantity integer not null check (quantity <> 0),
  completed_on date not null default current_date,
  note text check (note is null or char_length(note) <= 250),
  receipt_id uuid references public.receipts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists completion_entries_assignment_id_idx
  on public.completion_entries (assignment_id);
create index if not exists completion_entries_receipt_id_idx
  on public.completion_entries (receipt_id);
create index if not exists completion_entries_unreceipted_idx
  on public.completion_entries (assignment_id) where receipt_id is null;

create table if not exists public.assignment_adjustments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  previous_quantity integer not null check (previous_quantity >= 0),
  new_quantity integer not null check (new_quantity >= 1),
  reason text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists assignment_adjustments_assignment_id_idx
  on public.assignment_adjustments (assignment_id);

-- ---------------------------------------------------------------------------
-- Integrity: completions can never exceed the assigned quantity
-- ---------------------------------------------------------------------------

create or replace function public.assert_completion_balance(p_assignment_id uuid)
returns void
language plpgsql
as $$
declare
  v_assigned integer;
  v_completed integer;
begin
  select quantity_assigned into v_assigned
  from public.assignments
  where id = p_assignment_id
  for update;

  if v_assigned is null then
    return;
  end if;

  select coalesce(sum(quantity), 0) into v_completed
  from public.completion_entries
  where assignment_id = p_assignment_id;

  if v_completed > v_assigned then
    raise exception
      'Completed pieces (%) cannot exceed the assigned quantity (%)',
      v_completed, v_assigned
      using errcode = 'check_violation';
  end if;

  if v_completed < 0 then
    raise exception 'Completed pieces cannot fall below zero'
      using errcode = 'check_violation';
  end if;
end;
$$;

create or replace function public.completion_entries_guard()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_completion_balance(
    coalesce(new.assignment_id, old.assignment_id)
  );
  return null;
end;
$$;

drop trigger if exists completion_entries_balance on public.completion_entries;
create trigger completion_entries_balance
  after insert or update or delete on public.completion_entries
  for each row execute function public.completion_entries_guard();

-- Runs BEFORE UPDATE, so the table still holds the old quantity. The new value
-- has to be compared explicitly rather than re-read from the row.
create or replace function public.assignments_guard()
returns trigger
language plpgsql
as $$
declare
  v_completed integer;
begin
  new.updated_at := now();

  if new.quantity_assigned <> old.quantity_assigned then
    select coalesce(sum(quantity), 0) into v_completed
    from public.completion_entries
    where assignment_id = new.id;

    if v_completed > new.quantity_assigned then
      raise exception
        'Cannot set the assigned quantity to % when % pieces are already completed',
        new.quantity_assigned, v_completed
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists assignments_touch on public.assignments;
create trigger assignments_touch
  before update on public.assignments
  for each row execute function public.assignments_guard();

-- ---------------------------------------------------------------------------
-- Derived progress, so the client never recomputes balances inconsistently
-- ---------------------------------------------------------------------------

create or replace view public.assignment_progress
with (security_invoker = true) as
select
  a.id,
  a.employee_id,
  a.article_type_id,
  a.size,
  a.quantity_assigned,
  a.unit_price,
  a.notes,
  a.created_at,
  a.updated_at,
  coalesce(c.completed_quantity, 0)::integer as completed_quantity,
  (a.quantity_assigned - coalesce(c.completed_quantity, 0))::integer
    as remaining_quantity,
  coalesce(c.unreceipted_quantity, 0)::integer as unreceipted_quantity,
  case
    when coalesce(c.completed_quantity, 0) <= 0 then 'not_started'
    when coalesce(c.completed_quantity, 0) >= a.quantity_assigned then 'completed'
    else 'in_progress'
  end as status
from public.assignments a
left join (
  select
    assignment_id,
    sum(quantity) as completed_quantity,
    sum(quantity) filter (where receipt_id is null) as unreceipted_quantity
  from public.completion_entries
  group by assignment_id
) c on c.assignment_id = a.id;

-- ---------------------------------------------------------------------------
-- Receipt numbering
-- ---------------------------------------------------------------------------

-- Numbers run continuously rather than resetting each year, which keeps them
-- unique without a per-year lock.
create sequence if not exists public.receipt_no_seq as integer start 1;

create or replace function public.next_receipt_no()
returns text
language sql
as $$
  select 'RCP-'
    || to_char(now(), 'YYYY')
    || '-'
    || lpad(nextval('public.receipt_no_seq')::text, 4, '0');
$$;

-- ---------------------------------------------------------------------------
-- Receipt generation
--
-- Collects every completion for the employee that has not been receipted yet,
-- groups it by article and size, stamps those entries, and returns the receipt.
-- Doing this in one function keeps the same pieces off two different slips.
-- ---------------------------------------------------------------------------

create or replace function public.generate_receipt(p_employee_id uuid)
returns public.receipts
language plpgsql
as $$
declare
  v_employee_name text;
  v_lines jsonb;
  v_total integer;
  v_receipt public.receipts;
begin
  select name into v_employee_name
  from public.employees
  where id = p_employee_id;

  if v_employee_name is null then
    raise exception 'EMPLOYEE_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  -- A bucket that nets to zero or less is an unresolved correction. Leave those
  -- entries open so they offset a future receipt instead of vanishing.
  with pending as (
    select
      art.id as article_type_id,
      art.name as article_name,
      a.size,
      ce.quantity
    from public.completion_entries ce
    join public.assignments a on a.id = ce.assignment_id
    join public.article_types art on art.id = a.article_type_id
    where ce.receipt_id is null
      and a.employee_id = p_employee_id
  ),
  buckets as (
    select article_name, size, sum(quantity)::integer as quantity
    from pending
    group by article_type_id, article_name, size
    having sum(quantity) > 0
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'articleName', article_name,
          'size', size,
          'quantity', quantity
        )
        order by article_name, size
      ),
      '[]'::jsonb
    ),
    coalesce(sum(quantity), 0)::integer
  into v_lines, v_total
  from buckets;

  if v_total <= 0 then
    raise exception 'NO_PENDING_PIECES' using errcode = 'no_data_found';
  end if;

  insert into public.receipts (receipt_no, employee_id, snapshot, total_pieces)
  values (
    public.next_receipt_no(),
    p_employee_id,
    jsonb_build_object('employeeName', v_employee_name, 'lines', v_lines),
    v_total
  )
  returning * into v_receipt;

  with pending as (
    select
      ce.id as entry_id,
      a.article_type_id,
      a.size,
      ce.quantity
    from public.completion_entries ce
    join public.assignments a on a.id = ce.assignment_id
    where ce.receipt_id is null
      and a.employee_id = p_employee_id
  ),
  included as (
    select article_type_id, size
    from pending
    group by article_type_id, size
    having sum(quantity) > 0
  )
  update public.completion_entries ce
  set receipt_id = v_receipt.id
  from pending p
  where ce.id = p.entry_id
    and (p.article_type_id, p.size) in (select article_type_id, size from included);

  return v_receipt;
end;
$$;

-- ---------------------------------------------------------------------------
-- Topping up an assigned quantity
--
-- The quantity change and its audit record must land together, otherwise the
-- assigned total could move with nothing on the record explaining it.
-- ---------------------------------------------------------------------------

create or replace function public.top_up_assignment(
  p_assignment_id uuid,
  p_additional integer,
  p_reason text default null
)
returns public.assignments
language plpgsql
as $$
declare
  v_previous integer;
  v_assignment public.assignments;
begin
  if p_additional is null or p_additional < 1 then
    raise exception 'INVALID_QUANTITY' using errcode = 'check_violation';
  end if;

  select quantity_assigned into v_previous
  from public.assignments
  where id = p_assignment_id
  for update;

  if v_previous is null then
    raise exception 'ASSIGNMENT_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  update public.assignments
  set quantity_assigned = v_previous + p_additional
  where id = p_assignment_id
  returning * into v_assignment;

  insert into public.assignment_adjustments (
    assignment_id, previous_quantity, new_quantity, reason
  )
  values (
    p_assignment_id,
    v_previous,
    v_previous + p_additional,
    nullif(btrim(coalesce(p_reason, '')), '')
  );

  return v_assignment;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles: one row per Auth user; Super Admin is assigned in SQL
-- ---------------------------------------------------------------------------

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.app_users where id = auth.uid()),
    'admin'::public.app_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'super_admin'::public.app_role;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, role)
  values (new.id, 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill app_users for Auth accounts created before this migration ran.
insert into public.app_users (id, role)
select id, 'admin'::public.app_role
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.app_users enable row level security;

alter table public.employees enable row level security;
alter table public.article_types enable row level security;
alter table public.assignments enable row level security;
alter table public.completion_entries enable row level security;
alter table public.assignment_adjustments enable row level security;
alter table public.receipts enable row level security;

drop policy if exists app_users_read_own on public.app_users;
create policy app_users_read_own on public.app_users
  for select to authenticated using (id = auth.uid());

drop policy if exists app_users_super_admin_read on public.app_users;
create policy app_users_super_admin_read on public.app_users
  for select to authenticated using (public.is_super_admin());

drop policy if exists app_users_super_admin_update on public.app_users;
create policy app_users_super_admin_update on public.app_users
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

do $$
declare
  t text;
begin
  foreach t in array array[
    'employees',
    'assignments',
    'completion_entries',
    'assignment_adjustments',
    'receipts'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_admin_all',
      t
    );
  end loop;
end
$$;

-- article_types: everyone reads; only Super Admin writes from the app.
drop policy if exists article_types_read on public.article_types;
create policy article_types_read on public.article_types
  for select to authenticated using (true);

drop policy if exists article_types_super_admin_insert on public.article_types;
create policy article_types_super_admin_insert on public.article_types
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists article_types_super_admin_update on public.article_types;
create policy article_types_super_admin_update on public.article_types
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

revoke all on public.assignment_progress from anon;
grant select on public.assignment_progress to authenticated;
grant execute on function public.generate_receipt(uuid) to authenticated;
grant execute on function public.top_up_assignment(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed stitching rates
-- ---------------------------------------------------------------------------

insert into public.article_types (name, stitching_price)
values
  ('Shirt', 350),
  ('Trouser', 300),
  ('Kurta', 450),
  ('Shalwar', 280),
  ('Waistcoat', 600),
  ('Blouse', 550),
  ('Sherwani', 2200),
  ('Lehenga', 1800)
on conflict do nothing;
