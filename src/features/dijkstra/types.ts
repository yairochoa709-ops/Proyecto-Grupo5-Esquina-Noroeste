import { GraphData } from "../../models/graph";

export interface DijkstraExercise {
  id: string | number;
  name: string;
  graph: GraphData;
  sourceNodeId: string;
  targetNodeId?: string | null; // Destino específico opcional para resaltar la ruta final
}

export interface DijkstraFrame {
  step: number;
  narrative: string;
  currentNodeId: string | null; // Nodo actual siendo analizado (marcado en naranja/activo)
  distances: Record<string, number>; // Distancias acumuladas de cada nodo (Infinity si es inalcanzable)
  previous: Record<string, string | null>; // Tabla de predecesores para reconstruir la ruta
  visited: string[]; // Nodos ya visitados/cerrados
  queue: { nodeId: string; distance: number }[]; // Lista de la cola de prioridad actual
  activeEdgeId: string | null; // Arista siendo evaluada/relajada en el paso actual
  shortestPathEdges: string[]; // IDs de las aristas confirmadas en el árbol de rutas más cortas
}

export interface DijkstraSolution {
  frames: DijkstraFrame[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  shortestPath: string[]; // Lista ordenada de nodos (por ejemplo: ['A', 'B', 'D'])
  shortestPathEdgeIds: string[]; // IDs de las aristas que forman la ruta más corta final
}
