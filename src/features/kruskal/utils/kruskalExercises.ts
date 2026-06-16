import { KruskalExercise } from "../types";

// Generador de números aleatorios
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ejercicios Precargados
export const preloadedExercises: KruskalExercise[] = [
  {
    id: "kruskal-1",
    name: "Red de Tuberías de Agua Potable",
    graph: {
      nodes: [
        { id: "A", label: "Nodo A", x: 80, y: 180 },
        { id: "B", label: "Nodo B", x: 240, y: 70 },
        { id: "C", label: "Nodo C", x: 240, y: 290 },
        { id: "D", label: "Nodo D", x: 420, y: 70 },
        { id: "E", label: "Nodo E", x: 420, y: 290 },
        { id: "F", label: "Nodo F", x: 580, y: 180 }
      ],
      edges: [
        { id: "e-ab", source: "A", target: "B", weight: 6, isBidirectional: true },
        { id: "e-ac", source: "A", target: "C", weight: 1, isBidirectional: true },
        { id: "e-ad", source: "A", target: "D", weight: 5, isBidirectional: true },
        { id: "e-bc", source: "B", target: "C", weight: 5, isBidirectional: true },
        { id: "e-be", source: "B", target: "E", weight: 3, isBidirectional: true },
        { id: "e-cd", source: "C", target: "D", weight: 5, isBidirectional: true },
        { id: "e-ce", source: "C", target: "E", weight: 6, isBidirectional: true },
        { id: "e-cf", source: "C", target: "F", weight: 4, isBidirectional: true },
        { id: "e-df", source: "D", target: "F", weight: 2, isBidirectional: true },
        { id: "e-ef", source: "E", target: "F", weight: 6, isBidirectional: true }
      ]
    }
  },
  {
    id: "kruskal-2",
    name: "Optimización de Tendido Eléctrico (Rural)",
    graph: {
      nodes: [
        { id: "V1", label: "Villa A", x: 100, y: 100 },
        { id: "V2", label: "Villa B", x: 250, y: 80 },
        { id: "V3", label: "Villa C", x: 220, y: 260 },
        { id: "V4", label: "Villa D", x: 380, y: 140 },
        { id: "V5", label: "Villa E", x: 380, y: 300 },
        { id: "V6", label: "Villa F", x: 520, y: 220 },
        { id: "V7", label: "Villa G", x: 650, y: 160 }
      ],
      edges: [
        { id: "e-12", source: "V1", target: "V2", weight: 7, isBidirectional: true },
        { id: "e-13", source: "V1", target: "V3", weight: 8, isBidirectional: true },
        { id: "e-23", source: "V2", target: "V3", weight: 3, isBidirectional: true },
        { id: "e-24", source: "V2", target: "V4", weight: 6, isBidirectional: true },
        { id: "e-34", source: "V3", target: "V4", weight: 4, isBidirectional: true },
        { id: "e-35", source: "V3", target: "V5", weight: 3, isBidirectional: true },
        { id: "e-45", source: "V4", target: "V5", weight: 5, isBidirectional: true },
        { id: "e-46", source: "V4", target: "V6", weight: 2, isBidirectional: true },
        { id: "e-56", source: "V5", target: "V6", weight: 2, isBidirectional: true },
        { id: "e-47", source: "V4", target: "V7", weight: 9, isBidirectional: true },
        { id: "e-67", source: "V6", target: "V7", weight: 4, isBidirectional: true }
      ]
    }
  }
];

// Generar redes aleatorias garantizando conectividad para Kruskal
export function generateRandomKruskalExercise(id: number): KruskalExercise {
  const nodeNames = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"];
  const numNodes = getRandomInt(5, 7);
  const activeNodes = nodeNames.slice(0, numNodes);

  const nodes = activeNodes.map((name, index) => {
    let x = 80;
    let y = 180;
    if (index === 0) {
      x = 80; y = 180;
    } else if (index === numNodes - 1) {
      x = 600; y = 180;
    } else {
      const col = Math.ceil(index / 2);
      const isTop = index % 2 === 1;
      x = 100 + col * 170;
      y = isTop ? 75 : 285;
    }

    return {
      id: name,
      label: `Punto ${name}`,
      x,
      y
    };
  });

  const edges: any[] = [];
  let edgeCounter = 1;

  // Garantizar conectividad secuencial
  for (let i = 0; i < numNodes - 1; i++) {
    edges.push({
      id: `e-krand-${edgeCounter++}`,
      source: activeNodes[i],
      target: activeNodes[i + 1],
      weight: getRandomInt(2, 12),
      isBidirectional: true
    });
  }

  // Añadir aristas cruzadas
  for (let i = 0; i < numNodes; i++) {
    for (let j = i + 2; j < numNodes; j++) {
      if (Math.random() < 0.45) {
        edges.push({
          id: `e-krand-${edgeCounter++}`,
          source: activeNodes[i],
          target: activeNodes[j],
          weight: getRandomInt(4, 18),
          isBidirectional: true
        });
      }
    }
  }

  return {
    id: `random-kruskal-${id}`,
    name: `Red Rural de Conexión #${id}`,
    graph: { nodes, edges }
  };
}
