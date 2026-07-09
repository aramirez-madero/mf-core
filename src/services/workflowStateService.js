import { findAcquirer, findOriginParticipant, findProvider } from './masterDataService.js';
import { validateControlRow } from './validationService.js';
import {
  buildInvoice,
  normalizeCurrency,
  normalizeDate,
  normalizeMoney,
  normalizeRuc,
  normalizeText,
} from '../utils/normalizers.js';

export function processCavaliRows({ rows, fileName, masterData, usuario }) {
  const cargaId = crypto.randomUUID();
  const baseRows = rows.map((row) => buildControlDraft(row, masterData, cargaId, fileName, usuario));
  const invoiceCounts = baseRows.reduce((acc, row) => {
    const key = [row.factura, row.ruc_cliente, row.ruc_obligado].join('|');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const processed = baseRows.map((row) => {
    const key = [row.factura, row.ruc_cliente, row.ruc_obligado].join('|');
    return { ...row, ...validateControlRow(row, invoiceCounts[key]) };
  });

  return {
    rows: processed,
    summary: {
      carga_id: cargaId,
      archivo_nombre: fileName,
      usuario_carga: usuario,
      fecha_carga: new Date().toISOString(),
      total: processed.length,
      validos: processed.filter((row) => ['Validado', 'Listo para generar'].includes(row.estado_validacion)).length,
      observados: processed.filter((row) => row.estado_validacion === 'Observado').length,
      duplicados: processed.filter((row) => row.estado_validacion === 'Duplicado').length,
    },
  };
}

function buildControlDraft(rawRow, masterData, cargaId, fileName, usuario) {
  const rucProveedor = normalizeRuc(rawRow.ruc_proveedor);
  const rucAdquirente = normalizeRuc(rawRow.ruc_adquirente);
  const participanteCodigo = normalizeText(rawRow.participante_origen);
  const provider = findProvider(masterData, rucProveedor);
  const acquirer = findAcquirer(masterData, rucAdquirente);
  const participant = participanteCodigo === '841' ? null : findOriginParticipant(masterData, participanteCodigo);
  const montoNetoPago = normalizeMoney(rawRow.importe_neto_pagar) ?? normalizeMoney(rawRow.monto_neto) ?? normalizeMoney(rawRow.monto_bruto);
  const moneda = normalizeCurrency(rawRow.moneda);
  const factura = buildInvoice(rawRow.serie, rawRow.numeracion);
  const fechaVencimiento = normalizeDate(rawRow.fecha_vencimiento);
  const fechaEmision = normalizeDate(rawRow.fecha_emision);

  return {
    carga_id: cargaId,
    factura_id: crypto.randomUUID(),
    operacion_id: crypto.randomUUID(),
    control_id: crypto.randomUUID(),
    archivo_cavali: fileName,
    originador: participanteCodigo === '841' ? 'Madero Factoring' : (participant?.nombre_participante || ''),
    fondo: 'Madero Factoring',
    cliente_factoring_referidor: provider?.codigo_interno || '',
    cliente: provider?.razon_social_homologada || normalizeText(rawRow.razon_social_proveedor),
    ruc_cliente: rucProveedor,
    codigo_obligado: acquirer?.codigo_adquirente || '',
    obligado: acquirer?.razon_social_homologada || normalizeText(rawRow.razon_social_adquirente),
    ruc_obligado: rucAdquirente,
    operacion: factura ? `OP-${factura}` : '',
    factura,
    fecha_desembolso: '',
    fecha_vencimiento: fechaVencimiento,
    fecha_pago: normalizeDate(rawRow.fecha_pago),
    tasa: Number(acquirer?.tasa_default || 0),
    estado: 'Cargado',
    margen_cobertura: '',
    moneda,
    monto_neto_pago: montoNetoPago || 0,
    monto_financiado_saldo_capital: montoNetoPago || 0,
    costo_bancario: 0,
    porcentaje_comision_desembolso: 0,
    comisiones: 0,
    recalculo_intereses: 0,
    monto_desembolsar: montoNetoPago || 0,
    interes_compensatorio: 0,
    interes_moratorio: 0,
    igv: normalizeMoney(rawRow.igv) || 0,
    deuda_a_la_fecha: montoNetoPago || 0,
    interes_operacion: 0,
    plazo_operacion: calculateTerm(fechaEmision, fechaVencimiento),
    capital: montoNetoPago || 0,
    tasa_fondos: 0,
    interes_fondos: 0,
    spread_mf: 0,
    plazo_x_capital: 0,
    tasa_x_capital: 0,
    a_la_venta: '',
    participante_origen_codigo: participanteCodigo,
    participante_origen_nombre: participanteCodigo === '841' ? 'Madero Factoring' : (participant?.nombre_participante || ''),
    participante_origen_ruc: participanteCodigo === '841' ? '' : (participant?.ruc_participante || ''),
    requiere_datos_participante: participanteCodigo === '841' ? 'No' : 'Si',
    codigo_valor_cavali: normalizeText(rawRow.codigo_valor_cavali),
    estado_cavali: normalizeText(rawRow.estado_cavali),
    respuesta_adquirente: normalizeText(rawRow.respuesta_adquirente),
    observaciones: '',
    link_anexo_word: '',
    link_anexo_pdf: '',
    version_anexo: '',
    fecha_carga: new Date().toISOString(),
    usuario_carga: usuario,
    fecha_generacion: '',
    usuario_generador: '',
    tipo_anexo: 'Anexo Tipo 1',
  };
}

function calculateTerm(start, end) {
  if (!start || !end) return '';
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diff)) return '';
  return Math.max(0, Math.round(diff / 86400000));
}
