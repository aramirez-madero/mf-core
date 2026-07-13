import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentSession = null;
let passwordRecoveryMode = false;
let authNotice = '';

const STORAGE = {
  master: 'mf_core_master_data_v2',
  control: 'mf_core_control_records_v2',
  annexes: 'mf_core_generated_annexes_v1',
  audit: 'mf_core_audit_actions_v2',
  preview: 'mf_core_preview_records_v2',
  counters: 'mf_core_counters_v1',
  annexParams: 'mf_core_annex_params_v1',
  migrations: 'mf_core_migrations_v1',
};

const DEFAULT_ANNEX_PARAMS = {
  tnm: '',
  comisionDesembolso: '',
  margenCobertura: '',
  gastosAdministrativos: '',
  gastosBancarios: '',
};

const HISTORICO_COLUMNS = [
  ['originador', 'Originador'],
  ['fondo', 'Fondo'],
  ['cliente_factoring_referidor', 'Cliente + factoring / referidor'],
  ['cliente', 'Cliente'],
  ['ruc_cliente', 'RUC (Cliente)'],
  ['codigo_obligado', 'Codigo Obligado'],
  ['obligado', 'Obligado'],
  ['ruc_obligado', 'RUC (Obligado)'],
  ['operacion', 'Operacion'],
  ['factura', 'Factura'],
  ['fecha_desembolso', 'Fecha de Desembolso'],
  ['fecha_vencimiento', 'Fecha Vencimiento'],
  ['fecha_pago', 'Fecha de pago'],
  ['tasa', 'Tasa'],
  ['estado', 'Estado'],
  ['margen_cobertura', 'Margen cobertura'],
  ['moneda', 'Moneda'],
  ['monto_neto_pago', 'Monto Neto de pago'],
  ['monto_financiado_saldo_capital', 'Monto Financiado / Saldo de capital'],
  ['costo_bancario', 'Costo Bancario'],
  ['porcentaje_comision_desembolso', '% Comision de desembolso'],
  ['comisiones', 'Comisiones'],
  ['recalculo_intereses', '(+/-) Recalculo de intereses'],
  ['monto_desembolsar', 'Monto a desembolsar'],
  ['interes_compensatorio', 'Int. Compensatorio'],
  ['interes_moratorio', 'Int. Moratorios'],
  ['igv', 'IGV'],
  ['deuda_a_la_fecha', 'Deuda a la fecha'],
  ['interes_operacion', 'Interes operacion'],
  ['plazo_operacion', 'Plazo operacion'],
  ['capital', 'Capital'],
  ['tasa_fondos', 'Tasa Fondos'],
  ['interes_fondos', 'Interes fondos'],
  ['spread_mf', 'Spread MF'],
  ['plazo_x_capital', 'Plazo x Capital'],
  ['tasa_x_capital', 'Tasa x Capital'],
  ['a_la_venta', 'A la venta'],
];

const DEFAULT_MASTER = {
  adquirentes: [],
  proveedoresParticipantes: [],
  referidores: [],
  plantillasAnexos: [],
};

const MASTER_VIEWS = {
  adquirentes: {
    title: 'Adquirientes',
    collection: 'adquirentes',
    fields: ['codigo', 'razon_social', 'ruc', 'estado'],
    template: { codigo: '', razon_social: '', ruc: '', estado: 'Activo' },
    primary: 'razon_social',
  },
  proveedoresParticipantes: {
    title: 'Proveedor / Participante',
    collection: 'proveedoresParticipantes',
    fields: ['codigo_cavali', 'codigo_contrato', 'ruc', 'razon_social', 'representante_legal', 'tipo_documento', 'nro_documento', 'cargo', 'referidor_id', 'estado'],
    template: { codigo_cavali: '', codigo_contrato: '', ruc: '', razon_social: '', representante_legal: '', tipo_documento: 'DNI', nro_documento: '', cargo: '', referidor_id: '', estado: 'Activo' },
    primary: 'razon_social',
  },
  referidores: {
    title: 'Referidores',
    collection: 'referidores',
    fields: ['id', 'nombre', 'tipo_documento', 'nro_documento', 'estado'],
    template: { nombre: '', tipo_documento: 'DNI', nro_documento: '', estado: 'Activo' },
    primary: 'nombre',
  },
};

const TEMPLATE_VIEW = {
  title: 'Plantillas de anexos',
  collection: 'plantillasAnexos',
  fields: ['tipo_anexo', 'version', 'ruta_archivo_plantilla', 'estado'],
  template: { tipo_anexo: 'Anexo Tipo 1', version: 'v1', ruta_archivo_plantilla: '', estado: 'Activo' },
  primary: 'tipo_anexo',
};

const CONTROL_VIEW = {
  title: 'Control',
  fields: ['originador', 'fondo', 'cliente', 'ruc_cliente', 'codigo_obligado', 'obligado', 'ruc_obligado', 'operacion', 'factura', 'fecha_vencimiento', 'fecha_pago', 'tasa', 'estado', 'moneda', 'monto_neto_pago', 'monto_desembolsar', 'participante_origen_codigo', 'participante_origen_nombre', 'requiere_datos_participante', 'estado_validacion', 'observaciones'],
  template: { originador: '', fondo: 'Madero Factoring', cliente: '', ruc_cliente: '', codigo_obligado: '', obligado: '', ruc_obligado: '', operacion: '', factura: '', fecha_vencimiento: '', fecha_pago: '', tasa: 0, estado: 'Cargado', moneda: 'PEN', monto_neto_pago: 0, monto_desembolsar: 0, participante_origen_codigo: '841', participante_origen_nombre: 'Madero Factoring', requiere_datos_participante: 'No', estado_validacion: 'Manual', observaciones: '' },
  primary: 'operacion',
};

const AUDIT_VIEW = {
  title: 'Auditoria',
  fields: ['entidad', 'accion', 'registro', 'estado_anterior', 'estado_nuevo', 'detalle', 'usuario', 'fecha_hora'],
  template: { entidad: 'manual', entidad_id: '', accion: '', registro: '', estado_anterior: '', estado_nuevo: '', detalle: '', usuario: 'usuario.local', comentario: '', fecha_hora: '' },
  primary: 'accion',
};

const ALIASES = {
  participante_origen: ['participante origen', 'codigo participante origen', 'part origen'],
  ruc_proveedor: ['ruc proveedor', 'ruc cedente', 'ruc cliente'],
  razon_social_proveedor: ['razon social proveedor', 'proveedor', 'razon social cedente', 'cliente'],
  ruc_adquirente: ['ruc adquirente', 'ruc obligado', 'ruc pagador'],
  razon_social_adquirente: ['razon social adquirente', 'adquirente', 'obligado', 'pagador'],
  serie: ['serie'],
  numeracion: ['numeracion', 'numero', 'correlativo'],
  codigo_valor_cavali: ['codigo de valor', 'codigo valor', 'codigo cavali'],
  importe_neto_pagar: ['importe neto a pagar', 'importe neto a pagar factura negociable', 'importe neto a pagar (factura negociable)', 'importe neto a pagar xml factura negociable'],
  monto_bruto: ['monto bruto', 'monto bruto comprobante de pago'],
  igv: ['igv'],
  monto_neto: ['monto neto'],
  moneda: ['moneda'],
  fecha_emision: ['fecha de emision', 'fecha emision'],
  fecha_vencimiento: ['fecha de vencimiento', 'fecha vencimiento'],
  fecha_pago: ['fecha de pago (xml - credito)', 'fecha de pago xml credito', 'fecha pago xml credito', 'fecha de pago', 'fecha pago'],
  respuesta_adquirente: ['respuesta de adquirente', 'respuesta adquirente'],
  estado_cavali: ['estado'],
  observaciones_cavali: ['observaciones', 'observacion'],
};

const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI', sunatCode: '1', maxLength: 8, exactLength: 8, pattern: 'numeric' },
  { value: 'CE', label: 'CE', sunatCode: '4', maxLength: 12, pattern: 'alphanumeric' },
  { value: 'RUC', label: 'RUC', sunatCode: '6', maxLength: 11, exactLength: 11, pattern: 'numeric' },
  { value: 'PASAPORTE', label: 'Pasaporte', sunatCode: '7', maxLength: 12, pattern: 'alphanumeric' },
  { value: 'PARTIDA_NACIMIENTO', label: 'Partida de nacimiento / identidad', sunatCode: '11', maxLength: 15, pattern: 'alphanumeric' },
  { value: 'DOC_TRIB_NO_DOM', label: 'Doc. trib. no domiciliado sin RUC', sunatCode: '0', maxLength: 15, pattern: 'alphanumeric' },
  { value: 'CEDULA_DIPLOMATICA', label: 'Cedula diplomatica', sunatCode: 'A', maxLength: 15, pattern: 'alphanumeric' },
  { value: 'OTROS', label: 'Otros documentos', sunatCode: '0', maxLength: 15, pattern: 'alphanumeric' },
];

const MODULE_ROUTES = {
  anexos: '/anexos',
  maestros: '/maestros',
  control: '/control',
  auditoria: '/auditoria',
};

const ROUTE_MODULES = {
  '/': { module: 'anexos', annexTab: 'generar' },
  '/anexos': { module: 'anexos', annexTab: 'generar' },
  '/anexos/generados': { module: 'anexos', annexTab: 'generados' },
  '/cavali': { module: 'anexos', annexTab: 'generar' },
  '/maestros': { module: 'maestros' },
  '/control': { module: 'control' },
  '/auditoria': { module: 'auditoria' },
};

let state = {
  module: 'anexos',
  annexTab: 'generar',
  annexGeneratedSearch: '',
  annexGeneratedDate: '',
  annexGeneratedSort: 'fecha_desc',
  activeMaster: 'adquirentes',
  masterSearch: '',
  masterPage: 1,
  masterPageSize: 25,
  auditSearch: '',
  auditEntityFilter: '',
  auditDateFilter: '',
  auditPage: 1,
  auditPageSize: 25,
  masterData: normalizeMasterData(load(STORAGE.master, DEFAULT_MASTER)),
  counters: load(STORAGE.counters, {}),
  annexParams: normalizeAnnexParams(load(STORAGE.annexParams, {})),
  migrations: load(STORAGE.migrations, {}),
  previewRows: load(STORAGE.preview, []),
  controlRows: load(STORAGE.control, []),
  annexRows: loadGeneratedAnnexes(),
  auditRows: load(STORAGE.audit, []),
};

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const $ = (id) => document.getElementById(id);

window.addEventListener('error', (event) => {
  showErrorDialog('Error inesperado', event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  showErrorDialog('Error inesperado', event.reason?.message || String(event.reason || 'Ocurrio un error inesperado.'));
});

void boot();

async function boot() {
  window.addEventListener('popstate', applyRouteFromLocation);
  document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault();
    switchModule(button.dataset.module);
  }));
  document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => switchModule(button.dataset.go)));
  document.querySelectorAll('[data-annex-tab]').forEach((button) => button.addEventListener('click', () => switchAnnexTab(button.dataset.annexTab)));
  $('file').addEventListener('change', handleFile);
  $('master-file').addEventListener('change', handleMasterFile);
  $('export-master-format').addEventListener('change', (event) => {
    if (!event.target.value) return;
    exportActiveMaster(event.target.value);
    event.target.value = '';
  });
  $('master-search').addEventListener('input', (event) => {
    state.masterSearch = event.target.value;
    state.masterPage = 1;
    renderMasters();
  });
  $('clear-master-filters').addEventListener('click', () => {
    state.masterSearch = '';
    state.masterPage = 1;
    $('master-search').value = '';
    renderMasters();
  });
  $('audit-search').addEventListener('input', (event) => {
    state.auditSearch = event.target.value;
    state.auditPage = 1;
    renderAudit();
  });
  $('audit-entity-filter').addEventListener('change', (event) => {
    state.auditEntityFilter = event.target.value;
    state.auditPage = 1;
    renderAudit();
  });
  $('audit-date-filter').addEventListener('change', (event) => {
    state.auditDateFilter = event.target.value;
    state.auditPage = 1;
    renderAudit();
  });
  $('clear-audit-filters').addEventListener('click', () => {
    state.auditSearch = '';
    state.auditEntityFilter = '';
    state.auditDateFilter = '';
    state.auditPage = 1;
    $('audit-search').value = '';
    $('audit-entity-filter').value = '';
    $('audit-date-filter').value = '';
    renderAudit();
  });
  $('generate-annexes').addEventListener('click', generateAnnexes);
  $('cancel-preview-import').addEventListener('click', cancelPreviewImport);
  $('annex-params').addEventListener('input', cacheAnnexParamInput);
  $('annex-params').addEventListener('change', commitAnnexParamInput);
  $('annex-params').addEventListener('focusout', commitAnnexParamInput);
  $('export-preview-format').addEventListener('change', (event) => {
    if (!event.target.value) return;
    exportPreview(event.target.value);
    event.target.value = '';
  });
  $('annex-generated-search').addEventListener('input', (event) => {
    state.annexGeneratedSearch = event.target.value;
    renderGeneratedAnnexes();
  });
  $('annex-generated-date').addEventListener('change', (event) => {
    state.annexGeneratedDate = event.target.value;
    renderGeneratedAnnexes();
  });
  $('annex-generated-sort').addEventListener('change', (event) => {
    state.annexGeneratedSort = event.target.value;
    renderGeneratedAnnexes();
  });
  $('clear-annex-generated-filters').addEventListener('click', () => {
    state.annexGeneratedSearch = '';
    state.annexGeneratedDate = '';
    state.annexGeneratedSort = 'fecha_desc';
    $('annex-generated-search').value = '';
    $('annex-generated-date').value = '';
    $('annex-generated-sort').value = 'fecha_desc';
    renderGeneratedAnnexes();
  });
  $('login-form').addEventListener('submit', signIn);
  $('auth-reset').addEventListener('click', resetPassword);
  $('auth-logout').addEventListener('click', signOut);
  $('add-master').addEventListener('click', () => openRecordModal('master', state.activeMaster, null));
  $('export-control-format').addEventListener('change', (event) => {
    if (!event.target.value) return;
    exportControl(event.target.value);
    event.target.value = '';
  });
  $('master-selector').addEventListener('change', (event) => {
    state.activeMaster = event.target.value;
    state.masterSearch = '';
    state.masterPage = 1;
    $('master-search').value = '';
    renderMasters();
  });
  seedMasterSelector();
  await initializeAuth();
  await loadSupabaseState();
  if (currentSession) {
    applyRouteFromLocation({ replace: true });
  } else {
    replacePublicRoute();
  }
  initializeCounters();
  handleStartupActions();
  renderAll();
}

function applyRouteFromLocation(options = {}) {
  const route = routeForPath(window.location.pathname);
  switchModule(route.module, { updateRoute: false });
  if (route.annexTab) switchAnnexTab(route.annexTab, { updateRoute: false });
  if (options.replace) replaceRoute(route.module, route.annexTab);
}

function routeForPath(pathname) {
  const normalizedPath = normalizePathname(pathname);
  return ROUTE_MODULES[normalizedPath] || ROUTE_MODULES['/'];
}

function normalizePathname(pathname) {
  const path = `/${String(pathname || '').split('?')[0].replace(/^\/+/, '')}`.replace(/\/+$/, '');
  return path === '' ? '/' : path.toLowerCase();
}

function routeForModule(moduleName) {
  return MODULE_ROUTES[moduleName] || MODULE_ROUTES.anexos;
}

function replaceRoute(moduleName, annexTab) {
  const route = moduleName === 'anexos' && annexTab === 'generados'
    ? '/anexos/generados'
    : routeForModule(moduleName);
  if (window.location.pathname !== route) {
    window.history.replaceState({ module: moduleName, annexTab }, '', route);
  }
}

function replacePublicRoute() {
  if (window.location.pathname !== '/') {
    window.history.replaceState({}, document.title, '/');
  }
}

function pushRoute(moduleName, annexTab) {
  const route = moduleName === 'anexos' && annexTab === 'generados'
    ? '/anexos/generados'
    : routeForModule(moduleName);
  if (window.location.pathname !== route) {
    window.history.pushState({ module: moduleName, annexTab }, '', route);
  }
}

function switchModule(moduleName, options = {}) {
  if (!MODULE_ROUTES[moduleName]) moduleName = 'anexos';
  state.module = moduleName;
  if (moduleName === 'anexos' && options.resetAnnexTab !== false && state.annexTab !== 'generar') {
    switchAnnexTab('generar', { updateRoute: false });
  }
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.module === moduleName));
  document.querySelectorAll('.module').forEach((module) => module.classList.toggle('active', module.id === moduleName));
  const titles = {
    anexos: ['Documentos', 'Anexos'],
    maestros: ['Datos base', 'Maestros'],
    control: ['Base operativa', 'Control'],
    auditoria: ['Trazabilidad', 'Auditoria'],
  };
  $('module-kicker').textContent = titles[moduleName][0];
  $('module-title').textContent = titles[moduleName][1];
  if (options.updateRoute !== false) pushRoute(moduleName, moduleName === 'anexos' ? 'generar' : undefined);
}

function switchAnnexTab(tab, options = {}) {
  state.annexTab = tab;
  document.querySelectorAll('[data-annex-tab]').forEach((button) => button.classList.toggle('active', button.dataset.annexTab === tab));
  document.querySelectorAll('.annex-tab').forEach((panel) => panel.classList.toggle('active', panel.id === `annex-tab-${tab}`));
  if (tab === 'generados') renderGeneratedAnnexes();
  if (state.module === 'anexos' && options.updateRoute !== false) pushRoute('anexos', tab);
}

async function initializeAuth() {
  handleAuthHashError();
  if (!supabaseReady()) {
    updateAuthUi();
    return;
  }
  const { data } = await supabase.auth.getSession();
  currentSession = data.session;
  if (!currentSession) clearSensitiveLocalState();
  updateAuthUi();
  supabase.auth.onAuthStateChange(async (event, session) => {
    currentSession = session;
    if (event === 'PASSWORD_RECOVERY') {
      passwordRecoveryMode = true;
      authNotice = 'Ingresa tu nueva contraseña.';
      replacePublicRoute();
    }
    updateAuthUi();
    if (session && !passwordRecoveryMode) {
      await loadSupabaseState();
      applyRouteFromLocation({ replace: true });
      renderAll();
    }
  });
}

function handleAuthHashError() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (params.get('type') === 'recovery') {
    passwordRecoveryMode = true;
    authNotice = 'Ingresa tu nueva contraseña.';
  }
  if (!params.has('error')) return;
  const code = params.get('error_code') || '';
  passwordRecoveryMode = false;
  authNotice = code === 'otp_expired'
    ? 'Enlace vencido. Solicita otro enlace.'
    : 'Enlace no valido. Solicita otro enlace.';
  replacePublicRoute();
}

async function signIn(event) {
  event?.preventDefault();
  if (passwordRecoveryMode) {
    await updatePassword();
    return;
  }
  if (!supabaseReady()) {
    setLoginStatus('Configura Supabase en Vercel.');
    return;
  }
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  if (!email || !password) {
    setLoginStatus('Completa correo y contraseña.');
    return;
  }
  $('auth-login').disabled = true;
  setLoginStatus('Validando credenciales...');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  $('auth-login').disabled = false;
  if (error) {
    setLoginStatus('Credenciales no validas.');
    return;
  }
  currentSession = data.session;
  $('auth-password').value = '';
  setLoginStatus('Sesion iniciada.');
  updateAuthUi();
  await loadSupabaseState();
  applyRouteFromLocation({ replace: true });
  renderAll();
}

async function signOut() {
  if (!supabaseReady()) return;
  await supabase.auth.signOut();
  currentSession = null;
  passwordRecoveryMode = false;
  authNotice = '';
  clearSensitiveLocalState();
  updateAuthUi();
  replacePublicRoute();
  renderAll();
}

async function updatePassword() {
  const password = $('auth-password').value;
  const confirmation = $('auth-password-confirm').value;
  if (!password || password.length < 8) {
    setLoginStatus('Usa minimo 8 caracteres.');
    return;
  }
  if (password !== confirmation) {
    setLoginStatus('Las contraseñas no coinciden.');
    return;
  }
  $('auth-login').disabled = true;
  setLoginStatus('Actualizando contraseña...');
  const { error } = await supabase.auth.updateUser({ password });
  $('auth-login').disabled = false;
  if (error) {
    console.warn('Actualizacion de contrasena fallida:', error.message);
    setLoginStatus('No se pudo actualizar.');
    return;
  }
  passwordRecoveryMode = false;
  authNotice = 'Contraseña actualizada.';
  $('auth-password').value = '';
  $('auth-password-confirm').value = '';
  updateAuthUi();
  await loadSupabaseState();
  applyRouteFromLocation({ replace: true });
  renderAll();
}

async function resetPassword() {
  if (!supabaseReady()) {
    setLoginStatus('Configura Supabase en Vercel.');
    return;
  }
  const email = $('auth-email').value.trim();
  if (!email) {
    setLoginStatus('Ingresa tu correo.');
    return;
  }
  $('auth-reset').disabled = true;
  setLoginStatus('Enviando correo...');
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) {
      console.warn('Recuperacion de contraseña fallida:', error.message);
      setLoginStatus('Revisa Email Auth y URL.');
      return;
    }
    setLoginStatus('Revisa tu correo.');
  } catch (error) {
    console.warn('Recuperacion de contraseña fallida:', error);
    setLoginStatus('No se pudo enviar.');
  } finally {
    $('auth-reset').disabled = false;
  }
}

function updateAuthUi() {
  const email = currentSession?.user?.email || '';
  const locked = !email || passwordRecoveryMode;
  document.body.classList.toggle('auth-locked', locked);
  if (locked) replacePublicRoute();
  $('login-form').classList.toggle('is-recovery', passwordRecoveryMode);
  $('auth-email-wrap').hidden = passwordRecoveryMode;
  $('auth-email').disabled = passwordRecoveryMode;
  $('auth-email').required = !passwordRecoveryMode;
  $('auth-password').autocomplete = passwordRecoveryMode ? 'new-password' : 'current-password';
  $('auth-title').textContent = passwordRecoveryMode ? 'Nueva contraseña' : 'Iniciar sesion';
  $('auth-password-label').textContent = passwordRecoveryMode ? 'Nueva contraseña' : 'Contraseña';
  $('auth-password-confirm-wrap').hidden = !passwordRecoveryMode;
  $('auth-password-confirm').required = passwordRecoveryMode;
  $('auth-login').textContent = passwordRecoveryMode ? 'Actualizar contraseña' : 'Iniciar sesion';
  $('auth-reset').hidden = passwordRecoveryMode;
  $('auth-status').textContent = authNotice || (supabaseReady()
    ? 'Ingresa tus credenciales.'
    : 'Configura Supabase en Vercel.');
  $('auth-user').textContent = email || 'Sin sesion';
  $('auth-logout').hidden = !email;
}

function setLoginStatus(message) {
  authNotice = message;
  $('auth-status').textContent = message;
}

function currentUserName() {
  return currentSession?.user?.email || 'usuario.local';
}

function currentUserId() {
  return currentSession?.user?.id || null;
}

function clearSensitiveLocalState() {
  state.masterData = normalizeMasterData(DEFAULT_MASTER);
  state.previewRows = [];
  state.controlRows = [];
  state.annexRows = [];
  state.auditRows = [];
  state.annexParams = {};
  [STORAGE.master, STORAGE.preview, STORAGE.control, STORAGE.annexes, STORAGE.audit, STORAGE.annexParams].forEach((key) => localStorage.removeItem(key));
}

async function handleMasterFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const rows = await parseGenericFile(file);
    const imported = rows.map((row) => mapMasterRow(row, state.activeMaster)).filter(Boolean);
    const view = MASTER_VIEWS[state.activeMaster];
    const result = mergeImportedMasterRows(state.masterData[view.collection], imported, state.activeMaster, false);
    const decision = await showImportModal({ title: view.title, preview: result });
    if (decision === 'cancel') return;

    const finalResult = mergeImportedMasterRows(state.masterData[view.collection], imported, state.activeMaster, decision === 'update');

    state.masterData[view.collection] = finalResult.rows;
    save(STORAGE.master, state.masterData);
    persistImportedLoadToSupabase({
      modulo: 'maestros',
      tipo_maestro: view.collection,
      nombre_archivo: file.name,
      cantidad_registros: imported.length,
      cantidad_creados: finalResult.created.length,
      cantidad_actualizados: finalResult.updated.length,
      cantidad_omitidos: finalResult.skipped.length,
      detalle: `Existentes no actualizados: ${finalResult.duplicates.length}`,
      datos_originales: rows.slice(0, 100),
    });
    appendAudit(
      'maestros',
      view.collection,
      `Importacion de ${view.title}`,
      'Archivo recibido',
      'Importado',
      `Archivo: ${file.name} | Nuevos: ${finalResult.created.length} | Actualizados: ${finalResult.updated.length} | Existentes no actualizados: ${finalResult.duplicates.length} | Omitidos: ${finalResult.skipped.length}`,
      file.name,
    );
    showToast(`Importacion completada. Nuevos: ${finalResult.created.length}. Actualizados: ${finalResult.updated.length}.`);
    renderAll();
  } catch (error) {
    showErrorDialog('No se pudo importar el maestro', error.message);
  } finally {
    event.target.value = '';
  }
}

function seedMasterSelector() {
  $('master-selector').innerHTML = Object.entries(MASTER_VIEWS)
    .map(([key, view]) => `<option value="${key}">${escapeHtml(view.title)}</option>`)
    .join('');
  $('master-selector').value = state.activeMaster;
}

function handleStartupActions() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('clear') || params.has('load') || params.has('confirm')) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showErrorDialog('Accion bloqueada', 'Las acciones de limpieza o carga por URL estan desactivadas. Los maestros solo se modifican desde el sistema o por codigo interno.');
  }
}

function showImportModal({ title, preview }) {
  return new Promise((resolve) => {
    const modal = ensureImportModal();
    const hasUpdates = preview.duplicates.length > 0;
    let resolved = false;
    $('import-title').textContent = `Importar ${title}`;
    $('import-summary').innerHTML = `
      <div><span>Nuevos</span><strong>${preview.created.length}</strong></div>
      <div><span>Se actualizarian</span><strong>${preview.duplicates.length}</strong></div>
      <div><span>Omitidos</span><strong>${preview.skipped.length}</strong></div>
    `;
    $('import-updates').innerHTML = hasUpdates
      ? `
        <h4>Registros a actualizar</h4>
        <div class="import-update-list">
          ${preview.duplicates.slice(0, 50).map((item) => `<div>${escapeHtml(item.reason)}</div>`).join('')}
          ${preview.duplicates.length > 50 ? `<div>${preview.duplicates.length - 50} registros adicionales...</div>` : ''}
        </div>
      `
      : '';
    $('import-confirm').textContent = hasUpdates ? 'Crear y actualizar' : 'Crear nuevos';

    const cleanup = () => {
      $('import-confirm').onclick = null;
      $('import-cancel').onclick = null;
      modal.onclose = null;
    };
    const finish = (value) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      modal.close();
      resolve(value);
    };

    $('import-confirm').onclick = (event) => {
      event.preventDefault();
      finish(hasUpdates ? 'update' : 'create');
    };
    $('import-cancel').onclick = (event) => {
      event.preventDefault();
      finish('cancel');
    };
    modal.onclose = () => {
      finish('cancel');
    };
    modal.showModal();
  });
}

function ensureImportModal() {
  let modal = $('import-modal');
  if (modal) return modal;

  document.body.insertAdjacentHTML('beforeend', `
    <dialog id="import-modal">
      <form method="dialog" class="modal-card">
        <div class="section-title">
          <div>
            <p class="eyebrow">Importacion</p>
            <h3 id="import-title">Confirmar importacion</h3>
          </div>
          <button class="icon-button" value="cancel" aria-label="Cerrar">x</button>
        </div>
        <div id="import-summary" class="import-summary"></div>
        <div id="import-updates" class="import-updates"></div>
        <menu class="modal-actions">
          <button class="secondary" id="import-cancel" value="cancel">Cancelar</button>
          <button class="primary" id="import-confirm" value="default">Confirmar</button>
        </menu>
      </form>
    </dialog>
  `);
  return $('import-modal');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3800);
}

function showErrorDialog(title, message) {
  const modal = $('error-modal');
  if (!modal) {
    showToast(`${title}: ${message}`);
    return;
  }
  $('error-title').textContent = title || 'No se pudo completar la accion';
  $('error-message').textContent = message || 'Ocurrio un error inesperado.';
  if (typeof modal.showModal === 'function') modal.showModal();
  else showToast(`${title}: ${message}`);
}

function initializeCounters() {
  syncAdquirenteCounterFromRows(state.masterData.adquirentes || []);
  syncReferidorCounterFromRows(state.masterData.referidores || []);
}

function syncAdquirenteCounterFromRows(rows) {
  const current = Number(state.counters.adquirentes || 0);
  const maxFromRows = Math.max(0, ...rows.map((row) => parseAdquirenteCode(row.codigo)));
  const nextValue = Math.max(current, maxFromRows);
  if (nextValue !== current) {
    state.counters.adquirentes = nextValue;
    save(STORAGE.counters, state.counters);
  }
}

function setAdquirenteCounterFromRows(rows) {
  state.counters.adquirentes = Math.max(0, ...rows.map((row) => parseAdquirenteCode(row.codigo)));
  save(STORAGE.counters, state.counters);
}

function parseAdquirenteCode(value) {
  const match = String(value || '').match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function nextAdquirenteCode() {
  const current = Number(state.counters.adquirentes || 0);
  const next = current + 1;
  state.counters.adquirentes = next;
  save(STORAGE.counters, state.counters);
  return `ADQ${String(next).padStart(4, '0')}`;
}

function peekNextAdquirenteCode() {
  const next = Number(state.counters.adquirentes || 0) + 1;
  return `ADQ${String(next).padStart(4, '0')}`;
}

function syncReferidorCounterFromRows(rows) {
  const current = Number(state.counters.referidores || 0);
  const maxFromRows = Math.max(0, ...rows.map((row) => parseReferidorCode(row.id)));
  const nextValue = Math.max(current, maxFromRows);
  if (nextValue !== current) {
    state.counters.referidores = nextValue;
    save(STORAGE.counters, state.counters);
  }
}

function parseReferidorCode(value) {
  const match = String(value || '').match(/^REF(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

function nextReferidorCode() {
  const current = Number(state.counters.referidores || 0);
  const next = current + 1;
  state.counters.referidores = next;
  save(STORAGE.counters, state.counters);
  return `REF${String(next).padStart(4, '0')}`;
}

function peekNextReferidorCode() {
  const next = Number(state.counters.referidores || 0) + 1;
  return `REF${String(next).padStart(4, '0')}`;
}

async function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  $('summary').textContent = 'Procesando archivo...';
  try {
    const rawRows = await parseFile(file);
    state.previewRows = processRows(rawRows, file.name);
    save(STORAGE.preview, state.previewRows);
    persistImportedLoadToSupabase({
      modulo: 'cargas_cavali',
      tipo_maestro: null,
      nombre_archivo: file.name,
      cantidad_registros: state.previewRows.length,
      cantidad_creados: state.previewRows.length,
      cantidad_actualizados: 0,
      cantidad_omitidos: 0,
      detalle: 'Carga CAVALI procesada para validacion previa a anexos.',
      datos_originales: rawRows.slice(0, 100),
    });
    appendAudit('cargas_cavali', crypto.randomUUID(), 'Carga CAVALI procesada', '', 'Validacion ejecutada', `${file.name}: ${state.previewRows.length} registros leidos.`);
    $('summary').textContent = `Carga procesada: ${state.previewRows.length} registros desde ${file.name}. Revisa observaciones antes de generar.`;
    renderAll();
  } catch (error) {
    $('summary').textContent = '';
    showErrorDialog('No se pudo procesar el archivo CAVALI', error.message);
  } finally {
    event.target.value = '';
  }
}

async function parseFile(file) {
  const buffer = await file.arrayBuffer();
  if (!window.XLSX && !file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Para leer Excel se necesita conexion al CDN de SheetJS. Usa CSV si estas offline.');
  }
  if (!window.XLSX || file.name.toLowerCase().endsWith('.csv')) {
    return parseCsv(new TextDecoder('utf-8').decode(buffer));
  }
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }).map(mapCanonical);
}

async function parseGenericFile(file) {
  const buffer = await file.arrayBuffer();
  if (!window.XLSX && !file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Para leer Excel se necesita conexion al CDN de SheetJS. Usa CSV si estas offline.');
  }
  if (!window.XLSX || file.name.toLowerCase().endsWith('.csv')) {
    return parseRawCsv(new TextDecoder('utf-8').decode(buffer));
  }
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = splitCsvLine(lines.shift(), separator);
  return lines.map((line) => {
    const values = splitCsvLine(line, separator);
    return mapCanonical(Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
  });
}

function parseRawCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = splitCsvLine(lines.shift(), separator);
  return lines.map((line) => {
    const values = splitCsvLine(line, separator);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

function splitCsvLine(line, separator) {
  const result = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === separator && !quoted) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((item) => item.trim());
}

function mapCanonical(row) {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => normalized[normalizeHeader(key)] = value);
  return Object.fromEntries(Object.entries(ALIASES).map(([field, aliases]) => {
    const found = aliases.find((alias) => Object.prototype.hasOwnProperty.call(normalized, alias));
    return [field, found ? normalized[found] : ''];
  }));
}

function mapMasterRow(row, masterKey) {
  const normalized = normalizeObject(row);
  if (masterKey === 'referidores') {
    const id = firstValue(normalized, ['id', 'referidor id', 'codigo']);
    const nombre = firstValue(normalized, ['nombre', 'referidor', 'nombre referidor']);
    const tipoDocumento = normalizeDocumentType(firstValue(normalized, ['tipo de documento', 'tipo documento']) || 'DNI');
    const nroDocumento = normalizeDocumentNumber(firstValue(normalized, ['nro documento', 'n° documento', 'numero documento', 'numero de documento', 'documento', 'dni', 'ruc', 'ce']));
    if (!id && !nombre && !nroDocumento) return null;
    return { id: id || '', nombre, tipo_documento: tipoDocumento, nro_documento: nroDocumento, estado: 'Activo' };
  }

  if (masterKey === 'adquirentes') {
    const codigo = firstValue(normalized, ['codigo', 'cod']);
    const razonSocial = firstValue(normalized, ['razon social', 'adquirentes de pago', 'adquiriente', 'adquirente']);
    const ruc = normalizeRuc(firstValue(normalized, ['ruc']));
    if (!codigo && !razonSocial && !ruc) return null;
    return { id: crypto.randomUUID(), codigo: '', codigo_importado: codigo, razon_social: razonSocial, ruc, estado: 'Activo' };
  }

  const codigoCavali = firstValue(normalized, ['codigo cavali', 'participante origen', 'id participante', 'codigo participante']);
  const codigoContrato = firstValue(normalized, ['codigo de contrato', 'codigo contrato', 'contrato']);
  const ruc = normalizeRuc(firstValue(normalized, ['ruc', 'ruc proveedor', 'ruc participante']));
  const razonSocial = firstValue(normalized, ['razon social', 'razon social proveedor', 'proveedor', 'participante']);
  if (!codigoCavali && !codigoContrato && !ruc && !razonSocial) return null;
  return {
    id: crypto.randomUUID(),
    codigo_cavali: codigoCavali,
    codigo_contrato: normalizeContractCode(codigoContrato),
    ruc,
    razon_social: razonSocial,
    representante_legal: firstValue(normalized, ['representante legal']),
    tipo_documento: normalizeDocumentType(firstValue(normalized, ['tipo de documento', 'tipo documento']) || 'DNI'),
    nro_documento: normalizeDocumentNumber(firstValue(normalized, ['nro documento', 'n° documento', 'numero documento', 'numero de documento', 'dni', 'ce'])),
    cargo: firstValue(normalized, ['cargo']),
    referidor_id: resolveReferidorId(firstValue(normalized, ['referidor id', 'id referidor', 'referidor', 'nombre referidor'])),
    estado: 'Activo',
  };
}

function mergeImportedMasterRows(currentRows, importedRows, masterKey, updateExisting) {
  const rows = [...(currentRows || [])];
  const created = [];
  const updated = [];
  const duplicates = [];
  const skipped = [];
  const seenInFile = new Set();

  importedRows.forEach((incoming) => {
    const validation = validateMasterUniqueness(incoming, rows, masterKey);
    const fileKeys = masterFileUniqueKeys(incoming, masterKey);

    if (!fileKeys.length) {
      skipped.push(incoming);
      return;
    }

    const repeatedKey = fileKeys.find((key) => seenInFile.has(key));
    if (repeatedKey) {
      duplicates.push({ row: incoming, reason: `Duplicado en archivo: ${repeatedKey}` });
      return;
    }
    fileKeys.forEach((key) => seenInFile.add(key));

    if (!validation.valid) {
      if (updateExisting && validation.existingId) {
        const existingIndex = rows.findIndex((row) => row.id === validation.existingId);
        if (existingIndex < 0) {
          duplicates.push({ row: incoming, reason: validation.message });
          return;
        }
        const merged = {
          ...rows[existingIndex],
          ...incoming,
          codigo: masterKey === 'adquirentes' ? rows[existingIndex].codigo : incoming.codigo,
          id: rows[existingIndex].id,
        };
        const secondaryValidation = validateMasterUniqueness(merged, rows, masterKey, rows[existingIndex].id);
        if (!secondaryValidation.valid) {
          duplicates.push({ row: incoming, reason: secondaryValidation.message });
          return;
        }
        const before = structuredClone(rows[existingIndex]);
        rows[existingIndex] = {
          ...merged,
          fecha_actualizacion: new Date().toISOString(),
        };
        updated.push({ before, after: rows[existingIndex] });
      } else {
        duplicates.push({ row: incoming, reason: validation.message });
      }
      return;
    }

    const next = {
      ...incoming,
      codigo: masterKey === 'adquirentes' ? nextAdquirenteCode() : incoming.codigo,
      id: masterKey === 'referidores' ? (incoming.id || nextReferidorCode()) : (incoming.id || crypto.randomUUID()),
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    };
    rows.unshift(next);
    created.push(next);
  });

  return { rows, created, updated, duplicates, skipped };
}

function validateMasterUniqueness(record, rows, masterKey, currentId = '') {
  if (masterKey === 'referidores') {
    const id = clean(record.id);
    const nombre = clean(record.nombre);
    if (!nombre) return { valid: false, message: 'Nombre requerido.' };
    const documentValidation = validateDocument(record);
    if (!documentValidation.valid) return documentValidation;
    if (id) {
      const idExisting = rows.find((row) => row.id !== currentId && row.id === id);
      if (idExisting) return { valid: false, message: `ID ya existe: ${id} -> ${recordLabel(idExisting)} se actualizaria con ${recordLabel(record)}`, existingId: idExisting.id };
    }
    const existing = rows.find((row) => row.id !== currentId && normalizeHeader(row.nombre) === normalizeHeader(nombre));
    return existing
      ? { valid: false, message: `Referidor ya existe: ${nombre} -> ${recordLabel(existing)} se actualizaria con ${recordLabel(record)}`, existingId: existing.id }
      : { valid: true, message: '' };
  }

  if (masterKey === 'adquirentes') {
    const ruc = normalizeRuc(record.ruc);
    const codigo = clean(record.codigo);
    if (!ruc) return { valid: false, message: 'RUC requerido.' };
    if (!isValidRuc(ruc)) return { valid: false, message: 'El RUC debe tener 11 digitos numericos.' };
    if (codigo) {
      const codeExisting = rows.find((row) => row.id !== currentId && clean(row.codigo) === codigo);
      if (codeExisting) return { valid: false, message: `Codigo ya existe: ${codigo} -> ${recordLabel(codeExisting)} se actualizaria con ${recordLabel(record)}`, existingId: codeExisting.id };
    }
    const existing = rows.find((row) => row.id !== currentId && normalizeRuc(row.ruc) === ruc);
    return existing
      ? { valid: false, message: `RUC ya existe: ${ruc} -> ${recordLabel(existing)} se actualizaria con ${recordLabel(record)}`, existingId: existing.id }
      : { valid: true, message: '' };
  }

  const ruc = normalizeRuc(record.ruc);
  const contrato = normalizeContractCode(record.codigo_contrato);
  if (!ruc) return { valid: false, message: 'RUC requerido.' };
  if (!isValidRuc(ruc)) return { valid: false, message: 'El RUC debe tener 11 digitos numericos.' };
  if (!contrato) return { valid: false, message: 'Codigo de contrato requerido.' };

  const rucExisting = rows.find((row) => row.id !== currentId && normalizeRuc(row.ruc) === ruc);
  if (rucExisting) return { valid: false, message: `RUC ya existe: ${ruc} -> ${recordLabel(rucExisting)} se actualizaria con ${recordLabel(record)}`, existingId: rucExisting.id };

  const contractExisting = rows.find((row) => row.id !== currentId && normalizeContractCode(row.codigo_contrato) === contrato);
  if (contractExisting) return { valid: false, message: `Codigo de contrato ya existe: ${contrato} -> ${recordLabel(contractExisting)} se actualizaria con ${recordLabel(record)}`, existingId: contractExisting.id };

  const documentValidation = validateDocument(record);
  if (!documentValidation.valid) return documentValidation;

  return { valid: true, message: '' };
}

function validateMasterLive(record, rows, masterKey, currentId = '') {
  if (masterKey === 'referidores') {
    const id = clean(record.id);
    const nombre = clean(record.nombre);
    if (id) {
      const existing = rows.find((row) => row.id !== currentId && row.id === id);
      if (existing) return { valid: false, message: `ID ya existe: ${id}`, existingId: existing.id };
    }
    if (nombre) {
      const existing = rows.find((row) => row.id !== currentId && normalizeHeader(row.nombre) === normalizeHeader(nombre));
      if (existing) return { valid: false, message: `Referidor ya existe: ${nombre}`, existingId: existing.id };
    }
    const documentValidation = validateDocument(record);
    if (!documentValidation.valid) return documentValidation;
    if (!nombre) return { valid: false, message: 'Nombre requerido.' };
    return { valid: true, message: '' };
  }

  if (masterKey === 'adquirentes') {
    const ruc = normalizeRuc(record.ruc);
    const codigo = clean(record.codigo);
    if (codigo) {
      const existing = rows.find((row) => row.id !== currentId && clean(row.codigo) === codigo);
      if (existing) return { valid: false, message: `Codigo ya existe: ${codigo} -> ${recordLabel(existing)} se actualizaria con ${recordLabel(record)}`, existingId: existing.id };
    }
    if (ruc) {
      const existing = rows.find((row) => row.id !== currentId && normalizeRuc(row.ruc) === ruc);
      if (existing) return { valid: false, message: `RUC ya existe: ${ruc} -> ${recordLabel(existing)} se actualizaria con ${recordLabel(record)}`, existingId: existing.id };
      if (!isValidRuc(ruc)) return { valid: false, message: 'El RUC debe tener 11 digitos numericos.' };
    }
    if (!ruc) return { valid: false, message: 'RUC requerido.' };
    return { valid: true, message: '' };
  }

  const contrato = normalizeContractCode(record.codigo_contrato);
  const ruc = normalizeRuc(record.ruc);

  if (contrato) {
    const existing = rows.find((row) => row.id !== currentId && normalizeContractCode(row.codigo_contrato) === contrato);
    if (existing) return { valid: false, message: `Codigo de contrato ya existe: ${contrato} -> ${recordLabel(existing)} se actualizaria con ${recordLabel(record)}`, existingId: existing.id };
  }

  if (ruc) {
    const existing = rows.find((row) => row.id !== currentId && normalizeRuc(row.ruc) === ruc);
    if (existing) return { valid: false, message: `RUC ya existe: ${ruc} -> ${recordLabel(existing)} se actualizaria con ${recordLabel(record)}`, existingId: existing.id };
    if (!isValidRuc(ruc)) return { valid: false, message: 'El RUC debe tener 11 digitos numericos.' };
  }

  const documentValidation = validateDocument(record);
  if (!documentValidation.valid) return documentValidation;

  if (!contrato) return { valid: false, message: 'Codigo de contrato requerido.' };
  if (!ruc) return { valid: false, message: 'RUC requerido.' };

  return { valid: true, message: '' };
}

function masterFileUniqueKeys(row, masterKey) {
  if (masterKey === 'referidores') {
    const id = clean(row.id);
    const nombre = normalizeHeader(row.nombre);
    return [
      id ? `Referidor ID ${id}` : '',
      nombre ? `Referidor ${nombre}` : '',
    ].filter(Boolean);
  }

  if (masterKey === 'adquirentes') {
    const ruc = normalizeRuc(row.ruc);
    const codigo = clean(row.codigo);
    return [
      codigo ? `Codigo ${codigo}` : '',
      ruc ? `RUC ${ruc}` : '',
    ].filter(Boolean);
  }
  const ruc = normalizeRuc(row.ruc);
  const contrato = normalizeContractCode(row.codigo_contrato);
  const codigoCavali = clean(row.codigo_cavali);
  return [
    contrato ? `Contrato ${contrato}` : '',
    ruc ? `RUC ${ruc}` : '',
  ].filter(Boolean);
}

function recordLabel(row) {
  if (!row) return 'registro sin identificar';
  const code = row.codigo || row.codigo_contrato || '';
  const name = row.razon_social || row.cliente || row.factura || '';
  const ruc = row.ruc || row.ruc_cliente || '';
  return [code, name, ruc].filter(Boolean).join(' - ') || row.id || 'registro sin identificar';
}

function processRows(rows, fileName) {
  const cargaId = crypto.randomUUID();
  const drafts = assignOperationNumbers(rows.map((row) => buildDraft(row, cargaId, fileName)));
  const counts = drafts.reduce((acc, row) => {
    const key = [row.factura, row.ruc_cliente, row.ruc_obligado].join('|');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return applyAnnexCalculations(drafts).map((row) => ({ ...row, ...validate(row, counts[[row.factura, row.ruc_cliente, row.ruc_obligado].join('|')]) }));
}

function buildDraft(raw, cargaId, fileName) {
  const rucCliente = normalizeRuc(raw.ruc_proveedor);
  const rucObligado = normalizeRuc(raw.ruc_adquirente);
  const codigo = clean(raw.participante_origen);
  const isDirectProvider = codigo === '841';
  const provider = state.masterData.proveedoresParticipantes.find((item) => normalizeRuc(item.ruc) === rucCliente && item.estado !== 'Desactivado');
  const acquirer = state.masterData.adquirentes.find((item) => normalizeRuc(item.ruc) === rucObligado && item.estado !== 'Desactivado');
  const participant = isDirectProvider ? null : state.masterData.proveedoresParticipantes.find((item) => clean(item.codigo_cavali) === codigo && item.estado !== 'Desactivado');
  const contractSource = isDirectProvider ? provider : participant;
  const signatureSource = isDirectProvider ? provider : participant;
  const monto = normalizeMoney(raw.importe_neto_pagar) ?? normalizeMoney(raw.monto_neto) ?? normalizeMoney(raw.monto_bruto) ?? 0;
  const factura = buildInvoice(raw.serie, raw.numeracion);
  const today = limaDateInput();
  const fechaVencimiento = normalizeCavaliDate(raw.fecha_pago) || normalizeCavaliDate(raw.fecha_vencimiento);
  const proveedorNombre = clean(raw.razon_social_proveedor);
  const clienteNombre = isDirectProvider
    ? proveedorNombre
    : [proveedorNombre, participant?.razon_social].filter(Boolean).join(' | ');
  const clienteRuc = isDirectProvider
    ? rucCliente
    : [rucCliente, participant?.ruc].filter(Boolean).join(' | ');
  return {
    id: crypto.randomUUID(),
    carga_id: cargaId,
    factura_id: crypto.randomUUID(),
    operacion_id: crypto.randomUUID(),
    control_id: crypto.randomUUID(),
    archivo_cavali: fileName,
    originador: isDirectProvider ? 'Madero Factoring' : (participant?.razon_social || ''),
    fondo: 'Madero Factoring',
    cliente_factoring_referidor: contractSource?.codigo_contrato || '',
    cliente: clienteNombre,
    ruc_cliente: clienteRuc,
    proveedor_razon_social_cavali: proveedorNombre,
    proveedor_ruc_cavali: rucCliente,
    proveedor_maestro_id: provider?.id || '',
    referidor_id: provider?.referidor_id || '',
    firma_razon_social: isDirectProvider ? proveedorNombre : (participant?.razon_social || ''),
    firma_representante: signatureSource?.representante_legal || '',
    firma_tipo_documento: signatureSource?.tipo_documento || 'DNI',
    firma_documento: signatureSource?.nro_documento || '',
    firma_cargo: signatureSource?.cargo || '',
    operacion_owner_key: normalizeRuc(contractSource?.ruc || rucCliente) || clean(contractSource?.codigo_cavali || codigo),
    codigo_obligado: acquirer?.codigo || '',
    obligado: acquirer?.razon_social || clean(raw.razon_social_adquirente),
    ruc_obligado: rucObligado,
    operacion: '',
    factura,
    fecha_desembolso: today,
    fecha_vencimiento: fechaVencimiento,
    fecha_pago: normalizeCavaliDate(raw.fecha_pago),
    tasa: Number(acquirer?.tasa_default || 0),
    estado: 'Cargado',
    margen_cobertura: '',
    moneda: normalizeCurrency(raw.moneda),
    monto_neto_pago: monto,
    monto_financiado_saldo_capital: monto,
    costo_bancario: 0,
    porcentaje_comision_desembolso: 0,
    comisiones: 0,
    recalculo_intereses: 0,
    monto_desembolsar: monto,
    interes_compensatorio: 0,
    interes_moratorio: 0,
    igv: normalizeMoney(raw.igv) || 0,
    deuda_a_la_fecha: monto,
    interes_operacion: 0,
    plazo_operacion: daysBetween(today, fechaVencimiento),
    capital: monto,
    tasa_fondos: 0,
    interes_fondos: 0,
    spread_mf: 0,
    plazo_x_capital: 0,
    tasa_x_capital: 0,
    a_la_venta: '',
    participante_origen_codigo: codigo,
    participante_origen_nombre: isDirectProvider ? 'Madero Factoring' : (participant?.razon_social || ''),
    participante_origen_ruc: isDirectProvider ? '' : (participant?.ruc || ''),
    participante_referidor_id: participant?.referidor_id || '',
    requiere_datos_participante: isDirectProvider ? 'No' : 'Si',
    codigo_valor_cavali: clean(raw.codigo_valor_cavali),
    estado_cavali: clean(raw.estado_cavali),
    respuesta_adquirente: clean(raw.respuesta_adquirente),
    link_anexo_word: '',
    link_anexo_pdf: '',
    version_anexo: '',
    fecha_carga: new Date().toISOString(),
    usuario_carga: 'usuario.local',
    fecha_generacion: '',
    usuario_generador: '',
    tipo_anexo: 'Descuento de facturas',
  };
}

function validate(row, duplicateCount) {
  const obs = [];
  if (!row.ruc_cliente) obs.push('Falta RUC proveedor.');
  if (!row.cliente) obs.push('Falta razon social proveedor.');
  if (!row.cliente_factoring_referidor) {
    obs.push(row.participante_origen_codigo === '841'
      ? 'Contrato del proveedor no encontrado en maestro.'
      : 'Contrato del participante origen no encontrado en maestro.');
  }
  if (!row.ruc_obligado) obs.push('Falta RUC adquiriente.');
  if (!row.obligado) obs.push('Falta razon social adquiriente.');
  if (!row.codigo_obligado) obs.push('Codigo de adquiriente no encontrado.');
  if (!row.factura) obs.push('No se pudo construir Factura.');
  if (!row.monto_neto_pago) obs.push('Falta monto.');
  if (!row.moneda) obs.push('Falta moneda.');
  if (!row.fecha_vencimiento) obs.push('Falta fecha de vencimiento.');
  const params = getAnnexParams(annexGroupKey(row));
  if (params.tnm === '') obs.push('Falta ingresar TNM.');
  if (params.comisionDesembolso === '') obs.push('Falta ingresar comision de desembolso.');
  if (params.margenCobertura === '') obs.push('Falta ingresar margen de cobertura.');
  if (groupRequiresAdminExpense(row) && params.gastosAdministrativos === '') obs.push('Falta ingresar gastos administrativos.');
  if (!row.participante_origen_codigo) obs.push('Falta Participante Origen.');
  if (row.participante_origen_codigo !== '841' && !row.participante_origen_nombre) {
    obs.push('Participante Origen no encontrado en maestro. Debe registrar este participante antes de generar el anexo.');
  }
  if (!row.firma_representante) obs.push('Falta representante legal en maestro para la firma.');
  if (!row.firma_documento) obs.push('Falta documento del representante en maestro para la firma.');
  if (!row.firma_cargo) obs.push('Falta cargo del representante en maestro para la firma.');
  if (duplicateCount > 1) obs.push('Factura duplicada en la carga.');
  if (!row.tipo_anexo) obs.push('Tipo de anexo no definido.');
  return {
    estado_validacion: duplicateCount > 1 ? 'Duplicado' : (obs.length ? 'Observado' : 'Listo para generar'),
    observaciones: obs.join(' '),
  };
}

function renderAnnexParams() {
  const container = $('annex-params');
  const groups = groupAnnexRows(state.previewRows);
  if (!groups.length) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <div class="annex-param-list">
      ${groups.map((group) => {
        const key = annexGroupKey(group);
        const params = getAnnexParams(key);
        const hasReferidor = groupRequiresAdminExpense(group);
        const bankExpense = params.gastosBancarios === '' ? fixed2(automaticBankExpense(group.moneda)) : params.gastosBancarios;
        const tnmValue = params.tnm === '' ? '' : formatDecimalInput(params.tnm);
        const commissionValue = params.comisionDesembolso === '' ? '' : formatDecimalInput(params.comisionDesembolso);
        const coverageValue = params.margenCobertura === '' ? '' : formatDecimalInput(params.margenCobertura);
        const adminValue = params.gastosAdministrativos === '' ? '' : formatDecimalInput(params.gastosAdministrativos);
        return `
          <div class="annex-param-row">
            <div class="annex-param-title">
              <strong>${escapeHtml(group.cliente || '-')} / ${escapeHtml(group.obligado || '-')}</strong>
              <span>${escapeHtml(group.ruc_cliente || '-')} - ${escapeHtml(group.ruc_obligado || '-')} | ${group.lineas.length} factura(s)</span>
            </div>
            <label>TNM %
              <input data-annex-param="${escapeAttr(key)}" data-field="tnm" type="text" inputmode="decimal" value="${escapeAttr(tnmValue)}" placeholder="1.50" />
            </label>
            <label>Comision %
              <input data-annex-param="${escapeAttr(key)}" data-field="comisionDesembolso" type="text" inputmode="decimal" value="${escapeAttr(commissionValue)}" placeholder="0.50" />
            </label>
            <label>Cobertura %
              <input data-annex-param="${escapeAttr(key)}" data-field="margenCobertura" type="text" inputmode="decimal" value="${escapeAttr(coverageValue)}" placeholder="10.00" />
            </label>
            <label>Gastos adm.
              ${hasReferidor ? `<input data-annex-param="${escapeAttr(key)}" data-field="gastosAdministrativos" type="text" inputmode="decimal" value="${escapeAttr(adminValue)}" placeholder="0.00" />` : '<span class="annex-static-value">No aplica</span>'}
            </label>
            <label>Gastos banc.
              <input data-annex-param="${escapeAttr(key)}" data-field="gastosBancarios" type="text" inputmode="decimal" value="${escapeAttr(formatDecimalInput(bankExpense))}" />
            </label>
          </div>`;
      }).join('')}
    </div>`;
}

function cacheAnnexParamInput(event) {
  const input = event.target.closest('[data-annex-param]');
  if (!input) return;
  const key = input.dataset.annexParam;
  const field = input.dataset.field;
  state.annexParams[key] = { ...getAnnexParams(key), [field]: input.value };
  save(STORAGE.annexParams, state.annexParams);
}

function commitAnnexParamInput(event) {
  const input = event.target.closest('[data-annex-param]');
  if (!input) return;
  const key = input.dataset.annexParam;
  const field = input.dataset.field;
  const formatted = formatDecimalInput(input.value);
  input.value = formatted;
  state.annexParams[key] = { ...getAnnexParams(key), [field]: formatted };
  save(STORAGE.annexParams, state.annexParams);
  state.previewRows = refreshPreviewRows(state.previewRows);
  save(STORAGE.preview, state.previewRows);
  renderAll();
}

function getAnnexParams(key) {
  return { ...DEFAULT_ANNEX_PARAMS, ...(state.annexParams?.[key] || {}) };
}

function groupRequiresAdminExpense(group) {
  const lines = group.lineas?.length ? group.lineas : [group];
  return lines.some((row) => clean(row.referidor_id || row.participante_referidor_id));
}

function formatDecimalInput(value) {
  const text = String(value ?? '').replace(',', '.').trim();
  if (!text) return '';
  const number = Number(text);
  return Number.isFinite(number) ? number.toFixed(2) : text;
}

function fixed2(value) {
  return (Number(value) || 0).toFixed(2);
}

function normalizeAnnexParams(value) {
  if (!value || typeof value !== 'object') return {};
  const hasLegacyKeys = Object.keys(DEFAULT_ANNEX_PARAMS).some((key) => Object.prototype.hasOwnProperty.call(value, key));
  return hasLegacyKeys ? { default: { ...DEFAULT_ANNEX_PARAMS, ...value } } : value;
}

function refreshPreviewRows(rows) {
  const calculated = applyAnnexCalculations(rows);
  const counts = calculated.reduce((acc, row) => {
    const key = [row.factura, row.ruc_cliente, row.ruc_obligado].join('|');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return calculated.map((row) => ({ ...row, ...validate(row, counts[[row.factura, row.ruc_cliente, row.ruc_obligado].join('|')]) }));
}

function assignOperationNumbers(rows) {
  const groupNext = {};
  const existingPreview = [...(state.previewRows || []), ...(state.controlRows || [])];
  return rows.map((row) => {
    const key = operationCounterKey(row);
    if (!groupNext[key]) {
      const current = Math.max(
        Number(state.counters[`operacion:${key}`] || 1999),
        ...existingPreview.filter((item) => operationCounterKey(item) === key).map((item) => Number(item.operacion) || 1999),
      );
      groupNext[key] = current + 1;
    }
    return { ...row, operacion: String(groupNext[key]) };
  });
}

function commitOperationCounters(rows) {
  const nextCounters = { ...state.counters };
  rows.forEach((row) => {
    const key = `operacion:${operationCounterKey(row)}`;
    const value = Number(row.operacion) || 1999;
    nextCounters[key] = Math.max(Number(nextCounters[key] || 1999), value);
  });
  state.counters = nextCounters;
  save(STORAGE.counters, state.counters);
}

function annexGroupKey(row) {
  return `${normalizeRuc(row.proveedor_ruc_cavali || row.ruc_cliente)}|${normalizeRuc(row.ruc_obligado)}`;
}

function operationCounterKey(row) {
  return normalizeRuc(row.operacion_owner_key || row.proveedor_ruc_cavali || row.ruc_cliente) || clean(row.operacion_owner_key || row.participante_origen_codigo || row.ruc_cliente);
}

function applyAnnexCalculations(rows) {
  return rows.map((row) => calculateAnnexRow(row));
}

function calculateAnnexRow(row) {
  const moneda = normalizeCurrency(row.moneda);
  const params = getAnnexParams(annexGroupKey(row));
  const neto = Number(row.monto_neto_pago) || 0;
  const tnm = parsePercentInput(params.tnm);
  const cobertura = parsePercentInput(params.margenCobertura);
  const comision = parsePercentInput(params.comisionDesembolso);
  const tnmTexto = formatPercentInputDisplay(params.tnm);
  const coberturaTexto = formatPercentInputDisplay(params.margenCobertura);
  const comisionTexto = formatPercentInputDisplay(params.comisionDesembolso);
  const gastosAdmin = groupRequiresAdminExpense(row) ? parseAmountInput(params.gastosAdministrativos) : 0;
  const gastoBanco = params.gastosBancarios === '' || params.gastosBancarios == null
    ? automaticBankExpense(moneda)
    : parseAmountInput(params.gastosBancarios);
  const fechaDesembolso = row.fecha_desembolso || limaDateInput();
  const fechaVencimiento = row.fecha_vencimiento || row.fecha_pago || '';
  const dias = daysBetween(fechaDesembolso, fechaVencimiento);
  const montoFinanciado = neto * (1 - cobertura);
  const interes = montoFinanciado * (Math.pow(1 + (tnm / 30), (Number(dias) || 0) + 1) - 1);
  const igvInteres = interes * 0.18;
  const montoDescontado = montoFinanciado - interes;
  const gastoDesembolso = montoFinanciado * comision;
  const igvGastosOperativos = (gastoBanco + gastoDesembolso) * 0.18;
  const totalGastosOperativos = gastoBanco + gastoDesembolso + igvGastosOperativos;
  const igvGastosAdministrativos = gastosAdmin * 0.18;
  const totalGastosAdministrativos = gastosAdmin + igvGastosAdministrativos;
  const totalGastos = totalGastosOperativos + totalGastosAdministrativos;
  return {
    ...row,
    fecha_desembolso: fechaDesembolso,
    fecha_vencimiento: fechaVencimiento,
    tasa: tnm,
    tasa_texto: tnmTexto,
    relacion_de: 'FACTURAS',
    margen_cobertura: cobertura,
    margen_cobertura_texto: coberturaTexto,
    porcentaje_comision_desembolso: comision,
    porcentaje_comision_desembolso_texto: comisionTexto,
    monto_financiado_saldo_capital: round2(montoFinanciado),
    interes_compensatorio: round2(interes),
    igv: round2(igvInteres),
    monto_descontado: round2(montoDescontado),
    monto_desembolsar: round2(montoDescontado - totalGastos),
    costo_bancario: round2(gastoBanco),
    comisiones: round2(gastoDesembolso),
    gastos_administrativos: round2(gastosAdmin),
    igv_gastos_operativos: round2(igvGastosOperativos),
    total_gastos_operativos: round2(totalGastosOperativos),
    igv_gastos_administrativos: round2(igvGastosAdministrativos),
    total_gastos_administrativos: round2(totalGastosAdministrativos),
    total_gastos: round2(totalGastos),
    plazo_operacion: dias,
    capital: round2(montoFinanciado),
  };
}

function groupAnnexRows(rows) {
  const groups = [];
  const byKey = new Map();
  rows.forEach((row) => {
    const key = annexGroupKey(row);
    if (!byKey.has(key)) {
      const group = { ...row, lineas: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).lineas.push(row);
  });
  return groups.map((group) => calculateAnnexGroup(group));
}

function calculateAnnexGroup(group) {
  const lineas = group.lineas || [group];
  const sum = (field) => round2(lineas.reduce((total, row) => total + (Number(row[field]) || 0), 0));
  const totalNeto = sum('monto_neto_pago');
  const totalFinanciado = sum('monto_financiado_saldo_capital');
  const totalInteres = sum('interes_compensatorio');
  const totalIgvInteres = sum('igv');
  const totalDescontado = sum('monto_descontado');
  const costoBancario = Number(lineas[0]?.costo_bancario) || 0;
  const gastosDesembolso = round2(totalFinanciado * (Number(group.porcentaje_comision_desembolso) || 0));
  const igvGastosOperativos = round2((costoBancario + gastosDesembolso) * 0.18);
  const totalGastosOperativos = round2(costoBancario + gastosDesembolso + igvGastosOperativos);
  const gastosAdministrativos = Number(group.gastos_administrativos) || 0;
  const igvGastosAdministrativos = round2(gastosAdministrativos * 0.18);
  const totalGastosAdministrativos = round2(gastosAdministrativos + igvGastosAdministrativos);
  const totalGastos = round2(totalGastosOperativos + totalGastosAdministrativos);
  return {
    ...group,
    lineas,
    total_monto_neto_pago: totalNeto,
    total_monto_financiado: totalFinanciado,
    total_interes_cobrado: totalInteres,
    total_igv_interes: totalIgvInteres,
    total_monto_descontado: totalDescontado,
    margen_cobertura_monto: round2(totalNeto * (Number(group.margen_cobertura) || 0)),
    tasa_texto: group.tasa_texto || percentDisplayValue(group.tasa),
    margen_cobertura_texto: group.margen_cobertura_texto || percentDisplayValue(group.margen_cobertura),
    porcentaje_comision_desembolso_texto: group.porcentaje_comision_desembolso_texto || percentDisplayValue(group.porcentaje_comision_desembolso),
    costo_bancario: round2(costoBancario),
    comisiones: gastosDesembolso,
    igv_gastos_operativos: igvGastosOperativos,
    total_gastos_operativos: totalGastosOperativos,
    gastos_administrativos: round2(gastosAdministrativos),
    igv_gastos_administrativos: igvGastosAdministrativos,
    total_gastos_administrativos: totalGastosAdministrativos,
    total_gastos: totalGastos,
    monto_desembolsar: round2(totalDescontado - totalGastos),
  };
}

function parsePercentInput(value) {
  const number = parseAmountInput(value);
  return number / 100;
}

function parseAmountInput(value) {
  return Number(String(value ?? '').replace(/%/g, '').replace(/,/g, '')) || 0;
}

function formatPercentInputDisplay(value) {
  const text = String(value ?? '').replace(',', '.').trim();
  if (!text) return '';
  return `${text}%`;
}

function percentDisplayValue(value) {
  const number = Number(value) || 0;
  if (!number) return '';
  return `${(number * 100).toFixed(2)}%`;
}

function automaticBankExpense(moneda) {
  return moneda === 'USD' ? 30 : 100;
}

function daysBetween(startDate, endDate) {
  const startKey = normalizeDate(startDate);
  const endKey = normalizeDate(endDate);
  if (!startKey || !endKey) return '';
  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function generateAnnexes() {
  const validRows = state.previewRows.filter((row) => ['Validado', 'Listo para generar'].includes(row.estado_validacion));
  if (!validRows.length) return;
  const generatedAt = new Date().toISOString();
  const generated = groupAnnexRows(validRows).map((row) => {
    const generatedRow = {
      ...row,
      id: row.control_id,
      estado: 'Anexo generado',
      estado_validacion: 'Generado',
      estado_control: 'Pendiente de pasar a Control',
      version_anexo: 'v1',
      link_anexo_word: `pendiente/${row.operacion}-Anexo-Tipo-1.docx`,
      fecha_generacion: generatedAt,
      usuario_generador: 'usuario.local',
    };
    return {
      ...generatedRow,
      anexo_html: buildAnnexHtmlV2(generatedRow),
      anexo_snapshot_version: 'html-v1',
      fecha_snapshot: generatedAt,
    };
  });
  commitOperationCounters(validRows);
  state.annexRows = [...generated, ...state.annexRows];
  state.previewRows = state.previewRows.map((row) => validRows.some((valid) => valid.factura_id === row.factura_id) ? { ...row, estado_validacion: 'Generado', estado: 'Anexo generado' } : row);
  save(STORAGE.annexes, state.annexRows);
  save(STORAGE.preview, state.previewRows);
  appendAudit('anexos', generated.map((row) => row.id).join(','), 'Generacion de anexos', 'Listo para generar', 'Pendiente de pasar a Control', `${generated.length} anexos generados y pendientes de confirmacion.`);
  switchModule('anexos');
  switchAnnexTab('generados');
  renderAll();
}

function cancelPreviewImport() {
  if (!state.previewRows.length) return;
  if (!confirm('Cancelar la carga en vista previa?')) return;
  const count = state.previewRows.length;
  state.previewRows = [];
  state.annexParams = {};
  save(STORAGE.preview, state.previewRows);
  save(STORAGE.annexParams, state.annexParams);
  $('summary').textContent = '';
  appendAudit('cargas_cavali', crypto.randomUUID(), 'Carga CAVALI cancelada', `${count} registros en vista previa`, 'Vista previa limpia', 'Se cancelo la importacion pendiente.');
  renderAll();
}

function buildAnnexHtml(row) {
  const amount = new Intl.NumberFormat('es-PE', { style: 'currency', currency: row.moneda === 'USD' ? 'USD' : 'PEN' }).format(Number(row.monto_neto_pago) || 0);
  const disburse = new Intl.NumberFormat('es-PE', { style: 'currency', currency: row.moneda === 'USD' ? 'USD' : 'PEN' }).format(Number(row.monto_desembolsar) || 0);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Anexo MF Core</title>
  <style>
    :root { --primary:#2f527c; --accent:#8af58b; --text:#172033; --muted:#667085; --line:#dbe6f2; }
    * { box-sizing: border-box; }
    body { margin:0; background:#eef4fa; color:var(--text); font-family: Arial, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 24px auto; padding: 22mm; background:white; box-shadow:0 20px 50px rgba(33,63,99,.18); }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:4px solid var(--primary); padding-bottom:18px; }
    .brand { display:flex; gap:12px; align-items:center; }
    .logo { width:54px; height:54px; border-radius:10px; background:var(--primary); display:grid; place-items:center; color:white; font-weight:800; }
    .brand h1 { margin:0; font-size:22px; color:var(--primary); }
    .brand span { color:var(--muted); font-size:13px; }
    .doc-meta { text-align:right; font-size:12px; color:var(--muted); }
    .title { margin:28px 0 18px; }
    .title p { margin:0 0 6px; color:var(--primary); font-weight:800; letter-spacing:.08em; font-size:12px; }
    .title h2 { margin:0; font-size:24px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin:18px 0; }
    .box { border:1px solid var(--line); border-radius:8px; padding:14px; }
    .box h3 { margin:0 0 10px; color:var(--primary); font-size:14px; }
    .field { display:grid; grid-template-columns:150px 1fr; gap:10px; padding:7px 0; border-bottom:1px solid #edf2f7; font-size:13px; }
    .field:last-child { border-bottom:0; }
    .field span:first-child { color:var(--muted); font-weight:700; }
    .summary { margin-top:18px; border:1px solid var(--line); border-radius:8px; overflow:hidden; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { background:var(--primary); color:white; text-align:left; padding:10px; }
    td { padding:10px; border-bottom:1px solid #edf2f7; }
    .note { margin-top:22px; padding:14px; background:#f8fbff; border-left:4px solid var(--accent); font-size:13px; line-height:1.5; }
    .signatures { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:52px; }
    .signature { border-top:1px solid var(--text); padding-top:8px; text-align:center; font-size:12px; }
    .actions { position:fixed; right:24px; top:24px; display:flex; gap:8px; }
    button { border:0; border-radius:8px; padding:10px 14px; font-weight:800; cursor:pointer; }
    .print { background:var(--accent); color:#123152; }
    @media print { body { background:white; } .page { margin:0; box-shadow:none; } .actions { display:none; } }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <div class="actions">
    <button class="print" onclick="window.print()">Imprimir</button>
    <button class="download" onclick="downloadAnexoPdf()">Descargar PDF</button>
  </div>
  <main class="page">
    <header class="header">
      <div class="brand">
        <img class="logo" src="${logoUrl}" alt="Madero Factoring" />
        <div><h1>Madero Factoring</h1><span>MF Core - Anexo operativo</span></div>
      </div>
      <div class="doc-meta">
        <strong>Version:</strong> v1<br />
        <strong>Fecha:</strong> ${escapeHtml(limaTimestamp().slice(0, 10))}<br />
        <strong>Codigo valor:</strong> ${escapeHtml(row.codigo_valor_cavali || '-')}
      </div>
    </header>

    <section class="title">
      <p>ANEXO DE OPERACION</p>
      <h2>Detalle de factura negociable</h2>
    </section>

    <section class="grid">
      <div class="box">
        <h3>Proveedor / Cliente</h3>
        ${annexField('Razon social', row.cliente)}
        ${annexField('RUC', row.ruc_cliente)}
        ${annexField('Originador', row.originador)}
      </div>
      <div class="box">
        <h3>Adquiriente</h3>
        ${annexField('Razon social', row.obligado)}
        ${annexField('RUC', row.ruc_obligado)}
        ${annexField('Codigo', row.codigo_obligado)}
      </div>
    </section>

    <section class="summary">
      <table>
        <thead><tr><th>Factura</th><th>Vencimiento</th><th>Moneda</th><th>Monto neto</th><th>Monto a desembolsar</th></tr></thead>
        <tbody><tr><td>${escapeHtml(row.factura)}</td><td>${escapeHtml(row.fecha_vencimiento)}</td><td>${escapeHtml(row.moneda)}</td><td>${amount}</td><td>${disburse}</td></tr></tbody>
      </table>
    </section>

    <div class="note">
      Este anexo usa el diseño interno de MF Core. Los campos se completaran automaticamente desde CAVALI, maestros internos y validaciones de la operacion.
    </div>

    <section class="signatures">
      <div class="signature">Madero Factoring</div>
      <div class="signature">Cliente / Representante</div>
    </section>
  </main>
</body>
</html>`;
}

function annexField(label, value) {
  return `<div class="field"><span>${escapeHtml(label)}</span><span>${escapeHtml(formatValue(value))}</span></div>`;
}

function buildAnnexHtmlV2(row, options = {}) {
  const currency = row.moneda === 'USD' ? 'USD' : 'PEN';
  const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency });
  const asNumber = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0;
  const moneyValue = (value) => money.format(asNumber(value));
  const percentValue = (value) => {
    const number = asNumber(value);
    if (!number) return '-';
    const normalized = Math.abs(number) <= 1 ? number * 100 : number;
    return `${normalized.toFixed(2)}%`;
  };
  const dateValue = (value) => escapeHtml(normalizeDate(value) || value || '-');
  const lines = row.lineas?.length ? row.lineas : [row];
  const rowValue = (item, field) => asNumber(item[field]);
  const sumLines = (field) => lines.reduce((total, item) => total + rowValue(item, field), 0);
  const lineMontoDescontado = (item) => rowValue(item, 'monto_financiado_saldo_capital') - rowValue(item, 'interes_compensatorio');
  const totalNeto = asNumber(row.total_monto_neto_pago) || sumLines('monto_neto_pago');
  const totalFinanciado = asNumber(row.total_monto_financiado) || sumLines('monto_financiado_saldo_capital');
  const interesCobrado = asNumber(row.total_interes_cobrado) || sumLines('interes_compensatorio');
  const igvInteres = asNumber(row.total_igv_interes) || sumLines('igv');
  const totalIntereses = interesCobrado + igvInteres;
  const montoDescontado = lines.reduce((total, item) => total + lineMontoDescontado(item), 0);
  const margenCoberturaMonto = asNumber(row.margen_cobertura_monto) || totalNeto * asNumber(row.margen_cobertura);
  const porcentajeFinanciado = Math.max(0, 1 - asNumber(row.margen_cobertura));
  const gastosBancarios = asNumber(row.costo_bancario || row.gastos_bancarios);
  const gastosDesembolso = asNumber(row.comisiones || row.gastos_desembolso);
  const gastosAdministrativos = asNumber(row.gastos_administrativos);
  const igvGastosOperativos = asNumber(row.igv_gastos_operativos) || (gastosBancarios + gastosDesembolso) * 0.18;
  const igvGastosAdministrativos = asNumber(row.igv_gastos_administrativos) || gastosAdministrativos * 0.18;
  const totalIgvGastos = igvGastosOperativos + igvGastosAdministrativos;
  const totalGastos = gastosBancarios + gastosDesembolso + gastosAdministrativos + totalIgvGastos;
  const montoEfectivo = montoDescontado - totalGastos;
  const logoUrl = new URL('assets/logos/mf-logo.jpg', window.location.href).href;
  const contratoNro = clean(row.codigo_contrato || row.cliente_factoring_referidor);
  const operacionNro = clean(row.operacion || row.control_id);
  const codigoAnexo = ['MF', contratoNro, operacionNro].filter(Boolean).join('-');
  const pdfFileName = `Anexo-${String(codigoAnexo || row.factura || 'MF-Core').replace(/[^a-z0-9-]/gi, '-')}.pdf`;
  const hasAdminExpense = groupRequiresAdminExpense(row);
  const upperValue = (value) => escapeHtml(formatValue(value).toUpperCase());
  const firmaTipoDocumento = clean(row.firma_tipo_documento || (row.firma_documento ? 'DNI' : ''));
  const firmaDocumento = clean(row.firma_documento)
    ? `${documentTypeLabel(firmaTipoDocumento).toUpperCase()} N° ${clean(row.firma_documento).toUpperCase()}`
    : '';
  const invoiceRows = lines.map((item) => `
          <tr>
            <td>${escapeHtml(formatValue(item.obligado))}</td>
            <td>${escapeHtml(formatValue(item.factura))}</td>
            <td>${dateValue(item.fecha_desembolso)}</td>
            <td>${dateValue(item.fecha_vencimiento)}</td>
            <td class="num">${escapeHtml(formatValue(item.plazo_operacion || daysBetween(item.fecha_desembolso, item.fecha_vencimiento)))}</td>
            <td class="num">${moneyValue(item.monto_neto_pago)}</td>
            <td class="num">${moneyValue(rowValue(item, 'monto_neto_pago') * asNumber(item.margen_cobertura || row.margen_cobertura))}</td>
            <td class="num">${moneyValue(item.monto_financiado_saldo_capital)}</td>
            <td class="num">${moneyValue(item.interes_compensatorio)}</td>
            <td class="num">${moneyValue(lineMontoDescontado(item))}</td>
          </tr>`).join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Anexo MF Core</title>
  <style>
    :root { --primary:#111111; --primary-dark:#111111; --accent:#e8e8e8; --text:#111111; --muted:#3f3f46; --line:#b8b8b8; --soft:#f7f7f7; }
    * { box-sizing: border-box; }
    body { margin:0; background:#f3f3f3; color:var(--text); font-family: Arial, sans-serif; }
    .page { width: 297mm; min-height: 210mm; margin: 24px auto; padding: 12mm 14mm; background:white; box-shadow:0 16px 36px rgba(0,0,0,.12); }
    .header { display:grid; grid-template-columns:1fr 245px; gap:18px; align-items:start; border-bottom:1px solid var(--primary); padding-bottom:10px; }
    .brand { display:flex; gap:14px; align-items:center; }
    .logo { width:66px; height:66px; object-fit:contain; border:0; padding:0; background:transparent; }
    .brand h1 { margin:0; font-size:22px; color:var(--primary-dark); }
    .brand span { display:block; margin-top:4px; color:var(--muted); font-size:12px; letter-spacing:.04em; text-transform:uppercase; }
    .doc-meta { text-align:right; font-size:11px; color:var(--muted); line-height:1.65; }
    .doc-meta strong { color:var(--primary-dark); }
    .title { margin:12px 0 8px; display:flex; justify-content:space-between; gap:20px; align-items:end; }
    .title p { margin:0 0 6px; color:var(--primary); font-weight:800; letter-spacing:.08em; font-size:11px; }
    .title h2 { margin:0; font-size:22px; color:var(--primary-dark); }
    .title .legal { max-width:300px; color:var(--muted); font-size:10.5px; line-height:1.45; text-align:right; }
    .section { margin-top:7px; break-inside:avoid; }
    .section-title { margin:0; padding:5px 8px; background:#f5f5f5; color:#111111; border:1px solid var(--line); border-bottom:0; border-radius:4px 4px 0 0; font-size:9.5px; letter-spacing:.05em; text-transform:uppercase; }
    .sub-section { margin-top:10px; }
    .info-grid { display:grid; grid-template-columns:1.42fr .58fr .5fr .58fr .38fr .78fr .5fr .38fr; border:1px solid var(--line); border-top:0; overflow:hidden; }
    .info-grid.compact { grid-template-columns:.8fr .8fr .7fr .95fr .95fr; }
    .info-grid.merged { grid-template-columns:1.42fr .58fr .5fr .58fr .38fr .78fr .5fr .38fr; border-radius:0 0 4px 4px; }
    .info-grid.merged .info-cell:nth-child(8n) { border-right:0; }
    .info-cell { min-height:38px; padding:6px 8px; border-right:1px solid var(--line); border-bottom:1px solid var(--line); background:white; }
    .info-cell:nth-child(8n), .info-grid.compact .info-cell:nth-child(5n) { border-right:0; }
    .label { display:block; color:var(--muted); font-size:8px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }
    .value { display:block; margin-top:3px; font-size:10.2px; font-weight:700; line-height:1.2; overflow-wrap:anywhere; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:8.6px; border:1px solid var(--line); border-top:0; }
    th { background:#f2f2f2; color:#111111; text-align:left; padding:5px 5px; border-bottom:1px solid var(--line); font-weight:800; }
    td { padding:6px 5px; border-bottom:1px solid #edf2f7; vertical-align:top; line-height:1.2; overflow-wrap:anywhere; }
    .num { text-align:right; }
    .annex-summary-block { width:270px; margin:8px 0 0 auto; font-size:8.6px; }
    .annex-summary-line { display:grid; grid-template-columns:1fr auto; gap:16px; padding:4px 5px; font-weight:800; }
    .annex-summary-line span:last-child { text-align:right; white-space:nowrap; }
    .money-box { border:1px solid var(--line); border-top:0; border-radius:0 0 8px 8px; padding:12px 14px; background:var(--soft); display:flex; justify-content:space-between; align-items:center; gap:20px; }
    .money-box span { color:var(--muted); font-size:11px; font-weight:800; text-transform:uppercase; }
    .money-box strong { font-size:21px; color:#111111; white-space:nowrap; }
    .split { display:grid; grid-template-columns:.86fr 1.4fr; gap:12px; align-items:start; }
    .footer-note { display:none; }
    .signatures { display:grid; grid-template-columns:1fr 1fr 1fr; gap:22px; margin-top:48px; }
    .signature { border-top:1px solid var(--text); padding-top:7px; text-align:center; font-size:10px; line-height:1.35; }
    .signature strong { display:block; font-size:10.5px; }
    .actions { position:fixed; right:24px; top:24px; display:flex; gap:8px; z-index:10; }
    button { border:0; border-radius:8px; padding:10px 14px; font-weight:800; cursor:pointer; box-shadow:0 8px 20px rgba(32,59,92,.14); }
    .print { background:#eeeeee; color:#111111; }
    .download { background:#dddddd; color:#111111; }
    @page { size:A4 landscape; margin:0; }
    @media print { body { background:white; } .page { margin:0; box-shadow:none; } .actions { display:none; } }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <div class="actions">
    <button class="print" onclick="window.print()">Imprimir</button>
    <button class="download" onclick="downloadAnexoPdf()">Descargar PDF</button>
  </div>
  <main class="page">
    <header class="header">
      <div class="brand">
        <img class="logo" src="${logoUrl}" alt="Madero Factoring" />
        <div><h1>Madero Factoring</h1><span>MF Core - Anexo operativo</span></div>
      </div>
      <div class="doc-meta">
        <strong>Fecha:</strong> ${escapeHtml(limaTimestamp().slice(0, 10))}<br />
        <strong>Codigo anexo:</strong> ${escapeHtml(codigoAnexo || '-')}
      </div>
    </header>

    <section class="title">
      <div>
        <h2>Detalle de operacion</h2>
      </div>
    </section>

    <section class="section">
      <h3 class="section-title">Resumen</h3>
      <div class="info-grid merged">
        ${annexCell('Cliente', row.cliente)}
        ${annexCell('RUC', row.ruc_cliente)}
        ${annexCell('Contrato Nro', row.codigo_contrato || row.cliente_factoring_referidor)}
        ${annexCell('Operacion Nro', row.operacion || row.control_id)}
        ${annexCell('Moneda', row.moneda)}
        ${annexCell('Tipo de operacion', row.tipo_operacion || row.tipo_anexo || 'Factoring')}
        ${annexCell('Fecha', row.fecha_desembolso)}
        ${annexCell('% Financ.', percentValue(porcentajeFinanciado))}
      </div>
    </section>

    <section class="section">
      <h3 class="section-title">Facturas</h3>
      <table>
        <thead>
          <tr>
            <th>Adquirente</th>
            <th>Nro Factura</th>
            <th>F. Desembolso</th>
            <th>F. Venc.</th>
            <th>Dias venc.</th>
            <th>Monto Neto</th>
            <th>Margen Cob.</th>
            <th>Monto Financ.</th>
            <th>Interes</th>
            <th>Monto Desc.</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceRows}
          <tr>
            <td colspan="5"><strong>Total</strong></td>
            <td class="num"><strong>${moneyValue(totalNeto)}</strong></td>
            <td class="num"><strong>${moneyValue(margenCoberturaMonto)}</strong></td>
            <td class="num"><strong>${moneyValue(totalFinanciado)}</strong></td>
            <td class="num"><strong>${moneyValue(interesCobrado)}</strong></td>
            <td class="num"><strong>${moneyValue(montoDescontado)}</strong></td>
          </tr>
        </tbody>
      </table>
      <div class="annex-summary-block">
        <div class="annex-summary-line"><span>(-) G. Bancarios</span><span>${moneyValue(gastosBancarios)}</span></div>
        <div class="annex-summary-line"><span>(-) G. Desembolso</span><span>${moneyValue(gastosDesembolso)}</span></div>
        ${hasAdminExpense ? `<div class="annex-summary-line"><span>(-) G. Administrativos</span><span>${moneyValue(gastosAdministrativos)}</span></div>` : ''}
        <div class="annex-summary-line"><span>(-) IGV</span><span>${moneyValue(totalIgvGastos)}</span></div>
        <div class="annex-summary-line"><span>Monto a Depositar</span><span>${moneyValue(montoEfectivo)}</span></div>
        <div class="annex-summary-line"><span>Margen Cob.</span><span>${moneyValue(margenCoberturaMonto)}</span></div>
      </div>
    </section>

    <section class="signatures">
      <div class="signature">
        <strong>${upperValue(row.firma_razon_social || row.cliente)}</strong>
        ${upperValue(row.firma_representante)}<br />
        ${escapeHtml(firmaDocumento || '-')}<br />
        ${upperValue(row.firma_cargo)}
      </div>
    </section>
  </main>
  <script>
    function downloadAnexoPdf() {
      const page = document.querySelector('.page');
      const options = {
        margin: 0,
        filename: ${JSON.stringify(pdfFileName)},
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      if (window.html2pdf) {
        html2pdf().set(options).from(page).save();
      } else {
        window.print();
      }
    }
    ${options.autoDownload ? "window.addEventListener('load', function () { setTimeout(downloadAnexoPdf, 500); });" : ''}
  </script>
</body>
</html>`;
}

function annexCell(label, value) {
  return `<div class="info-cell"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(formatValue(value))}</span></div>`;
}

function exportPreview(type) {
  if (!state.previewRows.length) return;
  exportRows({
    type,
    fileBase: 'MF-Core-CAVALI',
    sheetName: 'CAVALI',
    headers: HISTORICO_COLUMNS.map(([, label]) => label),
    rows: state.previewRows,
    keys: HISTORICO_COLUMNS.map(([key]) => key),
  });
}

function exportHistorico(rows, fileName = `MF-Core-HISTORICO-${new Date().toISOString().slice(0, 10)}.xlsx`) {
  const data = rows.map((row) => Object.fromEntries(HISTORICO_COLUMNS.map(([key, label]) => [label, row[key] ?? ''])));
  if (window.XLSX) {
    const worksheet = XLSX.utils.json_to_sheet(data, { header: HISTORICO_COLUMNS.map(([, label]) => label) });
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(data.length, 1), c: HISTORICO_COLUMNS.length - 1 } }) };
    worksheet['!cols'] = HISTORICO_COLUMNS.map(([, label]) => ({ wch: Math.max(14, Math.min(34, label.length + 4)) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HISTORICO');
    XLSX.writeFile(workbook, fileName);
    return;
  }
  downloadCsv(`MF-Core-HISTORICO-${new Date().toISOString().slice(0, 10)}.csv`, HISTORICO_COLUMNS.map(([, label]) => label), rows, HISTORICO_COLUMNS.map(([key]) => key));
}

function exportRows({ type, fileBase, sheetName, headers, rows, keys }) {
  const date = new Date().toISOString().slice(0, 10);
  if (type === 'csv') {
    downloadCsv(`${fileBase}-${date}.csv`, headers, rows, keys);
    return;
  }
  if (type === 'excel') {
    if (!window.XLSX) {
      downloadCsv(`${fileBase}-${date}.csv`, headers, rows, keys);
      return;
    }
    const data = rows.map((row) => Object.fromEntries(keys.map((key, index) => [headers[index], row[key] ?? ''])));
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(data.length, 1), c: headers.length - 1 } }) };
    worksheet['!cols'] = headers.map((label) => ({ wch: Math.max(12, Math.min(34, String(label).length + 4)) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(sheetName || 'EXPORT'));
    XLSX.writeFile(workbook, `${fileBase}-${date}.xlsx`);
  }
}

function safeSheetName(value) {
  const cleaned = String(value || 'EXPORT')
    .replace(/[\\/?*[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'EXPORT').slice(0, 31);
}

function exportControl(type) {
  exportRows({
    type,
    fileBase: 'MF-Core-Control',
    sheetName: 'CONTROL',
    headers: CONTROL_VIEW.fields.map(labelFor),
    rows: state.controlRows,
    keys: CONTROL_VIEW.fields,
  });
}

function exportActiveMaster(type) {
  const view = MASTER_VIEWS[state.activeMaster];
  const rows = state.masterData[view.collection] || [];
  exportRows({
    type,
    fileBase: `MF-Core-${view.title.replaceAll(' ', '-')}`,
    sheetName: view.title.slice(0, 31),
    headers: view.fields.map(labelFor),
    rows,
    keys: view.fields,
  });
}

function renderAll() {
  renderAnnexParams();
  renderMetrics();
  renderPreview();
  renderGeneratedAnnexes();
  renderMasters();
  renderControl();
  renderAudit();
}

function renderMetrics() {
  const valid = state.previewRows.filter((row) => ['Validado', 'Listo para generar'].includes(row.estado_validacion)).length;
  $('generate-annexes').disabled = valid === 0;
  $('export-preview-format').disabled = state.previewRows.length === 0;
  $('cancel-preview-import').disabled = state.previewRows.length === 0;
}

function renderPreview() {
  const tbody = $('preview-table');
  tbody.innerHTML = state.previewRows.length ? state.previewRows.map((row) => `
    <tr>
      <td>${escapeHtml(row.cliente)}</td>
      <td>${escapeHtml(row.ruc_cliente)}</td>
      <td>${escapeHtml(row.obligado)}</td>
      <td>${escapeHtml(row.codigo_obligado || '-')}</td>
      <td>${escapeHtml(row.factura)}</td>
      <td>${money.format(Number(row.monto_neto_pago) || 0)}</td>
      <td>${escapeHtml(row.moneda)}</td>
      <td>${escapeHtml(row.fecha_vencimiento || '-')}</td>
      <td>${escapeHtml(row.participante_origen_codigo)}</td>
      <td>${escapeHtml(row.originador || '-')}</td>
      <td>${badge(row.estado_validacion)}</td>
      <td>${escapeHtml(row.observaciones || '-')}</td>
      <td class="actions">
        <button class="icon-action" title="Editar" aria-label="Editar" data-edit-preview="${row.id}">${iconEdit()}</button>
        <button class="icon-action danger-icon" title="Eliminar" aria-label="Eliminar" data-delete-preview="${row.id}">${iconDelete()}</button>
      </td>
    </tr>
  `).join('') : '<tr><td class="empty" colspan="13">Carga un archivo CAVALI para ver la validacion previa.</td></tr>';

  tbody.querySelectorAll('[data-edit-preview]').forEach((button) => button.addEventListener('click', () => openRecordModal('preview', null, button.dataset.editPreview)));
  tbody.querySelectorAll('[data-delete-preview]').forEach((button) => button.addEventListener('click', () => deleteRecord('preview', null, button.dataset.deletePreview)));
}

function renderGeneratedAnnexes() {
  const container = $('annex-generated-editor');
  if (!container) return;
  const rows = sortGeneratedAnnexes(filterGeneratedAnnexes(state.annexRows || []));
  const pendingCount = (state.annexRows || []).filter((row) => row.estado_control !== 'En Control').length;
  container.innerHTML = `
    <div class="list-toolbar">
      <span>${rows.length} anexos encontrados</span>
      <span>Pendientes de Control: ${pendingCount}</span>
    </div>
    <div class="table-wrap">
      <table class="data-table generated-annex-table">
        <thead>
          <tr>
            <th>Codigo anexo</th>
            <th>Fecha gen.</th>
            <th>Cliente</th>
            <th>Adquiriente</th>
            <th>Moneda</th>
            <th>Monto desc.</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => `
            <tr>
              <td>
                <strong>${escapeHtml(annexCode(row))}</strong>
                <small>Op. ${escapeHtml(row.operacion || '-')}</small>
              </td>
              <td>${escapeHtml(formatDateOnly(row.fecha_generacion))}</td>
              <td>
                <strong>${escapeHtml(row.cliente || '-')}</strong>
                <small>${escapeHtml(row.ruc_cliente || '')}</small>
              </td>
              <td>
                <strong>${escapeHtml(row.obligado || '-')}</strong>
                <small>${escapeHtml(row.ruc_obligado || row.codigo_obligado || '')}</small>
              </td>
              <td>${escapeHtml(row.moneda || '-')}</td>
              <td class="num">${money.format(Number(row.total_monto_descontado || row.monto_descontado || row.monto_desembolsar) || 0)}</td>
              <td>${annexControlBadge(row.estado_control || row.estado_validacion || row.estado)}</td>
              <td class="actions">
                <button class="icon-action" title="Ver anexo" aria-label="Ver anexo" data-view-annex="${row.id}">${iconView()}</button>
                <button class="icon-action" title="Descargar PDF" aria-label="Descargar PDF" data-download-annex="${row.id}">${iconDownload()}</button>
                ${row.estado_control === 'En Control'
                  ? ''
                  : `<button class="small-button" type="button" title="Pasar a Control" data-send-control="${row.id}">Pasar</button>`}
              </td>
            </tr>`).join('') : '<tr><td class="empty" colspan="8">No hay anexos generados.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  container.querySelectorAll('[data-view-annex]').forEach((button) => button.addEventListener('click', () => openGeneratedAnnex(button.dataset.viewAnnex)));
  container.querySelectorAll('[data-download-annex]').forEach((button) => button.addEventListener('click', () => openGeneratedAnnex(button.dataset.downloadAnnex, true)));
  container.querySelectorAll('[data-send-control]').forEach((button) => button.addEventListener('click', () => confirmAnnexToControl(button.dataset.sendControl)));
}

function filterGeneratedAnnexes(rows) {
  const query = normalizeHeader(state.annexGeneratedSearch);
  return rows.filter((row) => {
    const matchesQuery = !query || ['operacion', 'cliente', 'ruc_cliente', 'obligado', 'ruc_obligado', 'moneda', 'estado', 'estado_control'].some((field) => normalizeHeader(row[field]).includes(query));
    const matchesDate = !state.annexGeneratedDate || formatDateOnly(row.fecha_generacion) === state.annexGeneratedDate;
    return matchesQuery && matchesDate;
  });
}

function sortGeneratedAnnexes(rows) {
  const sorted = [...rows];
  const sort = state.annexGeneratedSort;
  sorted.sort((a, b) => {
    if (sort === 'fecha_asc') return String(a.fecha_generacion || '').localeCompare(String(b.fecha_generacion || ''));
    if (sort === 'operacion_asc') return String(a.operacion || '').localeCompare(String(b.operacion || ''));
    if (sort === 'cliente_asc') return String(a.cliente || '').localeCompare(String(b.cliente || ''));
    return String(b.fecha_generacion || '').localeCompare(String(a.fecha_generacion || ''));
  });
  return sorted;
}

function confirmAnnexToControl(id) {
  const annex = state.annexRows.find((row) => row.id === id);
  if (!annex) return;
  if (annex.estado_control === 'En Control') return;
  if (!confirm(`Pasar el anexo ${annex.operacion || id} a Control?`)) return;

  const controlRecord = {
    ...annex,
    estado_control: 'En Control',
    estado_validacion: 'En Control',
    estado: 'En Control',
    fecha_pase_control: new Date().toISOString(),
    usuario_pase_control: 'usuario.local',
  };

  state.controlRows = [controlRecord, ...state.controlRows.filter((row) => row.id !== id)];
  state.annexRows = state.annexRows.map((row) => row.id === id ? controlRecord : row);
  save(STORAGE.control, state.controlRows);
  save(STORAGE.annexes, state.annexRows);
  appendAudit('control', id, 'Confirmacion de pase a Control', 'Pendiente de pasar a Control', 'En Control', `Anexo ${annex.operacion || id} confirmado para Control.`, annex.operacion || id);
  renderAll();
}

function renderMasters() {
  const view = MASTER_VIEWS[state.activeMaster];
  $('master-selector').value = state.activeMaster;
  const rows = state.masterData[view.collection] || [];
  const filteredRows = filterRows(rows, view.fields, state.masterSearch);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / state.masterPageSize));
  state.masterPage = Math.min(state.masterPage, totalPages);
  const start = (state.masterPage - 1) * state.masterPageSize;
  const pageRows = filteredRows.slice(start, start + state.masterPageSize);

  $('master-editor').innerHTML = `
    <div class="list-toolbar">
      <span>${filteredRows.length} registros encontrados</span>
      <span>Pagina ${state.masterPage} de ${totalPages}</span>
    </div>
    <div class="table-wrap master-table-wrap">
      <table class="data-table master-table master-${state.activeMaster}">
        <thead>
          <tr>
            ${view.fields.map((field) => `<th>${escapeHtml(labelFor(field))}</th>`).join('')}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${pageRows.length ? pageRows.map((row) => `
            <tr>
              ${view.fields.map((field) => `<td>${field === 'estado' ? statusBadge(row[field]) : escapeHtml(formatValue(displayFieldValue(field, row[field])))}</td>`).join('')}
              <td>
                <div class="actions">
                  <button class="icon-action" title="Editar" aria-label="Editar" data-type="master" data-scope="${state.activeMaster}" data-edit="${row.id}">${iconEdit()}</button>
                  <button class="icon-action danger-icon" title="Eliminar" aria-label="Eliminar" data-type="master" data-scope="${state.activeMaster}" data-delete="${row.id}">${iconDelete()}</button>
                </div>
              </td>
            </tr>
          `).join('') : `<tr><td class="empty empty-notice" colspan="${view.fields.length + 1}">No hay registros. Usa Agregar registro para crear el primero.</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button class="secondary" id="master-prev" ${state.masterPage <= 1 ? 'disabled' : ''}>Anterior</button>
      <button class="secondary" id="master-next" ${state.masterPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
    </div>
  `;
  bindCrudButtons('master', state.activeMaster, $('master-editor'));
  $('master-prev').addEventListener('click', () => {
    state.masterPage = Math.max(1, state.masterPage - 1);
    renderMasters();
  });
  $('master-next').addEventListener('click', () => {
    state.masterPage = Math.min(totalPages, state.masterPage + 1);
    renderMasters();
  });
}

function renderControl() {
  const rows = state.controlRows || [];
  $('control-editor').innerHTML = `
    <div class="list-toolbar">
      <span>${rows.length} registros en Control</span>
      <span>Solo anexos confirmados</span>
    </div>
    <div class="table-wrap control-table-wrap">
      <table class="data-table control-table">
        <thead>
          <tr>
            <th>Codigo anexo</th>
            <th>Operacion</th>
            <th>Fecha Control</th>
            <th>Cliente</th>
            <th>Adquiriente</th>
            <th>Factura</th>
            <th>Moneda</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => `
            <tr>
              <td><strong>${escapeHtml(annexCode(row))}</strong></td>
              <td>${escapeHtml(row.operacion || '-')}</td>
              <td>${escapeHtml(formatDateOnly(row.fecha_pase_control || row.fecha_generacion))}</td>
              <td>
                <strong>${escapeHtml(row.cliente || '-')}</strong>
                <small>${escapeHtml(row.ruc_cliente || '')}</small>
              </td>
              <td>
                <strong>${escapeHtml(row.obligado || '-')}</strong>
                <small>${escapeHtml(row.ruc_obligado || row.codigo_obligado || '')}</small>
              </td>
              <td>${escapeHtml(row.factura || '-')}</td>
              <td>${escapeHtml(row.moneda || '-')}</td>
              <td class="num">${money.format(Number(row.total_monto_descontado || row.monto_descontado || row.monto_desembolsar || row.monto_neto_pago) || 0)}</td>
              <td>${badge(row.estado_control || row.estado_validacion || row.estado)}</td>
              <td class="actions">
                <button class="icon-action" title="Ver anexo" aria-label="Ver anexo" data-view-annex="${row.id}">${iconView()}</button>
                <button class="icon-action" title="Descargar PDF" aria-label="Descargar PDF" data-download-annex="${row.id}">${iconDownload()}</button>
              </td>
            </tr>
          `).join('') : '<tr><td class="empty" colspan="10">No hay registros en Control. Confirma un anexo generado para pasarlo a Control.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  const container = $('control-editor');
  container.querySelectorAll('[data-view-annex]').forEach((button) => button.addEventListener('click', () => openGeneratedAnnex(button.dataset.viewAnnex)));
  container.querySelectorAll('[data-download-annex]').forEach((button) => button.addEventListener('click', () => openGeneratedAnnex(button.dataset.downloadAnnex, true)));
}

function annexCode(row) {
  const contratoNro = clean(row.codigo_contrato || row.cliente_factoring_referidor);
  const operacionNro = clean(row.operacion || row.control_id);
  return ['MF', contratoNro, operacionNro].filter(Boolean).join('-') || row.operacion || row.id || '-';
}

function renderAudit() {
  const rows = state.auditRows || [];
  const filteredRows = filterAuditRows(rows);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / state.auditPageSize));
  state.auditPage = Math.min(state.auditPage, totalPages);
  const start = (state.auditPage - 1) * state.auditPageSize;
  const pageRows = filteredRows.slice(start, start + state.auditPageSize);
  const fields = AUDIT_VIEW.fields;

  $('audit-editor').innerHTML = `
    <div class="list-toolbar">
      <span>${filteredRows.length} eventos encontrados</span>
      <span>Pagina ${state.auditPage} de ${totalPages}</span>
    </div>
    <div class="table-wrap master-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            ${fields.map((field) => `<th>${escapeHtml(labelFor(field))}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${pageRows.length ? pageRows.map((row) => `
            <tr>
              ${fields.map((field) => `<td>${escapeHtml(formatValue(field === 'fecha_hora' ? formatLimaDateTime(row[field]) : row[field]))}</td>`).join('')}
            </tr>
          `).join('') : `<tr><td class="empty" colspan="${fields.length}">No hay eventos para mostrar.</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button class="secondary" id="audit-prev" ${state.auditPage <= 1 ? 'disabled' : ''}>Anterior</button>
      <button class="secondary" id="audit-next" ${state.auditPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
    </div>
  `;
  bindCrudButtons('audit', null, $('audit-editor'));
  $('audit-prev').addEventListener('click', () => {
    state.auditPage = Math.max(1, state.auditPage - 1);
    renderAudit();
  });
  $('audit-next').addEventListener('click', () => {
      state.auditPage = Math.min(totalPages, state.auditPage + 1);
      renderAudit();
  });
}

function renderCards(rows, view, type, scope) {
  if (!rows.length) return '<div class="summary">No hay registros. Usa Agregar registro para crear el primero.</div>';
  return `<div class="crud-grid">${rows.map((row) => `
    <article class="record-card">
      <h4>${escapeHtml(row[view.primary] || row.id || 'Registro')}</h4>
      <dl>${view.fields.slice(0, 6).map((field) => `<div><dt>${escapeHtml(labelFor(field))}</dt><dd>${escapeHtml(formatValue(displayFieldValue(field, row[field])))}</dd></div>`).join('')}</dl>
      <div class="actions">
        ${type === 'control' ? `<button class="icon-action" title="Ver anexo" aria-label="Ver anexo" data-view-annex="${row.id}">${iconView()}</button>` : ''}
        <button class="icon-action" title="Editar" aria-label="Editar" data-type="${type}" data-scope="${scope || ''}" data-edit="${row.id}">${iconEdit()}</button>
        <button class="icon-action danger-icon" title="Eliminar" aria-label="Eliminar" data-type="${type}" data-scope="${scope || ''}" data-delete="${row.id}">${iconDelete()}</button>
      </div>
    </article>`).join('')}</div>`;
}

function filterRows(rows, fields, query) {
  const normalizedQuery = normalizeHeader(query);
  if (!normalizedQuery) return rows;
  return rows.filter((row) => fields.some((field) => normalizeHeader(displayFieldValue(field, row[field])).includes(normalizedQuery)));
}

function filterAuditRows(rows) {
  let filtered = filterRows(rows, AUDIT_VIEW.fields, state.auditSearch);
  if (state.auditEntityFilter) {
    filtered = filtered.filter((row) => row.entidad === state.auditEntityFilter);
  }
  if (state.auditDateFilter) {
    filtered = filtered.filter((row) => limaDateKey(row.fecha_hora) === state.auditDateFilter);
  }
  return filtered;
}

function buildAuditDetail(before, after, fields) {
  if (!before && after) {
    return fields
      .filter((field) => after[field] !== undefined && after[field] !== '')
      .map((field) => `${labelFor(field)}: "${formatValue(after[field])}"`)
      .join(' | ');
  }

  if (before && !after) {
    return fields
      .filter((field) => before[field] !== undefined && before[field] !== '')
      .map((field) => `${labelFor(field)} antes: "${formatValue(before[field])}"`)
      .join(' | ');
  }

  const changes = fields
    .filter((field) => String(before?.[field] ?? '') !== String(after?.[field] ?? ''))
    .map((field) => `${labelFor(field)}: "${formatValue(before?.[field])}" -> "${formatValue(after?.[field])}"`);

  return changes.length ? changes.join(' | ') : 'Sin cambios de campos visibles.';
}

function bindCrudButtons(type, scope, container) {
  container.querySelectorAll('[data-view-annex]').forEach((button) => button.addEventListener('click', () => openGeneratedAnnex(button.dataset.viewAnnex)));
  container.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openRecordModal(type, scope, button.dataset.edit)));
  container.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteRecord(type, scope, button.dataset.delete)));
}

function openGeneratedAnnex(id, autoDownload = false) {
  const row = [...(state.annexRows || []), ...(state.controlRows || [])].find((item) => item.id === id);
  if (!row) {
    showErrorDialog('No se pudo abrir el anexo', 'No se encontro el anexo generado.');
    return;
  }
  const popup = window.open('', '_blank', 'width=980,height=760');
  if (!popup) {
    showErrorDialog('No se pudo abrir el anexo', 'Permite ventanas emergentes para ver o descargar el anexo.');
    return;
  }
  const html = row.anexo_html
    ? annexSnapshotHtml(row.anexo_html, autoDownload)
    : buildAnnexHtmlV2(row, { autoDownload });
  popup.document.write(html);
  popup.document.close();
}

function annexSnapshotHtml(html, autoDownload = false) {
  if (!autoDownload) return html;
  const autoDownloadScript = `
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (typeof downloadAnexoPdf === 'function') downloadAnexoPdf();
        else window.print();
      }, 500);
    });
  </script>`;
  return html.includes('</body>') ? html.replace('</body>', `${autoDownloadScript}</body>`) : `${html}${autoDownloadScript}`;
}

function openRecordModal(type, scope, id) {
  const { view, rows } = getCollection(type, scope);
  const record = id ? rows.find((row) => row.id === id) : { id: crypto.randomUUID(), ...view.template };
  if (!id && type === 'master' && scope === 'adquirentes') record.codigo = peekNextAdquirenteCode();
  if (!id && type === 'master' && scope === 'referidores') record.id = peekNextReferidorCode();
  if (!record.fecha_hora && type === 'audit') record.fecha_hora = new Date().toISOString();

  $('modal-kicker').textContent = id ? 'Editar' : 'Nuevo';
  $('modal-title').textContent = view.title;
  $('modal-fields').innerHTML = view.fields.map((field) => `
    <label>
      <span>${escapeHtml(labelFor(field))}</span>
      ${field === 'estado'
        ? `<select data-field="${field}"><option value="Activo" ${normalizeEstado(record[field]) === 'Activo' ? 'selected' : ''}>Activo</option><option value="Desactivado" ${normalizeEstado(record[field]) === 'Desactivado' ? 'selected' : ''}>Desactivado</option></select>`
        : field === 'tipo_documento'
        ? `<select data-field="${field}">${documentTypeOptions(record[field])}</select>`
        : field === 'referidor_id'
        ? `<select data-field="${field}"><option value="">Sin referidor</option>${referidorOptions(record[field])}</select>`
        : field === 'observaciones' || field === 'comentario'
        ? `<textarea data-field="${field}">${escapeHtml(record[field] ?? '')}</textarea>`
        : `<input data-field="${field}" ${(type === 'master' && scope === 'adquirentes' && field === 'codigo') || (type === 'master' && scope === 'referidores' && field === 'id') ? 'readonly' : ''} ${field === 'codigo_contrato' ? 'maxlength="4" inputmode="numeric"' : ''} ${field === 'ruc' ? 'maxlength="11" inputmode="numeric"' : ''} ${field === 'nro_documento' ? 'inputmode="numeric"' : ''} value="${escapeAttr(record[field] ?? '')}" />`}
    </label>
  `).join('') + '<div class="form-warning" id="modal-validation-message"></div>';

  const validateModal = () => {
    const next = { ...record };
    $('modal-fields').querySelectorAll('[data-field]').forEach((input) => next[input.dataset.field] = coerceField(input.dataset.field, input.value));
    if ('codigo_contrato' in next) next.codigo_contrato = normalizeContractCode(next.codigo_contrato);
    if ('nro_documento' in next) next.nro_documento = normalizeDocumentNumber(next.nro_documento);
    if (type !== 'master') {
      $('modal-save').disabled = false;
      $('modal-validation-message').textContent = '';
      return;
    }
    const validation = validateMasterLive(next, rows, scope, record.id);
    $('modal-save').disabled = !validation.valid && !validation.existingId;
    $('modal-validation-message').textContent = validation.valid ? '' : validation.message;
  };

  $('modal-fields').querySelectorAll('[data-field]').forEach((input) => input.addEventListener('input', validateModal));
  validateModal();

  $('modal-save').onclick = (event) => {
    event.preventDefault();
    const next = { ...record };
    $('modal-fields').querySelectorAll('[data-field]').forEach((input) => next[input.dataset.field] = coerceField(input.dataset.field, input.value));
    if ('estado' in next) next.estado = normalizeEstado(next.estado);
    if ('codigo_contrato' in next) next.codigo_contrato = normalizeContractCode(next.codigo_contrato);
    if ('nro_documento' in next) next.nro_documento = normalizeDocumentNumber(next.nro_documento);
    upsertRecord(type, scope, next);
    $('record-modal').close();
  };

  $('record-modal').showModal();
}

function upsertRecord(type, scope, record) {
  const target = getCollection(type, scope);
  const index = target.rows.findIndex((row) => row.id === record.id);
  const before = index >= 0 ? structuredClone(target.rows[index]) : null;

  if (type === 'master') {
    const validation = validateMasterUniqueness(record, target.rows, scope, record.id);
    if (!validation.valid) {
      if (!validation.existingId) {
        showErrorDialog('No se puede guardar el registro', validation.message);
        return;
      }
      const updateExisting = confirm(`${validation.message}\n\nDeseas actualizar el registro existente?`);
      if (!updateExisting) return;
      const existingIndex = target.rows.findIndex((row) => row.id === validation.existingId);
      if (existingIndex < 0) return;
      const merged = {
        ...target.rows[existingIndex],
        ...record,
        codigo: scope === 'adquirentes' ? target.rows[existingIndex].codigo : record.codigo,
        id: target.rows[existingIndex].id,
      };
      const secondaryValidation = validateMasterUniqueness(merged, target.rows, scope, target.rows[existingIndex].id);
      if (!secondaryValidation.valid) {
        showErrorDialog('No se puede guardar el registro', secondaryValidation.message);
        return;
      }
      const beforeExisting = structuredClone(target.rows[existingIndex]);
      target.rows[existingIndex] = { ...merged, fecha_actualizacion: new Date().toISOString() };
      persistCollection(type);
      appendAudit(
        'crud',
        target.rows[existingIndex].id,
        `Actualizacion por duplicado de ${target.view.title}`,
        'Valor anterior',
        'Valor nuevo',
        buildAuditDetail(beforeExisting, target.rows[existingIndex], target.view.fields),
        target.rows[existingIndex][target.view.primary] || target.rows[existingIndex].id,
      );
      renderAll();
      return;
    }
  }

  if (type === 'master' && scope === 'adquirentes' && (!before || record.codigo === peekNextAdquirenteCode())) record.codigo = nextAdquirenteCode();
  if (type === 'master' && scope === 'referidores' && (!before || record.id === peekNextReferidorCode())) record.id = nextReferidorCode();

  if (index >= 0) target.rows[index] = { ...target.rows[index], ...record, fecha_actualizacion: new Date().toISOString() };
  else target.rows.unshift({ ...record, fecha_creacion: new Date().toISOString(), fecha_actualizacion: new Date().toISOString() });
  persistCollection(type);
  appendAudit(
    'crud',
    record.id,
    `${index >= 0 ? 'Edicion' : 'Creacion'} de ${target.view.title}`,
    before ? 'Valor anterior' : '',
    'Valor nuevo',
    buildAuditDetail(before, record, target.view.fields),
    record[target.view.primary] || record.id,
  );
  renderAll();
}

function deleteRecord(type, scope, id) {
  const target = getCollection(type, scope);
  const record = target.rows.find((row) => row.id === id);
  if (!record) return;
  if (!confirm(`Eliminar registro ${record[target.view.primary] || id}?`)) return;
  const nextRows = target.rows.filter((row) => row.id !== id);
  setCollectionRows(type, scope, nextRows);
  persistCollection(type);
  appendAudit('crud', id, `Eliminacion de ${target.view.title}`, 'Existia', 'Eliminado', buildAuditDetail(record, null, target.view.fields), record[target.view.primary] || id);
  renderAll();
}

function getCollection(type, scope) {
  if (type === 'master') {
    const view = MASTER_VIEWS[scope];
    return { view, rows: state.masterData[view.collection] };
  }
  if (type === 'template') return { view: TEMPLATE_VIEW, rows: state.masterData.plantillasAnexos };
  if (type === 'control') return { view: CONTROL_VIEW, rows: state.controlRows };
  if (type === 'preview') return { view: CONTROL_VIEW, rows: state.previewRows };
  return { view: AUDIT_VIEW, rows: state.auditRows };
}

function setCollectionRows(type, scope, rows) {
  if (type === 'master') state.masterData[MASTER_VIEWS[scope].collection] = rows;
  else if (type === 'template') state.masterData.plantillasAnexos = rows;
  else if (type === 'control') state.controlRows = rows;
  else if (type === 'preview') state.previewRows = rows;
  else state.auditRows = rows;
}

function persistCollection(type) {
  if (type === 'master' || type === 'template') save(STORAGE.master, state.masterData);
  if (type === 'control') save(STORAGE.control, state.controlRows);
  if (type === 'preview') save(STORAGE.preview, state.previewRows);
  if (type === 'audit') save(STORAGE.audit, state.auditRows);
}

function appendAudit(entidad, entidadId, accion, estadoAnterior, estadoNuevo, comentario, registro = '') {
  const row = {
    id: crypto.randomUUID(),
    entidad,
    entidad_id: entidadId,
    accion,
    registro,
    estado_anterior: estadoAnterior,
    estado_nuevo: estadoNuevo,
    usuario: currentUserName(),
    usuario_id: currentUserId(),
    fecha_hora: limaTimestamp(),
    comentario,
    detalle: comentario,
  };
  state.auditRows.unshift(row);
  save(STORAGE.audit, state.auditRows);
  persistAuditToSupabase(row);
  persistTraceToSupabase({
    entidad,
    id_local: entidadId,
    accion,
    estado_anterior: estadoAnterior,
    estado_nuevo: estadoNuevo,
    usuario_id: currentUserId(),
    usuario_nombre: currentUserName(),
    detalle: comentario,
    datos_nuevos: row,
  });
}

function resetDemo() {
  if (!confirm('Reiniciar datos locales?')) return;
  state.masterData = structuredClone(DEFAULT_MASTER);
  state.previewRows = [];
  state.controlRows = [];
  state.annexRows = [];
  state.auditRows = [];
  Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
  save(STORAGE.master, state.masterData);
  renderAll();
}

function loadGeneratedAnnexes() {
  const storedAnnexes = load(STORAGE.annexes, []);
  if (Array.isArray(storedAnnexes) && storedAnnexes.length) {
    return storedAnnexes.map((row) => ({
      ...row,
      estado_control: row.estado_control || (row.estado_validacion === 'En Control' ? 'En Control' : 'Pendiente de pasar a Control'),
    }));
  }

  const existingControl = load(STORAGE.control, []);
  if (!Array.isArray(existingControl) || !existingControl.length) return [];
  const migrated = existingControl
    .filter((row) => row.anexo_html || row.fecha_generacion || row.version_anexo)
    .map((row) => ({
      ...row,
      estado_control: 'En Control',
      estado_validacion: row.estado_validacion === 'Generado' ? 'En Control' : (row.estado_validacion || 'En Control'),
    }));
  if (migrated.length) save(STORAGE.annexes, migrated);
  return migrated;
}

function normalizeMasterData(data) {
  const source = data || {};
  return {
    adquirentes: Array.isArray(source.adquirentes)
      ? source.adquirentes.map((row) => ({
        id: row.id || crypto.randomUUID(),
        codigo: row.codigo ?? row.codigo_adquirente ?? '',
        razon_social: row.razon_social ?? row.razon_social_homologada ?? row.razon_social_cavali ?? '',
        ruc: normalizeRuc(row.ruc ?? row.ruc_adquirente ?? ''),
        estado: normalizeEstado(row.estado),
      }))
      : structuredClone(DEFAULT_MASTER.adquirentes),
    proveedoresParticipantes: Array.isArray(source.proveedoresParticipantes)
      ? source.proveedoresParticipantes.map((row) => ({
        ...row,
        codigo_contrato: normalizeContractCode(row.codigo_contrato),
        ruc: normalizeRuc(row.ruc),
        tipo_documento: normalizeDocumentType(row.tipo_documento || (row.dni ? 'DNI' : 'DNI')),
        nro_documento: normalizeDocumentNumber(row.nro_documento ?? row.dni ?? ''),
        referidor_id: row.referidor_id || '',
        estado: normalizeEstado(row.estado),
      }))
      : [
        ...(source.proveedores || []).map((row) => ({
          id: row.id || crypto.randomUUID(),
          codigo_cavali: row.codigo_cavali || '',
          codigo_contrato: normalizeContractCode(row.codigo_contrato ?? row.codigo_interno ?? ''),
          ruc: normalizeRuc(row.ruc ?? row.ruc_proveedor ?? ''),
          razon_social: row.razon_social ?? row.razon_social_homologada ?? row.razon_social_cavali ?? '',
          representante_legal: row.representante_legal || '',
          tipo_documento: normalizeDocumentType(row.tipo_documento || (row.dni ? 'DNI' : 'DNI')),
          nro_documento: normalizeDocumentNumber(row.nro_documento ?? row.dni ?? ''),
          cargo: row.cargo || '',
          referidor_id: row.referidor_id || '',
          estado: normalizeEstado(row.estado),
        })),
        ...(source.participantesOrigen || []).map((row) => ({
          id: row.id || crypto.randomUUID(),
          codigo_cavali: row.codigo_cavali ?? row.codigo_participante ?? '',
          codigo_contrato: normalizeContractCode(row.codigo_contrato || ''),
          ruc: normalizeRuc(row.ruc ?? row.ruc_participante ?? ''),
          razon_social: row.razon_social ?? row.nombre_participante ?? '',
          representante_legal: row.representante_legal || '',
          tipo_documento: normalizeDocumentType(row.tipo_documento || (row.dni ? 'DNI' : 'DNI')),
          nro_documento: normalizeDocumentNumber(row.nro_documento ?? row.dni ?? ''),
          cargo: row.cargo || '',
          referidor_id: row.referidor_id || '',
          estado: normalizeEstado(row.estado),
        })),
        ...structuredClone(DEFAULT_MASTER.proveedoresParticipantes),
      ],
    referidores: Array.isArray(source.referidores)
      ? source.referidores.map((row) => ({
        id: row.id || crypto.randomUUID(),
        nombre: row.nombre || '',
        tipo_documento: normalizeDocumentType(row.tipo_documento || (row.dni ? 'DNI' : 'DNI')),
        nro_documento: normalizeDocumentNumber(row.nro_documento ?? row.dni ?? ''),
        estado: normalizeEstado(row.estado),
      }))
      : structuredClone(DEFAULT_MASTER.referidores),
    plantillasAnexos: Array.isArray(source.plantillasAnexos) ? source.plantillasAnexos : structuredClone(DEFAULT_MASTER.plantillasAnexos),
  };
}

function normalizeObject(row) {
  return Object.entries(row).reduce((acc, [key, value]) => {
    acc[normalizeHeader(key)] = clean(value);
    return acc;
  }, {});
}

function firstValue(row, keys) {
  const key = keys.find((candidate) => row[candidate] !== undefined && row[candidate] !== '');
  return key ? row[key] : '';
}

function normalizeHeader(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeRuc(value) {
  return String(value || '').replace(/[^\d]/g, '').trim();
}

function isValidRuc(value) {
  return /^\d{11}$/.test(normalizeRuc(value));
}

function normalizeDocumentNumber(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function validateDocument(record) {
  const type = normalizeDocumentType(record.tipo_documento);
  const number = normalizeDocumentNumber(record.nro_documento);
  if (!number) return { valid: true, message: '' };
  const rule = DOCUMENT_TYPES.find((item) => item.value === type);
  if (!rule) return { valid: false, message: 'Tipo de documento no valido.' };
  if (rule.pattern === 'numeric' && !/^\d+$/.test(number)) {
    return { valid: false, message: `${rule.label} solo permite numeros.` };
  }
  if (rule.pattern === 'alphanumeric' && !/^[a-zA-Z0-9]+$/.test(number)) {
    return { valid: false, message: `${rule.label} solo permite caracteres alfanumericos.` };
  }
  if (rule.exactLength && number.length !== rule.exactLength) {
    return { valid: false, message: `${rule.label} debe tener ${rule.exactLength} digitos.` };
  }
  if (rule.maxLength && number.length > rule.maxLength) {
    return { valid: false, message: `${rule.label} acepta hasta ${rule.maxLength} caracteres.` };
  }
  return { valid: true, message: '' };
}

function normalizeDocumentType(value) {
  const text = normalizeHeader(value).replaceAll('.', '');
  const found = DOCUMENT_TYPES.find((item) => (
    normalizeHeader(item.value) === text ||
    normalizeHeader(item.label).replaceAll('.', '') === text ||
    item.sunatCode.toLowerCase() === text
  ));
  return found ? found.value : (value || 'DNI');
}

function documentTypeOptions(selected) {
  const normalized = normalizeDocumentType(selected);
  return DOCUMENT_TYPES
    .map((item) => `<option value="${item.value}" ${item.value === normalized ? 'selected' : ''}>${escapeHtml(item.label)}</option>`)
    .join('');
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const parsed = Number(String(value).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCurrency(value) {
  const text = clean(value).toUpperCase();
  if (['S/', 'S/.', 'PEN', 'SOLES', 'SOL'].includes(text)) return 'PEN';
  if (['$', 'US$', 'USD', 'DOLARES', 'DOLAR'].includes(text)) return 'USD';
  return text || '';
}

function normalizeContractCode(value) {
  const text = clean(value);
  if (!text) return '';
  if (/^\d+$/.test(text)) return text.padStart(4, '0').slice(-4);
  return text;
}

function normalizeDate(value) {
  if (!value) return '';
  if (value instanceof Date) return limaDateInput(value);
  const text = clean(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+.*)?$/);
  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = (match[3].length === 2 ? '20' + match[3] : match[3]).padStart(4, '0');
    if (second > 12) return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
    return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function normalizeCavaliDate(value) {
  return normalizeDate(value);
}

function limaDateInput(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function buildInvoice(serie, numeracion) {
  return clean(serie) && clean(numeracion) ? `${clean(serie).toUpperCase()}-${clean(numeracion)}` : '';
}

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  persistStorageToSupabase(key, value);
}

function supabaseReady() {
  return Boolean(supabase);
}

function persistStorageToSupabase(key, value) {
  if (!supabaseReady() || !currentSession) return;
  if (key === STORAGE.master) void persistMastersToSupabase(value);
  if (key === STORAGE.annexes) void persistAnnexesToSupabase(value);
  if (key === STORAGE.control) void persistControlToSupabase(value);
  if (key === STORAGE.audit) void persistAuditsToSupabase(value);
}

async function safeSupabaseWrite(label, operation) {
  if (!supabaseReady() || !currentSession) return;
  try {
    const { error } = await operation();
    if (error) throw error;
  } catch (error) {
    console.warn(`Supabase no pudo guardar ${label}:`, error.message || error);
  }
}

async function safeSupabaseRead(label, operation) {
  if (!supabaseReady() || !currentSession) return [];
  try {
    const { data, error } = await operation();
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn(`Supabase no pudo leer ${label}:`, error.message || error);
    return [];
  }
}

function rowData(row) {
  return structuredClone(row || {});
}

function mapAdquirienteToDb(row) {
  return {
    id_local: row.id,
    codigo: row.codigo || row.id,
    razon_social: row.razon_social || '',
    ruc: normalizeRuc(row.ruc),
    estado: normalizeEstado(row.estado),
    datos_completos: rowData(row),
  };
}

function mapProveedorParticipanteToDb(row) {
  return {
    id_local: row.id,
    codigo_cavali: row.codigo_cavali || null,
    codigo_contrato: normalizeContractCode(row.codigo_contrato),
    ruc: normalizeRuc(row.ruc),
    razon_social: row.razon_social || '',
    representante_legal: row.representante_legal || null,
    tipo_documento: row.tipo_documento || 'DNI',
    nro_documento: row.nro_documento || null,
    cargo: row.cargo || null,
    referidor_codigo: row.referidor_id || null,
    estado: normalizeEstado(row.estado),
    datos_completos: rowData(row),
  };
}

function mapReferidorToDb(row) {
  return {
    id_local: row.id,
    codigo: row.id,
    nombre: row.nombre || '',
    tipo_documento: row.tipo_documento || 'DNI',
    nro_documento: row.nro_documento || null,
    estado: normalizeEstado(row.estado),
    datos_completos: rowData(row),
  };
}

function mapPlantillaToDb(row) {
  return {
    id_local: row.id,
    tipo_anexo: row.tipo_anexo || '',
    version: row.version || 'v1',
    ruta_archivo_plantilla: row.ruta_archivo_plantilla || null,
    estado: normalizeEstado(row.estado),
    datos_completos: rowData(row),
  };
}

function mapAnnexToDb(row) {
  return {
    id_local: row.id,
    estado_control: row.estado_control || 'Pendiente de pasar a Control',
    operacion: row.operacion || null,
    cliente: row.cliente || null,
    ruc_cliente: row.ruc_cliente || null,
    obligado: row.obligado || null,
    ruc_obligado: row.ruc_obligado || null,
    moneda: row.moneda || null,
    monto_neto_pago: Number(row.monto_neto_pago) || null,
    fecha_generacion: row.fecha_generacion || null,
    datos_completos: rowData(row),
  };
}

function mapControlToDb(row) {
  return {
    id_local: row.id,
    estado_control: row.estado_control || 'En Control',
    operacion: row.operacion || null,
    cliente: row.cliente || null,
    ruc_cliente: row.ruc_cliente || null,
    obligado: row.obligado || null,
    ruc_obligado: row.ruc_obligado || null,
    moneda: row.moneda || null,
    monto_neto_pago: Number(row.monto_neto_pago) || null,
    fecha_pase_control: row.fecha_pase_control || null,
    datos_completos: rowData(row),
  };
}

function mapAuditToDb(row) {
  return {
    id_local: row.id,
    entidad: row.entidad || 'manual',
    entidad_id: row.entidad_id || null,
    accion: row.accion || '',
    registro: row.registro || null,
    estado_anterior: row.estado_anterior || null,
    estado_nuevo: row.estado_nuevo || null,
    detalle: row.detalle || row.comentario || null,
    comentario: row.comentario || null,
    usuario_id: row.usuario_id || currentUserId(),
    usuario_nombre: row.usuario || row.usuario_nombre || currentUserName(),
    fecha_hora: row.fecha_hora || new Date().toISOString(),
    datos_completos: rowData(row),
  };
}

async function persistRows(table, rows, mapper, label, onConflict = 'id_local') {
  const payload = (rows || []).map(mapper).filter((row) => row.id_local);
  if (!payload.length) return;
  await safeSupabaseWrite(label, () => supabase.from(table).upsert(payload, { onConflict }));
}

async function persistMastersToSupabase(masterData) {
  await Promise.all([
    persistRows('adquirientes', masterData?.adquirentes || [], mapAdquirienteToDb, 'adquirientes'),
    persistRows('proveedores_participantes', masterData?.proveedoresParticipantes || [], mapProveedorParticipanteToDb, 'proveedores participantes'),
    persistRows('referidores', masterData?.referidores || [], mapReferidorToDb, 'referidores'),
    persistRows('plantillas_anexos', masterData?.plantillasAnexos || [], mapPlantillaToDb, 'plantillas de anexos'),
  ]);
}

async function persistAnnexesToSupabase(rows) {
  await persistRows('anexos_generados', rows, mapAnnexToDb, 'anexos generados');
}

async function persistControlToSupabase(rows) {
  await persistRows('registros_control', rows, mapControlToDb, 'registros de control');
}

async function persistAuditsToSupabase(rows) {
  await persistRows('auditoria', rows, mapAuditToDb, 'auditoria');
}

async function persistAuditToSupabase(row) {
  await persistRows('auditoria', [row], mapAuditToDb, 'auditoria');
}

async function persistTraceToSupabase(row) {
  await safeSupabaseWrite('trazabilidad', () => supabase.from('trazabilidad').insert({
    entidad: row.entidad || 'manual',
    id_local: row.id_local || null,
    accion: row.accion || '',
    estado_anterior: row.estado_anterior || null,
    estado_nuevo: row.estado_nuevo || null,
    usuario_id: row.usuario_id || currentUserId(),
    usuario_nombre: row.usuario_nombre || currentUserName(),
    detalle: row.detalle || null,
    datos_anteriores: row.datos_anteriores || null,
    datos_nuevos: row.datos_nuevos || null,
  }));
}

async function persistImportedLoadToSupabase(load) {
  await safeSupabaseWrite('cargas importadas', () => supabase.from('cargas_importadas').insert({
    modulo: load.modulo,
    tipo_maestro: load.tipo_maestro || null,
    nombre_archivo: load.nombre_archivo || null,
    cantidad_registros: load.cantidad_registros || 0,
    cantidad_creados: load.cantidad_creados || 0,
    cantidad_actualizados: load.cantidad_actualizados || 0,
    cantidad_omitidos: load.cantidad_omitidos || 0,
    usuario_id: currentUserId(),
    usuario_nombre: currentUserName(),
    estado: 'Procesado',
    detalle: load.detalle || null,
    datos_originales: load.datos_originales || null,
  }));
  await persistTraceToSupabase({
    entidad: load.modulo,
    id_local: load.nombre_archivo,
    accion: 'Importacion de archivo',
    estado_anterior: '',
    estado_nuevo: 'Procesado',
    usuario_nombre: 'usuario.local',
    detalle: `${load.nombre_archivo || 'Archivo'}: ${load.cantidad_registros || 0} registros procesados.`,
    datos_nuevos: load,
  });
}

function fromDatosCompletos(row) {
  return row?.datos_completos && Object.keys(row.datos_completos).length
    ? row.datos_completos
    : row;
}

async function loadSupabaseState() {
  if (!supabaseReady() || !currentSession) return;

  const [
    adquirientes,
    proveedoresParticipantes,
    referidores,
    plantillasAnexos,
    anexosGenerados,
    registrosControl,
    auditoria,
  ] = await Promise.all([
    safeSupabaseRead('adquirientes', () => supabase.from('adquirientes').select('*').order('creado_en', { ascending: false })),
    safeSupabaseRead('proveedores participantes', () => supabase.from('proveedores_participantes').select('*').order('creado_en', { ascending: false })),
    safeSupabaseRead('referidores', () => supabase.from('referidores').select('*').order('creado_en', { ascending: false })),
    safeSupabaseRead('plantillas de anexos', () => supabase.from('plantillas_anexos').select('*').order('creado_en', { ascending: false })),
    safeSupabaseRead('anexos generados', () => supabase.from('anexos_generados').select('*').order('creado_en', { ascending: false })),
    safeSupabaseRead('registros de control', () => supabase.from('registros_control').select('*').order('creado_en', { ascending: false })),
    safeSupabaseRead('auditoria', () => supabase.from('auditoria').select('*').order('fecha_hora', { ascending: false })),
  ]);

  const hasRemoteMasters = adquirientes.length || proveedoresParticipantes.length || referidores.length || plantillasAnexos.length;
  const hasRemoteOperations = anexosGenerados.length || registrosControl.length || auditoria.length;

  if (hasRemoteMasters) {
    state.masterData = normalizeMasterData({
      adquirentes: adquirientes.map(fromDatosCompletos),
      proveedoresParticipantes: proveedoresParticipantes.map(fromDatosCompletos),
      referidores: referidores.map(fromDatosCompletos),
      plantillasAnexos: plantillasAnexos.map(fromDatosCompletos),
    });
    localStorage.setItem(STORAGE.master, JSON.stringify(state.masterData));
  }

  if (anexosGenerados.length) {
    state.annexRows = anexosGenerados.map(fromDatosCompletos);
    localStorage.setItem(STORAGE.annexes, JSON.stringify(state.annexRows));
  }

  if (registrosControl.length) {
    state.controlRows = registrosControl.map(fromDatosCompletos);
    localStorage.setItem(STORAGE.control, JSON.stringify(state.controlRows));
  }

  if (auditoria.length) {
    state.auditRows = auditoria.map((row) => ({ ...fromDatosCompletos(row), id: row.id_local || fromDatosCompletos(row).id }));
    localStorage.setItem(STORAGE.audit, JSON.stringify(state.auditRows));
  }

  if (!hasRemoteMasters && !hasRemoteOperations) {
    await Promise.all([
      persistMastersToSupabase(state.masterData),
      persistAnnexesToSupabase(state.annexRows),
      persistControlToSupabase(state.controlRows),
      persistAuditsToSupabase(state.auditRows),
    ]);
  }
}

function badge(status) {
  const tone = status === 'Listo para generar' || status === 'Validado' || status === 'Generado'
    ? 'ok'
    : status === 'Duplicado'
      ? 'bad'
      : status === 'Observado'
        ? 'warn'
        : 'info';
  return `<span class="badge ${tone}">${escapeHtml(status || 'Pendiente')}</span>`;
}

function annexControlBadge(status) {
  const normalized = status || 'Pendiente de pasar a Control';
  const label = normalized === 'En Control' ? 'En Control' : 'Pendiente';
  const tone = normalized === 'En Control' ? 'ok' : 'info';
  return `<span class="badge ${tone}" title="${escapeHtml(normalized)}">${escapeHtml(label)}</span>`;
}

function statusBadge(status) {
  const normalized = normalizeEstado(status);
  const tone = normalized === 'Activo' ? 'ok' : 'bad';
  return `<span class="badge ${tone}">${escapeHtml(normalized)}</span>`;
}

function normalizeEstado(value) {
  const text = clean(value);
  if (!text || text === 'Inactivo') return text === 'Inactivo' ? 'Desactivado' : 'Activo';
  return text;
}

function iconEdit() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4.2L19.4 8.8a2 2 0 0 0 0-2.8L18 4.6a2 2 0 0 0-2.8 0L4 15.8V20Zm12.6-14L18 7.4l-1.7 1.7-1.4-1.4L16.6 6ZM6 16.6l7.5-7.5 1.4 1.4L7.4 18H6v-1.4Z"/></svg>';
}

function iconDelete() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21a2 2 0 0 1-2-2V8h14v11a2 2 0 0 1-2 2H7ZM9 4h6l1 2h4v2H4V6h4l1-2Zm0 7v7h2v-7H9Zm4 0v7h2v-7h-2Z"/></svg>';
}

function iconView() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5.2 0 8.7 4.1 10 7-1.3 2.9-4.8 7-10 7S3.3 14.9 2 12c1.3-2.9 4.8-7 10-7Zm0 2C8.5 7 5.8 9.4 4.3 12c1.5 2.6 4.2 5 7.7 5s6.2-2.4 7.7-5C18.2 9.4 15.5 7 12 7Zm0 2.2A2.8 2.8 0 1 1 12 14.8 2.8 2.8 0 0 1 12 9.2Z"/></svg>';
}

function iconDownload() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4h2v8.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4 3.3 3.3V4ZM5 18h14v2H5v-2Z"/></svg>';
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function referidorOptions(selectedId) {
  return (state.masterData.referidores || [])
    .filter((row) => row.estado !== 'Desactivado')
    .map((row) => `<option value="${escapeAttr(row.id)}" ${row.id === selectedId ? 'selected' : ''}>${escapeHtml(row.nombre)}</option>`)
    .join('');
}

function resolveReferidorId(value) {
  const text = clean(value);
  if (!text) return '';
  const found = (state.masterData.referidores || []).find((row) => row.id === text || normalizeHeader(row.nombre) === normalizeHeader(text));
  return found ? found.id : '';
}

function referidorName(id) {
  const found = (state.masterData.referidores || []).find((row) => row.id === id);
  return found ? found.nombre : '';
}

function displayFieldValue(field, value) {
  if (field === 'referidor_id') return referidorName(value);
  if (field === 'tipo_documento') return documentTypeLabel(value);
  return value;
}

function documentTypeLabel(value) {
  const normalized = normalizeDocumentType(value);
  return DOCUMENT_TYPES.find((item) => item.value === normalized)?.label || value;
}

function limaTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function formatLimaDateTime(value) {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(String(value))) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : limaTimestamp(parsed);
}

function limaDateKey(value) {
  const formatted = formatLimaDateTime(value);
  return /^\d{4}-\d{2}-\d{2}/.test(formatted) ? formatted.slice(0, 10) : '';
}

function formatDateOnly(value) {
  return limaDateKey(value) || normalizeDate(value) || '';
}

function labelFor(field) {
  const labels = {
    id: 'ID',
    codigo: 'Codigo',
    razon_social: 'Razon social',
    ruc: 'RUC',
    estado: 'Estado',
    codigo_cavali: 'Codigo CAVALI',
    codigo_contrato: 'Codigo de contrato',
    representante_legal: 'Representante legal',
    tipo_documento: 'Tipo de documento',
    nro_documento: 'Nro documento',
    cargo: 'Cargo',
    referidor_id: 'Referidor',
    tipo_anexo: 'Tipo de anexo',
    version: 'Version',
    ruta_archivo_plantilla: 'Ruta de plantilla',
    originador: 'Originador',
    fondo: 'Fondo',
    cliente: 'Cliente',
    ruc_cliente: 'RUC cliente',
    codigo_obligado: 'Codigo adquiriente',
    obligado: 'Adquiriente',
    ruc_obligado: 'RUC adquiriente',
    operacion: 'Operacion',
    factura: 'Factura',
    fecha_vencimiento: 'Fecha vencimiento',
    fecha_pago: 'Fecha de pago',
    tasa: 'Tasa',
    moneda: 'Moneda',
    monto_neto_pago: 'Monto neto de pago',
    monto_desembolsar: 'Monto a desembolsar',
    participante_origen_codigo: 'Codigo participante origen',
    participante_origen_nombre: 'Participante origen',
    requiere_datos_participante: 'Requiere datos participante',
    estado_validacion: 'Estado de validacion',
    observaciones: 'Observaciones',
    entidad: 'Entidad',
    entidad_id: 'ID entidad',
    accion: 'Accion',
    registro: 'Registro',
    estado_anterior: 'Estado anterior',
    estado_nuevo: 'Estado nuevo',
    detalle: 'Cambio realizado',
    usuario: 'Usuario',
    comentario: 'Comentario',
    fecha_hora: 'Fecha y hora',
  };
  return labels[field] || String(field || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function coerce(value) {
  const trimmed = String(value).trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function coerceField(field, value) {
  if (['ruc', 'codigo_cavali', 'codigo_contrato', 'nro_documento'].includes(field)) return String(value || '').trim();
  return coerce(value);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function downloadCsv(filename, headers, rows, keys) {
  const lines = [headers, ...rows.map((row) => keys.map((key) => row[key] ?? ''))];
  const csv = lines.map((line) => line.map(csvEscape).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[;"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
