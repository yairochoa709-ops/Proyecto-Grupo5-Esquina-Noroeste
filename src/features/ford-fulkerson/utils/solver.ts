import { FordFulkersonExercise, FordFulkersonSolution, FordFulkersonFrame } from "../types";
import { GraphEdge } from "../../../models/graph";

export function solveFordFulkerson(exercise: FordFulkersonExercise): FordFulkersonSolution {
  const { graph, sourceNodeId, targetNodeId } = exercise;
  const nodes = graph.nodes;
  const edges = graph.edges;

  // Mapa de flujos actuales por arista
  const flows: Record<string, number> = {};
  edges.forEach(e => {
    flows[e.id] = 0;
  });

  const frames: FordFulkersonFrame[] = [];
  let step = 0;
  let maxFlow = 0;

  // Helper para calcular capacidades residuales actuales
  const getResidualCapacities = () => {
    const res: Record<string, number> = {};
    edges.forEach(e => {
      const cap = e.capacity !== undefined ? e.capacity : 10;
      res[e.id] = cap - flows[e.id];
    });
    return res;
  };

  // Frame 0: Inicialización
  frames.push({
    step: 0,
    narrative: `Inicialización: El flujo de todas las aristas se establece en 0. Comenzamos la búsqueda de caminos de aumento.`,
    activePath: [],
    activeEdgeIds: [],
    bottleNeck: 0,
    flows: { ...flows },
    residualCapacities: getResidualCapacities(),
    maxFlow: 0
  });

  // Bucle principal de Edmonds-Karp (BFS en red residual)
  while (true) {
    // BFS para encontrar un camino de aumento
    const parent: Record<string, { parentId: string; edge: GraphEdge; isForward: boolean } | null> = {};
    nodes.forEach(n => parent[n.id] = null);
    
    const queue: string[] = [sourceNodeId];
    const visited = new Set<string>([sourceNodeId]);
    let pathFound = false;

    while (queue.length > 0 && !pathFound) {
      const u = queue.shift()!;

      // Buscar aristas salientes (Forward edges en la red residual)
      // O aristas entrantes (Backward edges en la red residual)
      for (const edge of edges) {
        const capacity = edge.capacity !== undefined ? edge.capacity : 10;
        const currentFlow = flows[edge.id];

        // Caso Forward: u es el source de la arista, y la capacidad residual (cap - flow) > 0
        if (edge.source === u && !visited.has(edge.target)) {
          const residual = capacity - currentFlow;
          if (residual > 0) {
            visited.add(edge.target);
            parent[edge.target] = { parentId: u, edge, isForward: true };
            queue.push(edge.target);
            if (edge.target === targetNodeId) {
              pathFound = true;
              break;
            }
          }
        }

        // Caso Backward: u es el target de la arista, y hay flujo que se puede reducir (flow > 0)
        if (edge.target === u && !visited.has(edge.source)) {
          const residual = currentFlow; // Flujo que podemos "devolver"
          if (residual > 0) {
            visited.add(edge.source);
            parent[edge.source] = { parentId: u, edge, isForward: false };
            queue.push(edge.source);
            if (edge.source === targetNodeId) {
              pathFound = true;
              break;
            }
          }
        }
      }
    }

    // Si no se encuentra un camino de aumento, el algoritmo termina
    if (!pathFound) {
      break;
    }

    // Reconstruir el camino de aumento
    const activePath: string[] = [];
    const activeEdgeIds: string[] = [];
    let bottleNeck = Infinity;

    let curr = targetNodeId;
    while (curr !== sourceNodeId) {
      activePath.unshift(curr);
      const edgeInfo = parent[curr]!;
      activeEdgeIds.unshift(edgeInfo.edge.id);
      
      const capacity = edgeInfo.edge.capacity !== undefined ? edgeInfo.edge.capacity : 10;
      const currentFlow = flows[edgeInfo.edge.id];
      const residual = edgeInfo.isForward 
        ? capacity - currentFlow 
        : currentFlow;
      
      bottleNeck = Math.min(bottleNeck, residual);
      curr = edgeInfo.parentId;
    }
    activePath.unshift(sourceNodeId);

    // Incrementar el paso y registrar la evaluación del camino
    step++;
    frames.push({
      step,
      narrative: `Paso ${step} (Búsqueda): Encontramos un camino de aumento: ${activePath.join(" → ")}. El cuello de botella es la capacidad residual mínima en este camino, que es de ${bottleNeck} unidades.`,
      activePath: [...activePath],
      activeEdgeIds: [...activeEdgeIds],
      bottleNeck,
      flows: { ...flows },
      residualCapacities: getResidualCapacities(),
      maxFlow
    });

    // Aumentar el flujo en la red original
    let tempCurr = targetNodeId;
    while (tempCurr !== sourceNodeId) {
      const edgeInfo = parent[tempCurr]!;
      if (edgeInfo.isForward) {
        flows[edgeInfo.edge.id] += bottleNeck;
      } else {
        flows[edgeInfo.edge.id] -= bottleNeck;
      }
      tempCurr = edgeInfo.parentId;
    }

    maxFlow += bottleNeck;

    // Registrar la actualización del flujo
    step++;
    frames.push({
      step,
      narrative: `Paso ${step} (Aumento): Enviamos ${bottleNeck} unidades de flujo a través del camino. El flujo máximo acumulado se incrementa a ${maxFlow} unidades.`,
      activePath: [...activePath],
      activeEdgeIds: [...activeEdgeIds],
      bottleNeck,
      flows: { ...flows },
      residualCapacities: getResidualCapacities(),
      maxFlow
    });
  }

  // Paso final de completado
  step++;
  frames.push({
    step,
    narrative: `Algoritmo completado. No se encontraron más caminos de aumento con capacidad residual disponible en la red. El flujo máximo total es de ${maxFlow} unidades.`,
    activePath: [],
    activeEdgeIds: [],
    bottleNeck: 0,
    flows: { ...flows },
    residualCapacities: getResidualCapacities(),
    maxFlow
  });

  return {
    frames,
    maxFlow,
    flows
  };
}
