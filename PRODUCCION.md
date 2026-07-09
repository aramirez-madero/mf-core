# MF Core - primera version publicable

## Publicacion V1

Esta version se puede publicar como aplicacion web estatica.

Comandos:

```powershell
npm install
npm run build
```

El resultado queda en `dist/`.

## Opcion rapida: Vercel

Configuracion:

- Build command: `npm run build`
- Output directory: `dist`
- Framework: `Vite`

El archivo `vercel.json` ya deja esta configuracion preparada.

## Punto critico antes de uso masivo

Esta V1 guarda datos en el navegador con `localStorage`. Eso sirve para una primera prueba operativa controlada, pero no para un software completo multiusuario.

Para la version escalable se debe mover la persistencia a:

- Backend con API.
- Base de datos central.
- Usuarios y permisos.
- Auditoria persistente en servidor.
- Almacenamiento real de anexos/documentos.

## Arquitectura recomendada siguiente

- Frontend: Vite con modulos por pestana.
- Backend: API REST o RPC.
- Base de datos: PostgreSQL.
- Archivos: storage tipo S3, Azure Blob o equivalente.
- Autenticacion: roles por usuario.

## Pestañas

La navegacion principal queda organizada por pestanas:

- Anexos
- Maestros
- Control
- Auditoria

Anexos mantiene subpestanas internas:

- Generar
- Anexos generados
