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
