import { DijkstraExercise, DijkstraSolution, DijkstraFrame } from "../types";
import { GraphEdge } from "../../../models/graph";

export function solveDijkstra(exercise: DijkstraExercise): DijkstraSolution {
  const { graph, sourceNodeId, targetNodeId } = exercise;
  const nodes = graph.nodes;
  const edges = graph.edges;

  // Inicialización de distancias y predecesores
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited: string[] = [];
  
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[sourceNodeId] = 0;

  const frames: DijkstraFrame[] = [];
  let step = 0;

  // Cola de prioridad simple (representada por un array ordenado)
  let queue: { nodeId: string; distance: number }[] = [{ nodeId: sourceNodeId, distance: 0 }];

  // Helper para buscar vecinos y aristas
  // Si la arista es bidireccional, el nodo u puede ser source o target.
  const getNeighbors = (u: string) => {
    const neighbors: { neighborId: string; weight: number; edge: GraphEdge }[] = [];
    edges.forEach(edge => {
      const weight = edge.weight !== undefined ? edge.weight : 1;
      if (edge.source === u) {
        neighbors.push({ neighborId: edge.target, weight, edge });
      } else if (edge.isBidirectional && edge.target === u) {
        neighbors.push({ neighborId: edge.source, weight, edge });
      }
    });
    return neighbors;
  };

  // Frame 0: Inicialización
  frames.push({
    step: 0,
    narrative: `Inicialización: Se establece la distancia al nodo origen ${sourceNodeId} en 0 y a los demás nodos en infinito (∞).`,
    currentNodeId: null,
    distances: { ...distances },
    previous: { ...previous },
    visited: [],
    queue: [...queue],
    activeEdgeId: null,
    shortestPathEdges: []
  });

  const confirmedEdges = new Set<string>();

  while (queue.length > 0) {
    // Ordenamos la cola por distancia menor
    queue.sort((a, b) => a.distance - b.distance);
    const currItem = queue.shift()!;
    const u = currItem.nodeId;

    if (visited.includes(u)) continue;

    // Registrar visita al nodo actual
    visited.push(u);
    step++;

    // Si u no es el nodo de origen y tiene un predecesor, confirmamos la arista que nos trajo aquí
    const prevNode = previous[u];
    if (prevNode) {
      // Encontrar la arista de prevNode a u
      const incomingEdge = edges.find(e => 
        (e.source === prevNode && e.target === u) || 
        (e.isBidirectional && e.source === u && e.target === prevNode)
      );
      if (incomingEdge) {
        confirmedEdges.add(incomingEdge.id);
      }
    }

    frames.push({
      step,
      narrative: `Paso ${step}: Seleccionamos el nodo ${u} con la menor distancia acumulada (${distances[u]}) de la cola. Lo marcamos como visitado (cerrado).`,
      currentNodeId: u,
      distances: { ...distances },
      previous: { ...previous },
      visited: [...visited],
      queue: [...queue],
      activeEdgeId: null,
      shortestPathEdges: Array.from(confirmedEdges)
    });

    // Si definimos un destino y lo alcanzamos, podemos terminar la búsqueda
    if (targetNodeId && u === targetNodeId) {
      step++;
      frames.push({
        step,
        narrative: `Alcanzamos el nodo destino ${targetNodeId}. Algoritmo completado. Procedemos a reconstruir la ruta.`,
        currentNodeId: u,
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visited],
        queue: [...queue],
        activeEdgeId: null,
        shortestPathEdges: Array.from(confirmedEdges)
      });
      break;
    }

    const neighbors = getNeighbors(u);

    for (const { neighborId, weight, edge } of neighbors) {
      if (visited.includes(neighborId)) continue;

      step++;
      const currentDist = distances[neighborId];
      const newDist = distances[u] + weight;
      const isShorter = newDist < currentDist;

      let narrative = `Evaluamos la conexión (${u} → ${neighborId}) con peso ${weight}. Distancia actual a ${neighborId} es ${currentDist === Infinity ? '∞' : currentDist}. Distancia propuesta a través de ${u} es ${newDist}.`;

      if (isShorter) {
        distances[neighborId] = newDist;
        previous[neighborId] = u;
        
        // Actualizar o insertar en la cola de prioridad
        const qIdx = queue.findIndex(item => item.nodeId === neighborId);
        if (qIdx >= 0) {
          queue[qIdx].distance = newDist;
        } else {
          queue.push({ nodeId: neighborId, distance: newDist });
        }

        narrative += ` ¡Es menor! Actualizamos su distancia a ${newDist} y definimos a ${u} como predecesor.`;
      } else {
        narrative += ` No es menor. Se mantiene la distancia actual.`;
      }

      frames.push({
        step,
        narrative,
        currentNodeId: u,
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visited],
        queue: [...queue],
        activeEdgeId: edge.id,
        shortestPathEdges: Array.from(confirmedEdges)
      });
    }
  }

  // Reconstrucción de la ruta más corta final si hay un targetNodeId
  const shortestPath: string[] = [];
  const shortestPathEdgeIds: string[] = [];

  if (targetNodeId && distances[targetNodeId] !== Infinity) {
    let curr: string | null = targetNodeId;
    while (curr) {
      shortestPath.unshift(curr);
      const prevVal: string | null = previous[curr];
      if (prevVal) {
        const edge = edges.find(e => 
          (e.source === prevVal && e.target === curr) || 
          (e.isBidirectional && e.source === curr && e.target === prevVal)
        );
        if (edge) {
          shortestPathEdgeIds.unshift(edge.id);
        }
      }
      curr = prevVal;
    }
  }

  return {
    frames,
    distances,
    previous,
    shortestPath,
    shortestPathEdgeIds
  };
}
