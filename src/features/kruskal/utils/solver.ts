import { KruskalExercise, KruskalSolution, KruskalFrame } from "../types";

// Estructura de Conjuntos Disjuntos (Union-Find / Disjoint Set Union) con compresión de caminos
class UnionFind {
  private parent: Record<string, string>;
  private rank: Record<string, number>;

  constructor(nodeIds: string[]) {
    this.parent = {};
    this.rank = {};
    nodeIds.forEach(id => {
      this.parent[id] = id;
      this.rank[id] = 0;
    });
  }

  // Encontrar el representante del conjunto (con compresión de caminos)
  find(i: string): string {
    if (this.parent[i] === i) {
      return i;
    }
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  // Unir dos conjuntos (por rango). Retorna false si ya estaban conectados (ciclo)
  union(i: string, j: string): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI === rootJ) {
      return false; // Ya están conectados, formarían un ciclo
    }

    // Unión por rango
    if (this.rank[rootI] < this.rank[rootJ]) {
      this.parent[rootI] = rootJ;
    } else if (this.rank[rootI] > this.rank[rootJ]) {
      this.parent[rootJ] = rootI;
    } else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }
    return true;
  }
}

export function solveKruskal(exercise: KruskalExercise): KruskalSolution {
  const { graph } = exercise;
  const nodes = graph.nodes;
  const edges = graph.edges;

  // Ordenar aristas por peso de menor a mayor
  const sortedEdges = [...edges].sort((a, b) => {
    const wA = a.weight !== undefined ? a.weight : 1;
    const wB = b.weight !== undefined ? b.weight : 1;
    return wA - wB;
  });

  const nodeIds = nodes.map(n => n.id);
  const uf = new UnionFind(nodeIds);

  const approvedEdges: string[] = [];
  const rejectedEdges: string[] = [];
  const frames: KruskalFrame[] = [];
  
  let mstCost = 0;
  let step = 0;

  // Frame 0: Inicialización (ordenar aristas)
  const edgeListStr = sortedEdges.map(e => `(${e.source}-${e.target}: ${e.weight !== undefined ? e.weight : 1})`).join(", ");
  frames.push({
    step: 0,
    narrative: `Inicialización: Ordenamos las aristas por peso ascendente: ${edgeListStr}. Todos los nodos inician desconectados.`,
    activeEdgeId: null,
    approvedEdges: [],
    rejectedEdges: [],
    mstCost: 0
  });

  // Iterar por las aristas ordenadas
  for (const edge of sortedEdges) {
    step++;
    const weight = edge.weight !== undefined ? edge.weight : 1;
    const canConnect = uf.union(edge.source, edge.target);

    let narrative = "";

    if (canConnect) {
      approvedEdges.push(edge.id);
      mstCost += weight;
      narrative = `Paso ${step}: Evaluamos arista (${edge.source} ↔ ${edge.target}) con peso ${weight}. Une los conjuntos de ${edge.source} y ${edge.target} sin formar ciclos. Se APRUEBA e ingresa al Árbol de Expansión Mínima (MST).`;
    } else {
      rejectedEdges.push(edge.id);
      narrative = `Paso ${step}: Evaluamos arista (${edge.source} ↔ ${edge.target}) con peso ${weight}. Los nodos ${edge.source} y ${edge.target} ya están conectados en el mismo conjunto. Se RECHAZA para prevenir un ciclo.`;
    }

    frames.push({
      step,
      narrative,
      activeEdgeId: edge.id,
      approvedEdges: [...approvedEdges],
      rejectedEdges: [...rejectedEdges],
      mstCost
    });

    // Optimización opcional: Si ya tenemos N-1 aristas aprobadas en el MST, podemos parar la ejecución matemática del DSU,
    // pero para fines educativos e históricos recorremos y marcamos explícitamente el resto de aristas como rechazadas.
  }

  // Agregar frame final de completado
  step++;
  frames.push({
    step,
    narrative: `Algoritmo completado. Se evaluaron todas las aristas. El Árbol de Expansión Mínima se compone de ${approvedEdges.length} aristas con un costo total óptimo de ${mstCost}.`,
    activeEdgeId: null,
    approvedEdges: [...approvedEdges],
    rejectedEdges: [...rejectedEdges],
    mstCost
  });

  return {
    frames,
    mstEdges: approvedEdges,
    totalCost: mstCost
  };
}
