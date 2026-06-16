import { GraphData } from "../../models/graph";

export interface KruskalExercise {
  id: string | number;
  name: string;
  graph: GraphData;
}

export interface KruskalFrame {
  step: number;
  narrative: string;
  activeEdgeId: string | null; // Arista evaluada en el paso actual
  approvedEdges: string[]; // Aristas que forman parte del MST hasta este paso
  rejectedEdges: string[]; // Aristas rechazadas por formar ciclos hasta este paso
  mstCost: number; // Costo acumulado del árbol hasta este paso
}

export interface KruskalSolution {
  frames: KruskalFrame[];
  mstEdges: string[]; // Listado final de IDs de aristas del árbol de expansión mínima
  totalCost: number; // Costo total óptimo del MST
}
