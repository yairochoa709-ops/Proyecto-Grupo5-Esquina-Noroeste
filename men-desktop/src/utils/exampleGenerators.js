const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── INVENTARIOS ───
const invItems = ['neumáticos', 'computadoras', 'calculadoras', 'escritorios', 'sillas', 'teléfonos', 'cámaras', 'televisores', 'impresoras', 'baterías'];
const invCompanies = ['Una tienda', 'Un distribuidor', 'Una fábrica', 'Un almacén central', 'Una empresa importadora'];

export function generateInventoryExamples(method, count = 5) {
  const examples = [];
  for (let i = 1; i <= count; i++) {
    const item = randomItem(invItems);
    const company = randomItem(invCompanies);
    const D = randomInt(500, 15000);
    const Co = randomInt(10, 200);
    const diasHabiles = randomItem([250, 300, 360, 365]);
    
    if (method === 'eoq') {
      const C = randomInt(10, 5000);
      const I = randomInt(5, 30); // porcentaje
      const Ch = Number(((I / 100) * C).toFixed(2));
      const L = randomInt(1, 14);
      examples.push({
        id: i,
        title: `Ejemplo EOQ ${i} (${item})`,
        statement: `${company} vende ${item}. La demanda anual es de ${D} unidades. El proveedor tarda ${L} días hábiles en entregar la orden. Se trabaja ${diasHabiles} días al año. El costo unitario es $${C}. El costo de realizar un pedido es $${Co} y mantener el inventario cuesta el ${I}% del costo unitario al año ($${Ch}). Determine la política óptima de inventario.`,
        method: 'eoq',
        D, Co, Ch, Cf: '', p: '', d: '', diasHabiles, L, C
      });
    } else if (method === 'eoq-backorders') {
      const Ch = randomInt(1, 20);
      const Cf = randomInt(Ch + 1, Ch * 5); // Cf debe ser mayor que Ch usualmente
      examples.push({
        id: i,
        title: `Ejemplo Faltantes ${i} (${item})`,
        statement: `${company} maneja ${item} con una demanda de ${D} anual. El costo de pedido es $${Co}, y mantener el inventario cuesta $${Ch}. Además, se permite un déficit planeado, y el costo por unidad faltante es de $${Cf}. Determine la cantidad a ordenar y el nivel máximo de escasez.`,
        method: 'eoq-backorders',
        D, Co, Ch, Cf, p: '', d: '', diasHabiles: 365, L: 0, C: 0
      });
    } else if (method === 'epq') {
      const Ch = randomInt(1, 20);
      const p = randomInt(D + 1000, D * 3); // Tasa de producción mayor a demanda
      examples.push({
        id: i,
        title: `Ejemplo EPQ ${i} (${item})`,
        statement: `${company} produce ${item} a una tasa anual de ${p} unidades, mientras que la demanda es de ${D} unidades. El costo de preparación de la corrida de producción es $${Co} y el de mantenimiento es $${Ch} por unidad al año. Encuentre el tamaño óptimo de lote de producción.`,
        method: 'epq',
        D, Co, Ch, Cf: '', p, d: D, diasHabiles: 365, L: 0, C: 0
      });
    } else if (method === 'abc') {
      const abcItems = [];
      const numItems = randomInt(5, 10);
      for(let j = 1; j <= numItems; j++) {
        abcItems.push({
          id: String(j),
          name: `Articulo ${j}`,
          D: randomInt(10, 5000),
          C: randomInt(1, 500)
        });
      }
      examples.push({
        id: i,
        title: `Clasificación ABC ${i}`,
        statement: `${company} tiene ${numItems} artículos diferentes en su inventario. Clasifíquelos en categorías A, B y C basándose en su valor monetario anual.`,
        method: 'abc',
        D: '', Co: '', Ch: '', Cf: '', p: '', d: '', diasHabiles: 365, L: 0, C: 0,
        abcItems
      });
    }
  }
  return examples;
}

// ─── COLAS ───
const queuePlaces = ['Un banco', 'Un restaurante de comida rápida', 'Un autolavado', 'Una caseta de peaje', 'Un centro de atención telefónica', 'Una clínica', 'Un servidor web'];
const queueEntities = ['clientes', 'vehículos', 'autos', 'pacientes', 'peticiones'];

export function generateQueueExamples(method, count = 5) {
  const examples = [];
  for (let i = 1; i <= count; i++) {
    const place = randomItem(queuePlaces);
    const entity = randomItem(queueEntities);
    let lambda = randomInt(5, 50);
    
    if (method === 'mm1') {
      let mu = randomInt(lambda + 1, lambda + 20); // mu > lambda para estabilidad
      examples.push({
        id: i,
        title: `Ejemplo M/M/1 ${i}`,
        statement: `${place} tiene 1 servidor. Llegan ${entity} a una tasa de ${lambda} por hora (Poisson). El servidor los atiende a una tasa de ${mu} por hora (Exponencial). Calcule las medidas de desempeño del sistema.`,
        method: 'mm1',
        lambda, mu, s: 1, maxK: '', maxN: ''
      });
    } else if (method === 'mms') {
      let s = randomInt(2, 5);
      let mu = randomInt(Math.ceil(lambda/s) + 1, lambda); // s*mu > lambda
      examples.push({
        id: i,
        title: `Ejemplo M/M/S ${i}`,
        statement: `${place} cuenta con ${s} servidores idénticos en paralelo. La tasa de llegada es de ${lambda} ${entity}/hora. Cada servidor atiende a una tasa de ${mu} ${entity}/hora. Determine la probabilidad de que el sistema esté vacío y los tiempos de espera.`,
        method: 'mms',
        lambda, mu, s, maxK: '', maxN: ''
      });
    } else if (method === 'mm1k') {
      let mu = randomInt(lambda - 5, lambda + 15); // no requiere mu > lambda estrictamente
      let K = randomInt(3, 10);
      examples.push({
        id: i,
        title: `Ejemplo M/M/1/K ${i}`,
        statement: `${place} tiene 1 servidor y capacidad máxima en el sistema para ${K} ${entity}. Si llega alguien y está lleno, se va. Tasa de llegada: ${lambda}/hora. Tasa de servicio: ${mu}/hora. Calcule L, W y la tasa efectiva de llegada.`,
        method: 'mm1k',
        lambda, mu, s: 1, maxK: K, maxN: ''
      });
    } else if (method === 'mmsk') {
      let s = randomInt(2, 4);
      let mu = randomInt(Math.ceil(lambda/s) - 2, lambda); 
      let K = randomInt(s + 1, s + 10);
      examples.push({
        id: i,
        title: `Ejemplo M/M/S/K ${i}`,
        statement: `${place} tiene ${s} servidores y una sala de espera limitada. En total el sistema admite máximo ${K} ${entity}. Las llegadas son ${lambda}/hora y el servicio ${mu}/hora por servidor. Evalúe el sistema.`,
        modelType: 'mmsk',
        lambda, mu, s, maxK: K, maxN: ''
      });
    } else if (method === 'md1') {
      let mu = randomInt(lambda + 1, lambda + 20);
      examples.push({
        id: i,
        title: `Ejemplo M/D/1 ${i}`,
        statement: `${place} atiende a ${lambda} ${entity}/hora de forma constante (tiempo de servicio determinístico). El servidor procesa exactamente ${mu} ${entity}/hora. Calcule la longitud de la cola.`,
        method: 'md1',
        lambda, mu, s: 1, maxK: '', maxN: ''
      });
    } else if (method === 'birth-death') {
      let N = randomInt(3, 6);
      let bLambdas = Array.from({length: N}, () => randomInt(5, 20));
      let bMus = [0, ...Array.from({length: N}, () => randomInt(10, 25))]; // Index 1 to N are the actual mu values
      examples.push({
        id: i,
        title: `Nacimiento y Muerte ${i}`,
        statement: `Un sistema con capacidad máxima de ${N} estados donde las tasas de llegada (λ) y servicio (μ) varían según el estado del sistema. Determine la probabilidad de cada estado y las medidas de desempeño generales.`,
        method: 'birth-death',
        bdN: N, bdLambdas: bLambdas, bdMus: bMus
      });
    } else if (method === 'markov') {
      let N = randomInt(3, 5);
      let matrix = [];
      for (let r = 0; r < N; r++) {
        let row = Array.from({length: N}, () => Math.random());
        let sum = row.reduce((a,b) => a+b, 0);
        matrix.push(row.map(x => Number((x/sum).toFixed(2))));
        // Adjust last element to ensure sum is exactly 1
        let actSum = matrix[r].slice(0, N-1).reduce((a,b) => a+b, 0);
        matrix[r][N-1] = Number((1 - actSum).toFixed(2));
      }
      let initial = Array(N).fill(0);
      initial[0] = 1;
      examples.push({
        id: i,
        title: `Cadena de Markov ${i}`,
        statement: `Se modela un proceso estocástico con ${N} estados posibles. Dada la matriz de transición P y asumiendo que inicia en el estado 0, proyecte el estado futuro en n iteraciones y determine las probabilidades de estado estable.`,
        method: 'markov',
        markovN: N, markovMatrix: matrix, markovInitial: initial, markovSteps: randomInt(3, 10)
      });
    } else {
       // fallback para otros
       let mu = randomInt(lambda + 1, lambda + 20);
       examples.push({
         id: i, title: `Ejemplo ${method} ${i}`,
         statement: `${place} recibe ${lambda} llegadas. Servicio ${mu}.`,
         modelType: method, lambda, mu, s: 1, maxK: '', maxN: ''
       });
    }
  }
  return examples;
}

// ─── DECISIONES ───
const decisionContexts = ['Lanzar nuevo producto', 'Invertir en bolsa', 'Abrir nueva sucursal', 'Comprar maquinaria', 'Desarrollar software'];
const decisionStates = [['Demanda Alta', 'Demanda Media', 'Demanda Baja'], ['Mercado Alcista', 'Mercado Estable', 'Mercado Bajista'], ['Éxito', 'Moderado', 'Fracaso']];

export function generateDecisionExamples(method, count = 5) {
  const examples = [];
  for (let i = 1; i <= count; i++) {
    const context = randomItem(decisionContexts);
    const states = randomItem(decisionStates);
    
    if (method === 'incertidumbre' || method === 'riesgo') {
      const isRiesgo = method === 'riesgo';
      const matrix = [
        [randomInt(-500, 2000), randomInt(0, 1000), randomInt(-1000, 500)],
        [randomInt(0, 1500), randomInt(200, 800), randomInt(-500, 0)],
        [randomInt(500, 1000), randomInt(400, 600), randomInt(100, 300)]
      ];
      const probabilities = isRiesgo ? [0.33, 0.33, 0.34] : [0.33, 0.33, 0.34];
      examples.push({
        id: i,
        title: `Ejemplo ${isRiesgo ? 'Riesgo' : 'Incertidumbre'} ${i}`,
        statement: `La empresa considera ${context}. Tiene 3 alternativas con 3 estados de la naturaleza (${states.join(', ')}). Determine la mejor decisión bajo el modelo de ${isRiesgo ? 'riesgo (valor esperado)' : 'incertidumbre'}.`,
        method,
        isCost: randomItem([true, false]),
        matrix,
        probabilities,
      });
    } else if (method === 'arbol') {
      // Un árbol de ejemplo
      const treeData = {
        id: '1', name: 'Decisión Inicial', type: 'decision',
        children: [
          {
            id: '2', name: 'Alternativa 1', type: 'chance',
            children: [
              { id: '3', name: 'Probabilidad Alta', type: 'terminal', value: randomInt(1000, 5000), prob: 0.6 },
              { id: '4', name: 'Probabilidad Baja', type: 'terminal', value: randomInt(-1000, 500), prob: 0.4 }
            ]
          },
          {
            id: '5', name: 'Alternativa 2', type: 'chance',
            children: [
              { id: '6', name: 'Probabilidad Única', type: 'terminal', value: randomInt(500, 2000), prob: 1 }
            ]
          }
        ]
      };
      examples.push({
        id: i,
        title: `Ejemplo Árbol ${i}`,
        statement: `Construya y evalúe el árbol de decisión para ${context} para maximizar el valor esperado.`,
        method: 'arbol',
        treeData
      });
    }
  }
  return examples;
}
