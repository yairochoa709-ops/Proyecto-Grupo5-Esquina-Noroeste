import { useState, useEffect, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Handle, 
  Position 
} from '@xyflow/react';
import { solveDijkstra } from '../utils/solver';
import { preloadedExercises, generateRandomDijkstraExercise } from '../utils/dijkstraExercises';
import { exportDijkstraToPDF } from '../utils/pdfGenerator';
import { DijkstraExercise, DijkstraSolution } from '../types';
import { 
  RefreshCw, Play, FileDown, ChevronLeft, ChevronRight, 
  Map, Milestone, Compass, Table, CheckCircle2, 
  ArrowRight, ListOrdered
} from 'lucide-react';

// Componente de Nodo Personalizado para React Flow
const DijkstraCustomNode = ({ data }: any) => {
  let borderClass = "border-white/10";
  let bgClass = "bg-slate-900/90";
  let textClass = "text-slate-400 font-medium";
  let statusText = "";

  if (data.isCurrent) {
    borderClass = "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]";
    bgClass = "bg-orange-500/10";
    textClass = "text-orange-400 font-bold";
    statusText = "Actual";
  } else if (data.isVisited) {
    borderClass = "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
    bgClass = "bg-emerald-950/40";
    textClass = "text-emerald-400 font-semibold";
    statusText = "Vis.";
  } else if (data.distance !== Infinity) {
    borderClass = "border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)]";
    bgClass = "bg-blue-950/30";
    textClass = "text-blue-400 font-semibold";
    statusText = "Cola";
  }

  const distText = data.distance === Infinity ? "∞" : data.distance;

  return (
    <div className={`px-4 py-2.5 rounded-xl border ${borderClass} ${bgClass} text-center min-w-[100px] select-none transition-all duration-300`}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="font-bold text-xs text-slate-100">{data.label}</div>
      <div className="flex justify-between items-center gap-3 mt-1.5 pt-1.5 border-t border-white/5">
        <span className={`text-[10px] ${textClass}`}>
          d: {distText}
        </span>
        {statusText && (
          <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-white/5 ${textClass}`}>
            {statusText}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

export default function DijkstraView() {
  const [exercises, setExercises] = useState<DijkstraExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<DijkstraExercise | null>(null);
  const [solutionsCache, setSolutionsCache] = useState<Record<string | number, DijkstraSolution>>({});
  const [currentFrames, setCurrentFrames] = useState<Record<string | number, number>>({});
  
  // Customizaciones de nodos origen/destino
  const [customSource, setCustomSource] = useState("");
  const [customTarget, setCustomTarget] = useState("");

  // Cargar ejercicios iniciales
  useEffect(() => {
    setExercises([...preloadedExercises]);
    if (preloadedExercises.length > 0) {
      setSelectedExercise(preloadedExercises[0]);
      setCustomSource(preloadedExercises[0].sourceNodeId);
      setCustomTarget(preloadedExercises[0].targetNodeId || "");
    }
  }, []);

  const handleGenerateRandom = () => {
    const nextId = exercises.length + 1;
    const newEx = generateRandomDijkstraExercise(nextId);
    setExercises(prev => [...prev, newEx]);
    setSelectedExercise(newEx);
    setCustomSource(newEx.sourceNodeId);
    setCustomTarget(newEx.targetNodeId || "");
  };

  const handleSelectExercise = (ex: DijkstraExercise) => {
    setSelectedExercise(ex);
    setCustomSource(ex.sourceNodeId);
    setCustomTarget(ex.targetNodeId || "");
  };

  const handleSolve = () => {
    if (selectedExercise) {
      // Aplicar source/target personalizado si se cambió
      const activeExercise = {
        ...selectedExercise,
        sourceNodeId: customSource || selectedExercise.sourceNodeId,
        targetNodeId: customTarget || selectedExercise.targetNodeId
      };
      
      const res = solveDijkstra(activeExercise);
      setSolutionsCache(prev => ({ ...prev, [selectedExercise.id]: res }));
      setCurrentFrames(prev => ({ ...prev, [selectedExercise.id]: 0 }));
    }
  };

  const currentSolution = selectedExercise ? solutionsCache[selectedExercise.id] : null;
  const activeFrame = selectedExercise ? (currentFrames[selectedExercise.id] || 0) : 0;
  const frameData = currentSolution ? currentSolution.frames[activeFrame] : null;

  const isComplete = currentSolution && frameData
    ? activeFrame === currentSolution.frames.length - 1
    : false;

  const updateActiveFrame = (updater: number | ((curr: number) => number)) => {
    if (!selectedExercise) return;
    setCurrentFrames(prev => {
      const current = prev[selectedExercise.id] || 0;
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [selectedExercise.id]: next };
    });
  };

  // Registrar los componentes de nodos personalizados en React Flow
  const nodeTypes = useMemo(() => ({
    customNode: DijkstraCustomNode,
  }), []);

  // Mapeo de Nodos a React Flow
  const rfNodes = useMemo(() => {
    if (!selectedExercise) return [];
    
    // Si hay una solución corriendo, mapear las distancias del frame actual
    const distances = frameData ? frameData.distances : null;
    const visited = frameData ? frameData.visited : [];
    const currentId = frameData ? frameData.currentNodeId : null;

    return selectedExercise.graph.nodes.map(node => {
      const isSrc = node.id === customSource;
      const isTgt = node.id === customTarget;
      
      let distance = isSrc ? 0 : Infinity;
      if (distances && distances[node.id] !== undefined) {
        distance = distances[node.id];
      }

      return {
        id: node.id,
        type: 'customNode',
        position: { x: node.x || 0, y: node.y || 0 },
        data: {
          label: node.id,
          distance,
          isCurrent: currentId === node.id,
          isVisited: visited.includes(node.id),
          isSource: isSrc,
          isSink: isTgt,
        },
      };
    });
  }, [selectedExercise, frameData, customSource, customTarget]);

  // Mapeo de Aristas a React Flow
  const rfEdges = useMemo(() => {
    if (!selectedExercise) return [];
    
    const activeEdgeId = frameData ? frameData.activeEdgeId : null;
    const confirmedEdges = frameData ? frameData.shortestPathEdges : [];
    const finalPathEdges = isComplete && currentSolution ? currentSolution.shortestPathEdgeIds : [];

    return selectedExercise.graph.edges.map(edge => {
      const isActive = activeEdgeId === edge.id;
      const isConfirmed = confirmedEdges.includes(edge.id);
      const isFinalPath = finalPathEdges.includes(edge.id);

      let stroke = "rgba(255, 255, 255, 0.15)";
      let strokeWidth = 1.5;
      let animated = false;

      if (isFinalPath) {
        stroke = "#10b981"; // Verde Esmeralda para ruta definitiva
        strokeWidth = 4.5;
        animated = true;
      } else if (isActive) {
        stroke = "#f97316"; // Naranja para relajación actual
        strokeWidth = 3;
        animated = true;
      } else if (isConfirmed) {
        stroke = "#3b82f6"; // Azul para arbol óptimo confirmado
        strokeWidth = 2.5;
      } else if (isComplete) {
        stroke = "rgba(255, 255, 255, 0.05)"; // Opacar aristas que no son de la ruta óptima
        strokeWidth = 1;
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: `${edge.weight}`,
        animated,
        type: 'simple',
        style: { stroke, strokeWidth },
        labelStyle: { 
          fill: isActive ? '#f97316' : isFinalPath ? '#10b981' : '#94a3b8', 
          fontWeight: 'bold', 
          fontSize: 11 
        },
        labelBgStyle: { fill: '#050811', fillOpacity: 0.85, rx: 4 },
      };
    });
  }, [selectedExercise, frameData, isComplete, currentSolution]);

  // Sincronizar selectores si cambia el ejercicio
  const handleSourceChange = (val: string) => {
    setCustomSource(val);
    setSolutionsCache({});
  };

  const handleTargetChange = (val: string) => {
    setCustomTarget(val);
    setSolutionsCache({});
  };

  return (
    <div className="w-full h-full flex gap-5 overflow-hidden">
      {/* Sidebar de Redes */}
      <aside className="w-80 flex flex-col gap-4 p-5 glass-panel rounded-xl shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold text-slate-100 m-0 flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-400" /> Redes
            </h2>
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs transition-colors cursor-pointer font-semibold" 
              onClick={handleGenerateRandom}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Nueva Red
            </button>
          </div>
        </div>

        {/* Lista de Ejercicios */}
        <div className="flex flex-col gap-2">
          {exercises.map((ex) => {
            const isSolved = !!solutionsCache[ex.id];
            const isActive = selectedExercise?.id === ex.id;
            return (
              <div 
                key={ex.id} 
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-600/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-white/3 border-white/5 hover:bg-white/8'
                }`}
                onClick={() => handleSelectExercise(ex)}
              >
                <div className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>{ex.name}</span>
                  {isSolved && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Resuelto</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Nodos: {ex.graph.nodes.length} | Conexiones: {ex.graph.edges.length}
                </div>
              </div>
            );
          })}
        </div>

        {/* Configurador de Nodos Origen y Destino */}
        {selectedExercise && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">Parámetros de Ruta</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Nodo Origen (Source)</label>
              <select 
                value={customSource} 
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {selectedExercise.graph.nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label || n.id}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Nodo Destino (Sink)</label>
              <select 
                value={customTarget} 
                onChange={(e) => handleTargetChange(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- Sin Destino (Resolver todo) --</option>
                {selectedExercise.graph.nodes.map(n => (
                  <option key={n.id} value={n.id} disabled={n.id === customSource}>{n.label || n.id}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </aside>

      {/* Panel Principal */}
      <main className="flex-1 flex flex-col p-6 glass-panel rounded-xl overflow-hidden relative">
        {selectedExercise ? (
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header del Solver */}
            <div className="flex justify-between items-start mb-4 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 m-0 flex items-center gap-2">
                  <Milestone className="w-6 h-6 text-emerald-400" /> Dijkstra: {selectedExercise.name}
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Encontrando ruta mínima desde el nodo <strong className="text-emerald-400 font-bold">{customSource}</strong> 
                  {customTarget ? <span> hasta el nodo <strong className="text-red-400 font-bold">{customTarget}</strong></span> : ' hacia toda la red'}
                </div>
              </div>
              
              <div className="flex gap-3">
                {currentSolution ? (
                  <button 
                    className="flex items-center gap-2 px-4.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg border border-purple-500 transition-all cursor-pointer shadow-lg shadow-purple-500/15" 
                    onClick={() => exportDijkstraToPDF(selectedExercise, currentSolution)}
                  >
                    <FileDown className="w-4 h-4" /> Exportar a PDF
                  </button>
                ) : (
                  <button 
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg border border-emerald-500 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer" 
                    onClick={handleSolve}
                  >
                    <Play className="w-4 h-4" /> Calcular Ruta Mínima
                  </button>
                )}
              </div>
            </div>

            {/* Controles de Paso a Paso */}
            {frameData && (
              <div className="p-3 bg-slate-900/50 border border-white/5 rounded-xl mb-4 shrink-0 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <button 
                    className="flex items-center gap-1 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" 
                    disabled={activeFrame === 0} 
                    onClick={() => updateActiveFrame(c => c - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Paso Anterior
                  </button>
                  <span className="font-bold text-xs text-slate-300 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
                    Paso {activeFrame} de {currentSolution ? currentSolution.frames.length - 1 : 0}
                  </span>
                  <button 
                    className="flex items-center gap-1 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" 
                    disabled={currentSolution ? activeFrame === currentSolution.frames.length - 1 : true} 
                    onClick={() => updateActiveFrame(c => c + 1)}
                  >
                    Siguiente Paso <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-3 bg-slate-950/60 border border-white/5 border-l-4 border-l-orange-500 rounded-lg text-xs leading-relaxed text-slate-300 flex items-start gap-2.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>{frameData.narrative}</span>
                </div>

                {isComplete && currentSolution && (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm border border-emerald-500/20 bg-emerald-500/5 py-2 rounded-lg animate-pulse">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>
                      ¡Calculado con éxito! 
                      {customTarget && currentSolution.distances[customTarget] !== Infinity
                        ? ` Ruta: ${currentSolution.shortestPath.join(" → ")} (Distancia: ${currentSolution.distances[customTarget]})`
                        : " Distancias mínimas obtenidas a todos los nodos."
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Lienzo y Panel de Datos */}
            <div className="flex-1 flex gap-4 overflow-hidden relative">
              {/* React Flow Canvas */}
              <div className="flex-1 h-full rounded-xl border border-white/5 relative overflow-hidden bg-[#050811]">
                <ReactFlow
                  nodes={rfNodes}
                  edges={rfEdges}
                  nodeTypes={nodeTypes}
                  fitView
                  minZoom={0.5}
                  maxZoom={1.5}
                >
                  <Background color="rgba(255,255,255,0.05)" gap={12} size={1} />
                  <Controls className="!bg-slate-900 !border-white/10 [&>button]:!text-slate-300 [&>button]:!border-white/5" />
                </ReactFlow>
              </div>

              {/* Panel de Distancias en Tiempo Real */}
              <div className="w-72 h-full glass-panel border border-white/5 rounded-xl p-4 shrink-0 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 mb-3 flex items-center gap-1.5 shrink-0">
                  <Table className="w-4 h-4 text-emerald-400" /> Tabla de Distancias
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500">
                        <th className="py-2">Nodo</th>
                        <th className="py-2 text-center">Dist.</th>
                        <th className="py-2 text-center">Predec.</th>
                        <th className="py-2 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExercise.graph.nodes.map(node => {
                        const dist = frameData ? frameData.distances[node.id] : Infinity;
                        const prev = frameData ? frameData.previous[node.id] : null;
                        const visited = frameData ? frameData.visited.includes(node.id) : false;
                        const isCurrent = frameData ? frameData.currentNodeId === node.id : false;
                        
                        let stateText = "Sin leer";
                        let stateColor = "text-slate-500 bg-white/2";
                        
                        if (isCurrent) {
                          stateText = "Actual";
                          stateColor = "text-orange-400 bg-orange-500/10 border border-orange-500/20";
                        } else if (visited) {
                          stateText = "Cerrado";
                          stateColor = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
                        } else if (dist !== Infinity) {
                          stateText = "Cola";
                          stateColor = "text-blue-400 bg-blue-500/10 border border-blue-500/20";
                        }

                        return (
                          <tr key={node.id} className="border-b border-white/3 hover:bg-white/2">
                            <td className="py-2.5 font-semibold text-slate-200">{node.id}</td>
                            <td className="py-2.5 text-center font-bold text-slate-300">
                              {dist === Infinity ? '∞' : dist}
                            </td>
                            <td className="py-2.5 text-center text-slate-400 font-medium">{prev || '-'}</td>
                            <td className="py-2.5 text-right">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${stateColor}`}>
                                {stateText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Lista de la Cola de Prioridad Activa */}
                {frameData && frameData.queue && (
                  <div className="mt-4 pt-3 border-t border-white/5 shrink-0 flex flex-col gap-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0 flex items-center gap-1">
                      <ListOrdered className="w-3 h-3 text-blue-400" /> Cola de Prioridad:
                    </h4>
                    <div className="flex gap-1.5 flex-wrap max-h-16 overflow-y-auto">
                      {frameData.queue.length > 0 ? (
                        frameData.queue.map(item => (
                          <span key={item.nodeId} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25">
                            {item.nodeId} ({item.distance})
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] text-slate-500 font-semibold italic">Vacía</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center text-slate-500 gap-3">
            <Compass className="w-10 h-10 animate-spin text-slate-600" />
            <span>Cargando ejercicios...</span>
          </div>
        )}
      </main>
    </div>
  );
}
