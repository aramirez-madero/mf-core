# Supabase para MF Core

## Objetivo

Supabase sera la base en la nube para reemplazar gradualmente `localStorage`.

Primera etapa:

- `control_records`: registros confirmados en Control.
- `generated_annexes`: anexos generados antes o despues de pasarlos a Control.
- `master_records`: maestros internos.
- `audit_actions`: trazabilidad.

## Crear proyecto

1. Entrar a Supabase.
2. Crear un proyecto nuevo.
3. Abrir `SQL Editor`.
4. Ejecutar el archivo `supabase/schema.sql`.

## Variables para Vercel

Crear estas variables en Vercel, dentro del proyecto:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Los valores salen de Supabase en `Project Settings > API`.

## Nota importante

El esquema tiene RLS activado y permite acceso solo a usuarios autenticados.
Antes de mover datos reales a Supabase, el sistema debe tener login o una capa backend.
