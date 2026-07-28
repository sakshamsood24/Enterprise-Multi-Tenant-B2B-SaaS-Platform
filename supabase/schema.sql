-- Enterprise multi-tenant SaaS schema.
-- Run this in Supabase SQL editor or with psql against a standalone PostgreSQL DB.

create extension if not exists "pgcrypto";

create type public.tenant_role as enum ('owner', 'admin', 'operator', 'viewer');
create type public.subscription_tier as enum ('free', 'growth', 'enterprise');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');
create type public.asset_status as enum ('available', 'assigned', 'maintenance', 'retired');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  subscription_tier public.subscription_tier not null default 'free',
  subscription_status public.subscription_status not null default 'trialing',
  created_at timestamptz not null default now()
);

create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text not null,
  risk_score int not null default 0 check (risk_score between 0 and 100),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  name text not null,
  serial_number text,
  status public.asset_status not null default 'available',
  replacement_value_cents int not null default 0 check (replacement_value_cents >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, serial_number)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_name text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index on public.tenant_memberships (user_id);
create index on public.assets (tenant_id, status);
create index on public.vendors (tenant_id, category);
create index on public.audit_events (tenant_id, created_at desc);

create or replace function public.jwt_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid;
$$;

create or replace function public.jwt_tenant_role()
returns public.tenant_role
language sql
stable
as $$
  select coalesce(nullif(auth.jwt() ->> 'tenant_role', '')::public.tenant_role, 'viewer'::public.tenant_role);
$$;

create or replace function public.jwt_subscription_status()
returns public.subscription_status
language sql
stable
as $$
  select coalesce(nullif(auth.jwt() ->> 'subscription_status', '')::public.subscription_status, 'canceled'::public.subscription_status);
$$;

create or replace function public.can_write_tenant_data()
returns boolean
language sql
stable
as $$
  select public.jwt_tenant_role() in ('owner', 'admin', 'operator')
     and public.jwt_subscription_status() in ('trialing', 'active');
$$;

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.vendors enable row level security;
alter table public.assets enable row level security;
alter table public.audit_events enable row level security;

create policy "tenant profile is visible to members"
on public.tenants for select
using (
  id = public.jwt_tenant_id()
  and exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = tenants.id
      and tm.user_id = auth.uid()
  )
);

create policy "owners can update tenant subscription metadata"
on public.tenants for update
using (id = public.jwt_tenant_id() and public.jwt_tenant_role() = 'owner')
with check (id = public.jwt_tenant_id() and public.jwt_tenant_role() = 'owner');

create policy "members can see their tenant memberships"
on public.tenant_memberships for select
using (tenant_id = public.jwt_tenant_id() and user_id = auth.uid());

create policy "owners and admins can manage memberships"
on public.tenant_memberships for all
using (tenant_id = public.jwt_tenant_id() and public.jwt_tenant_role() in ('owner', 'admin'))
with check (tenant_id = public.jwt_tenant_id() and public.jwt_tenant_role() in ('owner', 'admin'));

create policy "tenant scoped vendor reads"
on public.vendors for select
using (tenant_id = public.jwt_tenant_id());

create policy "tenant scoped vendor inserts"
on public.vendors for insert
with check (tenant_id = public.jwt_tenant_id() and public.can_write_tenant_data());

create policy "tenant scoped vendor updates"
on public.vendors for update
using (tenant_id = public.jwt_tenant_id() and public.can_write_tenant_data())
with check (tenant_id = public.jwt_tenant_id() and public.can_write_tenant_data());

create policy "tenant scoped vendor deletes"
on public.vendors for delete
using (tenant_id = public.jwt_tenant_id() and public.jwt_tenant_role() in ('owner', 'admin'));

create policy "tenant scoped asset reads"
on public.assets for select
using (tenant_id = public.jwt_tenant_id());

create policy "tenant scoped asset inserts"
on public.assets for insert
with check (tenant_id = public.jwt_tenant_id() and public.can_write_tenant_data());

create policy "tenant scoped asset updates"
on public.assets for update
using (tenant_id = public.jwt_tenant_id() and public.can_write_tenant_data())
with check (tenant_id = public.jwt_tenant_id() and public.can_write_tenant_data());

create policy "tenant scoped asset deletes"
on public.assets for delete
using (tenant_id = public.jwt_tenant_id() and public.jwt_tenant_role() in ('owner', 'admin'));

create policy "tenant scoped audit reads"
on public.audit_events for select
using (tenant_id = public.jwt_tenant_id() and public.jwt_tenant_role() in ('owner', 'admin'));

create policy "tenant scoped audit inserts"
on public.audit_events for insert
with check (tenant_id = public.jwt_tenant_id());

create or replace function public.set_tenant_claims(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  membership record;
  tenant record;
begin
  select tm.tenant_id, tm.role
  into membership
  from public.tenant_memberships tm
  where tm.user_id = (event ->> 'user_id')::uuid
  order by tm.created_at asc
  limit 1;

  if membership.tenant_id is null then
    return event;
  end if;

  select t.subscription_tier, t.subscription_status
  into tenant
  from public.tenants t
  where t.id = membership.tenant_id;

  claims := event -> 'claims';
  claims := jsonb_set(claims, '{tenant_id}', to_jsonb(membership.tenant_id::text));
  claims := jsonb_set(claims, '{tenant_role}', to_jsonb(membership.role::text));
  claims := jsonb_set(claims, '{subscription_tier}', to_jsonb(tenant.subscription_tier::text));
  claims := jsonb_set(claims, '{subscription_status}', to_jsonb(tenant.subscription_status::text));

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Configure `public.set_tenant_claims` as a Supabase Auth custom access token hook.
-- For production, seed tenants/memberships from an onboarding service using service-role credentials.
