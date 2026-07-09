import * as XLSX from 'xlsx';
import { normalizeHeader } from '../utils/normalizers.js';

const COLUMN_ALIASES = {
  participante_origen: ['participante origen', 'codigo participante origen', 'part origen'],
  ruc_proveedor: ['ruc proveedor', 'ruc cedente', 'ruc cliente'],
  razon_social_proveedor: ['razon social proveedor', 'proveedor', 'razon social cedente', 'cliente'],
  ruc_adquirente: ['ruc adquirente', 'ruc obligado', 'ruc pagador'],
  razon_social_adquirente: ['razon social adquirente', 'adquirente', 'obligado', 'pagador'],
  serie: ['serie'],
  numeracion: ['numeracion', 'numero', 'correlativo'],
  codigo_valor_cavali: ['codigo de valor', 'codigo valor', 'codigo cavali'],
  tipo_comprobante: ['tipo de comprobante', 'tipo comprobante'],
  importe_neto_pagar: ['importe neto a pagar', 'importe neto a pagar factura negociable'],
  monto_bruto: ['monto bruto', 'monto bruto comprobante de pago'],
  igv: ['igv'],
  monto_neto: ['monto neto'],
  moneda: ['moneda'],
  fecha_emision: ['fecha de emision', 'fecha emision'],
  fecha_vencimiento: ['fecha de vencimiento', 'fecha vencimiento'],
  fecha_pago: ['fecha de pago', 'fecha pago'],
  fecha_transferencia_contable: ['fecha de transferencia contable', 'fecha transferencia contable'],
  respuesta_adquirente: ['respuesta de adquirente', 'respuesta adquirente'],
  fecha_respuesta_adquirente: ['fecha de respuesta adquirente', 'fecha respuesta adquirente'],
  estado_cavali: ['estado'],
  estado_sunat: ['estado sunat'],
  estado_cpe_sunat: ['estado cpe sunat'],
  orden_compra: ['orden de compra', 'oc'],
  descripcion: ['descripcion'],
  observaciones_cavali: ['observaciones', 'observacion'],
};

export async function parseCavaliFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });
  return rawRows.map(mapRowToCanonical);
}

function mapRowToCanonical(row) {
  const normalizedEntries = Object.entries(row).reduce((acc, [key, value]) => {
    acc[normalizeHeader(key)] = value;
    return acc;
  }, {});

  return Object.entries(COLUMN_ALIASES).reduce((acc, [field, aliases]) => {
    const alias = aliases.find((item) => Object.prototype.hasOwnProperty.call(normalizedEntries, item));
    acc[field] = alias ? normalizedEntries[alias] : '';
    return acc;
  }, {});
}
