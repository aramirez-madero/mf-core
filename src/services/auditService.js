const AUDIT_KEY = 'mf_core_audit_actions';

export function loadAuditActions() {
  const stored = localStorage.getItem(AUDIT_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function appendAuditAction(action) {
  const nextAction = {
    id: crypto.randomUUID(),
    fecha_hora: new Date().toISOString(),
    ...action,
  };
  localStorage.setItem(AUDIT_KEY, JSON.stringify([nextAction, ...loadAuditActions()]));
  return nextAction;
}
