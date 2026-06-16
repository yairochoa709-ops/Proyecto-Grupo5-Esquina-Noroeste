export interface GraphNode {
  id: string;
  label: string;
  x?: number; // Posición X en el lienzo
  y?: number; // Posición Y en el lienzo
  // Datos auxiliares específicos de algoritmos
  distance?: number; // Para Dijkstra: distancia acumulada (Infinity por defecto)
  previousNodeId?: string | null; // Para Dijkstra: predecesor en ruta más corta
  visited?: boolean; // Para recorrido/visita (Dijkstra, Ford-Fulkerson, etc.)
  isSource?: boolean; // Para Ford-Fulkerson: nodo origen
  isSink?: boolean; // Para Ford-Fulkerson: nodo sumidero
}

export interface GraphEdge {
  id: string;
  source: string; // ID del nodo de origen
  target: string; // ID del nodo de destino
  weight?: number; // Peso/Costo de la arista (Dijkstra, Kruskal)
  capacity?: number; // Capacidad máxima (Ford-Fulkerson)
  flow?: number; // Flujo actual (Ford-Fulkerson)
  // Estados visuales para mostrar la ejecución paso a paso
  isActive?: boolean; // Si forma parte del resultado (Ruta óptima / Árbol de expansión)
  isRejected?: boolean; // Para Kruskal: si genera un ciclo y fue rechazada
  isCurrent?: boolean; // Si está siendo evaluada en el paso actual
  isBidirectional?: boolean; // Si la conexión es de doble sentido visualmente
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
