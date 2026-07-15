import { useState, useRef, useEffect } from 'react';
import { solveEOQ, solveEOQBackorders, solveEPQ, classifyABC } from '../../utils/inventorySolvers';
import { exportInventoryToPDF } from '../../utils/inventoryPdfGenerator';
import { generateInventoryExamples } from '../../utils/exampleGenerators';
import { ComposedChart, Line, LineChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function InventoryModule() {
  const [selectedMethod, setSelectedMethod] = useState('eoq');
  
  // EOQ / EPQ States
  const [D, setD] = useState(1000);
  const [Co, setCo] = useState(10);
  const [Ch, setCh] = useState(2.5);
  const [Cf, setCf] = useState(5);
  const [p, setP] = useState(2000);
  const [d, setdRate] = useState(1000);
  // EOQ extra
  const [diasHabiles, setDiasHabiles] = useState(365);
  const [L, setL] = useState(0);
  const [C, setC] = useState(0);

  // ABC States
  const [abcItems, setAbcItems] = useState([
    { id: '1', name: 'Articulo 1', D: 1000, C: 50 },
    { id: '2', name: 'Articulo 2', D: 500, C: 10 }
  ]);
  
  const [examplesList, setExamplesList] = useState([]);
  
  useEffect(() => {
    setExamplesList(generateInventoryExamples(selectedMethod));
  }, [selectedMethod]);

  const handleGenerateExamples = () => {
    setExamplesList(generateInventoryExamples(selectedMethod));
  };
  
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'results'
  const [statement, setStatement] = useState(null);
  const [showStatement, setShowStatement] = useState(true);
  const chartRef = useRef(null);

  const loadExample = (ex) => {
    setSelectedMethod(ex.method);
    if (ex.method !== 'abc') {
      setD(ex.D);
      setCo(ex.Co);
      setCh(ex.Ch);
      setCf(ex.Cf);
      setP(ex.p);
      setdRate(ex.d);
      setDiasHabiles(ex.diasHabiles || 365);
      setL(ex.L || 0);
      setC(ex.C || 0);
    } else {
      setAbcItems(ex.abcItems);
      setActiveTab('input');
    }
    setStatement(ex.statement);
    setShowStatement(true);
    setResult(null);
    setError('');
  };

  const handleSolve = () => {
    setError('');
    setResult(null);
    try {
      let res;
      if (selectedMethod === 'eoq') {
        res = solveEOQ(Number(D), Number(Co), Number(Ch), Number(diasHabiles), Number(L), Number(C));
      } else if (selectedMethod === 'eoq-backorders') {
        res = solveEOQBackorders(Number(D), Number(Co), Number(Ch), Number(Cf));
      } else if (selectedMethod === 'epq') {
        res = solveEPQ(Number(D), Number(Co), Number(Ch), Number(p), Number(d));
      } else if (selectedMethod === 'abc') {
        res = classifyABC(abcItems);
      }
      setResult(res);
      setCurrentStep(0);
      if (selectedMethod === 'abc') {
        setActiveTab('results');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    if (result) {
      const inputs = { D: Number(D), Co: Number(Co), Ch: Number(Ch), Cf: Number(Cf), p: Number(p), d: Number(d), C: Number(C), abcItems, statement };
      await exportInventoryToPDF(selectedMethod, inputs, result, chartRef);
    }
  };

  const handleAbcChange = (index, field, val) => {
    const newItems = [...abcItems];
    newItems[index][field] = field === 'name' || field === 'id' ? val : Number(val);
    setAbcItems(newItems);
  };

  const addAbcItem = () => {
    setAbcItems([...abcItems, { id: `${abcItems.length + 1}`, name: `Articulo ${abcItems.length + 1}`, D: 0, C: 0 }]);
  };

  const removeAbcItem = (index) => {
    if (abcItems.length <= 1) return;
    const newItems = [...abcItems];
    newItems.splice(index, 1);
    setAbcItems(newItems);
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100%' }}>
      <aside className="sidebar glass-panel">
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Inventarios</h3>
        
        {/* SECCIÓN 1: Configuración del Modelo */}
        <div style={{ marginBottom: '20px', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <label style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Configuración del Modelo</label>
          <select 
            value={selectedMethod} 
            onChange={e => { 
              setSelectedMethod(e.target.value); 
              setResult(null); 
              setError(''); 
              setActiveTab('input');
            }}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '2px solid #3b82f6', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
          >
            <option value="eoq">EOQ Clásico</option>
            <option value="eoq-backorders">EOQ con Faltantes planeados</option>
            <option value="epq">EPQ (Lote de Producción)</option>
            <option value="abc">Clasificación ABC</option>
          </select>
        </div>

        <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>Ejemplos precargados:</label>
                <button 
                  onClick={handleGenerateExamples}
                  style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  ↻ Generar Nuevos
                </button>
              </div>
              
              <div className="exercise-list">
                {examplesList.map(ex => (
                  <div
                    key={ex.id}
                    className="exercise-card"
                    onClick={() => loadExample(ex)}
                    style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div className="title" style={{ fontSize: '0.85rem' }}>
                      <span>{ex.id}. {ex.title}</span>
                      <span className="badge balanced" style={{ fontSize: '0.65rem', marginLeft: '5px', background: '#059669', padding: '2px 4px', borderRadius: '3px' }}>EJEMPLO</span>
                    </div>
                  </div>
                ))}
              </div>
      </aside>

      <main className="main-content glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }}>
        <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{selectedMethod === 'abc' ? 'Clasificación ABC' : 'Resultados de Inventario'}</h2>
            {!result && (
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '5px' }}>
                Configure los parámetros a continuación y presione Calcular.
              </div>
            )}
          </div>
          {result ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" style={{ background: '#3b82f6', padding: '8px 15px', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setResult(null)}>✏️ Modificar Datos</button>
              <button className="btn" style={{ background: '#8b5cf6', padding: '8px 15px', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={handleExport}>📄 Exportar a PDF</button>
            </div>
          ) : (
            <div>
              <button 
                className="btn" 
                style={{ background: '#10b981', color: '#fff', padding: '10px 25px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)' }} 
                onClick={handleSolve} 
              >
                ▶ Calcular Resultados
              </button>
            </div>
          )}
        </div>
        {error && <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}



        {error && (
          <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.2)', borderLeft: '4px solid #ef4444', borderRadius: '4px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#f87171' }}>Error</h4>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
          {statement && (
            <div style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
              <div 
                style={{ padding: '10px 15px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowStatement(!showStatement)}
              >
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary)' }}>Contexto del Problema</h3>
                <span style={{ fontSize: '0.8rem' }}>{showStatement ? '▼ Ocultar' : '▶ Mostrar'}</span>
              </div>
              {showStatement && (
                <div style={{ padding: '15px', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {statement}
                </div>
              )}
            </div>
          )}
          {!result && selectedMethod !== 'abc' && (
            <div className="glass-panel" style={{ padding: '25px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.7)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#f8fafc', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Parámetros de Entrada</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Demanda (D):</label>
                  <input type="number" value={D} onChange={e => setD(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Costo de Orden (K):</label>
                  <input type="number" value={Co} onChange={e => setCo(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Costo de Mantener (h):</label>
                  <input type="number" step="0.1" value={Ch} onChange={e => setCh(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                </div>
                
                {selectedMethod === 'eoq-backorders' && (
                  <div>
                    <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Costo Faltante (Cf):</label>
                    <input type="number" step="0.1" value={Cf} onChange={e => setCf(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                  </div>
                )}
                
                {selectedMethod === 'eoq' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Costo Unitario (C):</label>
                      <input type="number" min="0" value={C} onChange={e => setC(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>0 si no suma costo de compra.</span>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Días hábiles por año:</label>
                      <input type="number" value={diasHabiles} onChange={e => setDiasHabiles(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Tiempo de entrega — L (días):</label>
                      <input type="number" min="0" value={L} onChange={e => setL(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>0 si no aplica reorden.</span>
                    </div>
                  </>
                )}

                {selectedMethod === 'epq' && (
                  <>
                    <div>
                      <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Tasa de Producción (p):</label>
                      <input type="number" value={p} onChange={e => setP(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Tasa de Demanda (d):</label>
                      <input type="number" value={d} onChange={e => setdRate(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!result && selectedMethod === 'abc' && (
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '25px', borderRadius: '12px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#f8fafc', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Parámetros de Entrada (ABC)</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>Nombre</th>
                    <th style={{ padding: '10px' }}>Demanda (D)</th>
                    <th style={{ padding: '10px' }}>Costo Unit. (C)</th>
                    <th style={{ padding: '10px' }}>
                      <button onClick={addAbcItem} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>+ Agregar</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {abcItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: '5px' }}>
                        <input type="text" value={item.id} onChange={e => handleAbcChange(i, 'id', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                      </td>
                      <td style={{ padding: '5px' }}>
                        <input type="text" value={item.name} onChange={e => handleAbcChange(i, 'name', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                      </td>
                      <td style={{ padding: '5px' }}>
                        <input type="number" value={item.D} onChange={e => handleAbcChange(i, 'D', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                      </td>
                      <td style={{ padding: '5px' }}>
                        <input type="number" step="0.1" value={item.C} onChange={e => handleAbcChange(i, 'C', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                      </td>
                      <td style={{ padding: '5px', textAlign: 'center' }}>
                        <button onClick={() => removeAbcItem(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result && selectedMethod !== 'abc' && (
            <div id="pdf-export-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <ResultCard title="Lote Óptimo (Q*)" value={result.Q.toFixed(2)} desc="Cantidad a ordenar/producir" color="#10b981" />
              <ResultCard title="Costo Total Anual (TC)" value={`$${result.TC.toFixed(2)}`} desc="Costo mínimo optimizado" color="#3b82f6" />
              
              {result.N !== undefined && <ResultCard title="Número de Órdenes (N)" value={result.N.toFixed(2)} desc="Órdenes al año" color="#f59e0b" />}
              {result.T_days !== undefined && <ResultCard title="Tiempo entre Órdenes (T)" value={`${result.T_days.toFixed(2)} días`} desc="Días hábiles entre pedidos" color="#8b5cf6" />}
              {result.d_daily !== undefined && <ResultCard title="Demanda por Día (d)" value={result.d_daily.toFixed(4)} desc="Unidades/día hábil" color="#06b6d4" />}
              {result.R !== null && result.R !== undefined && <ResultCard title="Punto de Reorden (R)" value={result.R.toFixed(2)} desc="Pedir cuando inventario = R" color="#f97316" />}
              
              {result.S !== undefined && <ResultCard title="Faltante Máximo (S*)" value={result.S.toFixed(2)} desc="Unidades permitidas faltar" color="#ef4444" />}
              {result.Imax !== undefined && <ResultCard title="Inventario Máx (Imax)" value={result.Imax.toFixed(2)} desc="Nivel máximo de stock" color="#059669" />}
            </div>
            </div>
          )}

          {/* ── GRÁFICA DE COMPORTAMIENTO DE INVENTARIO ── */}
          {result && selectedMethod !== 'abc' && result.chartData && (
            <div
              ref={chartRef}
              style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '4px',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#f8fafc' }}>
                📈 Comportamiento del Inventario
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={result.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid stroke="#1e3a5f" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="t"
                    stroke="#64748b"
                    fontSize={10}
                    label={{ value: 'Tiempo (años)', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={v => v.toFixed(2)}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={v => v.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val, name) => [val.toLocaleString(), name === 'inventario' ? 'Inventario' : 'Promedio']}
                    labelFormatter={t => 't = ' + parseFloat(t).toFixed(3)}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  {/* Línea en y=0 para EOQ con faltantes */}
                  {selectedMethod === 'eoq-backorders' && (
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
                  )}
                  {/* Punto de Reorden R — solo EOQ con L > 0 */}
                  {selectedMethod === 'eoq' && result.R !== null && result.R !== undefined && (
                    <ReferenceLine
                      y={result.R}
                      stroke="#f97316"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      label={{
                        value: `R = ${result.R.toFixed(2)}`,
                        position: 'insideTopLeft',
                        fill: '#f97316',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  <Line
                    type="linear"
                    dataKey="inventario"
                    name="Inventario"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="promedio"
                    name="Promedio (Q/2)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {result && selectedMethod === 'abc' && activeTab === 'results' && (
            <div id="pdf-export-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ width: '100%', height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={result.items} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} />
                        <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} />
                        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar yAxisId="left" dataKey="vmaPercentage" name="% VMA" fill="#10b981" />
                        <Line yAxisId="right" type="monotone" dataKey="accumulatedPercentage" name="% Acum" stroke="#38bdf8" strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', overflowY: 'auto', maxHeight: '250px' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b' }}>
                      <tr>
                        <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>Artículo</th>
                        <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>VMA ($)</th>
                        <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>% Acum</th>
                        <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>Clase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((r, idx) => (
                        <tr key={idx} style={{ background: r.zone === 'A' ? 'rgba(16, 185, 129, 0.1)' : r.zone === 'B' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                          <td style={{ borderBottom: '1px solid #0f172a', padding: '6px' }}>{r.name}</td>
                          <td style={{ borderBottom: '1px solid #0f172a', padding: '6px' }}>{r.vma.toFixed(1)}</td>
                          <td style={{ borderBottom: '1px solid #0f172a', padding: '6px' }}>{r.accumulatedPercentage.toFixed(1)}%</td>
                          <td style={{ borderBottom: '1px solid #0f172a', padding: '6px', fontWeight: 'bold', color: r.zone === 'A' ? '#10b981' : r.zone === 'B' ? '#f59e0b' : '#ef4444' }}>{r.zone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {result && result.steps && (selectedMethod !== 'abc' || activeTab === 'results') && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>Resolución Paso a Paso</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    style={{ background: '#334155', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', opacity: currentStep === 0 ? 0.5 : 1, fontSize: '0.8rem' }}
                  >
                    ◀ Anterior
                  </button>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    {currentStep + 1} / {result.steps.length}
                  </span>
                  <button 
                    onClick={() => setCurrentStep(Math.min(result.steps.length - 1, currentStep + 1))}
                    disabled={currentStep === result.steps.length - 1}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: currentStep === result.steps.length - 1 ? 'not-allowed' : 'pointer', opacity: currentStep === result.steps.length - 1 ? 0.5 : 1, fontSize: '0.8rem' }}
                  >
                    Siguiente ▶
                  </button>
                </div>
              </div>
              
              <div className="no-print" style={{ padding: '10px 15px', background: '#0f172a', borderRadius: '4px', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6', fontSize: '0.95rem' }}>{result.steps[currentStep].title}</h4>
                <div style={{ overflowX: 'auto', margin: '10px 0', fontSize: '0.9rem' }}>
                  <BlockMath math={result.steps[currentStep].math} />
                </div>
                <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', color: '#cbd5e1', fontSize: '0.85rem' }}>
                  {result.steps[currentStep].desc}
                </div>
              </div>

              {/* Vista para el PDF con todos los pasos desenrollados */}
              <div className="print-only" style={{ display: 'none' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '1.1rem' }}>Resolución Paso a Paso Completa</h3>
                {result.steps.map((step, idx) => (
                  <div key={idx} style={{ padding: '10px 15px', background: '#0f172a', borderRadius: '4px', border: '1px solid #334155', marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6', fontSize: '0.95rem' }}>{step.title}</h4>
                    <div style={{ overflowX: 'auto', margin: '10px 0', fontSize: '0.9rem' }}>
                      <BlockMath math={step.math} />
                    </div>
                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', color: '#cbd5e1', fontSize: '0.85rem' }}>
                      {step.desc}
                    </div>
                  </div>
                ))}
              </div>

              {currentStep === result.steps.length - 1 && (
                <div style={{ marginTop: '10px', padding: '10px', borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#10b981', fontSize: '0.9rem' }}>Conclusión Final</h4>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.4' }}>{result.conclusion}</div>
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

function ResultCard({ title, value, desc, color }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderTop: `4px solid ${color}` }}>
      <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{title}</h3>
      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{desc}</div>
    </div>
  );
}
