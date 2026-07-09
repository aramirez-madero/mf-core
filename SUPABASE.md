# Supabase para MF Core

## Objetivo

Supabase se usara primero solo para el flujo que ya existe en el sistema:

- `generated_annexes`: anexos generados y pendientes de pasar a Control.
- `control_records`: anexos confirmados dentro de Control.

No se crean tablas para maestros, auditoria, usuarios, configuracion ni reportes todavia.
Eso se agregara cuando el sistema realmente lo use.

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

## Seguridad

El esquema tiene RLS activado y permite acceso solo a usuarios autenticados.
Antes de guardar datos reales desde la app publicada, falta conectar login o una capa backend.
