# Supabase para MF Core

## Objetivo

Supabase se usara primero solo para el flujo que ya existe en el sistema:

- `anexos_generados`: anexos generados y pendientes de pasar a Control.
- `registros_control`: anexos confirmados dentro de Control.
- `adquirientes`: maestro de adquirientes.
- `proveedores_participantes`: maestro de proveedores y participantes.
- `referidores`: maestro de referidores.
- `plantillas_anexos`: maestro de plantillas de anexos.
- `cargas_importadas`: historial de archivos importados y cantidades procesadas.
- `auditoria`: eventos visibles en la pestana Auditoria de la aplicacion.
- `trazabilidad`: historial de acciones, cambios de estado y movimientos importantes.

No se crean tablas para usuarios, configuracion ni reportes todavia.
Eso se agregara cuando el sistema realmente lo use.

## Guardado de maestros

Todo dato cargado en Maestros debe quedar persistido en Supabase.

Reglas:

- Adquirientes se guardan en `adquirientes`.
- Proveedores y participantes se guardan en `proveedores_participantes`.
- Referidores se guardan en `referidores`.
- Plantillas se guardan en `plantillas_anexos`.
- Cada importacion de Excel o CSV se registra en `cargas_importadas`.
- Cada alta, edicion, eliminacion, importacion o actualizacion masiva debe crear un evento en `auditoria` y `trazabilidad`.

La tabla `cargas_importadas` guarda el origen de la carga: modulo, tipo de maestro, nombre del archivo, cantidades procesadas, usuario y detalle. Las filas finales se guardan en su tabla maestra correspondiente.

## Auditoria

La pestana Auditoria debe leer desde `auditoria`, no desde el navegador.

La tabla `auditoria` guarda los eventos visibles para el usuario:

- entidad;
- accion;
- registro;
- estado anterior;
- estado nuevo;
- detalle;
- usuario;
- fecha y hora.

`auditoria` es el historial operativo visible. `trazabilidad` es el rastro completo para control tecnico, reconstruccion de cambios y soporte.

## Trazabilidad obligatoria

Cada accion importante debe registrar un evento en `trazabilidad`.

Eventos minimos:

- Generacion de anexo.
- Pase de anexo a Control.
- Cambio de estado.
- Edicion o correccion de datos relevantes.
- Importacion de maestros.
- Creacion, edicion o eliminacion de registros maestros.
- Eliminacion o anulacion, si luego se permite.

La trazabilidad debe guardar la entidad afectada, el identificador local, la accion, el estado anterior, el estado nuevo, el usuario y una copia de los datos anteriores/nuevos cuando aplique.

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
La app usa Supabase Auth para iniciar sesion antes de leer o guardar datos.

## Crear usuarios

Para que la app pueda guardar en Supabase:

1. Entrar a Supabase.
2. Ir a `Authentication > Users`.
3. Crear un usuario con correo y clave.
4. Abrir MF Core.
5. Iniciar sesion en la cabecera con ese correo y clave.

Sin sesion iniciada, la app seguira funcionando localmente, pero Supabase bloqueara las escrituras por RLS.

## Seguridad en produccion

Antes de dejar Vercel en produccion:

1. En Supabase ir a `Authentication > Providers > Email`.
2. Desactivar el registro publico si aparece como `Allow new users to sign up`.
3. Crear usuarios solo desde `Authentication > Users`.
4. Mantener RLS activado en todas las tablas.
5. No usar `service_role` en Vercel ni en el frontend.
6. En Vercel solo configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

La app bloquea las pantallas operativas si no hay sesion activa. Los datos deben leerse desde Supabase despues del login.

## URL de produccion

Dominio actual:

```txt
https://mfactoring-core.vercel.app/
```

En Supabase, ir a `Authentication > URL Configuration` y configurar:

```txt
Site URL: https://mfactoring-core.vercel.app
Redirect URLs: https://mfactoring-core.vercel.app
```

Esto es necesario para que el login y la recuperacion de clave vuelvan a la app correcta.
