import { useState, useEffect, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Handle, 
  Position,
  MarkerType
} from '@xyflow/react';
import { solveFordFulkerson } from '../utils/solver';
import { preloadedExercises, generateRandomFordFulkersonExercise } from '../utils/fordFulkersonExercises';
import { exportFordFulkersonToPDF } from '../utils/pdfGenerator';
import { FordFulkersonExercise, FordFulkersonSolution } from '../types';
import { 
  RefreshCw, Play, FileDown, ChevronLeft, ChevronRight, 
  Compass, CheckCircle2, ArrowRight, ListOrdered, Activity
} from 'lucide-react';

// Componente de Nodo Personalizado para Ford-Fulkerson
const FordFulkersonCustomNode = ({ data }: any) => {
  let borderClass = "border-white/10";
  let bgClass = "bg-slate-900/90";
  let textClass = "text-slate-400 font-medium";
  let roleText = "";

  if (data.isSource) {
    borderClass = "border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]";
    bgClass = "bg-blue-950/40";
    textClass = "text-blue-400 font-bold";
    roleText = "Fuente (S)";
  } else if (data.isSink) {
    borderClass = "border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]";
    bgClass = "bg-rose-950/40";
    textClass = "text-rose-400 font-bold";
    roleText = "Sumidero (T)";
  } else if (data.isCurrent) {
    borderClass = "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]";
    bgClass = "bg-orange-500/10";
    textClass = "text-orange-400 font-semibold";
    roleText = "Camino";
  }

  return (
    <div className={`px-4 py-2.5 rounded-xl border ${borderClass} ${bgClass} text-center min-w-[100px] select-none transition-all duration-300`}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="font-bold text-xs text-slate-100">{data.label}</div>
      {roleText && (
        <div className="mt-1">
          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/5 ${textClass}`}>
            {roleText}
          </span>
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

export default function FordFulkersonView() {
  const [exercises, setExercises] = useState<FordFulkersonExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<FordFulkersonExercise | null>(null);
  const [solutionsCache, setSolutionsCache] = useState<Record<string | number, FordFulkersonSolution>>({});
  const [currentFrames, setCurrentFrames] = useState<Record<string | number, number>>({});
  
  // Customizaciones de origen/destino
  const [customSource, setCustomSource] = useState("");
  const [customTarget, setCustomTarget] = useState("");

  // Cargar ejercicios iniciales
  useEffect(() => {
    setExercises([...preloadedExercises]);
    if (preloadedExercises.length > 0) {
      setSelectedExercise(preloadedExercises[0]);
      setCustomSource(preloadedExercises[0].sourceNodeId);
      setCustomTarget(preloadedExercises[0].targetNodeId);
    }
  }, []);

  const handleGenerateRandom = () => {
    const nextId = exercises.length + 1;
    const newEx = generateRandomFordFulkersonExercise(nextId);
    setExercises(prev => [...prev, newEx]);
    setSelectedExercise(newEx);
    setCustomSource(newEx.sourceNodeId);
    setCustomTarget(newEx.targetNodeId);
  };

  const handleSelectExercise = (ex: FordFulkersonExercise) => {
    setSelectedExercise(ex);
    setCustomSource(ex.sourceNodeId);
    setCustomTarget(ex.targetNodeId);
  };

  const handleSolve = () => {
    if (selectedExercise) {
      const activeExercise = {
        ...selectedExercise,
        sourceNodeId: customSource || selectedExercise.sourceNodeId,
        targetNodeId: customTarget || selectedExercise.targetNodeId
      };
      
      const res = solveFordFulkerson(activeExercise);
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

    const activePath = frameData ? frameData.activePath : [];

    return selectedExercise.graph.nodes.map(node => {
      const isSrc = node.id === customSource;
      const isTgt = node.id === customTarget;

      return {
        id: node.id,
        type: 'customNode',
        position: { x: node.x || 0, y: node.y || 0 },
        data: {
          label: node.id,
          isSource: isSrc,
          isSink: isTgt,
          isCurrent: activePath.includes(node.id)
        },
      };
    });
  }, [selectedExercise, frameData, customSource, customTarget]);

  // Aristas de React Flow
  const rfEdges = useMemo(() => {
    if (!selectedExercise) return [];

    const activeEdgeIds = frameData ? frameData.activeEdgeIds : [];
    const flows = frameData ? frameData.flows : {};

    return selectedExercise.graph.edges.map(edge => {
      const finalFlow = flows[edge.id] || 0;
      const capacity = edge.capacity !== undefined ? edge.capacity : 10;
      const isSaturated = finalFlow === capacity && capacity > 0;
      const isActive = activeEdgeIds.includes(edge.id);

      let stroke = "rgba(255, 255, 255, 0.15)";
      let strokeWidth = 1.5;
      let animated = false;

      if (isActive) {
        stroke = "#f97316"; // Naranja para el camino de aumento evaluado
        strokeWidth = 3.5;
        animated = true;
      } else if (isSaturated) {
        stroke = "#f43f5e"; // Rosado/Rojo para saturadas (cuellos de botella)
        strokeWidth = 2.5;
      } else if (finalFlow > 0) {
        stroke = "#3b82f6"; // Azul para aristas con flujo activo
        strokeWidth = 2.5;
        animated = true; // Flujo corriendo!
      } else if (isComplete) {
        stroke = "rgba(255, 255, 255, 0.03)"; // Atenuar al finalizar
        strokeWidth = 1;
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: `${finalFlow} / ${capacity}`,
        animated,
        type: 'simple',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isActive ? '#f97316' : isSaturated ? '#f43f5e' : finalFlow > 0 ? '#3b82f6' : 'rgba(255,255,255,0.2)',
        },
        style: { stroke, strokeWidth },
        labelStyle: { 
          fill: isActive ? '#f97316' : isSaturated ? '#f43f5e' : finalFlow > 0 ? '#3b82f6' : '#94a3b8', 
          fontWeight: 'bold', 
          fontSize: 11 
        },
        labelBgStyle: { fill: '#050811', fillOpacity: 0.85, rx: 4 },
      };
    });
  }, [selectedExercise, frameData, isComplete]);

  const nodeTypes = useMemo(() => ({
    customNode: FordFulkersonCustomNode,
  }), []);

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
      {/* Sidebar de Ford-Fulkerson */}
      <aside className="w-80 flex flex-col gap-4 p-5 glass-panel rounded-xl shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold text-slate-100 m-0 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" /> Max Flow
            </h2>
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 rounded-lg text-xs transition-colors cursor-pointer font-semibold" 
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
                    ? 'bg-rose-600/15 border-rose-500 shadow-md shadow-rose-500/10'
                    : 'bg-white/3 border-white/5 hover:bg-white/8'
                }`}
                onClick={() => handleSelectExercise(ex)}
              >
                <div className="font-semibold text-sm text-slate-100 flex items-center justify-between">
                  <span>{ex.name}</span>
                  {isSolved && <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">Resuelto</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Nodos: {ex.graph.nodes.length} | Conexiones: {ex.graph.edges.length}
                </div>
              </div>
            );
          })}
        </div>

        {/* Configurador de Nodos */}
        {selectedExercise && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">Parámetros de Red</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Nodo Fuente (Source)</label>
              <select 
                value={customSource} 
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {selectedExercise.graph.nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label || n.id}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Nodo Sumidero (Sink)</label>
              <select 
                value={customTarget} 
                onChange={(e) => handleTargetChange(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
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
                  <Activity className="w-6 h-6 text-rose-500 animate-pulse" /> Ford-Fulkerson: {selectedExercise.name}
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Encontrando el flujo máximo que puede circular desde la fuente <strong className="text-blue-400 font-bold">{customSource}</strong> hasta el sumidero <strong className="text-rose-400 font-bold">{customTarget}</strong>.
                </div>
              </div>
              
              <div className="flex gap-3">
                {currentSolution ? (
                  <button 
                    className="flex items-center gap-2 px-4.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg border border-purple-500 transition-all cursor-pointer shadow-lg shadow-purple-500/15" 
                    onClick={() => exportFordFulkersonToPDF(selectedExercise, currentSolution)}
                  >
                    <FileDown className="w-4 h-4" /> Exportar a PDF
                  </button>
                ) : (
                  <button 
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg border border-rose-500 shadow-lg shadow-rose-500/20 transition-all cursor-pointer" 
                    onClick={handleSolve}
                  >
                    <Play className="w-4 h-4" /> Calcular Flujo Máximo
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
                  <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm border border-rose-500/20 bg-rose-500/5 py-2 rounded-lg animate-pulse">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    <span>
                      ¡Flujo Máximo Alcanzado! 
                      La red se ha optimizado. El flujo total óptimo es de <strong className="text-emerald-400 font-bold text-base">{currentSolution.maxFlow}</strong> unidades.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Lienzo y Tabla de Estado */}
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

              {/* Historial de Flujos por Arista */}
              <div className="w-72 h-full glass-panel border border-white/5 rounded-xl p-4 shrink-0 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 mb-3 flex items-center gap-1.5 shrink-0">
                  <ListOrdered className="w-4 h-4 text-rose-500" /> Flujos por Arista
                </h3>

                <div className="flex justify-between text-[10px] text-slate-500 pb-1.5 border-b border-white/5 shrink-0">
                  <span>Arista</span>
                  <span>Flujo/Cap.</span>
                  <span className="w-20 text-right">Decisión</span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 mt-1.5">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      {selectedExercise.graph.edges.map(edge => {
                        const activeEdgeIds = frameData ? frameData.activeEdgeIds : [];
                        const flows = frameData ? frameData.flows : {};

                        const isAct = activeEdgeIds.includes(edge.id);
                        const flowVal = flows[edge.id] || 0;
                        const capacity = edge.capacity !== undefined ? edge.capacity : 10;
                        const isSat = flowVal === capacity && capacity > 0;

                        let stateText = flowVal > 0 ? "Con Flujo" : "Inactivo";
                        let stateColor = flowVal > 0 ? "text-blue-400 bg-blue-500/10 border border-blue-500/20" : "text-slate-500 bg-white/2";

                        if (isAct) {
                          stateText = "Camino";
                          stateColor = "text-orange-400 bg-orange-500/10 border border-orange-500/20";
                        } else if (isSat) {
                          stateText = "Saturada";
                          stateColor = "text-rose-400 bg-rose-500/10 border border-rose-500/20";
                        }

                        return (
                          <tr key={edge.id} className={`border-b border-white/3 hover:bg-white/2 ${isAct ? 'bg-orange-500/5' : ''}`}>
                            <td className="py-2.5 font-semibold text-slate-200">
                              {edge.source} → {edge.target}
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-300">
                              {flowVal} / {capacity}
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

                {/* Resumen Flujo Máximo actual */}
                {frameData && (
                  <div className="mt-4 pt-3 border-t border-white/5 shrink-0 flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Flujo máximo actual:</span>
                      <strong className="text-rose-400 font-bold text-sm">{frameData.maxFlow} u.</strong>
                    </div>
                    {frameData.bottleNeck > 0 && frameData.activePath.length > 0 && (
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Aumento del paso:</span>
                        <strong className="text-orange-400 font-semibold">+{frameData.bottleNeck} u.</strong>
                      </div>
                    )}
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
