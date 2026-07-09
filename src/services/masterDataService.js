import { DEFAULT_MASTER_DATA } from '../data/defaultMasterData.js';
import { normalizeRuc, normalizeText } from '../utils/normalizers.js';

const MASTER_DATA_KEY = 'mf_core_master_data';

export function getMasterData() {
  const stored = localStorage.getItem(MASTER_DATA_KEY);
  if (!stored) return DEFAULT_MASTER_DATA;
  try {
    return { ...DEFAULT_MASTER_DATA, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_MASTER_DATA;
  }
}

export function saveMasterData(masterData) {
  localStorage.setItem(MASTER_DATA_KEY, JSON.stringify(masterData));
}

export function findProvider(masterData, ruc) {
  const cleanRuc = normalizeRuc(ruc);
  return masterData.proveedores.find((item) => normalizeRuc(item.ruc_proveedor) === cleanRuc && item.estado !== 'Inactivo');
}

export function findAcquirer(masterData, ruc) {
  const cleanRuc = normalizeRuc(ruc);
  return masterData.adquirentes.find((item) => normalizeRuc(item.ruc_adquirente) === cleanRuc && item.estado !== 'Inactivo');
}

export function findOriginParticipant(masterData, codigo) {
  const cleanCode = normalizeText(codigo);
  return masterData.participantesOrigen.find((item) => normalizeText(item.codigo_participante) === cleanCode && item.estado !== 'Inactivo');
}
