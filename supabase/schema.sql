create extension if not exists "pgcrypto";

create table if not exists public.generated_annexes (
  id uuid primary key default gen_random_uuid(),
  local_id text not null unique,
  estado_control text not null default 'Pendiente de pasar a Control',
  operacion text,
  cliente text,
  ruc_cliente text,
  obligado text,
  ruc_obligado text,
  moneda text,
  monto_neto_pago numeric,
  fecha_generacion timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.control_records (
  id uuid primary key default gen_random_uuid(),
  generated_annex_id uuid references public.generated_annexes(id) on delete set null,
  local_id text not null unique,
  estado_control text not null default 'En Control',
  operacion text,
  cliente text,
  ruc_cliente text,
  obligado text,
  ruc_obligado text,
  moneda text,
  monto_neto_pago numeric,
  fecha_pase_control timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generated_annexes_estado_control_idx
on public.generated_annexes (estado_control);

create index if not exists generated_annexes_operacion_idx
on public.generated_annexes (operacion);

create index if not exists control_records_operacion_idx
on public.control_records (operacion);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_generated_annexes_updated_at on public.generated_annexes;
create trigger set_generated_annexes_updated_at
before update on public.generated_annexes
for each row execute function public.set_updated_at();

drop trigger if exists set_control_records_updated_at on public.control_records;
create trigger set_control_records_updated_at
before update on public.control_records
for each row execute function public.set_updated_at();

alter table public.generated_annexes enable row level security;
alter table public.control_records enable row level security;

create policy "Authenticated users can manage generated annexes"
on public.generated_annexes for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can manage control records"
on public.control_records for all
to authenticated
using (true)
with check (true);
