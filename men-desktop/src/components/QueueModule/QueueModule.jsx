import React, { useState, useEffect } from 'react';
import { solveMM1, solveMM1K, solveMMs, solveBirthDeath, solveMarkovChain } from '../../utils/queueSolvers';
import { exportQueueToPDF } from '../../utils/queuePdfGenerator';
import { generateQueueExamples } from '../../utils/exampleGenerators';
import MarkovGraph from './MarkovGraph';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function QueueModule() {
  const [selectedMethod, setSelectedMethod] = useState('mm1');
  const [lambda, setLambda] = useState(10);
  const [mu, setMu] = useState(15);
  const [k, setK] = useState(5);
  const [s, setS] = useState(2);
  const [timeUnit, setTimeUnit] = useState('Horas');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [statement, setStatement] = useState(null);
  const [showStatement, setShowStatement] = useState(true);

  const [examplesList, setExamplesList] = useState([]);

  // Birth and Death states
  const [bdN, setBdN] = useState(5);
  const [bdLambdas, setBdLambdas] = useState(Array(5).fill(10));
  const [bdMus, setBdMus] = useState(Array(6).fill(15)); // mus[0] is unused usually, but we keep length bdN+1 so index matches

  // Markov Chains states
  const [markovN, setMarkovN] = useState(3);
  const [markovMatrix, setMarkovMatrix] = useState([[0.5, 0.5, 0], [0.2, 0.6, 0.2], [0, 0.5, 0.5]]);
  const [markovInitial, setMarkovInitial] = useState([1, 0, 0]);
  const [markovSteps, setMarkovSteps] = useState(5);

  useEffect(() => {
    setExamplesList(generateQueueExamples(selectedMethod));
  }, [selectedMethod]);

  const handleGenerateExamples = () => {
    setExamplesList(generateQueueExamples(selectedMethod));
  };

  const loadExample = (ex) => {
    setSelectedMethod(ex.method);
    setLambda(ex.lambda || 10);
    setMu(ex.mu || 15);
    setK(ex.k || 5);
    setS(ex.s || 2);
    setTimeUnit(ex.timeUnit || 'Horas');
    
    if (ex.method === 'birth-death') {
      setBdN(ex.bdN || 5);
      setBdLambdas(ex.bdLambdas || Array(5).fill(10));
      setBdMus(ex.bdMus || Array(6).fill(15));
    } else if (ex.method === 'markov') {
      setMarkovN(ex.markovN || 3);
      setMarkovMatrix(ex.markovMatrix || [[0.5, 0.5, 0], [0.2, 0.6, 0.2], [0, 0.5, 0.5]]);
      setMarkovInitial(ex.markovInitial || [1, 0, 0]);
      setMarkovSteps(ex.markovSteps || 5);
    }
    
    setStatement(ex.statement);
    setShowStatement(true);
    setResult(null);
    setError('');
  };

  useEffect(() => {
    setWarning('');
    if (!lambda || !mu) return;
    const lVal = parseFloat(lambda);
    const mVal = parseFloat(mu);
    if (selectedMethod === 'mm1' && lVal >= mVal) {
      setWarning('Advertencia: El sistema es inestable (λ ≥ μ). La cola crecerá infinitamente.');
    } else if (selectedMethod === 'mms' && s) {
      const sVal = parseFloat(s);
      if (lVal >= sVal * mVal) {
        setWarning('Advertencia: El sistema es inestable (λ ≥ s * μ). Los servidores no se darán abasto.');
      }
    }
  }, [lambda, mu, s, selectedMethod]);

  const handleSolve = () => {
    setError('');
    setResult(null);
    try {
      let res;
      if (selectedMethod === 'birth-death') {
        res = solveBirthDeath(bdLambdas, bdMus, bdN);
      } else if (selectedMethod === 'markov') {
        res = solveMarkovChain(markovMatrix, markovInitial, Number(markovSteps));
      } else {
        const lVal = Number(lambda);
        const mVal = Number(mu);
        const kVal = Number(k);
        const sVal = Number(s);
        if (selectedMethod === 'mm1') {
          res = solveMM1(lVal, mVal);
        } else if (selectedMethod === 'mm1k') {
          res = solveMM1K(lVal, mVal, kVal);
        } else if (selectedMethod === 'mms') {
          res = solveMMs(lVal, mVal, sVal);
        }
      }
      setResult({ ...res, timeUnit, selectedMethod });
      setCurrentStep(0);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    if (result) {
      const inputs = { lambda: Number(lambda), mu: Number(mu), k: Number(k), s: Number(s), statement, bdN, bdLambdas, bdMus, markovN, markovMatrix, markovInitial, markovSteps };
      await exportQueueToPDF(selectedMethod, inputs, result);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100%', color: '#fff' }}>
      <aside className="sidebar glass-panel">
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Teoría de Colas</h3>
        
        <div style={{ marginBottom: '20px', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <label style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Configuración del Modelo</label>
          <select value={selectedMethod} onChange={(e) => { setSelectedMethod(e.target.value); setResult(null); }} style={{ width: '100%', padding: '12px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '2px solid #3b82f6', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
            <option value="mm1">M/M/1 (Un Servidor)</option>
            <option value="mm1k">M/M/1/K (Cola Finita)</option>
            <option value="mms">M/M/s (Múltiples Servidores)</option>
            <option value="birth-death">Nacimiento y Muerte</option>
            <option value="markov">Cadenas de Markov</option>
          </select>
        </div>

        <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' }} />

        <div style={{ width: '100%', marginTop: '15px' }}>
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
                style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #334155' }}
              >
                <div className="title" style={{ fontSize: '0.85rem' }}>
                  <span>{ex.id}. {ex.title}</span>
                  <span className="badge balanced" style={{ fontSize: '0.65rem', marginLeft: '5px', background: '#059669', padding: '2px 4px', borderRadius: '3px' }}>EJEMPLO</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <main className="main-content" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <h2 style={{ margin: 0 }}>Resultados {selectedMethod === 'markov' ? 'y Datos' : ''}</h2>
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
                disabled={!!warning}
              >
                ▶ Calcular Resultados
              </button>
            </div>
          )}
        </div>
        {error && <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}
        {warning && <div style={{ margin: '15px 0', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '10px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '20px' }}>{warning}</div>}

        {statement && (
          <div style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
            <div 
              style={{ padding: '10px 15px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowStatement(!showStatement)}
            >
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#3b82f6' }}>Contexto del Problema</h3>
              <span style={{ fontSize: '0.8rem' }}>{showStatement ? '▼ Ocultar' : '▶ Mostrar'}</span>
            </div>
            {showStatement && (
              <div style={{ padding: '15px', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                {statement}
              </div>
            )}
          </div>
        )}

        {!result && (
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.7)', flexShrink: 0 }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#f8fafc', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Parámetros de Entrada</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Unidad de Tiempo:</label>
                <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }}>
                  <option value="Horas">Horas</option>
                  <option value="Minutos">Minutos</option>
                  <option value="Días">Días</option>
                </select>
              </div>

              {(selectedMethod === 'mm1' || selectedMethod === 'mm1k' || selectedMethod === 'mms') && (
                <>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Tasa de Llegada (λ):</label>
                    <input type="number" step="0.1" value={lambda} onChange={e => setLambda(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Tasa de Servicio (μ):</label>
                    <input type="number" step="0.1" value={mu} onChange={e => setMu(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                  </div>
                  {selectedMethod === 'mm1k' && (
                    <div>
                      <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Capacidad (K):</label>
                      <input type="number" value={k} onChange={e => setK(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                    </div>
                  )}
                  {selectedMethod === 'mms' && (
                    <div>
                      <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Servidores (s):</label>
                      <input type="number" value={s} onChange={e => setS(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                    </div>
                  )}
                </>
              )}

              {selectedMethod === 'markov' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Estados (N):</label>
                    <input type="number" min="2" max="10" value={markovN} onChange={e => {
                      const val = Number(e.target.value);
                      setMarkovN(val);
                      setMarkovMatrix(Array.from({length: val}, () => Array(val).fill(1/val)));
                      setMarkovInitial(Array(val).fill(1/val));
                    }} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Iteraciones (n):</label>
                    <input type="number" min="1" value={markovSteps} onChange={e => setMarkovSteps(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                  </div>
                </>
              )}
            </div>

            {selectedMethod === 'birth-death' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>Capacidad N:</label>
                  <input type="number" min="1" max="20" value={bdN} onChange={e => {
                    const val = Number(e.target.value);
                    setBdN(val);
                    setBdLambdas(Array(val).fill(10));
                    setBdMus(Array(val+1).fill(15));
                  }} style={{ width: '200px', display: 'block', padding: '10px', marginTop: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155', fontSize: '1rem' }} />
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {Array.from({length: bdN + 1}).map((_, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                        {i < bdN && (
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'bold' }}>λ_{i}:</label>
                            <input type="number" step="0.1" value={bdLambdas[i]} onChange={e => {
                              const newL = [...bdLambdas];
                              newL[i] = Number(e.target.value);
                              setBdLambdas(newL);
                            }} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
                          </div>
                        )}
                        {i > 0 && (
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'bold' }}>μ_{i}:</label>
                            <input type="number" step="0.1" value={bdMus[i]} onChange={e => {
                              const newM = [...bdMus];
                              newM[i] = Number(e.target.value);
                              setBdMus(newM);
                            }} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'markov' && (
              <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#94a3b8' }}>Matriz de Transición P y Estado Inicial π(0)</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', borderBottom: '1px solid #334155', color: '#94a3b8' }}></th>
                    {Array.from({length: markovN}).map((_, c) => (
                      <th key={c} style={{ padding: '8px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>E{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length: markovN}).map((_, r) => (
                    <tr key={r}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #334155', fontWeight: 'bold', color: '#94a3b8' }}>E{r}</td>
                      {Array.from({length: markovN}).map((_, c) => (
                        <td key={c} style={{ padding: '8px', borderBottom: '1px solid #334155' }}>
                          <input type="number" step="0.01" value={markovMatrix[r] ? markovMatrix[r][c] : 0} onChange={e => {
                            const newM = [...markovMatrix];
                            if(!newM[r]) newM[r] = Array(markovN).fill(0);
                            newM[r][c] = Number(e.target.value);
                            setMarkovMatrix(newM);
                          }} style={{ width: '60px', padding: '5px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '8px', paddingTop: '15px', fontWeight: 'bold', color: '#3b82f6' }}>π(0)</td>
                    {Array.from({length: markovN}).map((_, c) => (
                      <td key={c} style={{ padding: '8px', paddingTop: '15px' }}>
                        <input type="number" step="0.01" value={markovInitial[c] || 0} onChange={e => {
                          const newI = [...markovInitial];
                          newI[c] = Number(e.target.value);
                          setMarkovInitial(newI);
                        }} style={{ width: '60px', padding: '5px', background: 'rgba(59,130,246,0.1)', color: '#fff', border: '1px solid #3b82f6', borderRadius: '4px' }} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
          </div>
        )}




        {result && (
          <div id="pdf-export-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
            {result.selectedMethod !== 'markov' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {result.rho !== undefined && (
                  <ResultCard title="Utilización (ρ)" value={`${(result.rho * 100).toFixed(2)} %`} desc="Porcentaje de ocupado" color="#3b82f6" />
                )}
                {result.p0 !== undefined && (
                  <ResultCard title="Prob. Vacío (P₀)" value={`${(result.p0 * 100).toFixed(2)} %`} desc="Probabilidad cero clientes" color="#10b981" />
                )}
                {result.pk !== undefined && (
                  <ResultCard title="Prob. Lleno (Pₖ)" value={`${(result.pk * 100).toFixed(2)} %`} desc="Probabilidad rechazo" color="#ef4444" />
                )}
                {result.l !== undefined && (
                  <ResultCard title="L" value={result.l.toFixed(3)} desc="Clientes en sistema" color="#f59e0b" />
                )}
                {result.lq !== undefined && (
                  <ResultCard title="Lq" value={result.lq.toFixed(3)} desc="Clientes en cola" color="#f59e0b" />
                )}
                {result.w !== undefined && (
                  <ResultCard title="W" value={`${result.w.toFixed(3)} ${result.timeUnit}`} desc="Tiempo en sistema" color="#8b5cf6" />
                )}
                {result.wq !== undefined && (
                  <ResultCard title="Wq" value={`${result.wq.toFixed(3)} ${result.timeUnit}`} desc="Tiempo en cola" color="#8b5cf6" />
                )}
                {result.lambdaEfec !== undefined && (
                  <ResultCard title="λ efec" value={result.lambdaEfec.toFixed(3)} desc="Tasa de entrada real" color="#14b8a6" />
                )}
              </div>
            )}
            {result.selectedMethod === 'markov' && (
              <>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, background: '#1e293b', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Estado en Paso n ({markovSteps})</h4>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <tbody>
                        {result.stateAtN.map((val, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '5px', borderBottom: '1px solid #334155' }}>E{idx}</td>
                            <td style={{ padding: '5px', borderBottom: '1px solid #334155', color: '#3b82f6' }}>{val.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1, background: '#1e293b', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Estado Estable (π)</h4>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <tbody>
                        {result.steadyState.map((val, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '5px', borderBottom: '1px solid #334155' }}>π_{idx}</td>
                            <td style={{ padding: '5px', borderBottom: '1px solid #10b981' }}>{val.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <MarkovGraph matrix={markovMatrix} />
              </>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: result.rho !== undefined ? '1fr 2fr' : '1fr', gap: '15px' }}>
              {result.rho !== undefined && (
                <div style={{ background: '#1e293b', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Utilización</h4>
                  <div style={{ height: '120px', width: '100%', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={[{value: result.rho}, {value: 1-result.rho}]} startAngle={180} endAngle={0} innerRadius={50} outerRadius={70} dataKey="value"><Cell fill={result.rho > 0.8 ? '#ef4444' : '#10b981'} /><Cell fill="#334155" /></Pie></PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: result.rho > 0.8 ? '#ef4444' : '#10b981' }}>
                      {(result.rho * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
              {result.pnData && (
                <div style={{ background: '#1e293b', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Probabilidad por Estado</h4>
                  <div style={{ height: '140px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.pnData}><XAxis dataKey="n" stroke="#94a3b8" /><Tooltip /><Bar dataKey="Probabilidad" fill="#3b82f6" /></BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
            <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px' }}>
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#f8fafc' }}>Resolución Paso a Paso</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', opacity: currentStep === 0 ? 0.5 : 1 }}
                  >
                    ◀ Anterior
                  </button>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    {currentStep + 1} / {result.steps.length}
                  </span>
                  <button 
                    onClick={() => setCurrentStep(Math.min(result.steps.length - 1, currentStep + 1))}
                    disabled={currentStep === result.steps.length - 1}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: currentStep === result.steps.length - 1 ? 'not-allowed' : 'pointer', opacity: currentStep === result.steps.length - 1 ? 0.5 : 1 }}
                  >
                    Siguiente ▶
                  </button>
                </div>
              </div>
              
              <div className="no-print" style={{ padding: '15px', background: '#0f172a', borderRadius: '4px', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>{result.steps[currentStep].title}</h4>
                <div style={{ overflowX: 'auto', margin: '15px 0' }}>
                  <BlockMath math={result.steps[currentStep].math} />
                </div>
                <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', color: '#cbd5e1', fontSize: '0.9rem' }}>
                  {result.steps[currentStep].desc}
                </div>
              </div>

              {/* Vista para el PDF con todos los pasos desenrollados */}
              <div className="print-only" style={{ display: 'none' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc' }}>Resolución Paso a Paso Completa</h3>
                {result.steps.map((step, idx) => (
                  <div key={idx} style={{ padding: '15px', background: '#0f172a', borderRadius: '4px', border: '1px solid #334155', marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>{step.title}</h4>
                    <div style={{ overflowX: 'auto', margin: '15px 0' }}>
                      <BlockMath math={step.math} />
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', color: '#cbd5e1', fontSize: '0.9rem' }}>
                      {step.desc}
                    </div>
                  </div>
                ))}
              </div>

              {currentStep === result.steps.length - 1 && (
                <div style={{ marginTop: '15px', padding: '15px', borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#10b981' }}>Conclusión Final</h4>
                  {result.conclusion}
                </div>
              )}
            </div>
          </div>
        )}
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
