// Funciones auxiliares
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

// Helper para construir strings LaTeX seguros que el bundler no puede corromper
function tex(strings, ...vals) {
  let result = '';
  strings.forEach((str, i) => {
    result += str;
    if (i < vals.length) result += vals[i];
  });
  return result;
}

export function solveMM1(lambda, mu) {
  if (lambda >= mu) {
    throw new Error('El sistema es inestable (λ >= μ). La cola crecerá infinitamente.');
  }

  const rho = lambda / mu;
  const p0 = 1 - rho;
  const l = lambda / (mu - lambda);
  const lq = l * rho;
  const w = 1 / (mu - lambda);
  const wq = lambda / (mu * (mu - lambda));

  const steps = [
    {
      title: "Paso 1: Factor de utilización (ρ)",
      math: "\\rho = \\frac{\\lambda}{\\mu} = \\frac{" + lambda + "}{" + mu + "} = " + rho.toFixed(4),
      desc: "Calcula el porcentaje de tiempo que el servidor está ocupado. Debe ser menor a 1 para que el sistema sea estable."
    },
    {
      title: "Paso 2: Probabilidad de sistema vacío (P₀)",
      math: "P_0 = 1 - \\rho = 1 - " + rho.toFixed(4) + " = " + p0.toFixed(4),
      desc: "Es la probabilidad de que no haya ningún cliente en el sistema en un momento dado."
    },
    {
      title: "Paso 3: Clientes en el sistema (L)",
      math: "L = \\frac{\\lambda}{\\mu - \\lambda} = \\frac{" + lambda + "}{" + mu + " - " + lambda + "} = " + l.toFixed(4),
      desc: "Promedio de clientes totales que se encuentran en el sistema (tanto en cola como siendo atendidos)."
    },
    {
      title: "Paso 4: Clientes en cola (Lq)",
      math: "L_q = L \\cdot \\rho = " + l.toFixed(4) + " \\cdot " + rho.toFixed(4) + " = " + lq.toFixed(4),
      desc: "Promedio de clientes que están haciendo fila, esperando a ser atendidos."
    },
    {
      title: "Paso 5: Tiempo en el sistema (W)",
      math: "W = \\frac{1}{\\mu - \\lambda} = \\frac{1}{" + mu + " - " + lambda + "} = " + w.toFixed(4),
      desc: "Tiempo total promedio que un cliente pasa desde que llega hasta que termina su servicio."
    },
    {
      title: "Paso 6: Tiempo en cola (Wq)",
      math: "W_q = \\frac{\\lambda}{\\mu(\\mu - \\lambda)} = \\frac{" + lambda + "}{" + mu + "(" + mu + " - " + lambda + ")} = " + wq.toFixed(4),
      desc: "Tiempo promedio que un cliente pasa únicamente esperando en la fila antes de ser atendido."
    }
  ];

  // Calcular Pn para gráfico de barras (n = 0 a 4)
  const pnData = [];
  for (let n = 0; n <= 4; n++) {
    const pnValue = p0 * Math.pow(rho, n);
    pnData.push({ n: n.toString(), Probabilidad: Number(pnValue.toFixed(4)) });
  }

  const conclusion = `En este sistema de un solo servidor, el servidor pasa ocupado el ${(rho * 100).toFixed(2)}% del tiempo. En promedio, hay ${l.toFixed(2)} clientes en el sistema, de los cuales ${lq.toFixed(2)} están esperando en la cola. Un cliente típico pasará ${w.toFixed(2)} unidades de tiempo en el sistema, incluyendo ${wq.toFixed(2)} unidades de tiempo esperando ser atendido.`;

  return { rho, p0, l, lq, w, wq, steps, conclusion, pnData };
}

export function solveMM1K(lambda, mu, k) {
  if (k <= 0) throw new Error('La capacidad del sistema K debe ser mayor a 0');

  const rho = lambda / mu;
  let p0, l;

  if (Math.abs(lambda - mu) < 0.0001) { // lambda == mu
    p0 = 1 / (k + 1);
    l = k / 2;
  } else {
    p0 = (1 - rho) / (1 - Math.pow(rho, k + 1));
    l = (rho / (1 - rho)) - ((k + 1) * Math.pow(rho, k + 1)) / (1 - Math.pow(rho, k + 1));
  }

  const pk = p0 * Math.pow(rho, k);
  const lambdaEfec = lambda * (1 - pk);

  const w = l / lambdaEfec;
  const wq = w - (1 / mu);
  const lq = lambdaEfec * wq;

  const eqP0 = Math.abs(lambda - mu) < 0.0001
    ? "\\frac{1}{K + 1} = \\frac{1}{" + k + " + 1}"
    : "\\frac{1 - \\rho}{1 - \\rho^{K+1}} = \\frac{1 - " + rho.toFixed(4) + "}{1 - " + Math.pow(rho, k+1).toFixed(4) + "}";

  const eqL = Math.abs(lambda - mu) < 0.0001
    ? "\\frac{K}{2} = \\frac{" + k + "}{2}"
    : "\\frac{\\rho}{1 - \\rho} - \\frac{(K + 1)\\rho^{K+1}}{1 - \\rho^{K+1}}";

  const steps = [
    {
      title: "Paso 1: Utilización base (ρ)",
      math: "\\rho = \\frac{\\lambda}{\\mu} = \\frac{" + lambda + "}{" + mu + "} = " + rho.toFixed(4),
      desc: "Calcula el factor de utilización crudo. Al ser una cola finita, el sistema puede ser estable incluso si λ ≥ μ."
    },
    {
      title: "Paso 2: Probabilidad de sistema vacío (P₀)",
      math: "P_0 = " + eqP0 + " = " + p0.toFixed(4),
      desc: "Probabilidad de que el sistema esté completamente vacío."
    },
    {
      title: "Paso 3: Probabilidad de sistema lleno (Pₖ)",
      math: "P_K = P_0 \\cdot \\rho^K = " + p0.toFixed(4) + " \\cdot " + Math.pow(rho, k).toFixed(4) + " = " + pk.toFixed(4),
      desc: "Probabilidad de que la capacidad máxima (K) esté alcanzada, lo que provocará el rechazo de nuevos clientes."
    },
    {
      title: "Paso 4: Tasa de llegada efectiva (λ efec)",
      math: "\\lambda_{efec} = \\lambda(1 - P_K) = " + lambda + "(1 - " + pk.toFixed(4) + ") = " + lambdaEfec.toFixed(4),
      desc: "Representa la verdadera cantidad de clientes que logran entrar al sistema sin ser rechazados."
    },
    {
      title: "Paso 5: Clientes en sistema (L)",
      math: "L = " + eqL + " = " + l.toFixed(4),
      desc: "Promedio de clientes dentro de las instalaciones."
    },
    {
      title: "Paso 6: Tiempo en sistema (W)",
      math: "W = \\frac{L}{\\lambda_{efec}} = \\frac{" + l.toFixed(4) + "}{" + lambdaEfec.toFixed(4) + "} = " + w.toFixed(4),
      desc: "Tiempo total promedio que un cliente pasa dentro."
    },
    {
      title: "Paso 7: Tiempo en cola (Wq)",
      math: "W_q = W - \\frac{1}{\\mu} = " + w.toFixed(4) + " - \\frac{1}{" + mu + "} = " + wq.toFixed(4),
      desc: "Tiempo de espera en fila de un cliente que logró entrar."
    },
    {
      title: "Paso 8: Clientes en cola (Lq)",
      math: "L_q = \\lambda_{efec} \\cdot W_q = " + lambdaEfec.toFixed(4) + " \\cdot " + wq.toFixed(4) + " = " + lq.toFixed(4),
      desc: "Cantidad promedio de clientes esperando en la fila."
    }
  ];

  // Calcular Pn para gráfico de barras (n = 0 a 4)
  const pnData = [];
  for (let n = 0; n <= 4; n++) {
    let pnValue = 0;
    if (n <= k) {
      pnValue = p0 * Math.pow(rho, n);
    }
    pnData.push({ n: n.toString(), Probabilidad: Number(pnValue.toFixed(4)) });
  }

  const conclusion = `En este sistema con capacidad máxima de ${k} clientes, existe una probabilidad del ${(pk * 100).toFixed(2)}% de que un cliente que llegue encuentre el sistema lleno y se retire. La tasa real de clientes que entran al sistema es de ${lambdaEfec.toFixed(2)}. En promedio, habrá ${l.toFixed(2)} clientes en el sistema y el tiempo de espera total será de ${w.toFixed(2)} unidades.`;

  return { rho, p0, pk, lambdaEfec, l, lq, w, wq, steps, conclusion, pnData };
}

export function solveMMs(lambda, mu, s) {
  if (s <= 0) throw new Error('El número de servidores s debe ser mayor a 0');
  if (lambda >= s * mu) {
    throw new Error('El sistema es inestable (λ >= s * μ). La cola crecerá infinitamente.');
  }

  const rho = lambda / (s * mu);
  const r = lambda / mu; // a veces llamado razón de tráfico

  let sum = 0;
  for (let n = 0; n < s; n++) {
    sum += Math.pow(r, n) / factorial(n);
  }

  const term = Math.pow(r, s) / (factorial(s) * (1 - rho));
  const p0 = 1 / (sum + term);

  const lq = (p0 * Math.pow(r, s) * rho) / (factorial(s) * Math.pow(1 - rho, 2));
  const l = lq + r;
  const wq = lq / lambda;
  const w = wq + (1 / mu);

  const steps = [
    {
      title: "Paso 1: Utilización del sistema (ρ)",
      math: "\\rho = \\frac{\\lambda}{s \\mu} = \\frac{" + lambda + "}{" + s + " \\cdot " + mu + "} = " + rho.toFixed(4),
      desc: "Porcentaje promedio de tiempo que los servidores están ocupados colectivamente."
    },
    {
      title: "Paso 2: Razón de tráfico (r)",
      math: "r = \\frac{\\lambda}{\\mu} = \\frac{" + lambda + "}{" + mu + "} = " + r.toFixed(4),
      desc: "El número promedio de servidores que estarían ocupados si la capacidad fuera infinita."
    },
    {
      title: "Paso 3: Probabilidad de sistema vacío (P₀)",
      math: "P_0 = \\left[ \\sum_{n=0}^{s-1} \\frac{r^n}{n!} + \\frac{r^s}{s!(1 - \\rho)} \\right]^{-1} = " + p0.toFixed(4),
      desc: "Probabilidad de que todos los servidores estén inactivos simultáneamente."
    },
    {
      title: "Paso 4: Clientes en cola (Lq)",
      math: "L_q = \\frac{P_0 \\cdot r^s \\cdot \\rho}{s!(1 - \\rho)^2} = " + lq.toFixed(4),
      desc: "Promedio de clientes que no encuentran servidor libre y deben esperar en la fila compartida."
    },
    {
      title: "Paso 5: Clientes en sistema (L)",
      math: "L = L_q + r = " + lq.toFixed(4) + " + " + r.toFixed(4) + " = " + l.toFixed(4),
      desc: "Promedio total de clientes dentro de las instalaciones."
    },
    {
      title: "Paso 6: Tiempo en cola (Wq)",
      math: "W_q = \\frac{L_q}{\\lambda} = \\frac{" + lq.toFixed(4) + "}{" + lambda + "} = " + wq.toFixed(4),
      desc: "Tiempo que un cliente gasta esperando a que se desocupe alguno de los servidores."
    },
    {
      title: "Paso 7: Tiempo en sistema (W)",
      math: "W = W_q + \\frac{1}{\\mu} = " + wq.toFixed(4) + " + \\frac{1}{" + mu + "} = " + w.toFixed(4),
      desc: "Tiempo total empleado por un cliente desde que ingresa hasta que sale despachado."
    }
  ];

  // Calcular Pn para gráfico de barras (n = 0 a 4)
  const pnData = [];
  for (let n = 0; n <= 4; n++) {
    let pnValue = 0;
    if (n < s) {
      pnValue = p0 * (Math.pow(r, n) / factorial(n));
    } else {
      pnValue = p0 * (Math.pow(r, n) / (factorial(s) * Math.pow(s, n - s)));
    }
    pnData.push({ n: n.toString(), Probabilidad: Number(pnValue.toFixed(4)) });
  }

  const conclusion = `Este sistema cuenta con ${s} servidores operando en paralelo. Trabajan en conjunto al ${(rho * 100).toFixed(2)}% de su capacidad. En promedio, ${lq.toFixed(2)} clientes hacen fila esperando que alguno de los servidores se libere, lo que les toma un tiempo de espera de ${wq.toFixed(2)} unidades. El tiempo total desde que un cliente llega hasta que se va atendido es de ${w.toFixed(2)} unidades.`;

  return { rho, p0, l, lq, w, wq, steps, conclusion, pnData };
}

export function solveBirthDeath(lambdas, mus, N) {
  let c = new Array(N + 1).fill(0);
  c[0] = 1;
  let sumC = 1;
  let mathC = "C_0 = 1 \\\\ ";
  
  for (let n = 1; n <= N; n++) {
    c[n] = c[n-1] * (Number(lambdas[n-1]) / Number(mus[n]));
    sumC += c[n];
    if (n <= 3) {
      mathC += `C_{${n}} = C_{${n-1}} \\frac{\\lambda_{${n-1}}}{\\mu_{${n}}} = ${c[n].toFixed(4)} \\\\ `;
    } else if (n === 4 && N > 4) {
      mathC += "\\dots \\\\ ";
    }
  }

  const p0 = 1 / sumC;
  let p = new Array(N + 1).fill(0);
  let mathP = `P_0 = \\frac{1}{\\sum C_n} = \\frac{1}{${sumC.toFixed(4)}} = ${p0.toFixed(4)} \\\\ `;
  
  for (let n = 0; n <= N; n++) {
    p[n] = c[n] * p0;
    if (n > 0 && n <= 3) {
      mathP += `P_{${n}} = C_{${n}} P_0 = ${p[n].toFixed(4)} \\\\ `;
    }
  }

  let l = 0;
  for (let n = 1; n <= N; n++) {
    l += n * p[n];
  }

  let lambdaEfec = 0;
  for (let n = 0; n < N; n++) {
    lambdaEfec += Number(lambdas[n]) * p[n];
  }

  const w = lambdaEfec > 0 ? l / lambdaEfec : 0;

  const steps = [
    {
      title: "Paso 1: Cálculo de Coeficientes (C_n)",
      math: mathC,
      desc: "Se calculan los coeficientes C_n basados en las tasas de nacimiento y muerte para cada estado."
    },
    {
      title: "Paso 2: Probabilidades de Estado (P_n)",
      math: mathP,
      desc: "Se normalizan los coeficientes para encontrar la probabilidad de que el sistema esté en cada estado n."
    },
    {
      title: "Paso 3: Número esperado en el sistema (L)",
      math: `L = \\sum_{n=1}^{${N}} n P_n = ${l.toFixed(4)}`,
      desc: "El promedio de clientes en el sistema."
    },
    {
      title: "Paso 4: Tasa Efectiva y Tiempo Promedio (W)",
      math: `\\lambda_{efec} = \\sum \\lambda_n P_n = ${lambdaEfec.toFixed(4)} \\\\ W = \\frac{L}{\\lambda_{efec}} = ${w.toFixed(4)}`,
      desc: "El tiempo promedio que un cliente pasa en el sistema."
    }
  ];

  const pnData = [];
  for (let n = 0; n <= N; n++) {
    pnData.push({ n: n.toString(), Probabilidad: Number(p[n].toFixed(4)) });
  }

  const conclusion = `En este proceso de nacimiento y muerte con un máximo de ${N} estados, el sistema estará vacío el ${(p0 * 100).toFixed(2)}% del tiempo. En promedio, habrá ${l.toFixed(2)} clientes en el sistema, con un tiempo de permanencia medio de ${w.toFixed(2)} unidades. La tasa efectiva de entrada es ${lambdaEfec.toFixed(2)}.`;

  return { p0, l, w, lambdaEfec, p, steps, conclusion, pnData };
}

// Multiplicación de matrices
function multiplyMatrix(A, B) {
  let aNumRows = A.length, aNumCols = A[0].length,
      bNumRows = B.length, bNumCols = B[0].length,
      m = new Array(aNumRows); 
  for (let r = 0; r < aNumRows; ++r) {
    m[r] = new Array(bNumCols).fill(0);
    for (let c = 0; c < bNumCols; ++c) {
      for (let i = 0; i < aNumCols; ++i) {
        m[r][c] += A[r][i] * B[i][c];
      }
    }
  }
  return m;
}

// Eliminación de Gauss-Jordan para AX = B
function solveLinearSystem(A, B) {
  const n = A.length;
  let M = [];
  for (let i = 0; i < n; i++) {
    M.push([...A[i], B[i]]);
  }

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }
    let tmp = M[i];
    M[i] = M[maxRow];
    M[maxRow] = tmp;

    if (Math.abs(M[i][i]) < 1e-10) continue; 

    for (let k = i + 1; k < n; k++) {
      let c = -M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        if (i === j) {
          M[k][j] = 0;
        } else {
          M[k][j] += c * M[i][j];
        }
      }
    }
  }

  let x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(M[i][i]) < 1e-10) {
      x[i] = 0;
      continue;
    }
    x[i] = M[i][n] / M[i][i];
    for (let k = i - 1; k >= 0; k--) {
      M[k][n] -= M[k][i] * x[i];
    }
  }
  return x;
}

export function solveMarkovChain(matrix, initialVector, stepsCount) {
  const n = matrix.length;
  
  // 1. Probabilidades de estado a los n pasos: P(n) = P(0) * P^n
  let P_n = matrix;
  for (let i = 1; i < stepsCount; i++) {
    P_n = multiplyMatrix(P_n, matrix);
  }
  
  let stateAtN = multiplyMatrix([initialVector], P_n)[0];

  // 2. Probabilidades de estado estable (pi P = pi, sum(pi) = 1)
  let A = [];
  for (let i = 0; i < n; i++) {
    A[i] = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      A[i][j] = matrix[j][i] - (i === j ? 1 : 0);
    }
  }
  for (let j = 0; j < n; j++) {
    A[n - 1][j] = 1;
  }
  let B = new Array(n).fill(0);
  B[n - 1] = 1;

  let steadyState = solveLinearSystem(A, B);

  // 3. Tiempos medios de primer paso (M_ij)
  let firstPassage = [];
  for (let i = 0; i < n; i++) {
    firstPassage.push(new Array(n).fill(0));
  }

  for (let j = 0; j < n; j++) {
    firstPassage[j][j] = steadyState[j] > 1e-8 ? 1 / steadyState[j] : Infinity;
    
    let subA = [];
    let subB = [];
    let stateIndices = [];
    for(let i=0; i<n; i++) {
      if(i !== j) stateIndices.push(i);
    }
    
    for (let i = 0; i < stateIndices.length; i++) {
      let origI = stateIndices[i];
      let row = new Array(stateIndices.length).fill(0);
      for (let k = 0; k < stateIndices.length; k++) {
        let origK = stateIndices[k];
        row[k] = (i === k ? 1 : 0) - matrix[origI][origK];
      }
      subA.push(row);
      subB.push(1);
    }
    
    if (subA.length > 0) {
      let sol = solveLinearSystem(subA, subB);
      for (let i = 0; i < stateIndices.length; i++) {
        firstPassage[stateIndices[i]][j] = sol[i];
      }
    }
  }

  const steps = [
    {
      title: `Paso 1: Estado en t = ${stepsCount}`,
      math: `\\pi(${stepsCount}) = \\pi(0) P^{${stepsCount}}`,
      desc: `Calculando la matriz de transición a la potencia ${stepsCount} y multiplicando por el vector de estado inicial.`
    },
    {
      title: "Paso 2: Probabilidades de Estado Estable (π)",
      math: "\\pi P = \\pi, \\quad \\sum \\pi_i = 1",
      desc: "Resolviendo el sistema de ecuaciones lineales para encontrar las probabilidades a largo plazo."
    },
    {
      title: "Paso 3: Tiempos Medios de Primer Paso (M_ij)",
      math: "M_{ij} = 1 + \\sum_{k \\neq j} P_{ik} M_{kj}, \\quad M_{jj} = \\frac{1}{\\pi_j}",
      desc: "El número promedio de pasos necesarios para llegar al estado j desde el estado i por primera vez."
    }
  ];

  const pnData = [];
  for (let i = 0; i < n; i++) {
    pnData.push({ n: `E${i}`, Probabilidad: Number(steadyState[i].toFixed(4)) });
  }

  const conclusion = `La cadena de Markov converge a su estado estable a largo plazo. A los ${stepsCount} pasos, la probabilidad de estar en cada estado está dada por el vector de estado en t=${stepsCount}. El tiempo de retorno esperado para cada estado j está dado por M_jj.`;

  return { stateAtN, steadyState, firstPassage, steps, conclusion, pnData };
}

