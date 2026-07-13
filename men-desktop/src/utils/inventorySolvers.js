export function solveEOQ(D, Co, Ch, diasHabiles = 365, L = 0, C = 0) {
  if (D <= 0 || Co <= 0 || Ch <= 0) {
    throw new Error('Todos los parámetros deben ser mayores a 0');
  }
  if (diasHabiles <= 0) {
    throw new Error('Los días hábiles por año deben ser mayores a 0');
  }

  const Q_exact = Math.sqrt((2 * D * Co) / Ch);
  const Q = Math.ceil(Q_exact);             // Redondeo de piezas (video)
  const N_exact = D / Q;
  const N = Math.ceil(N_exact);             // Redondeo de órdenes (video)
  const T_years = Q / D;
  const T_days  = diasHabiles / N;          // días hábiles entre órdenes
  const d_exact = D / diasHabiles;
  const d_daily = Math.ceil(d_exact);       // redondeo de demanda diaria
  const R  = L > 0 ? Math.ceil(d_daily * L) : null; // punto de reorden (piezas)
  const TC = (D * C) + (D / Q) * Co + (Q / 2) * Ch;

  const steps = [
    {
      title: "Paso 1: Cantidad Económica de Pedido (Q*)",
      math: "Q^* = \\sqrt{\\frac{2DK}{h}} = \\sqrt{\\frac{2 \\cdot " + D + " \\cdot " + Co + "}{" + Ch + "}} = " + Q_exact.toFixed(4) + " \\approx " + Q,
      desc: "Volumen óptimo a ordenar cada vez. Se redondea al entero superior (" + Q + " piezas)."
    },
    {
      title: "Paso 2: Número esperado de órdenes (N)",
      math: "N = \\frac{D}{Q^*} = \\frac{" + D + "}{" + Q + "} = " + N_exact.toFixed(4) + " \\approx " + N,
      desc: "Cantidad de veces al año que se colocará una nueva orden (redondeado hacia arriba)."
    },
    {
      title: "Paso 3: Demanda por día (d)",
      math: "d = \\frac{D}{\\text{Días hábiles}} = \\frac{" + D + "}{" + diasHabiles + "} = " + d_exact.toFixed(4) + " \\approx " + d_daily,
      desc: "Unidades demandadas por día hábil (redondeado a la pieza superior)."
    },
    {
      title: "Paso 4: Tiempo esperado entre órdenes (T)",
      math: "T = \\frac{\\text{Días hábiles}}{N} = \\frac{" + diasHabiles + "}{" + N + "} = " + T_days.toFixed(4) + " \\text{ días}",
      desc: "Número de días hábiles que transcurren entre una orden y la siguiente."
    },
    ...(R !== null ? [{
      title: "Paso 5: Punto de Reorden (R)",
      math: "R = d \\times L = " + d_daily + " \\times " + L + " = " + (d_daily * L) + " \\approx " + R,
      desc: "Nivel de inventario en el que se debe colocar una nueva orden para recibirla justo a tiempo, considerando el tiempo de entrega L = " + L + " días (redondeado)."
    }] : []),
    {
      title: R !== null ? "Paso 6: Costo Total Anual (TC)" : "Paso 5: Costo Total Anual (TC)",
      math: "TC = D \\cdot C + \\frac{D}{Q^*} K + \\frac{Q^*}{2} h = (" + D + " \\cdot " + C + ") + \\frac{" + D + "}{" + Q + "} \\cdot " + Co + " + \\frac{" + Q + "}{2} \\cdot " + Ch + " = " + TC.toFixed(4),
      desc: C > 0 ? "Costo anual incluyendo adquisición de material, órdenes y mantenimiento." : "Costo mínimo anualizado sumando el costo de ordenar y el costo de mantener inventario."
    }
  ];

  const conclusionR = R !== null
    ? ` El punto de reorden es R = ${R.toFixed(2)} unidades (se debe hacer el pedido cuando el inventario llegue a ese nivel).`
    : '';
  const conclusion = `De acuerdo al modelo EOQ clásico, la empresa debe realizar pedidos de ${Q.toFixed(2)} unidades cada vez. Se realizarán ${N.toFixed(2)} órdenes al año, con ${T_days.toFixed(2)} días hábiles entre cada orden. La demanda diaria es de ${d_daily.toFixed(4)} unidades/día.${conclusionR} El Costo Total Anual (TC) es $${TC.toFixed(2)}.`;

  const chartData = buildInventoryChartData({ type: 'eoq', Q, T_years, N });
  return { Q, N, T_years, T_days, d_daily, R, CT: TC, TC, steps, conclusion, chartData };
}

export function solveEOQBackorders(D, Co, Ch, Cf) {
  if (D <= 0 || Co <= 0 || Ch <= 0 || Cf <= 0) {
    throw new Error('Todos los parámetros deben ser mayores a 0');
  }

  const Q = Math.sqrt(((2 * D * Co) / Ch) * ((Ch + Cf) / Cf));
  const S = Q * (Ch / (Ch + Cf));
  const Imax = Q - S;

  const costOrdering = (D / Q) * Co;
  const costHolding = (Math.pow(Q - S, 2) / (2 * Q)) * Ch;
  const costShortage = (Math.pow(S, 2) / (2 * Q)) * Cf;
  const TC = costOrdering + costHolding + costShortage;

  const steps = [
    {
      title: "Paso 1: Factor de penalización",
      math: "\\text{Factor} = \\frac{h + C_f}{C_f} = \\frac{" + Ch + " + " + Cf + "}{" + Cf + "} = " + ((Ch + Cf) / Cf).toFixed(4),
      desc: "Relación entre el costo de mantener inventario (h) y el costo de penalización por faltantes."
    },
    {
      title: "Paso 2: Cantidad de Pedido (Q*)",
      math: "Q^* = \\sqrt{\\frac{2 \\cdot D \\cdot K}{h} \\cdot \\text{Factor}} = " + Q.toFixed(4),
      desc: "Volumen ideal a ordenar compensando los costos de mantener con las multas de faltantes permitidos."
    },
    {
      title: "Paso 3: Faltante Máximo Permitido (S*)",
      math: "S^* = Q^* \\cdot \\left(\\frac{h}{h + C_f}\\right) = " + S.toFixed(4),
      desc: "Máxima cantidad de unidades que la empresa se permitirá no tener en stock intencionalmente antes de resurtir."
    },
    {
      title: "Paso 4: Inventario Máximo (Imax)",
      math: "I_{max} = Q^* - S^* = " + Q.toFixed(4) + " - " + S.toFixed(4) + " = " + Imax.toFixed(4),
      desc: "El nivel máximo de stock físico que se alcanzará en el almacén al recibir un pedido y saldar los faltantes."
    },
    {
      title: "Paso 5: Costo de Ordenar",
      math: "\\text{Costo Ordenar} = \\frac{D}{Q^*} K = " + costOrdering.toFixed(4),
      desc: "El gasto anual exclusivo de emitir órdenes de compra."
    },
    {
      title: "Paso 6: Costo de Mantener",
      math: "\\text{Costo Mantener} = \\frac{(Q^* - S^*)^2}{2Q^*} \\cdot h = " + costHolding.toFixed(4),
      desc: "El gasto anual por tener unidades guardadas."
    },
    {
      title: "Paso 7: Costo de Faltantes",
      math: "\\text{Costo Faltantes} = \\frac{(S^*)^2}{2Q^*} \\cdot C_f = " + costShortage.toFixed(4),
      desc: "El costo anual por multas o pérdidas de venta por no tener producto."
    },
    {
      title: "Paso 8: Costo Total Anual (TC)",
      math: "TC = " + costOrdering.toFixed(2) + " + " + costHolding.toFixed(2) + " + " + costShortage.toFixed(2) + " = " + TC.toFixed(4),
      desc: "Costo mínimo total óptimo."
    }
  ];

  const conclusion = `Bajo la política de permitir déficits, lo óptimo es pedir ${Q.toFixed(2)} unidades, permitiendo a propósito que falten ${S.toFixed(2)} unidades antes de que llegue el pedido. El inventario físico máximo real que se alcanzará en bodega es de ${Imax.toFixed(2)} unidades. Esta estrategia asume costos de pedido (K), mantenimiento (h) y multas por retraso sumando un Costo Total (TC) optimizado de $${TC.toFixed(2)}.`;

  const N = D / Q;
  const T_years = Q / D;
  const chartData = buildInventoryChartData({ type: 'backorders', Q, T_years, N, S, Imax });
  return { Q, S, Imax, CT: TC, TC, costOrdering, costHolding, costShortage, steps, conclusion, chartData };
}

export function solveEPQ(D, Co, Ch, p, d) {
  if (D <= 0 || Co <= 0 || Ch <= 0 || p <= 0 || d <= 0) {
    throw new Error('Todos los parámetros deben ser mayores a 0');
  }
  if (p <= d) {
    throw new Error('La tasa de producción (p) debe ser mayor a la tasa de demanda (d)');
  }

  const Q = Math.sqrt((2 * D * Co) / (Ch * (1 - (d / p))));
  const Imax = Q * (1 - (d / p));
  const tp = Q / p;
  const N = D / Q;

  const TC = (D / Q) * Co + (Imax / 2) * Ch;

  const steps = [
    {
      title: "Paso 1: Factor de utilización de producción",
      math: "\\text{Factor} = 1 - \\frac{d}{p} = 1 - \\frac{" + d + "}{" + p + "} = " + (1 - (d / p)).toFixed(4),
      desc: "Proporción del inventario que no se consume inmediatamente durante la producción."
    },
    {
      title: "Paso 2: Lote de Producción (Q*)",
      math: "Q^* = \\sqrt{\\frac{2 \\cdot D \\cdot K}{h \\cdot \\text{Factor}}} = " + Q.toFixed(4),
      desc: "Tamaño ideal de lote de fabricación para minimizar costos."
    },
    {
      title: "Paso 3: Inventario Máximo (Imax)",
      math: "I_{max} = Q^* \\cdot \\text{Factor} = " + Q.toFixed(4) + " \\cdot " + (1 - (d / p)).toFixed(4) + " = " + Imax.toFixed(4),
      desc: "Nivel más alto de stock que se acumulará antes de apagar las máquinas."
    },
    {
      title: "Paso 4: Duración de producción (tp)",
      math: "t_p = \\frac{Q^*}{p} = \\frac{" + Q.toFixed(4) + "}{" + p + "} = " + tp.toFixed(4),
      desc: "Tiempo activo de las máquinas en cada ciclo."
    },
    {
      title: "Paso 5: Número de corridas (N)",
      math: "N = \\frac{D}{Q^*} = \\frac{" + D + "}{" + Q.toFixed(4) + "} = " + N.toFixed(4),
      desc: "Frecuencia de lotes al año."
    },
    {
      title: "Paso 6: Costo Total Anual (TC)",
      math: "TC = \\frac{D}{Q^*} K + \\frac{I_{max}}{2} h = " + TC.toFixed(4),
      desc: "Costo de las configuraciones de máquina (setups) y almacenamiento de inventario."
    }
  ];

  const conclusion = `Para que la fábrica opere al menor costo sin interrumpir las ventas, debe programar lotes u órdenes de fabricación de ${Q.toFixed(2)} unidades por corrida. Se efectuarán ${N.toFixed(2)} corridas de producción al año. Cada corrida tomará ${tp.toFixed(4)} años en completarse. El inventario máximo en planta será de ${Imax.toFixed(2)} unidades. Costo Total Anual (TC): $${TC.toFixed(2)}.`;

  const T_years = Q / D;
  const chartData = buildInventoryChartData({ type: 'epq', Q, T_years, N, Imax, tp, p, d });
  return { Q, Imax, tp, N, CT: TC, TC, steps, conclusion, chartData };
}

export function classifyABC(items) {
  // items = [{ id, name, D, C }, ...]
  const computedItems = items.map(item => {
    const vma = item.D * item.C;
    return { ...item, vma };
  });

  computedItems.sort((a, b) => b.vma - a.vma);

  const totalVMA = computedItems.reduce((sum, item) => sum + item.vma, 0);

  let accumulatedVMA = 0;
  const result = computedItems.map((item, index) => {
    accumulatedVMA += item.vma;
    const vmaPercentage = (item.vma / totalVMA) * 100;
    const accumulatedPercentage = (accumulatedVMA / totalVMA) * 100;

    let zone = 'C';
    if (accumulatedPercentage <= 80) zone = 'A';
    else if (accumulatedPercentage <= 95) zone = 'B';

    return {
      ...item,
      vmaPercentage,
      accumulatedPercentage,
      zone
    };
  });

  const classA = result.filter(r => r.zone === 'A').length;
  const classB = result.filter(r => r.zone === 'B').length;
  const classC = result.filter(r => r.zone === 'C').length;

  const steps = [
    {
      title: "Paso 1: Calcular VMA individual",
      math: "\\text{VMA} = D \\cdot C",
      desc: "Se multiplicó la Demanda por el Costo Unitario para determinar el Valor Monetario Anual de cada uno de los " + items.length + " artículos."
    },
    {
      title: "Paso 2: Calcular VMA Total",
      math: "\\text{VMA}_{total} = \\sum \\text{VMA} = " + totalVMA.toFixed(2),
      desc: "Sumatoria total que representa el 100% de la inversión económica del almacén."
    },
    {
      title: "Paso 3: Clasificación Zona A",
      math: "\\text{Artículos A} \\le 80\\% \\text{ del } \\text{VMA}_{total}",
      desc: "Se asignó prioridad A a los productos de más impacto que concentran hasta ~80% de los costos."
    },
    {
      title: "Paso 4: Clasificación Zona B",
      math: "80\\% < \\text{Artículos B} \\le 95\\%",
      desc: "Los artículos con impacto intermedio conforman la zona B."
    },
    {
      title: "Paso 5: Clasificación Zona C",
      math: "\\text{Artículos C} > 95\\%",
      desc: "El resto de los artículos, generalmente gran volumen pero bajísimo costo, caen en C."
    }
  ];

  const conclusion = `El sistema ha clasificado el inventario con éxito. Se determinó que ${classA} artículo(s) pertenecen a la Clase A, y por ende, representan la mayor inversión económica y requieren un control estricto de inventario. Hay ${classB} artículo(s) Clase B y ${classC} artículo(s) Clase C. Enfoca tus políticas de compras y resurtido según esta prioridad para optimizar gastos.`;

  return { items: result, totalVMA, steps, conclusion };
}

/**
 * Genera los datos de la gráfica de comportamiento de inventario (diente de sierra).
 * Devuelve un array de puntos { t, inventario, promedio } listos para Recharts.
 * Se representan 3 ciclos completos para que la gráfica se vea bien.
 */
export function buildInventoryChartData({ type, Q, T_years, N, S = 0, Imax, tp, p, d }) {
  const cycles = Math.min(Math.ceil(N), 5); // máximo 5 ciclos
  const pointsPerCycle = 60;
  const points = [];

  const totalTime = cycles * T_years;

  for (let c = 0; c < cycles; c++) {
    const tStart = c * T_years;
    const tEnd   = (c + 1) * T_years;

    if (type === 'epq') {
      // Fase de producción (sube) + fase de consumo (baja)
      const tpCycle = tp;
      const tcCycle = T_years - tpCycle;
      const ptsProd = Math.round(pointsPerCycle * (tpCycle / T_years));
      const ptsCons = pointsPerCycle - ptsProd;

      // Producción: inventario sube de 0 a Imax
      for (let i = 0; i <= ptsProd; i++) {
        const frac = i / ptsProd;
        const t = tStart + frac * tpCycle;
        const inv = frac * Imax;
        points.push({ t: parseFloat(t.toFixed(4)), inventario: parseFloat(inv.toFixed(2)) });
      }
      // Consumo: inventario baja de Imax a 0
      for (let i = 1; i <= ptsCons; i++) {
        const frac = i / ptsCons;
        const t = tStart + tpCycle + frac * tcCycle;
        const inv = Imax * (1 - frac);
        points.push({ t: parseFloat(t.toFixed(4)), inventario: parseFloat(Math.max(0, inv).toFixed(2)) });
      }
    } else if (type === 'backorders') {
      // Inventario real sube a Imax, baja a 0, luego baja negativo a -S, sube de vuelta a 0
      const Imax_val = Imax !== undefined ? Imax : Q;
      const S_val    = S;
      const t1 = T_years * (Imax_val / Q); // tiempo en positivo
      const t2 = T_years - t1;             // tiempo en negativo (faltante)
      const pts1 = Math.round(pointsPerCycle * (t1 / T_years));
      const pts2 = pointsPerCycle - pts1;

      // Baja de Imax a 0
      for (let i = 0; i <= pts1; i++) {
        const frac = i / pts1;
        const t = tStart + frac * t1;
        const inv = Imax_val * (1 - frac);
        points.push({ t: parseFloat(t.toFixed(4)), inventario: parseFloat(inv.toFixed(2)) });
      }
      // Baja de 0 a -S (faltante)
      for (let i = 1; i <= pts2; i++) {
        const frac = i / pts2;
        const t = tStart + t1 + frac * t2;
        const inv = -S_val * frac;
        points.push({ t: parseFloat(t.toFixed(4)), inventario: parseFloat(inv.toFixed(2)) });
      }
    } else {
      // EOQ estándar: diente de sierra, baja de Q a 0
      for (let i = 0; i <= pointsPerCycle; i++) {
        const frac = i / pointsPerCycle;
        const t = tStart + frac * T_years;
        const inv = Q * (1 - frac);
        points.push({ t: parseFloat(t.toFixed(4)), inventario: parseFloat(inv.toFixed(2)) });
      }
    }
  }

  // Calcular inventario promedio para la línea horizontal
  const avgInv = type === 'backorders'
    ? (Imax !== undefined ? Imax : Q) / 2
    : type === 'epq'
      ? Imax / 2
      : Q / 2;

  // Añadir campo de promedio a todos los puntos
  return points.map(p => ({ ...p, promedio: parseFloat(avgInv.toFixed(2)) }));
}
