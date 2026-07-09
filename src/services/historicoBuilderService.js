import * as XLSX from 'xlsx';
import { HISTORICO_COLUMNS } from '../data/historicoColumns.js';

export function exportHistoricoWorkbook(controlRows) {
  const rows = controlRows.map((row) => Object.fromEntries(
    HISTORICO_COLUMNS.map(([key, label]) => [label, row[key] ?? '']),
  ));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: HISTORICO_COLUMNS.map(([, label]) => label),
  });
  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length, 1), c: HISTORICO_COLUMNS.length - 1 },
    }),
  };
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  worksheet['!cols'] = HISTORICO_COLUMNS.map(([, label]) => ({ wch: Math.max(14, Math.min(34, label.length + 4)) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'HISTORICO');
  XLSX.writeFile(workbook, `MF-Core-HISTORICO-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
