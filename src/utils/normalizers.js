export function normalizeHeader(header) {
  return String(header || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeRuc(value) {
  return String(value || '').replace(/[^\d]/g, '').trim();
}

export function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function normalizeMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeCurrency(value) {
  const text = normalizeText(value).toUpperCase();
  if (['S/', 'S/.', 'PEN', 'SOLES', 'SOL'].includes(text)) return 'PEN';
  if (['$', 'US$', 'USD', 'DOLARES', 'DOLAR'].includes(text)) return 'USD';
  return text || '';
}

export function normalizeDate(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + value);
    return epoch.toISOString().slice(0, 10);
  }

  const text = normalizeText(value);
  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, day, month, rawYear] = slashMatch;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

export function buildInvoice(serie, numeracion, prefix = '') {
  const cleanSerie = normalizeText(serie).toUpperCase();
  const cleanNumber = normalizeText(numeracion);
  if (!cleanSerie || !cleanNumber) return '';
  return `${prefix}${cleanSerie}-${cleanNumber}`;
}
