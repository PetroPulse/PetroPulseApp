
-- PetroPulse base schema (paste this in Supabase SQL editor)
create extension if not exists pgcrypto;
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);
create table if not exists members (
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner','analyst','viewer')),
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);
create table if not exists org_targets (
  org_id uuid primary key references organizations(id) on delete cascade,
  target_margin_pct numeric not null default 0.12,
  dso_target_days int not null default 28,
  ar_grace_days int not null default 7,
  early_pay_discount_max numeric not null default 0.02,
  forecast_horizon_days int not null default 14,
  currency text not null default 'USD',
  updated_at timestamptz default now()
);
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  external_id text,
  date date not null,
  customer text not null,
  product text not null,
  package_size text,
  quantity numeric,
  sell_price numeric,
  cost numeric,
  revenue numeric,
  profit numeric,
  margin_pct numeric,
  status text not null check (status in ('Paid','Outstanding')),
  source text not null,
  raw jsonb,
  created_at timestamptz default now()
);
create table if not exists data_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  kind text not null,
  config jsonb not null,
  status text not null default 'active',
  created_at timestamptz default now()
);

alter table organizations enable row level security;
alter table members       enable row level security;
alter table org_targets   enable row level security;
alter table orders        enable row level security;
alter table data_connections enable row level security;

create or replace function auth_uid() returns uuid
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), '00000000-0000-0000-0000-000000000000')::uuid;
$$;

create policy orgs_sel on organizations for select using (
  exists(select 1 from members m where m.org_id = organizations.id and m.user_id = auth_uid())
);
create policy members_sel on members for select using (
  user_id = auth_uid() or exists(select 1 from members m2 where m2.org_id = members.org_id and m2.user_id = auth_uid() and m2.role='owner')
);
create policy targets_rw on org_targets for all using (
  exists(select 1 from members m where m.org_id = org_targets.org_id and m.user_id = auth_uid())
) with check (true);
create policy orders_rw on orders for all using (
  exists(select 1 from members m where m.org_id = orders.org_id and m.user_id = auth_uid())
) with check (true);
create policy conns_rw on data_connections for all using (
  exists(select 1 from members m where m.org_id = data_connections.org_id and m.user_id = auth_uid())
) with check (true);

create index if not exists idx_orders_org_date on orders(org_id, date);
create index if not exists idx_orders_org_customer on orders(org_id, customer);
create index if not exists idx_orders_org_product on orders(org_id, product);
