export function validateControlRow(row, duplicateCount) {
  const observations = [];

  if (!row.ruc_cliente) observations.push('Falta RUC proveedor.');
  if (!row.cliente) observations.push('Falta razon social proveedor.');
  if (!row.ruc_obligado) observations.push('Falta RUC adquirente.');
  if (!row.obligado) observations.push('Falta razon social adquirente.');
  if (!row.codigo_obligado) observations.push('Codigo Obligado no encontrado.');
  if (!row.factura) observations.push('No se pudo construir Factura.');
  if (!row.monto_neto_pago) observations.push('Falta monto.');
  if (!row.moneda) observations.push('Falta moneda.');
  if (!row.fecha_vencimiento) observations.push('Falta fecha de vencimiento.');
  if (!row.participante_origen_codigo) observations.push('Falta Participante Origen.');
  if (row.participante_origen_codigo !== '841' && !row.participante_origen_nombre) {
    observations.push('Participante Origen no encontrado en maestro. Debe registrar este participante antes de generar el anexo.');
  }
  if (duplicateCount > 1) observations.push('Factura duplicada en la carga.');
  if (!row.tipo_anexo) observations.push('Tipo de anexo no definido.');

  if (duplicateCount > 1) {
    return { estado_validacion: 'Duplicado', observaciones: observations.join(' ') };
  }

  return {
    estado_validacion: observations.length ? 'Observado' : 'Listo para generar',
    observaciones: observations.join(' '),
  };
}
