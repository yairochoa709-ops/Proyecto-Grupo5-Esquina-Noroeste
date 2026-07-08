// matrix: arreglo de arreglos. Ej: matrix[i][j] = valor de Alternativa i, Estado j
export function solveDecisionsUncertainty(matrix, isCost = false) {
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    throw new Error('Matriz vacía o inválida');
  }

  const numAlts = matrix.length;
  const numStates = matrix[0].length;

  const results = [];

  for (let i = 0; i < numAlts; i++) {
    const row = matrix[i];
    const maxVal = Math.max(...row);
    const minVal = Math.min(...row);
    const sum = row.reduce((acc, val) => acc + val, 0);
    const avg = sum / numStates;

    results.push({
      altIndex: i,
      maxVal,
      minVal,
      laplace: avg
    });
  }

  // Encontrar la mejor alternativa para cada criterio
  // Si isCost = true, buscamos el MINIMO. Si isCost = false (Ganancia), buscamos el MAXIMO.

  const bestMaximax = isCost 
    ? Math.min(...results.map(r => r.minVal)) // Minimin para costos
    : Math.max(...results.map(r => r.maxVal)); // Maximax para ganancias

  const bestMaximin = isCost
    ? Math.min(...results.map(r => r.maxVal)) // Minimax para costos
    : Math.max(...results.map(r => r.minVal)); // Maximin para ganancias

  const bestLaplace = isCost
    ? Math.min(...results.map(r => r.laplace)) // Min Laplace para costos
    : Math.max(...results.map(r => r.laplace)); // Max Laplace para ganancias

  const optimalMaximax = results.filter(r => (isCost ? r.minVal : r.maxVal) === bestMaximax).map(r => r.altIndex);
  const optimalMaximin = results.filter(r => (isCost ? r.maxVal : r.minVal) === bestMaximin).map(r => r.altIndex);
  const optimalLaplace = results.filter(r => r.laplace === bestLaplace).map(r => r.altIndex);

  const enfoqueLabel = isCost ? "\\text{Minimizar Costos}" : "\\text{Maximizar Ganancias}";

  const steps = [
    {
      title: "Paso 1: Identificar el enfoque",
      math: "\\text{Enfoque Actual: } " + enfoqueLabel,
      desc: "Determina si el objetivo es buscar el valor numérico más alto (ganancias) o el más bajo (costos)."
    },
    {
      title: "Paso 2: Criterio Maximax (Optimista)",
      math: "\\text{Mejor Alternativa: } A_{" + optimalMaximax.map(i => i+1).join(", A_") + "} = " + bestMaximax,
      desc: "Para cada alternativa, encuentra el mejor escenario posible. Luego, elige el mejor de todos esos escenarios."
    },
    {
      title: "Paso 3: Criterio Maximin (Pesimista)",
      math: "\\text{Mejor Alternativa: } A_{" + optimalMaximin.map(i => i+1).join(", A_") + "} = " + bestMaximin,
      desc: "Para cada alternativa, encuentra el peor escenario posible. Luego, elige el 'mejor de los peores' (el mal menor)."
    },
    {
      title: "Paso 4: Criterio Laplace (Equiprobable)",
      math: "\\text{Mejor Alternativa: } A_{" + optimalLaplace.map(i => i+1).join(", A_") + "} = " + bestLaplace.toFixed(2),
      desc: "Asume que todos los estados tienen la misma probabilidad (1/" + numStates + ") y promedia cada alternativa. Luego elige el mejor promedio."
    }
  ];

  const conclusion = `Bajo un escenario de incertidumbre absoluta (sin probabilidades), la recomendación varía según el perfil del tomador de decisiones. Un gerente optimista debería elegir la Alternativa A${optimalMaximax.map(i => i+1).join(' o A')} esperando el mejor resultado posible (${bestMaximax}). Un gerente conservador/pesimista debería ir por la Alternativa A${optimalMaximin.map(i => i+1).join(' o A')} asegurando al menos ${bestMaximin} en el peor de los casos. Si se asume que todos los eventos son igual de probables, la decisión más balanceada es la Alternativa A${optimalLaplace.map(i => i+1).join(' o A')}.`;

  return {
    results,
    optimalMaximax,
    optimalMaximin,
    optimalLaplace,
    bestMaximax,
    bestMaximin,
    bestLaplace,
    steps,
    conclusion
  };
}

export function solveDecisionsRisk(matrix, probabilities, isCost = false) {
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    throw new Error('Matriz vacía o inválida');
  }
  if (!probabilities || probabilities.length !== matrix[0].length) {
    throw new Error('Las probabilidades deben coincidir con el número de estados');
  }
  
  // Validar suma de probabilidades == 1 (con margen de error)
  const sumProb = probabilities.reduce((a, b) => a + b, 0);
  if (Math.abs(sumProb - 1.0) > 0.001) {
    throw new Error('Las probabilidades deben sumar 1');
  }

  const results = [];
  
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    let vme = 0;
    for (let j = 0; j < row.length; j++) {
      vme += row[j] * probabilities[j];
    }
    results.push({ altIndex: i, vme });
  }

  const bestVME = isCost
    ? Math.min(...results.map(r => r.vme))
    : Math.max(...results.map(r => r.vme));

  const optimalVME = results.filter(r => r.vme === bestVME).map(r => r.altIndex);

  const enfoqueLabel = isCost ? "\\text{Costos}" : "\\text{Ganancias}";

  const steps = [
    {
      title: "Paso 1: Validar parámetros",
      math: "\\sum \\text{Probabilidades} = " + sumProb.toFixed(2) + " \\quad | \\quad \\text{Enfoque: } " + enfoqueLabel,
      desc: "Verifica que la suma de probabilidades sea el 100% (1.0) y define el objetivo a minimizar o maximizar."
    },
    ...results.map(r => {
      const row = matrix[r.altIndex];
      const sumStr = row.map((val, idx) => "(" + val + " \\cdot " + probabilities[idx] + ")").join(' + ');
      return {
        title: "Paso " + (r.altIndex + 2) + ": Valor Monetario Esperado A" + (r.altIndex + 1),
        math: "\\text{VME}_{A" + (r.altIndex + 1) + "} = " + sumStr + " = " + r.vme.toFixed(2),
        desc: "Multiplica cada resultado de la alternativa " + (r.altIndex + 1) + " por su probabilidad correspondiente y los suma."
      };
    }),
    {
      title: "Paso Final: Tomar la Decisión",
      math: "\\text{Decisión Óptima: } A_{" + optimalVME.map(i => i+1).join(", A_") + "} = " + bestVME.toFixed(2),
      desc: "Selecciona la alternativa con el " + (isCost ? 'menor' : 'mayor') + " VME, maximizando o minimizando el resultado a largo plazo."
    }
  ];

  const conclusion = `Integrando las probabilidades históricas o proyectadas a cada estado de la naturaleza, el Valor Monetario Esperado dictamina que la decisión más racional y rentable a largo plazo es optar por la(s) Alternativa(s) A${optimalVME.map(i => i+1).join(', A')}. Esta decisión producirá un valor esperado de ${bestVME.toFixed(2)} unidades por evento repetido.`;

  return {
    results,
    optimalVME,
    bestVME,
    steps,
    conclusion
  };
}
