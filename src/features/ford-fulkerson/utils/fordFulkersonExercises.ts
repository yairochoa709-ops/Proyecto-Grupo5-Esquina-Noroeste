import { FordFulkersonExercise } from "../types";

// Generador de números aleatorios en un rango
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ejercicios Precargados
export const preloadedExercises: FordFulkersonExercise[] = [
  {
    id: "ff-1",
    name: "Tuberías de Transporte de Hidrocarburos",
    sourceNodeId: "A",
    targetNodeId: "F",
    graph: {
      nodes: [
        { id: "A", label: "Fuente A (Source)", x: 80, y: 180, isSource: true },
        { id: "B", label: "Estación B", x: 250, y: 70 },
        { id: "C", label: "Estación C", x: 250, y: 290 },
        { id: "D", label: "Estación D", x: 450, y: 70 },
        { id: "E", label: "Estación E", x: 450, y: 290 },
        { id: "F", label: "Sumidero F (Sink)", x: 620, y: 180, isSink: true }
      ],
      edges: [
        { id: "e-ab", source: "A", target: "B", capacity: 10 },
        { id: "e-ac", source: "A", target: "C", capacity: 10 },
        { id: "e-bc", source: "B", target: "C", capacity: 2 },
        { id: "e-bd", source: "B", target: "D", capacity: 4 },
        { id: "e-ce", source: "C", target: "E", capacity: 9 },
        { id: "e-de", source: "D", target: "E", capacity: 6 },
        { id: "e-df", source: "D", target: "F", capacity: 10 },
        { id: "e-ef", source: "E", target: "F", capacity: 10 }
      ]
    }
  },
  {
    id: "ff-2",
    name: "Red de Tráfico de Autopistas Urbanas",
    sourceNodeId: "S",
    targetNodeId: "T",
    graph: {
      nodes: [
        { id: "S", label: "Entrada S (Source)", x: 80, y: 180, isSource: true },
        { id: "A", label: "Punto A", x: 240, y: 70 },
        { id: "B", label: "Punto B", x: 240, y: 290 },
        { id: "C", label: "Punto C", x: 440, y: 70 },
        { id: "D", label: "Punto D", x: 440, y: 290 },
        { id: "T", label: "Salida T (Sink)", x: 600, y: 180, isSink: true }
      ],
      edges: [
        { id: "e-sa", source: "S", target: "A", capacity: 16 },
        { id: "e-sb", source: "S", target: "B", capacity: 13 },
        { id: "e-ab", source: "A", target: "B", capacity: 10 },
        { id: "e-ac", source: "A", target: "C", capacity: 12 },
        { id: "e-ba", source: "B", target: "A", capacity: 4 },
        { id: "e-bd", source: "B", target: "D", capacity: 14 },
        { id: "e-dc", source: "D", target: "C", capacity: 7 },
        { id: "e-ct", source: "C", target: "T", capacity: 20 },
        { id: "e-dt", source: "D", target: "T", capacity: 4 }
      ]
    }
  }
];

// Generador de redes aleatorias para Ford-Fulkerson
export function generateRandomFordFulkersonExercise(id: number): FordFulkersonExercise {
  const nodeNames = ["S", "N1", "N2", "N3", "N4", "T"];
  const numNodes = 6; // Mantener 6 nodos fijos para que el layout quede perfecto
  const activeNodes = nodeNames;

  const nodes = activeNodes.map((name, index) => {
    let x = 80;
    let y = 180;
    if (index === 0) {
      x = 80; y = 180; // Source
    } else if (index === numNodes - 1) {
      x = 600; y = 180; // Sink
    } else {
      const col = Math.ceil(index / 2);
      const isTop = index % 2 === 1;
      x = 100 + col * 170;
      y = isTop ? 75 : 285;
    }

    return {
      id: name,
      label: name === "S" ? "Fuente S" : name === "T" ? "Sumidero T" : `Punto ${name}`,
      x,
      y,
      isSource: name === "S",
      isSink: name === "T"
    };
  });

  const edges: any[] = [];
  let edgeCounter = 1;

  // Conectividad secuencial básica
  edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "S", target: "N1", capacity: getRandomInt(8, 16) });
  edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "S", target: "N2", capacity: getRandomInt(8, 16) });
  edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "N1", target: "N3", capacity: getRandomInt(6, 12) });
  edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "N2", target: "N4", capacity: getRandomInt(6, 12) });
  edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "N3", target: "T", capacity: getRandomInt(8, 16) });
  edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "N4", target: "T", capacity: getRandomInt(8, 16) });

  // Conexiones intermedias adicionales
  if (Math.random() > 0.3) {
    edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "N1", target: "N2", capacity: getRandomInt(2, 6) });
  }
  if (Math.random() > 0.3) {
    edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "N4", target: "N3", capacity: getRandomInt(2, 6) });
  }
  if (Math.random() > 0.3) {
    edges.push({ id: `e-ffrand-${edgeCounter++}`, source: "N2", target: "N3", capacity: getRandomInt(4, 10) });
  }

  return {
    id: `random-ff-${id}`,
    name: `Red de Flujo Aleatoria #${id}`,
    sourceNodeId: "S",
    targetNodeId: "T",
    graph: { nodes, edges }
  };
}
