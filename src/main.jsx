import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  History,
  Layers3,
  Upload,
} from 'lucide-react';
import { parseCavaliFile } from './services/cavaliParserService.js';
import { processCavaliRows } from './services/workflowStateService.js';
import { exportHistoricoWorkbook } from './services/historicoBuilderService.js';
import { saveControlBatch, loadControlRecords } from './services/controlService.js';
import { appendAuditAction, loadAuditActions } from './services/auditService.js';
import { getMasterData, saveMasterData } from './services/masterDataService.js';
import { generateAnnexPlaceholders } from './services/annexGeneratorService.js';
import { HISTORICO_COLUMNS } from './data/historicoColumns.js';
import './styles.css';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 2,
});

function App() {
  const [masterData, setMasterData] = useState(() => getMasterData());
  const [loadSummary, setLoadSummary] = useState(null);
  const [processedRows, setProcessedRows] = useState([]);
  const [controlRecords, setControlRecords] = useState(() => loadControlRecords());
  const [auditActions, setAuditActions] = useState(() => loadAuditActions());
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMaster, setActiveMaster] = useState('participantes');

  const metrics = useMemo(() => {
    const total = processedRows.length;
    const valid = processedRows.filter((row) => ['Validado', 'Listo para generar'].includes(row.estado_validacion)).length;
    const observed = processedRows.filter((row) => row.estado_validacion === 'Observado').length;
    const duplicated = processedRows.filter((row) => row.estado_validacion === 'Duplicado').length;
    const amount = processedRows.reduce((sum, row) => sum + (Number(row.monto_neto_pago) || 0), 0);
    return { total, valid, observed, duplicated, amount };
  }, [processedRows]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const parsedRows = await parseCavaliFile(file);
      const result = processCavaliRows({
        rows: parsedRows,
        fileName: file.name,
        masterData,
        usuario: 'usuario.local',
      });
      setProcessedRows(result.rows);
      setLoadSummary(result.summary);
      appendAuditAction({
        entidad: 'cargas_cavali',
        entidad_id: result.summary.carga_id,
        accion: 'Carga CAVALI procesada',
        estado_anterior: null,
        estado_nuevo: 'Validacion ejecutada',
        usuario: 'usuario.local',
        comentario: `${file.name}: ${result.summary.total} registros, ${result.summary.validos} validos, ${result.summary.observados} observados.`,
      });
      setAuditActions(loadAuditActions());
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  }

  function handleGenerateHistorico() {
    const rowsToGenerate = processedRows.filter((row) => ['Validado', 'Listo para generar'].includes(row.estado_validacion));
    if (!rowsToGenerate.length) return;

    const annexes = generateAnnexPlaceholders(rowsToGenerate, 'Anexo Tipo 1');
    const controlBatch = saveControlBatch(rowsToGenerate.map((row, index) => ({
      ...row,
      estado: 'Anexo generado',
      link_anexo_word: annexes[index]?.link_anexo_word ?? '',
      version_anexo: annexes[index]?.version_anexo ?? 'v1',
      fecha_generacion: new Date().toISOString(),
      usuario_generador: 'usuario.local',
    })));
    exportHistoricoWorkbook(controlBatch);
    appendAuditAction({
      entidad: 'control',
      entidad_id: controlBatch.map((row) => row.id).join(','),
      accion: 'Generacion HISTORICO y Control',
      estado_anterior: 'Listo para generar',
      estado_nuevo: 'Anexo generado',
      usuario: 'usuario.local',
      comentario: `${controlBatch.length} registros guardados en Control y exportados a HISTORICO.`,
    });
    setControlRecords(loadControlRecords());
    setAuditActions(loadAuditActions());
    setProcessedRows((rows) => rows.map((row) => (
      rowsToGenerate.some((item) => item.factura_id === row.factura_id)
        ? { ...row, estado_validacion: 'Generado', estado: 'Anexo generado' }
        : row
    )));
  }

  function updateMasterRow(collection, rowIndex, key, value) {
    const next = {
      ...masterData,
      [collection]: masterData[collection].map((row, index) => (
        index === rowIndex ? { ...row, [key]: value, fecha_actualizacion: new Date().toISOString() } : row
      )),
    };
    setMasterData(next);
    saveMasterData(next);
  }

  function addMasterRow(collection, template) {
    const next = {
      ...masterData,
      [collection]: [
        ...masterData[collection],
        {
          id: crypto.randomUUID(),
          estado: 'Activo',
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          ...template,
        },
      ],
    };
    setMasterData(next);
    saveMasterData(next);
  }

  const masterCollections = {
    participantes: {
      title: 'Participantes origen',
      collection: 'participantesOrigen',
      fields: ['codigo_participante', 'nombre_participante', 'ruc_participante', 'correo_participante'],
      template: { codigo_participante: '', nombre_participante: '', ruc_participante: '', correo_participante: '' },
    },
    adquirentes: {
      title: 'Adquirentes',
      collection: 'adquirentes',
      fields: ['ruc_adquirente', 'razon_social_homologada', 'codigo_adquirente', 'tasa_default'],
      template: { ruc_adquirente: '', razon_social_homologada: '', codigo_adquirente: '', tasa_default: 0 },
    },
    proveedores: {
      title: 'Proveedores',
      collection: 'proveedores',
      fields: ['ruc_proveedor', 'razon_social_homologada', 'codigo_interno'],
      template: { ruc_proveedor: '', razon_social_homologada: '', codigo_interno: '' },
    },
  };
  const masterConfig = masterCollections[activeMaster];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/artboard-1.jpg" alt="MF Core" />
          <div>
            <strong>MF Core</strong>
            <span>Madero Factoring</span>
          </div>
        </div>
        <nav>
          <a className="active"><Layers3 size={18} /> Anexos y Control</a>
          <a><Database size={18} /> Maestros</a>
          <a><History size={18} /> Auditoria</a>
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">MVP operativo</p>
            <h1>Generador de Anexos y Control Historico</h1>
          </div>
          <button className="primary" onClick={handleGenerateHistorico} disabled={!metrics.valid}>
            <Download size={18} /> Generar HISTORICO
          </button>
        </header>

        <section className="hero-panel">
          <div>
            <p className="eyebrow">Flujo CAVALI</p>
            <h2>Carga, valida, cruza maestros y guarda Control con trazabilidad.</h2>
          </div>
          <label className="upload-box">
            <Upload size={24} />
            <strong>{isProcessing ? 'Procesando archivo...' : 'Cargar CSV o Excel CAVALI'}</strong>
            <span>CSV separado por punto y coma o XLSX exportado de CAVALI</span>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
          </label>
        </section>

        <section className="metric-grid">
          <Metric label="Leidos" value={metrics.total} />
          <Metric label="Validados" value={metrics.valid} tone="success" />
          <Metric label="Observados" value={metrics.observed} tone="warning" />
          <Metric label="Duplicados" value={metrics.duplicated} tone="danger" />
          <Metric label="Monto neto" value={currencyFormatter.format(metrics.amount || 0)} />
        </section>

        {loadSummary && (
          <section className="summary-strip">
            <CheckCircle2 size={18} />
            <span>Carga {loadSummary.carga_id}: {loadSummary.total} registros procesados desde {loadSummary.archivo_nombre}.</span>
          </section>
        )}

        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Vista previa</p>
                <h3>Validacion de registros CAVALI</h3>
              </div>
              <span>{HISTORICO_COLUMNS.length} columnas HISTORICO preparadas</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>RUC proveedor</th>
                    <th>Proveedor</th>
                    <th>RUC adquirente</th>
                    <th>Codigo obligado</th>
                    <th>Factura</th>
                    <th>Monto</th>
                    <th>Moneda</th>
                    <th>Vencimiento</th>
                    <th>Participante</th>
                    <th>Originador</th>
                    <th>Estado</th>
                    <th>Observacion</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRows.map((row) => (
                    <tr key={row.factura_id}>
                      <td>{row.ruc_cliente}</td>
                      <td>{row.cliente}</td>
                      <td>{row.ruc_obligado}</td>
                      <td>{row.codigo_obligado || '-'}</td>
                      <td>{row.factura}</td>
                      <td>{currencyFormatter.format(Number(row.monto_neto_pago) || 0)}</td>
                      <td>{row.moneda}</td>
                      <td>{row.fecha_vencimiento || '-'}</td>
                      <td>{row.participante_origen_codigo}</td>
                      <td>{row.originador}</td>
                      <td><StatusBadge status={row.estado_validacion} /></td>
                      <td>{row.observaciones || '-'}</td>
                    </tr>
                  ))}
                  {!processedRows.length && (
                    <tr>
                      <td colSpan="12" className="empty-state">
                        <FileSpreadsheet size={28} />
                        Carga un archivo CAVALI para ver la validacion previa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Maestros</p>
                <h3>{masterConfig.title}</h3>
              </div>
            </div>
            <div className="tabs">
              {Object.keys(masterCollections).map((key) => (
                <button key={key} className={activeMaster === key ? 'active' : ''} onClick={() => setActiveMaster(key)}>
                  {key}
                </button>
              ))}
            </div>
            <button className="secondary full" onClick={() => addMasterRow(masterConfig.collection, masterConfig.template)}>
              Agregar registro
            </button>
            <div className="master-list">
              {masterData[masterConfig.collection].map((row, rowIndex) => (
                <div className="master-row" key={row.id}>
                  {masterConfig.fields.map((field) => (
                    <label key={field}>
                      <span>{field}</span>
                      <input
                        value={row[field] ?? ''}
                        onChange={(event) => updateMasterRow(masterConfig.collection, rowIndex, field, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Control</p>
                <h3>Registros guardados</h3>
              </div>
              <strong>{controlRecords.length}</strong>
            </div>
            <div className="mini-list">
              {controlRecords.slice(0, 8).map((record) => (
                <div key={record.id}>
                  <span>{record.factura}</span>
                  <small>{record.estado} · {record.originador}</small>
                </div>
              ))}
              {!controlRecords.length && <p className="muted">Aun no hay registros guardados en Control.</p>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Trazabilidad</p>
                <h3>Historial de acciones</h3>
              </div>
              <AlertTriangle size={18} />
            </div>
            <div className="mini-list">
              {auditActions.slice(0, 8).map((action) => (
                <div key={action.id}>
                  <span>{action.accion}</span>
                  <small>{new Date(action.fecha_hora).toLocaleString('es-PE')} · {action.usuario}</small>
                </div>
              ))}
              {!auditActions.length && <p className="muted">La auditoria se llenara con cada carga y generacion.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className={`metric ${tone || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  const className = `badge ${String(status || '').toLowerCase().replaceAll(' ', '-')}`;
  return <span className={className}>{status || 'Pendiente'}</span>;
}

createRoot(document.getElementById('root')).render(<App />);
