import { useState, useEffect } from 'react';
import { solveDecisionsUncertainty, solveDecisionsRisk } from '../../utils/decisionSolvers';
import { exportDecisionToPDF } from '../../utils/decisionPdfGenerator';
import { generateDecisionExamples } from '../../utils/exampleGenerators';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function DecisionModule() {
  const [selectedMethod, setSelectedMethod] = useState('incertidumbre');
  const [isCost, setIsCost] = useState(false);
  const [matrix, setMatrix] = useState([
    [0, 0],
    [0, 0]
  ]);
  const [probabilities, setProbabilities] = useState([0.5, 0.5]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'results'
  const [statement, setStatement] = useState(null);
  const [showStatement, setShowStatement] = useState(true);

  const [examplesList, setExamplesList] = useState([]);

  useEffect(() => {
    setExamplesList(generateDecisionExamples(selectedMethod));
  }, [selectedMethod]);

  const handleGenerateExamples = () => {
    setExamplesList(generateDecisionExamples(selectedMethod));
  };

  const loadExample = (ex) => {
    setSelectedMethod(ex.method);
    setIsCost(ex.isCost);
    setMatrix(ex.matrix);
    setProbabilities(ex.probabilities);
    setStatement(ex.statement);
    setShowStatement(true);
    setResult(null);
    setError('');
  };

  const numRows = matrix.length;
  const numCols = matrix[0].length;

  const handleAddRow = () => {
    setMatrix([...matrix, new Array(numCols).fill(0)]);
  };

  const handleRemoveRow = (index) => {
    if (numRows <= 1) return;
    const newMatrix = [...matrix];
    newMatrix.splice(index, 1);
    setMatrix(newMatrix);
  };

  const handleAddCol = () => {
    setMatrix(matrix.map(row => [...row, 0]));
    setProbabilities([...probabilities, 0]);
  };

  const handleRemoveCol = (index) => {
    if (numCols <= 1) return;
    setMatrix(matrix.map(row => {
      const newRow = [...row];
      newRow.splice(index, 1);
      return newRow;
    }));
    const newProbs = [...probabilities];
    newProbs.splice(index, 1);
    setProbabilities(newProbs);
  };

  const handleMatrixChange = (r, c, val) => {
    const newMatrix = [...matrix];
    newMatrix[r][c] = Number(val);
    setMatrix(newMatrix);
  };

  const handleProbChange = (c, val) => {
    const newProbs = [...probabilities];
    newProbs[c] = Number(val);
    setProbabilities(newProbs);
  };

  const handleSolve = () => {
    setError('');
    setResult(null);
    try {
      let res;
      if (selectedMethod === 'incertidumbre') {
        res = solveDecisionsUncertainty(matrix, isCost);
      } else {
        res = solveDecisionsRisk(matrix, probabilities, isCost);
      }
      setResult(res);
      setCurrentStep(0);
      setActiveTab('results');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    if (result) {
      const inputs = { matrix, probabilities, isCost, statement };
      await exportDecisionToPDF(selectedMethod, inputs, result);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100%' }}>
      <aside className="sidebar glass-panel" style={{ minWidth: '250px' }}>
        <div className="header-actions" style={{ flexDirection: 'column', gap: '15px' }}>
          <h2 style={{ margin: 0, color: 'var(--primary)' }}>Teoría de Decisiones</h2>
          
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Criterio:</label>
            <select 
              value={selectedMethod} 
              onChange={e => { setSelectedMethod(e.target.value); setResult(null); setError(''); }}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <option value="incertidumbre">Incertidumbre (Maximax, Maximin, Laplace)</option>
              <option value="riesgo">Riesgo (Valor Monetario Esperado - VME)</option>
            </select>
          </div>

          <div style={{ width: '100%', marginTop: '10px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tipo de Matriz:</label>
            <select 
              value={isCost ? 'costos' : 'ganancias'} 
              onChange={e => setIsCost(e.target.value === 'costos')}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <option value="ganancias">Ganancias (Maximizar)</option>
              <option value="costos">Costos (Minimizar)</option>
            </select>
          </div>

          <button className="btn" style={{ background: 'var(--success)', marginTop: '20px', width: '100%' }} onClick={handleSolve}>
            Calcular Decisiones
          </button>

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
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Matriz de Pagos</h2>
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
          <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.2)', borderLeft: '4px solid #ef4444', borderRadius: '4px', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#f87171' }}>Error</h4>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
          {activeTab === 'input' && (
            <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px' }}></th>
                    {matrix[0].map((_, c) => (
                      <th key={c} style={{ padding: '10px', color: 'var(--primary)' }}>
                        Estado {c + 1}
                        {numCols > 1 && <button onClick={() => handleRemoveCol(c)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>}
                      </th>
                    ))}
                    <th style={{ padding: '10px' }}>
                      <button onClick={handleAddCol} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>+ Columna</button>
                    </th>
                  </tr>
                  {selectedMethod === 'riesgo' && (
                    <tr>
                      <th style={{ padding: '10px', color: 'var(--text-muted)', textAlign: 'right' }}>Probabilidad P(E)</th>
                      {probabilities.map((p, c) => (
                        <td key={c} style={{ padding: '5px' }}>
                          <input 
                            type="number" step="0.01" value={p} 
                            onChange={e => handleProbChange(c, e.target.value)} 
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }} 
                          />
                        </td>
                      ))}
                      <td></td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {matrix.map((row, r) => (
                    <tr key={r}>
                      <th style={{ padding: '10px', color: '#94a3b8' }}>
                        Alternativa {r + 1}
                        {numRows > 1 && <button onClick={() => handleRemoveRow(r)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>}
                      </th>
                      {row.map((val, c) => (
                        <td key={c} style={{ padding: '5px' }}>
                          <input 
                            type="number" value={val} 
                            onChange={e => handleMatrixChange(r, c, e.target.value)} 
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }} 
                          />
                        </td>
                      ))}
                      <td></td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '10px' }}>
                      <button onClick={handleAddRow} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>+ Fila</button>
                    </td>
                    <td colSpan={numCols + 1}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {result && activeTab === 'results' && (
            <div id="pdf-export-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
              {selectedMethod === 'incertidumbre' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <ResultCard title="Criterio Optimista (Maximax)" desc={`Mejor alternativa: ${result.optimalMaximax.map(i => `A${i+1}`).join(', ')}`} value={result.bestMaximax} color="#10b981" />
                  <ResultCard title="Criterio Pesimista (Maximin)" desc={`Mejor alternativa: ${result.optimalMaximin.map(i => `A${i+1}`).join(', ')}`} value={result.bestMaximin} color="#f59e0b" />
                  <ResultCard title="Criterio de Laplace" desc={`Mejor alternativa: ${result.optimalLaplace.map(i => `A${i+1}`).join(', ')}`} value={result.bestLaplace.toFixed(2)} color="#3b82f6" />
                </div>
              )}

              {selectedMethod === 'riesgo' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <ResultCard title="Valor Monetario Esperado (VME)" desc={`Decisión óptima: ${result.optimalVME.map(i => `A${i+1}`).join(', ')}`} value={result.bestVME.toFixed(2)} color="#10b981" />
                </div>
              )}
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Tabla de Análisis</h4>
                <div style={{ overflowX: 'auto', maxHeight: '180px', overflowY: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
                      <tr>
                        <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>Alternativa</th>
                        {selectedMethod === 'incertidumbre' && (
                          <>
                            <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>Máximo</th>
                            <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>Mínimo</th>
                            <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>Laplace</th>
                          </>
                        )}
                        {selectedMethod === 'riesgo' && (
                          <th style={{ borderBottom: '1px solid #334155', padding: '6px' }}>VME</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((r, idx) => (
                        <tr key={idx} style={{ background: (selectedMethod === 'incertidumbre' ? (result.optimalMaximax.includes(idx) || result.optimalMaximin.includes(idx) || result.optimalLaplace.includes(idx)) : result.optimalVME.includes(idx)) ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                          <td style={{ borderBottom: '1px solid #1e293b', padding: '6px' }}>A{r.altIndex + 1}</td>
                          {selectedMethod === 'incertidumbre' && (
                            <>
                              <td style={{ borderBottom: '1px solid #1e293b', padding: '6px', color: result.optimalMaximax.includes(idx) ? '#10b981' : 'inherit' }}>{r.maxVal}</td>
                              <td style={{ borderBottom: '1px solid #1e293b', padding: '6px', color: result.optimalMaximin.includes(idx) ? '#f59e0b' : 'inherit' }}>{r.minVal}</td>
                              <td style={{ borderBottom: '1px solid #1e293b', padding: '6px', color: result.optimalLaplace.includes(idx) ? '#3b82f6' : 'inherit' }}>{r.laplace.toFixed(2)}</td>
                            </>
                          )}
                          {selectedMethod === 'riesgo' && (
                            <td style={{ borderBottom: '1px solid #1e293b', padding: '6px', color: result.optimalVME.includes(idx) ? '#10b981' : 'inherit' }}>{r.vme.toFixed(2)}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {result.steps && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
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
