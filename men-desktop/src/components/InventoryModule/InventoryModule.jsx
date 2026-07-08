import { useState } from 'react';
import { solveEOQ, solveEOQBackorders, solveEPQ, classifyABC } from '../../utils/inventorySolvers';
import { exportInventoryToPDF } from '../../utils/inventoryPdfGenerator';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

const preloadedExamples = [
  {
    id: 1,
    title: 'Venta de Neumáticos (EOQ)',
    statement: 'Una tienda vende neumáticos y la demanda anual es de 1,200 unidades. El costo de hacer un pedido es de $20 y el costo de mantener un neumático en inventario es de $0.50 al año. Determine la cantidad óptima de pedido.',
    method: 'eoq',
    D: 1200,
    Co: 20,
    Ch: 0.5,
    Cf: '',
    p: '',
    d: ''
  },
  {
    id: 2,
    title: 'Fábrica de Juguetes (EPQ)',
    statement: 'Una fábrica produce juguetes con una demanda de 5,000 anual. El costo de preparación es $100 y de mantenimiento $1. La tasa de producción anual es de 8,000 unidades. Calcule el tamaño óptimo de lote de producción.',
    method: 'epq',
    D: 5000,
    Co: 100,
    Ch: 1,
    Cf: '',
    p: 8000,
    d: 5000
  },
  {
    id: 3,
    title: 'Gestión de Almacén (ABC)',
    statement: 'Clasifique los artículos del inventario para aplicar políticas de gestión enfocadas en el valor monetario.',
    method: 'abc',
    D: '', Co: '', Ch: '', Cf: '', p: '', d: '',
    abcItems: [
      { id: '1', name: 'Motor', D: 20, C: 5000 },
      { id: '2', name: 'Cables', D: 500, C: 10 },
      { id: '3', name: 'Tornillos', D: 2000, C: 0.5 },
      { id: '4', name: 'Bombillas', D: 100, C: 20 },
      { id: '5', name: 'Transmisor', D: 50, C: 1000 }
    ]
  },
  {
    id: 4,
    title: 'Componentes de PC (EOQ con Faltantes)',
    statement: 'La demanda de placas madre es 2,000. El costo de pedido es $50, mantener inventario cuesta $2. Además, el costo por unidad faltante planeada es de $5. Determine la cantidad a ordenar y el nivel máximo de escasez.',
    method: 'eoq-backorders',
    D: 2000,
    Co: 50,
    Ch: 2,
    Cf: 5,
    p: '',
    d: ''
  },
  {
    id: 5,
    title: 'Ensambladora de Muebles (EPQ)',
    statement: 'Una fábrica de muebles tiene una demanda de 3,000 mesas. Costo de inicio $150, mantenimiento $1.50. Tasa de producción 5,000. Encuentre el tamaño de lote y el inventario máximo.',
    method: 'epq',
    D: 3000,
    Co: 150,
    Ch: 1.5,
    Cf: '',
    p: 5000,
    d: 3000
  }
];

export default function InventoryModule() {
  const [selectedMethod, setSelectedMethod] = useState('eoq');
  
  // EOQ / EPQ States
  const [D, setD] = useState(1000);
  const [Co, setCo] = useState(10);
  const [Ch, setCh] = useState(2.5);
  const [Cf, setCf] = useState(5);
  const [p, setP] = useState(2000);
  const [d, setdRate] = useState(1000);

  // ABC States
  const [abcItems, setAbcItems] = useState([
    { id: '1', name: 'Articulo 1', D: 1000, C: 50 },
    { id: '2', name: 'Articulo 2', D: 500, C: 10 }
  ]);
  
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'results'
  const [statement, setStatement] = useState(null);
  const [showStatement, setShowStatement] = useState(true);

  const loadExample = (ex) => {
    setSelectedMethod(ex.method);
    if (ex.method !== 'abc') {
      setD(ex.D);
      setCo(ex.Co);
      setCh(ex.Ch);
      setCf(ex.Cf);
      setP(ex.p);
      setdRate(ex.d);
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
        res = solveEOQ(Number(D), Number(Co), Number(Ch));
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

  const handleExport = () => {
    if (result) {
      const inputs = { D: Number(D), Co: Number(Co), Ch: Number(Ch), Cf: Number(Cf), p: Number(p), d: Number(d), abcItems, statement };
      exportInventoryToPDF(selectedMethod, inputs, result);
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
      <aside className="sidebar glass-panel" style={{ minWidth: '250px' }}>
        <div className="header-actions" style={{ flexDirection: 'column', gap: '15px' }}>
          <h2 style={{ margin: 0, color: 'var(--primary)' }}>Inventarios</h2>
          
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modelo:</label>
            <select 
              value={selectedMethod} 
              onChange={e => { 
                setSelectedMethod(e.target.value); 
                setResult(null); 
                setError(''); 
                setActiveTab('input');
              }}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <option value="eoq">EOQ Clásico</option>
              <option value="eoq-backorders">EOQ con Faltantes planeados</option>
              <option value="epq">EPQ (Lote de Producción)</option>
              <option value="abc">Clasificación ABC</option>
            </select>
          </div>

          {selectedMethod !== 'abc' && (
            <>
              <div style={{ width: '100%', marginTop: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Demanda (D):</label>
                <input type="number" value={D} onChange={e => setD(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
              </div>

              <div style={{ width: '100%', marginTop: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Costo de Ordenar (Co):</label>
                <input type="number" value={Co} onChange={e => setCo(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
              </div>

              <div style={{ width: '100%', marginTop: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Costo de Mantener (Ch):</label>
                <input type="number" step="0.1" value={Ch} onChange={e => setCh(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
              </div>
            </>
          )}

          {selectedMethod === 'eoq-backorders' && (
            <div style={{ width: '100%', marginTop: '10px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Costo Faltante (Cf):</label>
              <input type="number" step="0.1" value={Cf} onChange={e => setCf(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
            </div>
          )}

          {selectedMethod === 'epq' && (
            <>
              <div style={{ width: '100%', marginTop: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tasa de Producción (p):</label>
                <input type="number" value={p} onChange={e => setP(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
              </div>
              <div style={{ width: '100%', marginTop: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tasa de Demanda (d):</label>
                <input type="number" value={d} onChange={e => setdRate(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
              </div>
            </>
          )}

            <button className="btn" style={{ background: 'var(--success)', marginTop: '20px', width: '100%' }} onClick={handleSolve}>
              Calcular Inventario
            </button>

            <div style={{ width: '100%', marginTop: '15px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Ejemplos precargados:</label>
              <div className="exercise-list" style={{ marginTop: '5px' }}>
                {preloadedExamples.map((ex) => (
                  <div
                    key={ex.id}
                    className="exercise-card"
                    onClick={() => loadExample(ex)}
                    style={{ cursor: 'pointer', padding: '10px' }}
                  >
                    <div className="title" style={{ fontSize: '0.85rem' }}>
                      <span>{ex.id}. {ex.title}</span>
                      <span className="badge balanced" style={{ fontSize: '0.65rem' }}>EJEMPLO</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

      </aside>

      <main className="main-content glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{selectedMethod === 'abc' ? 'Clasificación ABC' : 'Resultados de Inventario'}</h2>
            {selectedMethod === 'abc' && (
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', overflow: 'hidden' }}>
                <button 
                  onClick={() => setActiveTab('input')}
                  style={{ background: activeTab === 'input' ? '#3b82f6' : 'transparent', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }}
                >
                  Datos de Entrada
                </button>
                <button 
                  onClick={() => result && setActiveTab('results')}
                  style={{ background: activeTab === 'results' ? '#3b82f6' : 'transparent', color: result ? '#fff' : '#64748b', border: 'none', padding: '6px 12px', cursor: result ? 'pointer' : 'not-allowed', fontSize: '0.85rem', transition: 'background 0.2s' }}
                  disabled={!result}
                >
                  Resultados
                </button>
              </div>
            )}
          </div>
          {result && (
            <button className="btn" style={{ background: '#8b5cf6', padding: '5px 10px', fontSize: '0.85rem' }} onClick={handleExport}>
              📄 Exportar a PDF
            </button>
          )}
        </div>

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

        {error && (
          <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.2)', borderLeft: '4px solid #ef4444', borderRadius: '4px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#f87171' }}>Error</h4>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
          {selectedMethod === 'abc' && activeTab === 'input' && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
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
              <ResultCard title="Costo Total Anual (CT)" value={`$${result.CT.toFixed(2)}`} desc="Costo mínimo optimizado" color="#3b82f6" />
              
              {result.N !== undefined && <ResultCard title="Número Pedidos (N)" value={result.N.toFixed(2)} desc="Pedidos por año" color="#f59e0b" />}
              {result.T_days !== undefined && <ResultCard title="Tiempo (T)" value={`${result.T_days.toFixed(2)} días`} desc="Tiempo entre pedidos" color="#8b5cf6" />}
              
              {result.S !== undefined && <ResultCard title="Faltante Máximo (S*)" value={result.S.toFixed(2)} desc="Unidades permitidas faltar" color="#ef4444" />}
              {result.Imax !== undefined && <ResultCard title="Inventario Máx (Imax)" value={result.Imax.toFixed(2)} desc="Nivel máximo de stock" color="#059669" />}
            </div>
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
