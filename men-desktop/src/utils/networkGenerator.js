const dijkstraContexts = [
  "Una empresa de logística necesita determinar la ruta más corta para sus camiones de reparto desde el almacén central (S) hasta la sucursal de destino (T), minimizando la distancia en kilómetros.",
  "Un servicio de emergencias debe encontrar el camino más rápido para una ambulancia desde el hospital (S) hasta el lugar del incidente (T) cruzando la ciudad.",
  "Un sistema de GPS está calculando la ruta de menor tiempo para un usuario que viaja desde su casa (S) hasta su trabajo (T) sorteando el tráfico en distintas vías.",
  "Una compañía de trenes busca optimizar el trayecto de un tren de carga desde la estación origen (S) hasta la terminal portuaria (T) minimizando el consumo de combustible.",
  "Un viajero planea su viaje por carretera y desea encontrar el itinerario más corto entre la ciudad de partida (S) y su destino vacacional (T)."
];

const flujoContexts = [
  "Una red de distribución de agua requiere maximizar la cantidad de litros por minuto que pueden ser enviados desde la planta potabilizadora (S) hasta el tanque de almacenamiento de la ciudad (T).",
  "Una empresa de telecomunicaciones necesita calcular la capacidad máxima de datos (en Gbps) que puede transmitirse a través de su red desde el servidor principal (S) hasta el centro de datos (T).",
  "El sistema de metro de la ciudad busca determinar la cantidad máxima de pasajeros que pueden ser transportados desde la estación central (S) hasta el estadio (T) en hora pico.",
  "Una refinería de petróleo desea maximizar el flujo de barriles por día desde los pozos de extracción (S) hasta la planta de procesamiento (T) a través de su red de oleoductos.",
  "Una red logística de distribución de paquetes busca calcular cuántos envíos diarios pueden transitar simultáneamente desde el centro de distribución (S) hasta el cliente final (T) sin saturar las rutas."
];

const kruskalContexts = [
  "Un proveedor de internet rural quiere conectar varios pueblos a su red troncal. Su objetivo es instalar el cableado de fibra óptica conectando todos los nodos con la menor cantidad de kilómetros posibles.",
  "Un proyecto de urbanización requiere pavimentar caminos para asegurar que todas las casas del vecindario estén conectadas entre sí, minimizando el costo total del asfalto.",
  "Una empresa eléctrica necesita tender líneas de alta tensión para conectar todas las subestaciones de una región, buscando el diseño que requiera la menor inversión en infraestructura.",
  "Un parque nacional planea construir senderos para conectar todos los campamentos. Se busca el diseño que conecte todos los puntos requiriendo la mínima deforestación.",
  "Una red de cajeros automáticos debe ser conectada al servidor central bancario. Se busca la topología de red que minimice la longitud total de cableado requerido."
];

const cpmContexts = [
  "Un proyecto de desarrollo de software (desde el inicio S hasta el despliegue T) requiere gestionar múltiples tareas con duraciones estimadas. Se necesita calcular la ruta crítica para conocer el tiempo mínimo de finalización.",
  "La construcción de un nuevo edificio consta de diversas fases secuenciales y paralelas. Se debe determinar la ruta crítica desde la cimentación (S) hasta la inauguración (T) para no retrasar la obra.",
  "La organización de un evento masivo (desde la planificación S hasta el día del evento T) implica muchas actividades interdependientes. Se busca analizar los tiempos optimistas, más probables y pesimistas para estimar la duración total.",
  "El lanzamiento de una nueva campaña de marketing requiere la coordinación de equipos creativos, de producción y de medios. Se necesita identificar las actividades críticas (sin holgura) desde el inicio (S) hasta el lanzamiento (T).",
  "Un proceso de mantenimiento industrial en una fábrica requiere apagar maquinaria, realizar revisiones y reiniciar sistemas (desde S hasta T). Es crucial encontrar la ruta crítica para minimizar el tiempo de inactividad de la planta."
];

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

  // Randomly select a context index for this network (using id to pseudo-randomize without repetition if possible, or just random)
  const randIdx = Math.floor(Math.random() * 5);
  
  const contexts = {
    dijkstra: dijkstraContexts[randIdx],
    flujo: flujoContexts[randIdx],
    kruskal: kruskalContexts[randIdx],
    cpm: cpmContexts[randIdx],
    pert: cpmContexts[randIdx] // PERT shares context with CPM
  };

  return {
    id: `net-${id || Date.now()}`,
    name: `Red Aleatoria ${id}`,
    nodes,
    edges,
    source: 'S',
    sink: 'T',
    contexts
  };
}

export function generateNetworkBatch(count = 5) {
  const batch = [];
  for (let i = 1; i <= count; i++) {
    batch.push(generateNetworkExercise(i));
  }
  return batch;
}
