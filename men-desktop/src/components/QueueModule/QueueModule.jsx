import React, { useState, useEffect } from 'react';
import { solveMM1, solveMM1K, solveMMs } from '../../utils/queueSolvers';
import { exportQueueToPDF } from '../../utils/queuePdfGenerator';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const preloadedExamples = [
  {
    id: 1,
    title: 'Ventanilla de Banco',
    statement: 'A un banco llegan clientes a una tasa promedio de 10 por hora. El único cajero disponible atiende a una tasa promedio de 15 clientes por hora. Ambos tiempos siguen una distribución exponencial. Determine las medidas de desempeño del sistema.',
    method: 'mm1',
    lambda: 10,
    mu: 15,
    k: '',
    s: '',
    timeUnit: 'Horas'
  },
  {
    id: 2,
    title: 'Cajero Automático (Espacio Limitado)',
    statement: 'Un cajero automático atiende a 5 personas por hora, mientras que los clientes llegan a una tasa de 8 por hora. Sin embargo, por regulaciones del centro comercial, solo se permite un máximo de 3 personas en el área (incluyendo al que usa el cajero). Determine la probabilidad de rechazo.',
    method: 'mm1k',
    lambda: 8,
    mu: 5,
    k: 3,
    s: '',
    timeUnit: 'Horas'
  },
  {
    id: 3,
    title: 'Centro de Llamadas',
    statement: 'Un call center recibe un promedio de 20 llamadas por minuto. Hay 4 operadores trabajando, y cada uno puede manejar un promedio de 8 llamadas por minuto. Calcule la utilización de los operadores y el tiempo de espera promedio.',
    method: 'mms',
    lambda: 20,
    mu: 8,
    k: '',
    s: 4,
    timeUnit: 'Minutos'
  },
  {
    id: 4,
    title: 'Taller de Reparación',
    statement: 'Un taller mecánico recibe autos a una tasa de 2 por día. El mecánico principal puede reparar en promedio 3 autos al día. Calcule cuántos autos habrá esperando reparación y el tiempo total que un auto pasa en el taller.',
    method: 'mm1',
    lambda: 2,
    mu: 3,
    k: '',
    s: '',
    timeUnit: 'Días'
  },
  {
    id: 5,
    title: 'Restaurante Rápido',
    statement: 'En un restaurante de comida rápida, los clientes llegan a una tasa de 30 por hora durante el almuerzo. Tienen 3 empleados despachando pedidos, cada uno pudiendo servir a 12 clientes por hora. ¿Cuál es el tamaño de la fila promedio?',
    method: 'mms',
    lambda: 30,
    mu: 12,
    k: '',
    s: 3,
    timeUnit: 'Horas'
  }
];

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

  const loadExample = (ex) => {
    setSelectedMethod(ex.method);
    setLambda(ex.lambda);
    setMu(ex.mu);
    setK(ex.k);
    setS(ex.s);
    setTimeUnit(ex.timeUnit);
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
      const lVal = Number(lambda);
      const mVal = Number(mu);
      const kVal = Number(k);
      const sVal = Number(s);
      let res;
      if (selectedMethod === 'mm1') {
        res = solveMM1(lVal, mVal);
      } else if (selectedMethod === 'mm1k') {
        res = solveMM1K(lVal, mVal, kVal);
      } else if (selectedMethod === 'mms') {
        res = solveMMs(lVal, mVal, sVal);
      }
      setResult({ ...res, timeUnit });
      setCurrentStep(0);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    if (result) {
      const inputs = { lambda: Number(lambda), mu: Number(mu), k: Number(k), s: Number(s), statement };
      await exportQueueToPDF(selectedMethod, inputs, result);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100%', color: '#fff' }}>
      <aside className="sidebar glass-panel" style={{ minWidth: '250px', padding: '20px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: 'var(--primary)' }}>Teoría de Colas</h2>
        <div style={{ width: '100%', marginBottom: '15px' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Modelo:</label>
          <select value={selectedMethod} onChange={e => { setSelectedMethod(e.target.value); setResult(null); }} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}>
            <option value="mm1">M/M/1 (Un Servidor)</option>
            <option value="mm1k">M/M/1/K (Cola Finita)</option>
            <option value="mms">M/M/s (Múltiples Servidores)</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#94a3b8' }}>Unidad de Tiempo:</label>
          <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} style={{ width: '100%', padding: '8px', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }}>
            <option value="Horas">Horas</option>
            <option value="Minutos">Minutos</option>
            <option value="Días">Días</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tasa de Llegada (λ):</label>
          <input type="number" step="0.1" value={lambda} onChange={e => setLambda(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tasa de Servicio (μ):</label>
          <input type="number" step="0.1" value={mu} onChange={e => setMu(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }} />
        </div>
        {selectedMethod === 'mm1k' && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Capacidad (K):</label>
            <input type="number" value={k} onChange={e => setK(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }} />
          </div>
        )}
        {selectedMethod === 'mms' && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Servidores (s):</label>
            <input type="number" value={s} onChange={e => setS(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }} />
          </div>
        )}
        {warning && <div style={{ margin: '15px 0', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}>{warning}</div>}
        <button className="btn" style={{ background: '#10b981', color: '#fff', padding: '10px', marginTop: '10px', width: '100%', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={handleSolve} disabled={!!warning}>Calcular</button>

        <div style={{ width: '100%', marginTop: '20px' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px', display: 'block' }}>Ejemplos precargados:</label>
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
      </aside>
      <main className="main-content" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Resultados</h2>
          {result && <button className="btn" style={{ background: '#8b5cf6', padding: '8px 15px', color: '#fff', border: 'none', borderRadius: '4px' }} onClick={handleExport}>📄 Exportar</button>}
        </div>
        {error && <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '4px' }}>{error}</div>}

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

        {result && (
          <div id="pdf-export-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <ResultCard title="Utilización (ρ)" value={`${(result.rho * 100).toFixed(2)} %`} desc="Porcentaje de ocupado" color="#3b82f6" />
              <ResultCard title="Prob. Vacío (P₀)" value={`${(result.p0 * 100).toFixed(2)} %`} desc="Probabilidad cero clientes" color="#10b981" />
              
              {result.pk !== undefined && (
                <ResultCard title="Prob. Lleno (Pₖ)" value={`${(result.pk * 100).toFixed(2)} %`} desc="Probabilidad rechazo" color="#ef4444" />
              )}
              
              <ResultCard title="L" value={result.l.toFixed(3)} desc="Clientes en sistema" color="#f59e0b" />
              <ResultCard title="Lq" value={result.lq.toFixed(3)} desc="Clientes en cola" color="#f59e0b" />
              <ResultCard title="W" value={`${result.w.toFixed(3)} ${result.timeUnit}`} desc="Tiempo en sistema" color="#8b5cf6" />
              <ResultCard title="Wq" value={`${result.wq.toFixed(3)} ${result.timeUnit}`} desc="Tiempo en cola" color="#8b5cf6" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
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
              {result.pnData && (
                <div style={{ background: '#1e293b', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Probabilidad (Pn) vs Clientes (n)</h4>
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
