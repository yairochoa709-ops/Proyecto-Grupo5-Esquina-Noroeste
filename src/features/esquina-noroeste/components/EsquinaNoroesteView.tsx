import { useState, useEffect } from 'react';
import { generateBatch } from '../utils/matrixGenerator';
import { solveNorthwestCorner } from '../utils/solver';
import { exportToPDF } from '../utils/pdfGenerator';
import { NorthwestExercise, NorthwestSolution } from '../types';
import { 
  RefreshCw, Plus, Play, FileDown, ChevronLeft, ChevronRight, 
  BookOpen, Eye, EyeOff, LayoutGrid, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';

interface RouteOverlayProps {
  solution: NorthwestSolution;
  activeFrame: number;
}

const RouteOverlay = ({ solution, activeFrame }: RouteOverlayProps) => {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const updatePoints = () => {
      if (!solution) return;
      const newPoints: { x: number; y: number }[] = [];
      const containerEl = document.querySelector('.matrix-container');
      if (!containerEl) return;
      const containerRect = containerEl.getBoundingClientRect();

      for (let f = 1; f <= activeFrame; f++) {
        const frame = solution.frames[f];
        if (frame && frame.currentCell) {
          const el = document.getElementById(`cell-${frame.currentCell.r}-${frame.currentCell.c}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            newPoints.push({
              x: rect.left - containerRect.left + rect.width / 2 + containerEl.scrollLeft,
              y: rect.top - containerRect.top + rect.height / 2 + containerEl.scrollTop
            });
          }
        }
      }
      setPoints(newPoints);
    };

    const timer = setTimeout(updatePoints, 50);
    window.addEventListener('resize', updatePoints);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePoints);
    };
  }, [solution, activeFrame]);

  if (points.length < 2) return null;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
        </marker>
      </defs>
      {points.slice(0, -1).map((p, i) => {
        const nextP = points[i+1];
        if (p.x === nextP.x && p.y === nextP.y) return null;
        
        let x1 = p.x;
        let y1 = p.y;
        let x2 = nextP.x;
        let y2 = nextP.y;
        
        const offset = 28; // Recortar la línea 28px desde el centro para no tapar los números
        
        if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) { 
          // Horizontal
          if (x2 > x1) { x1 += offset; x2 -= offset; }
          else { x1 -= offset; x2 += offset; }
        } else {
          // Vertical
          if (y2 > y1) { y1 += offset; y2 -= offset; }
          else { y1 -= offset; y2 += offset; }
        }

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#f97316"
            strokeWidth="3"
            className="animated-route"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
};

interface ManualMatrix {
  costs: (number | string)[][];
  supply: (number | string)[];
  demand: (number | string)[];
}

export default function EsquinaNoroesteView() {
  const [exercises, setExercises] = useState<NorthwestExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<NorthwestExercise | null>(null);
  const [solutionsCache, setSolutionsCache] = useState<Record<string | number, NorthwestSolution>>({});
  const [currentFrames, setCurrentFrames] = useState<Record<string | number, number>>({});
  const [showRoute, setShowRoute] = useState(false);
  const [showStatement, setShowStatement] = useState(false);

  // Estados del Modo Manual
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualRows, setManualRows] = useState<number | string>(3);
  const [manualCols, setManualCols] = useState<number | string>(3);
  const [manualMatrix, setManualMatrix] = useState<ManualMatrix>({
    costs: Array(3).fill(null).map(() => Array(3).fill('')),
    supply: Array(3).fill(''),
    demand: Array(3).fill('')
  });
  const [manualError, setManualError] = useState('');

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
    setCurrentFrames({});
    setShowRoute(false);
    setShowStatement(false);
    setIsManualMode(false);
  };

  const handleSelect = (ex: NorthwestExercise) => {
    setSelectedExercise(ex);
    setShowRoute(false);
    setShowStatement(false);
    setIsManualMode(false);
  };

  const handleSolve = () => {
    if (selectedExercise) {
      const res = solveNorthwestCorner(selectedExercise);
      setSolutionsCache(prev => ({ ...prev, [selectedExercise.id]: res }));
      setCurrentFrames(prev => ({ ...prev, [selectedExercise.id]: 0 }));
      setShowRoute(false);
    }
  };

  // --- Funciones para Modo Manual ---
  const activateManualMode = () => {
    setIsManualMode(true);
    setSelectedExercise(null);
    setManualError('');
    setShowRoute(false);
  };

  const handleUpdateDimensions = () => {
    const r = Math.max(2, Math.min(8, Number(manualRows) || 2));
    const c = Math.max(2, Math.min(8, Number(manualCols) || 2));
    setManualRows(r);
    setManualCols(c);
    setManualMatrix({
      costs: Array(r).fill(null).map(() => Array(c).fill('')),
      supply: Array(r).fill(''),
      demand: Array(c).fill('')
    });
    setManualError('');
  };

  const handleMatrixChange = (type: 'cost' | 'supply' | 'demand', i: number | null, j: number | null, value: string) => {
    let num: number | string = value;
    if (value !== '') {
       num = parseInt(value, 10);
       if (isNaN(num)) num = '';
    }

    setManualMatrix(prev => {
      const next = { ...prev };
      if (type === 'cost' && i !== null && j !== null) {
        next.costs = prev.costs.map((row, rIdx) => 
          rIdx === i ? row.map((cVal, cIdx) => cIdx === j ? num : cVal) : row
        );
      } else if (type === 'supply' && i !== null) {
        next.supply = prev.supply.map((s, idx) => idx === i ? num : s);
      } else if (type === 'demand' && j !== null) {
        next.demand = prev.demand.map((d, idx) => idx === j ? num : d);
      }
      return next;
    });
  };

  const handleSolveManual = () => {
    let hasError = false;
    let errorMsg = '';
    
    const checkArray = (arr: (number | string)[], name: string) => {
      for (const x of arr) {
        if (x === '' || x === null || typeof x !== 'number' || x < 0) {
          return `Faltan valores o hay números inválidos en ${name}.`;
        }
      }
      return null;
    };
    
    for (const r of manualMatrix.costs) {
       const err = checkArray(r, 'la matriz de costos');
       if (err) { hasError = true; errorMsg = err; break; }
    }
    if (!hasError) {
       errorMsg = checkArray(manualMatrix.supply, 'las ofertas') || checkArray(manualMatrix.demand, 'las demandas') || '';
       if (errorMsg) hasError = true;
    }
    
    if (hasError) {
      setManualError(errorMsg);
      return;
    }

    const supplyNums = manualMatrix.supply as number[];
    const demandNums = manualMatrix.demand as number[];
    const costNums = manualMatrix.costs as number[][];

    const totalSupply = supplyNums.reduce((a, b) => a + b, 0);
    const totalDemand = demandNums.reduce((a, b) => a + b, 0);
    
    if (totalSupply <= 0 || totalDemand <= 0) {
      setManualError('La suma total de oferta y demanda debe ser mayor a cero.');
      return;
    }
    
    setManualError('');
    
    const ex: NorthwestExercise = {
      id: `manual-${Date.now()}`,
      name: 'Ejercicio Manual',
      rows: Number(manualRows),
      cols: Number(manualCols),
      costs: costNums.map(row => [...row]),
      supply: [...supplyNums],
      demand: [...demandNums],
      totalSupply,
      totalDemand,
      isBalanced: totalSupply === totalDemand,
      namesRows: Array.from({length: Number(manualRows)}, (_, idx) => `O${idx+1}`),
      namesCols: Array.from({length: Number(manualCols)}, (_, idx) => `D${idx+1}`),
      statement: null
    };
    
    setSelectedExercise(ex);
    setIsManualMode(false);
    
    const res = solveNorthwestCorner(ex);
    setSolutionsCache(prev => ({ ...prev, [ex.id]: res }));
    setCurrentFrames(prev => ({ ...prev, [ex.id]: 0 }));
    setShowRoute(false);
  };

  const currentSolution = selectedExercise ? solutionsCache[selectedExercise.id] : null;
  const activeFrame = selectedExercise ? (currentFrames[selectedExercise.id] || 0) : 0;

  const updateActiveFrame = (updater: number | ((curr: number) => number)) => {
    if (!selectedExercise) return;
    setCurrentFrames(prev => {
      const current = prev[selectedExercise.id] || 0;
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [selectedExercise.id]: next };
    });
  };

  const handleExportPDF = () => {
    if (currentSolution && selectedExercise) {
      exportToPDF(selectedExercise, currentSolution);
    }
  };

  const frameData = currentSolution ? currentSolution.frames[activeFrame] : null;
  const isSolved = !!currentSolution && !!frameData;
  const solvedFrame = isSolved ? frameData : null;

  return (
    <div className="w-full h-full flex gap-5 overflow-hidden">
      {/* Sidebar de Ejercicios */}
      <aside className="w-80 flex flex-col gap-4 p-5 glass-panel rounded-xl shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold text-slate-100 m-0">Ejercicios</h2>
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-sm transition-colors cursor-pointer" 
              onClick={handleGenerateNew}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Generar
            </button>
          </div>
          <button 
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold rounded-lg border transition-all cursor-pointer ${
              isManualMode 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            onClick={activateManualMode}
          >
            <Plus className="w-4 h-4" /> Ingresar Manualmente
          </button>
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          {exercises.map((ex) => {
            const isSolved = !!solutionsCache[ex.id];
            const isActive = selectedExercise?.id === ex.id && !isManualMode;
            return (
              <div 
                key={ex.id} 
                className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-white/3 border-white/5 hover:bg-white/8'
                }`}
                onClick={() => handleSelect(ex)}
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                    {ex.name} 
                    {isSolved && <span className="text-xs text-emerald-400">(Resuelto)</span>}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ex.isBalanced 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' 
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  }`}>
                    {ex.isBalanced ? 'Equilibrado' : 'Desequilibrado'}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Matriz: {ex.rows}x{ex.cols} | Oferta: {ex.totalSupply} | Demanda: {ex.totalDemand}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col p-6 glass-panel rounded-xl overflow-y-auto">
        {isManualMode ? (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-100 m-0">Crear Ejercicio Manual</h2>
              <button 
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/25 transition-all cursor-pointer" 
                onClick={handleSolveManual}
              >
                <Play className="w-4 h-4" /> Resolver Ejercicio
              </button>
            </div>
            
            <div className="p-5 rounded-xl border border-white/5 bg-white/2 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mt-0 mb-4 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-400" /> Dimensiones (2 a 8)
              </h3>
              <div className="flex gap-5 items-end flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">Orígenes (Filas)</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="8" 
                    value={manualRows} 
                    onChange={e => setManualRows(e.target.value)} 
                    className="w-28 bg-white/5 border border-white/10 text-white text-center rounded-lg py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">Destinos (Columnas)</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="8" 
                    value={manualCols} 
                    onChange={e => setManualCols(e.target.value)} 
                    className="w-28 bg-white/5 border border-white/10 text-white text-center rounded-lg py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <button 
                  className="px-4 py-2 bg-white/8 hover:bg-white/12 text-slate-200 hover:text-white rounded-lg border border-white/10 transition-all cursor-pointer font-medium" 
                  onClick={handleUpdateDimensions}
                >
                  Generar Cuadrícula
                </button>
              </div>
              {manualError && (
                <div className="flex items-center gap-2 mt-4 text-rose-400 bg-rose-500/10 border border-rose-500/25 px-4 py-3 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}
            </div>

            <div className="matrix-container relative overflow-x-auto p-2">
              <table className="mx-auto border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-sm font-semibold text-slate-400 bg-white/3 rounded-lg">Origen \ Destino</th>
                    {Array.from({ length: Number(manualCols) || 3 }).map((_, j) => (
                      <th key={j} className="py-2 px-3 text-sm font-semibold text-slate-400 bg-white/3 rounded-lg">D{j+1}</th>
                    ))}
                    <th className="py-2 px-3 text-sm font-semibold text-blue-300 bg-blue-500/10 rounded-lg">Oferta</th>
                  </tr>
                </thead>
                <tbody>
                  {manualMatrix.costs.map((row, i) => (
                    <tr key={i}>
                      <th className="py-2 px-3 text-sm font-semibold text-slate-400 bg-white/3 rounded-lg">O{i+1}</th>
                      {row.map((cost, j) => (
                        <td key={j} className="text-center">
                          <input 
                            type="number" 
                            min="0"
                            className="manual-input" 
                            value={cost} 
                            onChange={(e) => handleMatrixChange('cost', i, j, e.target.value)} 
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="text-center bg-blue-500/5 rounded-lg p-1.5 border border-blue-500/15">
                         <input 
                            type="number" 
                            min="0"
                            className="manual-input border-blue-500/30 focus:border-blue-500" 
                            value={manualMatrix.supply[i]} 
                            onChange={(e) => handleMatrixChange('supply', i, null, e.target.value)} 
                            placeholder="0"
                          />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th className="py-2 px-3 text-sm font-semibold text-purple-300 bg-purple-500/10 rounded-lg">Demanda</th>
                    {manualMatrix.demand.map((d, j) => (
                      <td key={j} className="text-center bg-purple-500/5 rounded-lg p-1.5 border border-purple-500/15">
                        <input 
                          type="number" 
                          min="0"
                          className="manual-input border-purple-500/30 focus:border-purple-500" 
                          value={d} 
                          onChange={(e) => handleMatrixChange('demand', null, j, e.target.value)} 
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="bg-white/2 rounded-lg border border-white/5"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedExercise ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 m-0">{selectedExercise.name}</h2>
                <div className="flex gap-2.5 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedExercise.isBalanced 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedExercise.isBalanced ? 'Equilibrado' : 'Desequilibrado'}
                  </span>
                  {!selectedExercise.isBalanced && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                      Balanceo automático (Diferencia: {Math.abs(selectedExercise.totalSupply - selectedExercise.totalDemand)})
                    </span>
                  )}
                </div>
              </div>
              
              {currentSolution ? (
                <div className="flex gap-3">
                  <button 
                    className={`flex items-center gap-2 px-4.5 py-2 rounded-lg font-semibold border transition-all cursor-pointer ${
                      showRoute 
                        ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`} 
                    onClick={() => setShowRoute(!showRoute)}
                  >
                    {showRoute ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showRoute ? 'Ocultar Ruta' : 'Trazar Ruta'}
                  </button>
                  <button 
                    className="flex items-center gap-2 px-4.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg border border-purple-500 transition-all cursor-pointer shadow-lg shadow-purple-500/15" 
                    onClick={handleExportPDF}
                  >
                    <FileDown className="w-4 h-4" /> Exportar a PDF
                  </button>
                </div>
              ) : (
                <button 
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg border border-emerald-500 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer" 
                  onClick={handleSolve}
                >
                  <Play className="w-4 h-4" /> Resolver Ejercicio
                </button>
              )}
            </div>

            {selectedExercise.statement && (
              <div className="p-4 rounded-xl bg-white/2 border border-white/5 border-l-4 border-l-blue-500 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-400" /> Contexto del Problema
                  </span>
                  <button 
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    onClick={() => setShowStatement(!showStatement)}
                  >
                    {showStatement ? 'Ocultar enunciado' : 'Ver enunciado completo'}
                  </button>
                </div>
                {showStatement && (
                  <div className="mt-3 leading-relaxed text-sm text-slate-400 italic">
                    {selectedExercise.statement}
                  </div>
                )}
              </div>
            )}

            {solvedFrame && (
              <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <button 
                    className="flex items-center gap-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" 
                    disabled={activeFrame === 0} 
                    onClick={() => updateActiveFrame(c => c - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Paso Anterior
                  </button>
                  <span className="font-bold text-sm text-slate-300 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
                    Paso {activeFrame} de {currentSolution ? currentSolution.frames.length - 1 : 0}
                  </span>
                  <button 
                    className="flex items-center gap-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" 
                    disabled={currentSolution ? activeFrame === currentSolution.frames.length - 1 : true} 
                    onClick={() => updateActiveFrame(c => c + 1)}
                  >
                    Siguiente Paso <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4 bg-slate-950/60 border border-white/5 border-l-4 border-l-orange-500 rounded-lg text-sm leading-relaxed text-slate-300 flex items-start gap-2.5">
                  <ArrowRight className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>{solvedFrame.narrative}</span>
                </div>
                
                {currentSolution && activeFrame === currentSolution.frames.length - 1 && (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-lg border border-emerald-500/20 bg-emerald-500/5 py-2.5 rounded-lg mt-2 animate-pulse">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>¡Solución Completada! Costo Total de Transporte: ${currentSolution.totalCost}</span>
                  </div>
                )}
              </div>
            )}

            <div className="matrix-container relative p-2 overflow-x-auto">
              <table className="w-full border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-sm font-semibold text-slate-400 bg-white/3 rounded-lg min-w-[120px]">Origen \\ Destino</th>
                    {(solvedFrame ? solvedFrame.namesCols : (selectedExercise.namesCols || Array.from({ length: selectedExercise.cols }, (_, idx) => `D${idx+1}`))).map((colName, idx) => (
                      <th 
                        key={idx} 
                        className="py-2 px-3 text-sm font-semibold text-slate-400 bg-white/3 rounded-lg min-w-[100px]"
                        style={solvedFrame && solvedFrame.crossedCols.includes(idx) ? { textDecoration: 'line-through', opacity: 0.4 } : {}}
                      >
                        {colName}
                      </th>
                    ))}
                    <th className="py-2 px-3 text-sm font-semibold text-blue-300 bg-blue-500/10 rounded-lg min-w-[90px]">Oferta</th>
                  </tr>
                </thead>
                <tbody>
                  {(solvedFrame ? solvedFrame.balancedCosts : selectedExercise.costs).map((row, i) => {
                    const rowName = solvedFrame ? solvedFrame.namesRows[i] : (selectedExercise.namesRows ? selectedExercise.namesRows[i] : `O${i+1}`);
                    const isRowCrossed = !!solvedFrame && solvedFrame.crossedRows.includes(i);
                    const supplyVal = solvedFrame ? solvedFrame.balancedSupply[i] : selectedExercise.supply[i];
                    return (
                      <tr key={i}>
                        <th 
                          className="py-2 px-3 text-sm font-semibold text-slate-400 bg-white/3 rounded-lg text-left"
                          style={isRowCrossed ? { textDecoration: 'line-through', opacity: 0.4 } : {}}
                        >
                          {rowName}
                        </th>
                        {row.map((cost, j) => {
                          const isColCrossed = !!solvedFrame && solvedFrame.crossedCols.includes(j);
                          const allocation = solvedFrame ? solvedFrame.allocations[i][j] : null;
                          const isCrossed = isRowCrossed || isColCrossed;
                          const isCurrentStep = !!solvedFrame && solvedFrame.currentCell && solvedFrame.currentCell.r === i && solvedFrame.currentCell.c === j;
                          
                          let cellStyle: React.CSSProperties = {};
                          let cellClassName = "cost-cell";
                          
                          if (isCurrentStep) {
                            cellClassName += " current-step";
                          } else if (allocation !== null) {
                            cellStyle = { background: 'rgba(16, 185, 129, 0.4)', borderColor: 'var(--success)', opacity: 1, boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' };
                          } else if (isCrossed) {
                            cellStyle = { opacity: 0.2 };
                          }

                          return (
                            <td key={j}>
                              <div id={`cell-${i}-${j}`} className={cellClassName} style={cellStyle}>
                                <span className="cost-label" style={allocation !== null || isCurrentStep ? { color: '#fff' } : {}}>c:{cost}</span>
                                {allocation !== null ? (
                                  <span className="text-white font-bold text-lg">{allocation}</span>
                                ) : (
                                  <span className="opacity-30">-</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="supply-cell text-center py-2 px-3 rounded-lg text-blue-300 font-semibold border border-blue-500/20 bg-blue-500/10" style={supplyVal === 0 ? { color: 'rgba(148, 163, 184, 0.4)', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' } : {}}>
                          {supplyVal}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <th className="py-2 px-3 text-sm font-semibold text-purple-300 bg-purple-500/10 rounded-lg text-left">Demanda</th>
                    {(solvedFrame ? solvedFrame.balancedDemand : selectedExercise.demand).map((d, j) => (
                      <td 
                        key={j} 
                        className="demand-cell text-center py-2 px-3 rounded-lg text-purple-300 font-semibold border border-purple-500/20 bg-purple-500/10" 
                        style={d === 0 ? { color: 'rgba(148, 163, 184, 0.4)', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' } : {}}
                      >
                        {d}
                      </td>
                    ))}
                    <td className="bg-white/5 rounded-lg border border-white/10 text-center font-bold text-slate-300 text-sm">
                      {solvedFrame ? solvedFrame.balancedSupply.reduce((a, b) => a + b, 0) : `${selectedExercise.totalSupply} / ${selectedExercise.totalDemand}`}
                    </td>
                  </tr>
                </tbody>
              </table>
              {showRoute && currentSolution && <RouteOverlay solution={currentSolution} activeFrame={activeFrame} />}
            </div>
          </>
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center text-slate-500 gap-3">
            <RefreshCw className="w-10 h-10 animate-spin text-slate-600" />
            <span>Selecciona o genera un ejercicio para comenzar</span>
          </div>
        )}
      </main>
    </div>
  );
}
