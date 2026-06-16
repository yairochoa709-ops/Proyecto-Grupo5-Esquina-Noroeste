import { DijkstraExercise } from "../types";

// Generador de números aleatorios en un rango
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ejercicios Precargados con temáticas interesantes
export const preloadedExercises: DijkstraExercise[] = [
  {
    id: "dijkstra-1",
    name: "Red de Fibra Óptica Metropolitana",
    sourceNodeId: "A",
    targetNodeId: "F",
    graph: {
      nodes: [
        { id: "A", label: "Nodo A (Origen)", x: 80, y: 180, isSource: true },
        { id: "B", label: "Nodo B", x: 250, y: 70 },
        { id: "C", label: "Nodo C", x: 250, y: 290 },
        { id: "D", label: "Nodo D", x: 450, y: 70 },
        { id: "E", label: "Nodo E", x: 450, y: 290 },
        { id: "F", label: "Nodo F (Destino)", x: 620, y: 180, isSink: true }
      ],
      edges: [
        { id: "e-ab", source: "A", target: "B", weight: 4, isBidirectional: true },
        { id: "e-ac", source: "A", target: "C", weight: 2, isBidirectional: true },
        { id: "e-bc", source: "B", target: "C", weight: 1, isBidirectional: true },
        { id: "e-bd", source: "B", target: "D", weight: 5, isBidirectional: true },
        { id: "e-cd", source: "C", target: "D", weight: 8, isBidirectional: true },
        { id: "e-ce", source: "C", target: "E", weight: 10, isBidirectional: true },
        { id: "e-de", source: "D", target: "E", weight: 2, isBidirectional: true },
        { id: "e-df", source: "D", target: "F", weight: 6, isBidirectional: true },
        { id: "e-ef", source: "E", target: "F", weight: 3, isBidirectional: true }
      ]
    }
  },
  {
    id: "dijkstra-2",
    name: "Red de Envíos Nacionales (Logística)",
    sourceNodeId: "Nogales",
    targetNodeId: "Cancun",
    graph: {
      nodes: [
        { id: "Nogales", label: "Nogales (Orig.)", x: 80, y: 100, isSource: true },
        { id: "Hermosillo", label: "Hermosillo", x: 200, y: 120 },
        { id: "Chihuahua", label: "Chihuahua", x: 220, y: 240 },
        { id: "Monterrey", label: "Monterrey", x: 380, y: 140 },
        { id: "Guadalajara", label: "Guadalajara", x: 360, y: 300 },
        { id: "CDMX", label: "Ciudad de México", x: 500, y: 240 },
        { id: "Veracruz", label: "Veracruz", x: 620, y: 280 },
        { id: "Cancun", label: "Cancún (Dest.)", x: 750, y: 180, isSink: true }
      ],
      edges: [
        { id: "e-nh", source: "Nogales", target: "Hermosillo", weight: 3, isBidirectional: true },
        { id: "e-nc", source: "Nogales", target: "Chihuahua", weight: 6, isBidirectional: true },
        { id: "e-hc", source: "Hermosillo", target: "Chihuahua", weight: 2, isBidirectional: true },
        { id: "e-hm", source: "Hermosillo", target: "Monterrey", weight: 7, isBidirectional: true },
        { id: "e-cm", source: "Chihuahua", target: "Monterrey", weight: 5, isBidirectional: true },
        { id: "e-cg", source: "Chihuahua", target: "Guadalajara", weight: 4, isBidirectional: true },
        { id: "e-mg", source: "Monterrey", target: "Guadalajara", weight: 6, isBidirectional: true },
        { id: "e-mx", source: "Monterrey", target: "CDMX", weight: 8, isBidirectional: true },
        { id: "e-gx", source: "Guadalajara", target: "CDMX", weight: 5, isBidirectional: true },
        { id: "e-xv", source: "CDMX", target: "Veracruz", weight: 3, isBidirectional: true },
        { id: "e-xc", source: "CDMX", target: "Cancun", weight: 12, isBidirectional: true },
        { id: "e-vc", source: "Veracruz", target: "Cancun", weight: 8, isBidirectional: true }
      ]
    }
  }
];

// Generador de ejercicios aleatorios para Dijkstra
export function generateRandomDijkstraExercise(id: number): DijkstraExercise {
  const nodeNames = ["A", "B", "C", "D", "E", "F", "G"];
  const numNodes = getRandomInt(5, 7);
  const activeNodes = nodeNames.slice(0, numNodes);

  // Layout de los nodos por columnas
  const nodes = activeNodes.map((name, index) => {
    let x = 80;
    let y = 180;
    
    // Distribuir nodos en una cuadrícula/columnas limpia
    if (index === 0) {
      x = 80; y = 180; // Origen
    } else if (index === numNodes - 1) {
      x = 600; y = 180; // Destino
    } else {
      const col = Math.ceil(index / 2);
      const isTop = index % 2 === 1;
      x = 100 + col * 180;
      y = isTop ? 70 : 290;
    }

    return {
      id: name,
      label: `Nodo ${name}`,
      x,
      y,
      isSource: index === 0,
      isSink: index === numNodes - 1
    };
  });

  const edges: any[] = [];
  let edgeCounter = 1;

  // Asegurar conectividad básica (camino secuencial A -> B -> C -> ...)
  for (let i = 0; i < numNodes - 1; i++) {
    edges.push({
      id: `e-rand-${edgeCounter++}`,
      source: activeNodes[i],
      target: activeNodes[i + 1],
      weight: getRandomInt(2, 10),
      isBidirectional: true
    });
  }

  // Agregar algunas aristas aleatorias cruzadas para dar complejidad
  for (let i = 0; i < numNodes; i++) {
    for (let j = i + 2; j < numNodes; j++) {
      // 40% de probabilidad de crear arista cruzada si no existe
      if (Math.random() < 0.4) {
        edges.push({
          id: `e-rand-${edgeCounter++}`,
          source: activeNodes[i],
          target: activeNodes[j],
          weight: getRandomInt(3, 15),
          isBidirectional: true
        });
      }
    }
  }

  return {
    id: `random-dijkstra-${id}`,
    name: `Red Aleatoria #${id}`,
    sourceNodeId: activeNodes[0],
    targetNodeId: activeNodes[numNodes - 1],
    graph: { nodes, edges }
  };
}
