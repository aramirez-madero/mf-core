delete from public.adquirientes
where id_local in ('adq-demo-1')
   or ruc in ('20431871808')
   or razon_social ilike '%PERURAIL%';

delete from public.proveedores_participantes
where id_local in ('pp-demo-1')
   or codigo_contrato in ('CLI-001')
   or ruc in ('20559070999')
   or razon_social ilike '%TRIPLETS%';

delete from public.plantillas_anexos
where id_local in ('tpl-1', 'tpl-2', 'tpl-3')
   or ruta_archivo_plantilla ilike 'plantillas/anexo-tipo-%';

delete from public.auditoria
where datos_completos ->> 'id' in ('adq-demo-1', 'pp-demo-1', 'tpl-1', 'tpl-2', 'tpl-3')
   or detalle ilike '%ejemplo%'
   or detalle ilike '%demo%';

delete from public.trazabilidad
where id_local in ('adq-demo-1', 'pp-demo-1', 'tpl-1', 'tpl-2', 'tpl-3')
   or detalle ilike '%ejemplo%'
   or detalle ilike '%demo%';
