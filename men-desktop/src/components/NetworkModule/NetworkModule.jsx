import { useState, useEffect } from 'react';
import { generateNetworkBatch } from '../../utils/networkGenerator';
import { solveDijkstra, solveKruskal, solveFordFulkerson, solveCpm, solvePert } from '../../utils/networkSolvers';
import { exportNetworkToPDF } from '../../utils/networkPdfGenerator';

export default function NetworkModule({ initialMethod = 'dijkstra', viewMode = 'network' }) {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(initialMethod);
  const [solutionsCache, setSolutionsCache] = useState({});
  const [currentFrames, setCurrentFrames] = useState({});
  const [isTableExpanded, setIsTableExpanded] = useState(true);
  const isCriticalView = viewMode === 'critical';
  const availableMethods = isCriticalView
    ? ['cpm', 'pert']
    : ['dijkstra', 'kruskal', 'ford-fulkerson'];

  useEffect(() => {
    handleGenerateNew();
  }, []);

  useEffect(() => {
    setSelectedMethod(initialMethod);
  }, [initialMethod]);

  useEffect(() => {
    if (!availableMethods.includes(selectedMethod)) {
      setSelectedMethod(availableMethods[0] || initialMethod);
    }
  }, [availableMethods, initialMethod, selectedMethod]);

  const handleGenerateNew = () => {
    const batch = generateNetworkBatch(5);
    setExercises(batch);
    setSelectedExercise(batch[0]);
    setSolutionsCache({});
    setCurrentFrames({});
  };

  const handleSelect = (ex) => {
    setSelectedExercise(ex);
  };

  const handleSolve = () => {
    if (selectedExercise) {
      let res;
      if (selectedMethod === 'dijkstra') res = solveDijkstra(selectedExercise);
      else if (selectedMethod === 'kruskal') res = solveKruskal(selectedExercise);
      else if (selectedMethod === 'ford-fulkerson') res = solveFordFulkerson(selectedExercise);
      else if (selectedMethod === 'cpm') res = solveCpm(selectedExercise);
      else if (selectedMethod === 'pert') res = solvePert(selectedExercise);
      
      const cacheKey = `${selectedExercise.id}-${selectedMethod}`;
      setSolutionsCache(prev => ({ ...prev, [cacheKey]: res }));
      setCurrentFrames(prev => ({ ...prev, [cacheKey]: 0 }));
    }
  };

  const cacheKey = selectedExercise ? `${selectedExercise.id}-${selectedMethod}` : null;
  const currentSolution = cacheKey ? solutionsCache[cacheKey] : null;
  const activeFrame = cacheKey ? (currentFrames[cacheKey] || 0) : 0;

  const updateActiveFrame = (updater) => {
    if (!cacheKey) return;
    setCurrentFrames(prev => {
      const current = prev[cacheKey] || 0;
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [cacheKey]: next };
    });
  };

  const handleExportPDF = () => {
    if (currentSolution && selectedExercise) {
      exportNetworkToPDF(selectedExercise, currentSolution);
    }
  };

  const frameData = currentSolution ? currentSolution.frames[activeFrame] : null;

  // Graph Visualization
  const renderGraph = () => {
    if (!selectedExercise) return null;
    
    const activeGraph = currentSolution?.graph ?? selectedExercise;
    const { nodes, edges } = activeGraph;
    const width = 800;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 280;
    
    // Sort nodes to put Source at left, Sink at right
    const sortedNodes = [...nodes];
    const sourceId = activeGraph.source ?? selectedExercise.source;
    const sinkId = activeGraph.sink ?? selectedExercise.sink;
    const sourceNode = sortedNodes.find(n => n.id === sourceId);
    const sinkNode = sortedNodes.find(n => n.id === sinkId);
    const middleNodes = sortedNodes.filter(n => n.id !== sourceId && n.id !== sinkId);
    
    const nodePositions = {};
    if (sourceNode) nodePositions[sourceNode.id] = { x: 60, y: centerY };
    if (sinkNode) nodePositions[sinkNode.id] = { x: width - 60, y: centerY };
    
    middleNodes.forEach((n, i) => {
      // distribute middle nodes in an ellipse to use horizontal space efficiently
      const angle = -Math.PI / 2 + (Math.PI / (middleNodes.length + 1)) * (i + 1);
      nodePositions[n.id] = {
        x: centerX + (radius * 0.9) * Math.sin(angle),
        y: centerY + (radius * 0.55) * Math.cos(angle) * (i % 2 === 0 ? 1 : -1)
      };
    });

    const isNodeActive = (id) => frameData && frameData.activeNode === id;
    const isNodeVisited = (id) => frameData && frameData.visitedNodes && frameData.visitedNodes.includes(id);
    const isNodeInPath = (id) => frameData && frameData.path && frameData.path.includes(id);
    const isNodeCritical = (id) => frameData && frameData.criticalPath && frameData.criticalPath.includes(id);
    
    const isEdgeActive = (id) => frameData && frameData.activeEdges && frameData.activeEdges.includes(id);
    const isEdgeInMST = (id) => frameData && frameData.mstEdges && frameData.mstEdges.includes(id);
    const isEdgeCritical = (id) => frameData && frameData.criticalEdges && frameData.criticalEdges.includes(id);

    return (
      <svg viewBox="0 0 800 400" style={{ width: '100%', height: '100%', minHeight: '200px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="28" refY="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
          <marker id="arrow-active" markerWidth="10" markerHeight="10" refX="28" refY="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
          </marker>
          <marker id="arrow-blocked" markerWidth="10" markerHeight="10" refX="28" refY="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#000000" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map(e => {
          const p1 = nodePositions[e.from];
          const p2 = nodePositions[e.to];
          if (!p1 || !p2) return null;
          
          const active = isEdgeActive(e.id) || isEdgeInMST(e.id) || isEdgeCritical(e.id);
          let strokeColor = active ? '#f97316' : '#4b5563';
          let strokeWidth = active ? 4 : 2;
          let marker = selectedMethod === 'kruskal' ? null : (active ? 'url(#arrow-active)' : 'url(#arrow)');

          // Label placement
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          let label = '';
          if (selectedMethod === 'dijkstra') label = `C: ${e.cost}`;
          else if (selectedMethod === 'kruskal') label = `C: ${e.cost}`;
          else if (selectedMethod === 'ford-fulkerson') {
            const capDisp = frameData && frameData.availableCap !== undefined ? frameData.availableCap[e.id] : e.capacity;
            label = `Disp: ${capDisp}`;
            if (capDisp === 0) {
              strokeColor = '#000000'; // Bloqueada
              strokeWidth = 3;
              marker = 'url(#arrow-blocked)';
            }
          } else if (selectedMethod === 'cpm' || selectedMethod === 'pert') {
            label = ''; // Ocultar D: en aristas para CPM/PERT para evitar confusión
          }

          if (label === '') {
            return (
              <g key={e.id}>
                <line 
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                  stroke={strokeColor} 
                  strokeWidth={strokeWidth} 
                  markerEnd={marker}
                />
              </g>
            );
          }

          return (
            <g key={e.id}>
              <line 
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                stroke={strokeColor} 
                strokeWidth={strokeWidth} 
                markerEnd={marker}
              />
              <rect x={midX - 20} y={midY - 10} width="40" height="20" fill="#1f2937" rx="4" />
              <text x={midX} y={midY + 4} fill="#e5e7eb" fontSize="12" textAnchor="middle" fontWeight={active ? "bold" : "normal"}>
                {label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const p = nodePositions[n.id];
          if (!p) return null;
          
          const active = isNodeActive(n.id) || isNodeInPath(n.id) || isNodeCritical(n.id);
          const visited = isNodeVisited(n.id);
          let bg = '#374151';
          let border = '#6b7280';
          
          if (active) {
            bg = '#ea580c'; border = '#f97316';
          } else if (visited) {
            bg = '#059669'; border = '#10b981';
          } else if (n.id === (activeGraph.source ?? selectedExercise.source)) {
            bg = '#2563eb'; border = '#3b82f6';
          } else if (n.id === (activeGraph.sink ?? selectedExercise.sink)) {
            bg = '#7c3aed'; border = '#8b5cf6';
          }

          let topLabel = '';
          let topLabelColor = '#93c5fd';
          let bottomLabel = '';
          let bottomLabelColor = '#93c5fd';
          let sideLabel = '';
          
          if (selectedMethod === 'dijkstra' && frameData && frameData.nodeStates) {
            const state = frameData.nodeStates[n.id];
            if (state && state.status !== 'none') {
               const isPerm = state.status === 'permanente';
               topLabel = `[${isPerm ? 'Perm' : 'Temp'}: ${state.value}]`;
               topLabelColor = isPerm ? '#6ee7b7' : '#fcd34d'; // Verde o Amarillo claro
               
               if (!active && n.id !== selectedExercise.source && n.id !== selectedExercise.sink) {
                   if (isPerm) {
                       bg = '#059669'; border = '#10b981'; // Verde para Permanente
                   } else {
                       bg = '#b45309'; border = '#f59e0b'; // Naranja/Ambar para Temporal
                   }
               }
            }
          } else if (selectedMethod === 'kruskal' && frameData && frameData.nodeStates) {
            const state = frameData.nodeStates[n.id];
            if (state) {
               const isC = state.status === 'C';
               topLabel = isC ? '[C]' : "[C']";
               topLabelColor = isC ? '#6ee7b7' : '#9ca3af'; 
               
               if (!active) {
                   if (isC) {
                       bg = '#059669'; border = '#10b981'; // Verde para C
                   } else {
                       bg = '#374151'; border = '#6b7280'; // Gris para C'
                   }
               }
            }
          } else if (selectedMethod === 'dijkstra' && frameData && frameData.distances) {
            const d = frameData.distances[n.id];
            topLabel = `d: ${d === Infinity ? '∞' : d}`;
          } else if ((selectedMethod === 'cpm' || selectedMethod === 'pert') && frameData && frameData.nodeTimings) {
            const state = frameData.nodeTimings[n.id];
            if (state) {
              const ic = state.earliestStart !== null ? state.earliestStart.toFixed(2) : '-';
              const tc = state.earliestFinish !== null ? state.earliestFinish.toFixed(2) : '-';
              const il = state.latestStart !== null ? state.latestStart.toFixed(2) : '-';
              const tl = state.latestFinish !== null ? state.latestFinish.toFixed(2) : '-';
              
              topLabel = `${ic} / ${tc}`;
              topLabelColor = state.earliestStart !== null ? '#6ee7b7' : '#4b5563';
              
              bottomLabel = `${il} / ${tl}`;
              bottomLabelColor = state.latestStart !== null ? '#f87171' : '#4b5563';

              if (state.slack !== null) {
                sideLabel = `H: ${state.slack.toFixed(0)}`;
              }

              if (!active && state.slack !== null && state.slack < 0.0001) {
                bg = '#facc15'; border = '#ca8a04'; // Amarillo para holgura = 0
              } else if (!active && state.critical) {
                bg = '#facc15'; border = '#ca8a04'; 
              }
            }
          }

          return (
            <g key={n.id}>
              { (selectedMethod === 'cpm' || selectedMethod === 'pert') ? (
                <rect x={p.x - 22} y={p.y - 15} width="44" height="30" fill={bg} stroke={border} strokeWidth="3" rx="4" />
              ) : (
                <circle cx={p.x} cy={p.y} r="18" fill={bg} stroke={border} strokeWidth="3" />
              )}
              <text x={p.x} y={p.y + 5} fill={(selectedMethod === 'cpm' || selectedMethod === 'pert') && bg === '#facc15' ? '#000000' : '#ffffff'} fontSize="14" textAnchor="middle" fontWeight="bold">
                {n.id}
              </text>
              {topLabel && (
                <text x={p.x} y={p.y - ((selectedMethod === 'cpm' || selectedMethod === 'pert') ? 22 : 25)} fill={topLabelColor} fontSize="12" textAnchor="middle" fontWeight="bold">
                  {topLabel}
                </text>
              )}
              {((selectedMethod === 'cpm' || selectedMethod === 'pert')) && (
                <text x={p.x} y={p.y + 20} fill="#cbd5e1" fontSize="11" textAnchor="middle">
                  D: {frameData?.nodeDurations?.[n.id] !== undefined ? frameData.nodeDurations[n.id].toFixed(2) : (n.duration !== undefined ? Number(n.duration).toFixed(2) : '0.00')}
                </text>
              )}
              {bottomLabel && (
                <text x={p.x} y={p.y + 30} fill={bottomLabelColor} fontSize="12" textAnchor="middle" fontWeight="bold">
                  {bottomLabel}
                </text>
              )}
              {sideLabel && (
                <text x={p.x + 30} y={p.y + 4} fill="#a78bfa" fontSize="12" textAnchor="start" fontWeight="bold">
                  {sideLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderPertTable = () => {
    if (selectedMethod !== 'pert' || !frameData || !frameData.expectedTimes) return null;
    const times = frameData.expectedTimes;
    if (Object.keys(times).length === 0) return null;
    
    return (
      <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(15, 23, 42, 0.85)', padding: '10px 15px', borderRadius: '8px', border: '1px solid #334155', color: '#e2e8f0', fontSize: '0.85rem', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
          <h4 style={{ margin: '0', color: '#94a3b8' }}>Estimaciones PERT</h4>
          <button 
            onClick={() => setIsTableExpanded(!isTableExpanded)} 
            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.8rem', padding: '0' }}>
            {isTableExpanded ? '[Ocultar]' : '[Mostrar]'}
          </button>
        </div>
        {isTableExpanded && (
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '250px', marginTop: '8px' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 8px', borderBottom: '1px solid #334155', textAlign: 'left' }}>Actividad</th>
              <th style={{ padding: '4px 8px', borderBottom: '1px solid #334155', textAlign: 'center' }}>a</th>
              <th style={{ padding: '4px 8px', borderBottom: '1px solid #334155', textAlign: 'center' }}>m</th>
              <th style={{ padding: '4px 8px', borderBottom: '1px solid #334155', textAlign: 'center' }}>b</th>
              <th style={{ padding: '4px 8px', borderBottom: '1px solid #334155', textAlign: 'center' }}>T</th>
              <th style={{ padding: '4px 8px', borderBottom: '1px solid #334155', textAlign: 'center' }}>σ² (Var)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(times).map(id => {
              if(id === 'Inicio' || id === 'Fin') return null;
              const {a, m, b, t, v} = times[id];
              return (
                <tr key={id}>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #1e293b' }}>{id}</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #1e293b', textAlign: 'center' }}>{a}</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #1e293b', textAlign: 'center' }}>{m}</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #1e293b', textAlign: 'center' }}>{b}</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #1e293b', textAlign: 'center', fontWeight: 'bold', color: '#38bdf8' }}>{t !== undefined ? t.toFixed(2) : '-'}</td>
                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #1e293b', textAlign: 'center', color: '#a78bfa' }}>{v !== undefined ? v.toFixed(3) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    );
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100%' }}>
      <aside className="sidebar glass-panel">
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>{viewMode === 'critical' ? 'Ruta Crítica' : 'Grafos'}</h3>
        
        {/* SECCIÓN 1: Configuración del Modelo */}
        <div style={{ marginBottom: '20px', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <label style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Configuración del Modelo</label>
          <select 
            value={selectedMethod} 
            onChange={e => setSelectedMethod(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '2px solid #3b82f6', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
          >
            {availableMethods.includes('dijkstra') && <option value="dijkstra">Ruta Más Corta (Dijkstra)</option>}
            {availableMethods.includes('kruskal') && <option value="kruskal">Árbol de Expansión Mínima (Kruskal)</option>}
            {availableMethods.includes('ford-fulkerson') && <option value="ford-fulkerson">Flujo Máximo (Ford-Fulkerson)</option>}
            {availableMethods.includes('cpm') && <option value="cpm">Ruta Crítica (CPM)</option>}
            {availableMethods.includes('pert') && <option value="pert">Ruta Crítica (PERT)</option>}
          </select>
        </div>

        <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' }} />

        {/* SECCIÓN 2: Ejemplos */}
        <div style={{ width: '100%', marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>Ejemplos precargados:</label>
            <button 
              onClick={handleGenerateNew}
              style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
              ↻ Generar Nuevos
            </button>
          </div>
          
          <div className="exercise-list">
            {exercises.map((ex) => {
              const isSolved = !!solutionsCache[`${ex.id}-${selectedMethod}`];
              return (
              <div 
                key={ex.id} 
                className={`exercise-card ${selectedExercise?.id === ex.id ? 'active' : ''}`}
                onClick={() => handleSelect(ex)}
                style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="title" style={{ fontSize: '0.85rem' }}>
                  <span>{ex.name}</span>
                  {isSolved && <span style={{fontSize: '0.65rem', marginLeft: '5px', background: 'var(--success)', padding: '2px 4px', borderRadius: '3px', color: 'white'}}>(Resuelto)</span>}
                  <span className="badge balanced" style={{ fontSize: '0.65rem', marginLeft: '5px', background: '#059669', padding: '2px 4px', borderRadius: '3px' }}>EJEMPLO</span>
                </div>
                <div className="details" style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                  Nodos: {ex.nodes.length} | Aristas: {ex.edges.length}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="main-content glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedExercise ? (
          <>
            <div className="header-actions">
              <div>
                <h2 style={{ margin: 0 }}>{selectedExercise.name}</h2>
                {!currentSolution && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                    {selectedMethod === 'dijkstra' && 'Buscando la ruta más corta desde Origen (S) a Destino (T).'}
                    {selectedMethod === 'kruskal' && 'Conectando todos los nodos con el menor costo posible.'}
                    {selectedMethod === 'ford-fulkerson' && 'Calculando el flujo máximo desde Origen (S) a Destino (T).'}
                    {(selectedMethod === 'cpm' || selectedMethod === 'pert') && 'Identificando la ruta crítica y el tiempo total mínimo del proyecto.'}
                  </div>
                )}
              </div>
              {currentSolution ? (
                <button className="btn" style={{ background: '#8b5cf6' }} onClick={handleExportPDF}>
                  📄 Exportar a PDF
                </button>
              ) : (
                <button className="btn" style={{ background: 'var(--success)' }} onClick={handleSolve}>
                  ▶ Resolver por {selectedMethod === 'dijkstra' ? 'Dijkstra' : selectedMethod === 'kruskal' ? 'Kruskal' : selectedMethod === 'ford-fulkerson' ? 'Ford-Fulkerson' : selectedMethod === 'cpm' ? 'CPM' : 'PERT'}
                </button>
              )}
            </div>

            {currentSolution && frameData && (
              <div className="player-controls glass-panel" style={{ padding: '10px 15px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    className="btn" 
                    disabled={activeFrame === 0} 
                    onClick={() => updateActiveFrame(c => c - 1)}
                  >
                    ◀ Paso Anterior
                  </button>
                  <span style={{ fontWeight: '600' }}>Paso {activeFrame} de {currentSolution.frames.length - 1}</span>
                  <button 
                    className="btn" 
                    disabled={activeFrame === currentSolution.frames.length - 1} 
                    onClick={() => updateActiveFrame(c => c + 1)}
                  >
                    Siguiente Paso ▶
                  </button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px', borderLeft: '4px solid var(--primary)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                  {frameData.narrative}
                </div>
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {renderGraph()}
              {renderPertTable()}
            </div>
            
            {/* Legend */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb' }}></div> Origen
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#7c3aed' }}></div> Destino
              </div>
              {selectedMethod === 'kruskal' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669' }}></div> C (Conectados)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#374151', border: '1px solid #6b7280' }}></div> C' (Pendientes)
                  </div>
                </>
              ) : selectedMethod === 'dijkstra' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669' }}></div> Permanente
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#b45309' }}></div> Temporal
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669' }}></div> Visitado / Óptimo
                </div>
              )}
              {selectedMethod === 'ford-fulkerson' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#000000' }}></div> Bloqueado
                </div>
              )}
              {(selectedMethod === 'cpm' || selectedMethod === 'pert') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#facc15' }}></div> Crítica (Holgura=0)
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ea580c' }}></div> Analizando / Óptimo
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Selecciona o genera un grafo
          </div>
        )}
      </main>
    </div>
  );
}
