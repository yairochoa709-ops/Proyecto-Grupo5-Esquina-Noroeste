export function generateNetworkExercise(id) {
  const nodeCount = Math.floor(Math.random() * 3) + 5; // 5 to 7 nodes
  const nodes = [];
  
  // Nodos ficticios de inicio y fin (duración 0)
  nodes.push({ id: 'S', label: 'S (Origen)', duration: 0, a: 0, m: 0, b: 0 });
  for (let i = 0; i < nodeCount - 2; i++) {
    const durationBase = Math.floor(Math.random() * 10) + 2; // de 2 a 11
    const a = Math.max(1, Math.floor(durationBase * 0.6));
    const m = durationBase;
    const b = Math.floor(durationBase * 1.5);
    nodes.push({ 
      id: String.fromCharCode(65 + i), 
      label: String.fromCharCode(65 + i),
      duration: durationBase,
      optimistic: a,
      mostLikely: m,
      pessimistic: b
    });
  }
  nodes.push({ id: 'T', label: 'T (Destino)', duration: 0, a: 0, m: 0, b: 0 });

  const edges = [];
  let edgeIdCounter = 1;

  const layers = [[nodes[0]]];
  const intermediateNodes = nodes.slice(1, -1);
  const splitIdx = Math.max(1, Math.floor(intermediateNodes.length / 2));
  layers.push(intermediateNodes.slice(0, splitIdx));
  if (splitIdx < intermediateNodes.length) {
    layers.push(intermediateNodes.slice(splitIdx));
  }
  layers.push([nodes[nodes.length - 1]]);

  function addEdge(from, to) {
    edges.push({
      id: `e${edgeIdCounter++}`,
      from,
      to,
      cost: Math.floor(Math.random() * 15) + 1, // 1 to 15
      capacity: Math.floor(Math.random() * 20) + 5 // 5 to 24
    });
  }

  for (let i = 0; i < layers.length - 1; i++) {
    const currentLayer = layers[i];
    const nextLayer = layers[i+1];
    
    currentLayer.forEach(u => {
      const v = nextLayer[Math.floor(Math.random() * nextLayer.length)];
      addEdge(u.id, v.id);
    });
    
    nextLayer.forEach(v => {
      const hasIncoming = edges.some(e => e.to === v.id && currentLayer.some(u => u.id === e.from));
      if (!hasIncoming) {
        const u = currentLayer[Math.floor(Math.random() * currentLayer.length)];
        if (!edges.some(e => e.from === u.id && e.to === v.id)) {
           addEdge(u.id, v.id);
        }
      }
    });
  }

  // Se eliminó la inyección masiva de aristas aleatorias cruzadas
  // para mantener el grafo legible y estructurado en capas.

  return {
    id: `net-${id || Date.now()}`,
    name: `Red Aleatoria ${id}`,
    nodes,
    edges,
    source: 'S',
    sink: 'T'
  };
}

export function generateNetworkBatch(count = 5) {
  const batch = [];
  for (let i = 1; i <= count; i++) {
    batch.push(generateNetworkExercise(i));
  }
  return batch;
}
