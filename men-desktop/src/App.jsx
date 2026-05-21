import { useState, useEffect } from 'react';
import { generateBatch } from './utils/matrixGenerator';
import { solveNorthwestCorner } from './utils/solver';
import { exportToPDF } from './utils/pdfGenerator';
import './index.css';

function App() {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [solutionsCache, setSolutionsCache] = useState({});
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const batch = generateBatch(5);
    setExercises(batch);
    if (batch.length > 0) {
      setSelectedExercise(batch[0]);
    }
  }, []);

  const handleGenerateNew = () => {
    const batch = generateBatch(5);
    setExercises(batch);
    setSelectedExercise(batch[0]);
    setSolutionsCache({});
    setCurrentFrame(0);
  };

  const handleSelect = (ex) => {
    setSelectedExercise(ex);
    setCurrentFrame(0);
  };

  const handleSolve = () => {
    if (selectedExercise) {
      const res = solveNorthwestCorner(selectedExercise);
      setSolutionsCache(prev => ({ ...prev, [selectedExercise.id]: res }));
      setCurrentFrame(0);
    }
  };

  const currentSolution = selectedExercise ? solutionsCache[selectedExercise.id] : null;

  const handleExportPDF = () => {
    if (currentSolution && selectedExercise) {
      exportToPDF(selectedExercise, currentSolution);
    }
  };

  const frameData = currentSolution ? currentSolution.frames[currentFrame] : null;

  return (
    <div className="app-container">
      <aside className="sidebar glass-panel">
        <div className="header-actions">
          <h1>Ejercicios</h1>
          <button className="btn" onClick={handleGenerateNew}>↻ Generar</button>
        </div>
        
        <div className="exercise-list">
          {exercises.map((ex) => {
            const isSolved = !!solutionsCache[ex.id];
            return (
            <div 
              key={ex.id} 
              className={`exercise-card ${selectedExercise?.id === ex.id ? 'active' : ''}`}
              onClick={() => handleSelect(ex)}
            >
              <div className="title">
                <span>{ex.name} {isSolved && <span style={{fontSize: '0.75rem', color: 'var(--success)'}}>(Resuelto)</span>}</span>
                <span className={`badge ${ex.isBalanced ? 'balanced' : 'unbalanced'}`}>
                  {ex.isBalanced ? 'Equilibrado' : 'Desequilibrado'}
                </span>
              </div>
              <div className="details">
                Matriz: {ex.rows}x{ex.cols} | Oferta: {ex.totalSupply} | Demanda: {ex.totalDemand}
              </div>
            </div>
            );
          })}
        </div>
      </aside>

      <main className="main-content glass-panel">
        {selectedExercise ? (
          <>
            <div className="header-actions">
              <div>
                <h2>{selectedExercise.name}</h2>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <span className={`badge ${selectedExercise.isBalanced ? 'balanced' : 'unbalanced'}`}>
                    Estado: {selectedExercise.isBalanced ? 'Equilibrado' : 'Desequilibrado'}
                  </span>
                  {!selectedExercise.isBalanced && (
                    <span className="badge" style={{background: 'rgba(255,255,255,0.1)', color: '#fff'}}>
                      Requiere Balanceo (Diferencia: {Math.abs(selectedExercise.totalSupply - selectedExercise.totalDemand)})
                    </span>
                  )}
                </div>
              </div>
              {currentSolution ? (
                <button className="btn" style={{ background: '#8b5cf6' }} onClick={handleExportPDF}>
                  📄 Exportar a PDF
                </button>
              ) : (
                <button className="btn" style={{ background: 'var(--success)' }} onClick={handleSolve}>
                  ▶ Resolver Ejercicio
                </button>
              )}
            </div>

            {currentSolution && frameData && (
              <div className="player-controls glass-panel" style={{ padding: '15px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    className="btn" 
                    disabled={currentFrame === 0} 
                    onClick={() => setCurrentFrame(c => c - 1)}
                  >
                    ◀ Paso Anterior
                  </button>
                  <span style={{ fontWeight: '600' }}>Paso {currentFrame} de {currentSolution.frames.length - 1}</span>
                  <button 
                    className="btn" 
                    disabled={currentFrame === currentSolution.frames.length - 1} 
                    onClick={() => setCurrentFrame(c => c + 1)}
                  >
                    Siguiente Paso ▶
                  </button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--primary)', fontSize: '1.05rem', lineHeight: '1.5' }}>
                  {frameData.narrative}
                </div>
                {currentFrame === currentSolution.frames.length - 1 && (
                  <div style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '10px' }}>
                    ¡Solución Completada! Costo Total de Transporte: ${currentSolution.totalCost}
                  </div>
                )}
              </div>
            )}

            <div className="matrix-container">
              <table>
                <thead>
                  <tr>
                    <th>Origen \ Destino</th>
                    {(currentSolution ? frameData.namesCols : Array.from({ length: selectedExercise.cols }, (_, i) => `D${i+1}`)).map((colName, i) => (
                      <th key={i} style={currentSolution && frameData.crossedCols.includes(i) ? { textDecoration: 'line-through', opacity: 0.4 } : {}}>
                        {colName}
                      </th>
                    ))}
                    <th>Oferta</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentSolution ? frameData.balancedCosts : selectedExercise.costs).map((row, i) => {
                    const rowName = currentSolution ? frameData.namesRows[i] : `O${i+1}`;
                    const isRowCrossed = currentSolution && frameData.crossedRows.includes(i);
                    const supplyVal = currentSolution ? frameData.balancedSupply[i] : selectedExercise.supply[i];
                    return (
                      <tr key={i}>
                        <th style={isRowCrossed ? { textDecoration: 'line-through', opacity: 0.4 } : {}}>{rowName}</th>
                        {row.map((cost, j) => {
                          const isColCrossed = currentSolution && frameData.crossedCols.includes(j);
                          const allocation = currentSolution ? frameData.allocations[i][j] : null;
                          const isCrossed = isRowCrossed || isColCrossed;
                          
                          let cellStyle = {};
                          if (allocation !== null) {
                            cellStyle = { background: 'rgba(16, 185, 129, 0.4)', borderColor: 'var(--success)', opacity: 1, boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' };
                          } else if (isCrossed) {
                            cellStyle = { opacity: 0.2 };
                          }

                          return (
                            <td key={j}>
                              <div className="cost-cell" style={cellStyle}>
                                <span className="cost-label" style={allocation !== null ? { color: '#fff' } : {}}>c:{cost}</span>
                                {allocation !== null ? (
                                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{allocation}</span>
                                ) : (
                                  <span style={{ opacity: 0.3 }}>-</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="supply-cell" style={supplyVal === 0 ? { color: 'var(--text-muted)' } : {}}>{supplyVal}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <th>Demanda</th>
                    {(currentSolution ? frameData.balancedDemand : selectedExercise.demand).map((d, j) => (
                      <td key={j} className="demand-cell" style={d === 0 ? { color: 'var(--text-muted)' } : {}}>{d}</td>
                    ))}
                    <td style={{ background: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {currentSolution ? frameData.balancedSupply.reduce((a,b)=>a+b,0) : `${selectedExercise.totalSupply} / ${selectedExercise.totalDemand}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Selecciona o genera un ejercicio
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
