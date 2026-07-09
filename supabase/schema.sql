create extension if not exists "pgcrypto";

create table if not exists public.control_records (
  id uuid primary key default gen_random_uuid(),
  control_id text unique,
  estado_control text not null default 'Pendiente',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_annexes (
  id uuid primary key default gen_random_uuid(),
  annex_id text unique,
  control_record_id uuid references public.control_records(id) on delete set null,
  estado_control text not null default 'Pendiente de pasar a Control',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.master_records (
  id uuid primary key default gen_random_uuid(),
  collection text not null,
  external_id text,
  estado text not null default 'Activo',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection, external_id)
);

create table if not exists public.audit_actions (
  id uuid primary key default gen_random_uuid(),
  entidad text not null,
  entidad_id text,
  accion text not null,
  estado_anterior text,
  estado_nuevo text,
  detalle text,
  usuario text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_control_records_updated_at on public.control_records;
create trigger set_control_records_updated_at
before update on public.control_records
for each row execute function public.set_updated_at();

drop trigger if exists set_generated_annexes_updated_at on public.generated_annexes;
create trigger set_generated_annexes_updated_at
before update on public.generated_annexes
for each row execute function public.set_updated_at();

drop trigger if exists set_master_records_updated_at on public.master_records;
create trigger set_master_records_updated_at
before update on public.master_records
for each row execute function public.set_updated_at();

alter table public.control_records enable row level security;
alter table public.generated_annexes enable row level security;
alter table public.master_records enable row level security;
alter table public.audit_actions enable row level security;

create policy "Authenticated users can read control records"
on public.control_records for select
to authenticated
using (true);

create policy "Authenticated users can write control records"
on public.control_records for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read generated annexes"
on public.generated_annexes for select
to authenticated
using (true);

create policy "Authenticated users can write generated annexes"
on public.generated_annexes for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read master records"
on public.master_records for select
to authenticated
using (true);

create policy "Authenticated users can write master records"
on public.master_records for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read audit actions"
on public.audit_actions for select
to authenticated
using (true);

create policy "Authenticated users can insert audit actions"
on public.audit_actions for insert
to authenticated
with check (true);
