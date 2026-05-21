export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateExercise(id, forceBalanced = false) {
  const rows = getRandomInt(3, 5); // Orígenes
  const cols = getRandomInt(3, 5); // Destinos

  const costs = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(getRandomInt(1, 30));
    }
    costs.push(row);
  }

  const supply = [];
  let totalSupply = 0;
  for (let i = 0; i < rows; i++) {
    const s = getRandomInt(10, 100);
    supply.push(s);
    totalSupply += s;
  }

  const demand = [];
  let totalDemand = 0;
  for (let i = 0; i < cols - 1; i++) {
    const d = getRandomInt(10, 80);
    demand.push(d);
    totalDemand += d;
  }

  const isBalanced = forceBalanced || Math.random() > 0.5;

  if (isBalanced) {
    let remainingDemand = totalSupply - totalDemand;
    if (remainingDemand <= 0) {
        remainingDemand = getRandomInt(10, 50);
        supply[rows-1] += (totalDemand + remainingDemand) - totalSupply; 
        totalSupply = totalDemand + remainingDemand;
    }
    demand.push(remainingDemand);
    totalDemand += remainingDemand;
  } else {
    demand.push(getRandomInt(10, 100));
    totalDemand = demand.reduce((a, b) => a + b, 0);
  }

  return {
    id,
    name: `Ejercicio ${id}`,
    rows,
    cols,
    costs,
    supply,
    demand,
    totalSupply,
    totalDemand,
    isBalanced: totalSupply === totalDemand
  };
}

export function generateBatch(count = 5) {
  const batch = [];
  batch.push(generateExercise(1, true));
  batch.push(generateExercise(2, false));
  for (let i = 3; i <= count; i++) {
    batch.push(generateExercise(i));
  }
  return batch;
}
