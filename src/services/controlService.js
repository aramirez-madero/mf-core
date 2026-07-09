const CONTROL_KEY = 'mf_core_control_records';

export function loadControlRecords() {
  const stored = localStorage.getItem(CONTROL_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveControlBatch(rows) {
  const timestamp = new Date().toISOString();
  const records = rows.map((row) => ({
    id: row.control_id || crypto.randomUUID(),
    ...row,
    fecha_actualizacion: timestamp,
  }));
  localStorage.setItem(CONTROL_KEY, JSON.stringify([...records, ...loadControlRecords()]));
  return records;
}
