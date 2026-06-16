import { useState, useEffect, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Handle, 
  Position 
} from '@xyflow/react';
import { solveKruskal } from '../utils/solver';
import { preloadedExercises, generateRandomKruskalExercise } from '../utils/kruskalExercises';
import { exportKruskalToPDF } from '../utils/pdfGenerator';
import { KruskalExercise, KruskalSolution } from '../types';
import { 
  RefreshCw, Play, FileDown, ChevronLeft, ChevronRight, 
  Compass, CheckCircle2, 
  ArrowRight, ListOrdered, GitBranch
} from 'lucide-react';

// Componente de Nodo Personalizado para Kruskal
const KruskalCustomNode = ({ data }: any) => {
  let borderClass = "border-white/10";
  let bgClass = "bg-slate-900/90";
  let textClass = "text-slate-400 font-medium";

  if (data.isCurrent) {
    borderClass = "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]";
    bgClass = "bg-orange-500/10";
    textClass = "text-orange-400 font-bold";
  } else if (data.isInMst) {
    borderClass = "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
    bgClass = "bg-amber-950/35";
    textClass = "text-amber-400 font-semibold";
  }

  return (
    <div className={`px-4 py-2.5 rounded-xl border ${borderClass} ${bgClass} text-center min-w-[100px] select-none transition-all duration-300`}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="font-bold text-xs text-slate-100">{data.label}</div>
      <div className="flex justify-between items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5">
        <span className={`text-[10px] ${textClass}`}>
          {data.isCurrent ? 'Actual' : data.isInMst ? 'MST' : 'Libre'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

export default function KruskalView() {
  const [exercises, setExercises] = useState<KruskalExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<KruskalExercise | null>(null);
  const [solutionsCache, setSolutionsCache] = useState<Record<string | number, KruskalSolution>>({});
  const [currentFrames, setCurrentFrames] = useState<Record<string | number, number>>({});

  // Cargar ejercicios iniciales
  useEffect(() => {
    setExercises([...preloadedExercises]);
    if (preloadedExercises.length > 0) {
      setSelectedExercise(preloadedExercises[0]);
    }
  }, []);

  const handleGenerateRandom = () => {
    const nextId = exercises.length + 1;
    const newEx = generateRandomKruskalExercise(nextId);
    setExercises(prev => [...prev, newEx]);
    setSelectedExercise(newEx);
  };

  const handleSelectExercise = (ex: KruskalExercise) => {
    setSelectedExercise(ex);
  };

  const handleSolve = () => {
    if (selectedExercise) {
      const res = solveKruskal(selectedExercise);
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

  // Nodos de React Flow
  const rfNodes = useMemo(() => {
    if (!selectedExercise) return [];

    const approvedEdges = frameData ? frameData.approvedEdges : [];
    const activeEdgeId = frameData ? frameData.activeEdgeId : null;
    
    // Obtener nodos que pertenecen a la arista activa
    let activeNodes: string[] = [];
    if (activeEdgeId) {
      const actEdge = selectedExercise.graph.edges.find(e => e.id === activeEdgeId);
      if (actEdge) {
        activeNodes = [actEdge.source, actEdge.target];
      }
    }

    // Obtener todos los nodos que ya tienen aristas aprobadas
    const mstNodes = new Set<string>();
    approvedEdges.forEach(eId => {
      const edge = selectedExercise.graph.edges.find(e => e.id === eId);
      if (edge) {
        mstNodes.add(edge.source);
        mstNodes.add(edge.target);
      }
    });

    return selectedExercise.graph.nodes.map(node => {
      return {
        id: node.id,
        type: 'customNode',
        position: { x: node.x || 0, y: node.y || 0 },
        data: {
          label: node.id,
          isCurrent: activeNodes.includes(node.id),
          isInMst: mstNodes.has(node.id)
        },
      };
    });
  }, [selectedExercise, frameData]);

  // Aristas de React Flow
  const rfEdges = useMemo(() => {
    if (!selectedExercise) return [];

    const activeEdgeId = frameData ? frameData.activeEdgeId : null;
    const approvedEdges = frameData ? frameData.approvedEdges : [];
    const rejectedEdges = frameData ? frameData.rejectedEdges : [];

    return selectedExercise.graph.edges.map(edge => {
      const isActive = activeEdgeId === edge.id;
      const isApproved = approvedEdges.includes(edge.id);
      const isRejected = rejectedEdges.includes(edge.id);

      let stroke = "rgba(255, 255, 255, 0.15)";
      let strokeWidth = 1.5;
      let animated = false;
      let strokeDasharray = undefined;

      if (isActive) {
        stroke = "#f97316"; // Naranja
        strokeWidth = 3.5;
        animated = true;
      } else if (isApproved) {
        stroke = "#f59e0b"; // Ámbar
        strokeWidth = 4;
      } else if (isRejected) {
        stroke = "rgba(239, 68, 68, 0.2)"; // Rojo translúcido
        strokeWidth = 1.5;
        strokeDasharray = "5,5"; // Discontinua
      } else if (isComplete) {
        stroke = "rgba(255, 255, 255, 0.03)"; // Desvanecer aristas no MST
        strokeWidth = 1;
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: `${edge.weight}`,
        animated,
        type: 'simple',
        style: { stroke, strokeWidth, strokeDasharray },
        labelStyle: { 
          fill: isActive ? '#f97316' : isApproved ? '#f59e0b' : isRejected ? '#ef4444' : '#94a3b8', 
          fontWeight: 'bold', 
          fontSize: 11 
        },
        labelBgStyle: { fill: '#050811', fillOpacity: 0.85, rx: 4 },
      };
    });
  }, [selectedExercise, frameData, isComplete]);

  // Ordenar aristas por peso de menor a mayor
  const sortedEdgesForTable = useMemo(() => {
    if (!selectedExercise) return [];
    return [...selectedExercise.graph.edges].sort((a, b) => {
      const wA = a.weight !== undefined ? a.weight : 1;
      const wB = b.weight !== undefined ? b.weight : 1;
      return wA - wB;
    });
  }, [selectedExercise]);

  const nodeTypes = useMemo(() => ({
    customNode: KruskalCustomNode,
  }), []);

  return (
    <div className="w-full h-full flex gap-5 overflow-hidden">
      {/* Sidebar de Ejercicios Kruskal */}
      <aside className="w-80 flex flex-col gap-4 p-5 glass-panel rounded-xl shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold text-slate-100 m-0 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-amber-500" /> Kruskal
            </h2>
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/30 rounded-lg text-xs transition-colors cursor-pointer font-semibold" 
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
                    ? 'bg-amber-600/15 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-white/3 border-white/5 hover:bg-white/8'
                }`}
                onClick={() => handleSelectExercise(ex)}
              >
                <div className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>{ex.name}</span>
                  {isSolved && <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Resuelto</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Nodos: {ex.graph.nodes.length} | Conexiones: {ex.graph.edges.length}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Panel Principal */}
      <main className="flex-1 flex flex-col p-6 glass-panel rounded-xl overflow-hidden relative">
        {selectedExercise ? (
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header del Solver */}
            <div className="flex justify-between items-start mb-4 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 m-0 flex items-center gap-2">
                  <GitBranch className="w-6 h-6 text-amber-500" /> Kruskal: {selectedExercise.name}
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Encontrando el Árbol de Expansión Mínima (MST) que conecta la red al menor costo posible.
                </div>
              </div>
              
              <div className="flex gap-3">
                {currentSolution ? (
                  <button 
                    className="flex items-center gap-2 px-4.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg border border-purple-500 transition-all cursor-pointer shadow-lg shadow-purple-500/15" 
                    onClick={() => exportKruskalToPDF(selectedExercise, currentSolution)}
                  >
                    <FileDown className="w-4 h-4" /> Exportar a PDF
                  </button>
                ) : (
                  <button 
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg border border-amber-500 shadow-lg shadow-amber-500/20 transition-all cursor-pointer" 
                    onClick={handleSolve}
                  >
                    <Play className="w-4 h-4" /> Calcular Árbol Mínimo (MST)
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
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm border border-amber-500/20 bg-amber-500/5 py-2 rounded-lg animate-pulse">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>
                      ¡MST Completado! Se conectaron todos los nodos con un costo total mínimo de {currentSolution.totalCost}.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Lienzo y Tabla de Decisiones */}
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

              {/* Historial de Aristas */}
              <div className="w-72 h-full glass-panel border border-white/5 rounded-xl p-4 shrink-0 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 mb-3 flex items-center gap-1.5 shrink-0">
                  <ListOrdered className="w-4 h-4 text-amber-500" /> Cola de Aristas
                </h3>

                <div className="flex justify-between text-[10px] text-slate-500 pb-1.5 border-b border-white/5 shrink-0">
                  <span>Conexión</span>
                  <span>Peso</span>
                  <span className="w-20 text-right">Decisión</span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 mt-1.5">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      {sortedEdgesForTable.map(edge => {
                        const approvedEdges = frameData ? frameData.approvedEdges : [];
                        const rejectedEdges = frameData ? frameData.rejectedEdges : [];
                        const activeEdgeId = frameData ? frameData.activeEdgeId : null;

                        const isAct = activeEdgeId === edge.id;
                        const isApp = approvedEdges.includes(edge.id);
                        const isRej = rejectedEdges.includes(edge.id);

                        let stateText = "Pendiente";
                        let stateColor = "text-slate-500 bg-white/2";

                        if (isAct) {
                          stateText = "Evaluando";
                          stateColor = "text-orange-400 bg-orange-500/10 border border-orange-500/20";
                        } else if (isApp) {
                          stateText = "Aprobada";
                          stateColor = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
                        } else if (isRej) {
                          stateText = "Ciclo (Rech.)";
                          stateColor = "text-rose-400 bg-rose-500/10 border border-rose-500/20";
                        }

                        return (
                          <tr key={edge.id} className={`border-b border-white/3 hover:bg-white/2 ${isAct ? 'bg-orange-500/5' : ''}`}>
                            <td className="py-2.5 font-semibold text-slate-200">
                              {edge.source} ↔ {edge.target}
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-300">
                              {edge.weight}
                            </td>
                            <td className="py-2.5 text-right w-20">
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

                {/* Resumen MST actual */}
                {frameData && (
                  <div className="mt-4 pt-3 border-t border-white/5 shrink-0 flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Costo MST actual:</span>
                      <strong className="text-amber-400 font-bold text-sm">${frameData.mstCost}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>Aristas en el MST:</span>
                      <strong className="text-slate-200 font-semibold">{frameData.approvedEdges.length} / {selectedExercise.graph.nodes.length - 1}</strong>
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
