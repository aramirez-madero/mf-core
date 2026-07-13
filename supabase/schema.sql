create extension if not exists "pgcrypto";

create table if not exists public.perfiles_usuario (
  id uuid primary key default gen_random_uuid(),
  id_local text not null unique,
  usuario_id uuid unique references auth.users(id) on delete cascade,
  correo text not null unique,
  nombre text,
  rol text not null default 'consulta' check (rol in ('administrador', 'operaciones', 'control', 'consulta', 'auditoria')),
  activo boolean not null default true,
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.anexos_generados (
  id uuid primary key default gen_random_uuid(),
  id_local text not null unique,
  estado_control text not null default 'Pendiente de pasar a Control',
  operacion text,
  cliente text,
  ruc_cliente text,
  obligado text,
  ruc_obligado text,
  moneda text,
  monto_neto_pago numeric,
  fecha_generacion timestamptz,
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.registros_control (
  id uuid primary key default gen_random_uuid(),
  anexo_generado_id uuid references public.anexos_generados(id) on delete set null,
  id_local text not null unique,
  estado_control text not null default 'En Control',
  operacion text,
  cliente text,
  ruc_cliente text,
  obligado text,
  ruc_obligado text,
  moneda text,
  monto_neto_pago numeric,
  fecha_pase_control timestamptz,
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.adquirientes (
  id uuid primary key default gen_random_uuid(),
  id_local text unique,
  codigo text not null unique,
  razon_social text not null,
  ruc text not null unique,
  estado text not null default 'Activo',
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.referidores (
  id uuid primary key default gen_random_uuid(),
  id_local text unique,
  codigo text not null unique,
  nombre text not null unique,
  tipo_documento text not null default 'DNI',
  nro_documento text,
  estado text not null default 'Activo',
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.proveedores_participantes (
  id uuid primary key default gen_random_uuid(),
  id_local text unique,
  codigo_cavali text,
  codigo_contrato text not null unique,
  ruc text not null unique,
  razon_social text not null,
  representante_legal text,
  tipo_documento text not null default 'DNI',
  nro_documento text,
  cargo text,
  referidor_codigo text,
  estado text not null default 'Activo',
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.plantillas_anexos (
  id uuid primary key default gen_random_uuid(),
  id_local text unique,
  tipo_anexo text not null,
  version text not null default 'v1',
  ruta_archivo_plantilla text,
  estado text not null default 'Activo',
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (tipo_anexo, version)
);

create table if not exists public.cargas_importadas (
  id uuid primary key default gen_random_uuid(),
  modulo text not null,
  tipo_maestro text,
  nombre_archivo text,
  hash_archivo text,
  cantidad_registros integer not null default 0,
  cantidad_creados integer not null default 0,
  cantidad_actualizados integer not null default 0,
  cantidad_omitidos integer not null default 0,
  usuario_id uuid,
  usuario_nombre text,
  estado text not null default 'Procesado',
  detalle text,
  datos_originales jsonb,
  creado_en timestamptz not null default now()
);

create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  id_local text unique,
  entidad text not null,
  entidad_id text,
  accion text not null,
  registro text,
  estado_anterior text,
  estado_nuevo text,
  detalle text,
  comentario text,
  usuario_id uuid,
  usuario_nombre text not null default 'usuario.local',
  fecha_hora timestamptz not null default now(),
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create table if not exists public.trazabilidad (
  id uuid primary key default gen_random_uuid(),
  entidad text not null,
  entidad_id uuid,
  id_local text,
  accion text not null,
  estado_anterior text,
  estado_nuevo text,
  usuario_id uuid,
  usuario_nombre text,
  detalle text,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  creado_en timestamptz not null default now()
);

create index if not exists anexos_generados_estado_control_idx
on public.anexos_generados (estado_control);

create index if not exists anexos_generados_operacion_idx
on public.anexos_generados (operacion);

create index if not exists registros_control_operacion_idx
on public.registros_control (operacion);

create index if not exists adquirientes_razon_social_idx
on public.adquirientes (razon_social);

create index if not exists proveedores_participantes_razon_social_idx
on public.proveedores_participantes (razon_social);

create index if not exists proveedores_participantes_referidor_idx
on public.proveedores_participantes (referidor_codigo);

create index if not exists referidores_nombre_idx
on public.referidores (nombre);

create index if not exists plantillas_anexos_tipo_idx
on public.plantillas_anexos (tipo_anexo);

create index if not exists cargas_importadas_modulo_idx
on public.cargas_importadas (modulo, tipo_maestro);

create index if not exists cargas_importadas_creado_en_idx
on public.cargas_importadas (creado_en desc);

create index if not exists auditoria_entidad_idx
on public.auditoria (entidad);

create index if not exists auditoria_fecha_hora_idx
on public.auditoria (fecha_hora desc);

create index if not exists auditoria_entidad_id_idx
on public.auditoria (entidad_id);

create index if not exists trazabilidad_entidad_idx
on public.trazabilidad (entidad, entidad_id);

create index if not exists trazabilidad_id_local_idx
on public.trazabilidad (id_local);

create index if not exists trazabilidad_creado_en_idx
on public.trazabilidad (creado_en desc);

create index if not exists perfiles_usuario_correo_idx
on public.perfiles_usuario (correo);

create index if not exists perfiles_usuario_rol_idx
on public.perfiles_usuario (rol);

create or replace function public.actualizar_fecha_modificacion()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists actualizar_anexos_generados_fecha on public.anexos_generados;
create trigger actualizar_anexos_generados_fecha
before update on public.anexos_generados
for each row execute function public.actualizar_fecha_modificacion();

drop trigger if exists actualizar_registros_control_fecha on public.registros_control;
create trigger actualizar_registros_control_fecha
before update on public.registros_control
for each row execute function public.actualizar_fecha_modificacion();

drop trigger if exists actualizar_adquirientes_fecha on public.adquirientes;
create trigger actualizar_adquirientes_fecha
before update on public.adquirientes
for each row execute function public.actualizar_fecha_modificacion();

drop trigger if exists actualizar_referidores_fecha on public.referidores;
create trigger actualizar_referidores_fecha
before update on public.referidores
for each row execute function public.actualizar_fecha_modificacion();

drop trigger if exists actualizar_proveedores_participantes_fecha on public.proveedores_participantes;
create trigger actualizar_proveedores_participantes_fecha
before update on public.proveedores_participantes
for each row execute function public.actualizar_fecha_modificacion();

drop trigger if exists actualizar_plantillas_anexos_fecha on public.plantillas_anexos;
create trigger actualizar_plantillas_anexos_fecha
before update on public.plantillas_anexos
for each row execute function public.actualizar_fecha_modificacion();

drop trigger if exists actualizar_perfiles_usuario_fecha on public.perfiles_usuario;
create trigger actualizar_perfiles_usuario_fecha
before update on public.perfiles_usuario
for each row execute function public.actualizar_fecha_modificacion();

create or replace function public.es_administrador()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles_usuario
    where usuario_id = auth.uid()
      and rol = 'administrador'
      and activo = true
  );
$$;

create or replace function public.perfil_activo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles_usuario
    where usuario_id = auth.uid()
      and activo = true
  );
$$;

create or replace function public.tiene_rol(roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles_usuario
    where usuario_id = auth.uid()
      and activo = true
      and rol = any (roles)
  );
$$;

alter table public.perfiles_usuario enable row level security;
alter table public.perfiles_usuario replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'perfiles_usuario'
  ) then
    alter publication supabase_realtime add table public.perfiles_usuario;
  end if;
end $$;

alter table public.anexos_generados enable row level security;
alter table public.registros_control enable row level security;
alter table public.adquirientes enable row level security;
alter table public.referidores enable row level security;
alter table public.proveedores_participantes enable row level security;
alter table public.plantillas_anexos enable row level security;
alter table public.cargas_importadas enable row level security;
alter table public.auditoria enable row level security;
alter table public.trazabilidad enable row level security;

drop policy if exists "Usuarios pueden consultar su perfil" on public.perfiles_usuario;
create policy "Usuarios pueden consultar su perfil"
on public.perfiles_usuario for select
to authenticated
using (usuario_id = auth.uid() or public.es_administrador());
-- Tambien permite que un usuario vea el perfil precreado por correo antes de enlazar usuario_id.
drop policy if exists "Usuarios pueden consultar perfil por correo" on public.perfiles_usuario;
create policy "Usuarios pueden consultar perfil por correo"
on public.perfiles_usuario for select
to authenticated
using (lower(correo) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Usuarios pueden crear su perfil inicial" on public.perfiles_usuario;
create policy "Usuarios pueden crear su perfil inicial"
on public.perfiles_usuario for insert
to authenticated
with check (usuario_id = auth.uid() or public.es_administrador());

drop policy if exists "Administradores pueden gestionar perfiles" on public.perfiles_usuario;
create policy "Administradores pueden gestionar perfiles"
on public.perfiles_usuario for update
to authenticated
using (public.es_administrador() or usuario_id = auth.uid())
with check (public.es_administrador() or usuario_id = auth.uid() or lower(correo) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Usuarios pueden enlazar su perfil por correo" on public.perfiles_usuario;
create policy "Usuarios pueden enlazar su perfil por correo"
on public.perfiles_usuario for update
to authenticated
using (lower(correo) = lower(coalesce(auth.jwt() ->> 'email', '')))
with check (usuario_id = auth.uid() and lower(correo) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Usuarios autenticados pueden gestionar anexos generados" on public.anexos_generados;
create policy "Usuarios autenticados pueden gestionar anexos generados"
on public.anexos_generados for all
to authenticated
using (public.tiene_rol(array['administrador', 'operaciones', 'control']))
with check (public.tiene_rol(array['administrador', 'operaciones', 'control']));

drop policy if exists "Usuarios autenticados pueden gestionar registros de control" on public.registros_control;
create policy "Usuarios autenticados pueden gestionar registros de control"
on public.registros_control for all
to authenticated
using (public.tiene_rol(array['administrador', 'operaciones', 'control']))
with check (public.tiene_rol(array['administrador', 'operaciones', 'control']));

drop policy if exists "Usuarios autenticados pueden gestionar adquirientes" on public.adquirientes;
create policy "Usuarios autenticados pueden gestionar adquirientes"
on public.adquirientes for all
to authenticated
using (public.tiene_rol(array['administrador', 'operaciones']))
with check (public.tiene_rol(array['administrador', 'operaciones']));

drop policy if exists "Usuarios autenticados pueden gestionar referidores" on public.referidores;
create policy "Usuarios autenticados pueden gestionar referidores"
on public.referidores for all
to authenticated
using (public.tiene_rol(array['administrador', 'operaciones']))
with check (public.tiene_rol(array['administrador', 'operaciones']));

drop policy if exists "Usuarios autenticados pueden gestionar proveedores participantes" on public.proveedores_participantes;
create policy "Usuarios autenticados pueden gestionar proveedores participantes"
on public.proveedores_participantes for all
to authenticated
using (public.tiene_rol(array['administrador', 'operaciones']))
with check (public.tiene_rol(array['administrador', 'operaciones']));

drop policy if exists "Usuarios autenticados pueden gestionar plantillas de anexos" on public.plantillas_anexos;
create policy "Usuarios autenticados pueden gestionar plantillas de anexos"
on public.plantillas_anexos for all
to authenticated
using (public.tiene_rol(array['administrador', 'operaciones']))
with check (public.tiene_rol(array['administrador', 'operaciones']));

drop policy if exists "Usuarios autenticados pueden gestionar cargas importadas" on public.cargas_importadas;
create policy "Usuarios autenticados pueden gestionar cargas importadas"
on public.cargas_importadas for all
to authenticated
using (public.tiene_rol(array['administrador', 'operaciones']))
with check (public.tiene_rol(array['administrador', 'operaciones']));

drop policy if exists "Usuarios activos pueden consultar anexos generados" on public.anexos_generados;
create policy "Usuarios activos pueden consultar anexos generados"
on public.anexos_generados for select
to authenticated
using (public.perfil_activo());

drop policy if exists "Usuarios activos pueden consultar registros de control" on public.registros_control;
create policy "Usuarios activos pueden consultar registros de control"
on public.registros_control for select
to authenticated
using (public.perfil_activo());

drop policy if exists "Usuarios activos pueden consultar adquirientes" on public.adquirientes;
create policy "Usuarios activos pueden consultar adquirientes"
on public.adquirientes for select
to authenticated
using (public.perfil_activo());

drop policy if exists "Usuarios activos pueden consultar referidores" on public.referidores;
create policy "Usuarios activos pueden consultar referidores"
on public.referidores for select
to authenticated
using (public.perfil_activo());

drop policy if exists "Usuarios activos pueden consultar proveedores participantes" on public.proveedores_participantes;
create policy "Usuarios activos pueden consultar proveedores participantes"
on public.proveedores_participantes for select
to authenticated
using (public.perfil_activo());

drop policy if exists "Usuarios activos pueden consultar plantillas de anexos" on public.plantillas_anexos;
create policy "Usuarios activos pueden consultar plantillas de anexos"
on public.plantillas_anexos for select
to authenticated
using (public.perfil_activo());

drop policy if exists "Usuarios autenticados pueden consultar auditoria" on public.auditoria;
create policy "Usuarios autenticados pueden consultar auditoria"
on public.auditoria for select
to authenticated
using (public.tiene_rol(array['administrador', 'auditoria']));

drop policy if exists "Usuarios autenticados pueden registrar auditoria" on public.auditoria;
create policy "Usuarios autenticados pueden registrar auditoria"
on public.auditoria for insert
to authenticated
with check (public.perfil_activo());

drop policy if exists "Usuarios autenticados pueden consultar trazabilidad" on public.trazabilidad;
create policy "Usuarios autenticados pueden consultar trazabilidad"
on public.trazabilidad for select
to authenticated
using (public.tiene_rol(array['administrador', 'auditoria']));

drop policy if exists "Usuarios autenticados pueden registrar trazabilidad" on public.trazabilidad;
create policy "Usuarios autenticados pueden registrar trazabilidad"
on public.trazabilidad for insert
to authenticated
with check (public.perfil_activo());
