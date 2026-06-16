import { GraphData } from "../../models/graph";

export interface FordFulkersonExercise {
  id: string | number;
  name: string;
  graph: GraphData;
  sourceNodeId: string;
  targetNodeId: string; // Nodo sumidero (Sink)
}

export interface FordFulkersonFrame {
  step: number;
  narrative: string;
  activePath: string[]; // Nodos en el camino de aumento actual (p. ej. ['A', 'B', 'D'])
  activeEdgeIds: string[]; // IDs de las aristas del camino de aumento actual
  bottleNeck: number; // Flujo adicional (cuello de botella) enviado en este paso
  flows: Record<string, number>; // Flujo actual asignado a cada arista (clave: edge.id)
  residualCapacities: Record<string, number>; // Capacidad residual de cada arista (clave: edge.id)
  maxFlow: number; // Flujo máximo acumulado hasta este paso
}

export interface FordFulkersonSolution {
  frames: FordFulkersonFrame[];
  maxFlow: number; // Flujo máximo total calculado
  flows: Record<string, number>; // Flujos finales asignados a cada arista
}
