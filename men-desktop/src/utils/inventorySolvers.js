export function solveEOQ(D, Co, Ch) {
  if (D <= 0 || Co <= 0 || Ch <= 0) {
    throw new Error('Todos los parámetros deben ser mayores a 0');
  }

  const Q = Math.sqrt((2 * D * Co) / Ch);
  const N = D / Q;
  const T_years = Q / D;
  const T_days = T_years * 365;
  const CT = (D / Q) * Co + (Q / 2) * Ch;

  const steps = [
    {
      title: "Paso 1: Cantidad Económica de Pedido (Q*)",
      math: `Q^* = \\sqrt{\\frac{2 \\cdot D \\cdot C_o}{C_h}} = \\sqrt{\\frac{2 \\cdot ${D} \\cdot ${Co}}{${Ch}}} = ${Q.toFixed(4)}`,
      desc: "Representa el volumen ideal que debes ordenar cada vez para minimizar los costos de inventario."
    },
    {
      title: "Paso 2: Número de pedidos (N)",
      math: `N = \\frac{D}{Q^*} = \\frac{${D}}{${Q.toFixed(4)}} = ${N.toFixed(4)}`,
      desc: "La cantidad de veces al año que tendrás que hacer un nuevo pedido."
    },
    {
      title: "Paso 3: Tiempo entre pedidos (T años)",
      math: `T = \\frac{Q^*}{D} = \\frac{${Q.toFixed(4)}}{${D}} = ${T_years.toFixed(4)}`,
      desc: "El lapso de tiempo en años que dura un pedido en agotarse."
    },
    {
      title: "Paso 4: Tiempo entre pedidos (T días)",
      math: `T_{dias} = T \\cdot 365 = ${T_years.toFixed(4)} \\cdot 365 = ${T_days.toFixed(4)}`,
      desc: "Expresa el lapso de tiempo anterior en un formato más comprensible (días)."
    },
    {
      title: "Paso 5: Costo Total (CT)",
      math: `CT = \\left(\\frac{D}{Q^*}\\right)C_o + \\left(\\frac{Q^*}{2}\\right)C_h = ${CT.toFixed(4)}`,
      desc: "El costo mínimo anualizado considerando ordenar y mantener el inventario."
    }
  ];

  const conclusion = `De acuerdo al modelo EOQ clásico, la empresa debe realizar pedidos de ${Q.toFixed(2)} unidades cada vez. De esta forma, se realizarán aproximadamente ${N.toFixed(2)} pedidos al año, con un espaciamiento de ${T_days.toFixed(2)} días entre cada pedido. Esta política garantiza el menor costo posible, siendo el Costo Total Anual de Inventario de $${CT.toFixed(2)}.`;

  return { Q, N, T_years, T_days, CT, steps, conclusion };
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
  const CT = costOrdering + costHolding + costShortage;

  const steps = [
    {
      title: "Paso 1: Factor de penalización",
      math: `\\text{Factor} = \\frac{C_h + C_f}{C_f} = \\frac{${Ch} + ${Cf}}{${Cf}} = ${((Ch + Cf) / Cf).toFixed(4)}`,
      desc: "Relación entre el costo de mantener inventario y el costo de penalización por faltantes."
    },
    {
      title: "Paso 2: Cantidad de Pedido (Q*)",
      math: `Q^* = \\sqrt{\\frac{2 \\cdot D \\cdot C_o}{C_h} \\cdot \\text{Factor}} = ${Q.toFixed(4)}`,
      desc: "Volumen ideal a ordenar compensando los costos de mantener con las multas de faltantes permitidos."
    },
    {
      title: "Paso 3: Faltante Máximo Permitido (S*)",
      math: `S^* = Q^* \\cdot \\left(\\frac{C_h}{C_h + C_f}\\right) = ${S.toFixed(4)}`,
      desc: "Máxima cantidad de unidades que la empresa se permitirá no tener en stock intencionalmente antes de resurtir."
    },
    {
      title: "Paso 4: Inventario Máximo (Imax)",
      math: `I_{max} = Q^* - S^* = ${Q.toFixed(4)} - ${S.toFixed(4)} = ${Imax.toFixed(4)}`,
      desc: "El nivel máximo de stock físico que se alcanzará en el almacén al recibir un pedido y saldar los faltantes."
    },
    {
      title: "Paso 5: Costo de Ordenar",
      math: `\\text{Costo Ordenar} = \\left(\\frac{D}{Q^*}\\right) C_o = ${costOrdering.toFixed(4)}`,
      desc: "El gasto anual exclusivo de emitir órdenes de compra."
    },
    {
      title: "Paso 6: Costo de Mantener",
      math: `\\text{Costo Mantener} = \\frac{(Q^* - S^*)^2}{2Q^*} \\cdot C_h = ${costHolding.toFixed(4)}`,
      desc: "El gasto anual por tener unidades guardadas."
    },
    {
      title: "Paso 7: Costo de Faltantes",
      math: `\\text{Costo Faltantes} = \\frac{(S^*)^2}{2Q^*} \\cdot C_f = ${costShortage.toFixed(4)}`,
      desc: "El costo anual por multas o pérdidas de venta por no tener producto."
    },
    {
      title: "Paso 8: Sumar Costo Total (CT)",
      math: `CT = ${costOrdering.toFixed(2)} + ${costHolding.toFixed(2)} + ${costShortage.toFixed(2)} = ${CT.toFixed(4)}`,
      desc: "Costo mínimo total óptimo."
    }
  ];

  const conclusion = `Bajo la política de permitir déficits, lo óptimo es pedir ${Q.toFixed(2)} unidades, permitiendo a propósito que falten ${S.toFixed(2)} unidades antes de que llegue el pedido. El inventario físico máximo real que se alcanzará en bodega es de ${Imax.toFixed(2)} unidades. Esta estrategia asume costos de pedido, mantenimiento y multas por retraso sumando un Costo Total optimizado de $${CT.toFixed(2)}.`;

  return { Q, S, Imax, CT, costOrdering, costHolding, costShortage, steps, conclusion };
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
  
  const CT = (D / Q) * Co + (Imax / 2) * Ch;

  const steps = [
    {
      title: "Paso 1: Factor de utilización de producción",
      math: `\\text{Factor} = 1 - \\frac{d}{p} = 1 - \\frac{${d}}{${p}} = ${(1 - (d / p)).toFixed(4)}`,
      desc: "Proporción del inventario que no se consume inmediatamente durante la producción."
    },
    {
      title: "Paso 2: Lote de Producción (Q*)",
      math: `Q^* = \\sqrt{\\frac{2 \\cdot D \\cdot C_o}{C_h \\cdot \\text{Factor}}} = ${Q.toFixed(4)}`,
      desc: "Tamaño ideal de lote de fabricación para minimizar costos."
    },
    {
      title: "Paso 3: Inventario Máximo (Imax)",
      math: `I_{max} = Q^* \\cdot \\text{Factor} = ${Q.toFixed(4)} \\cdot ${(1 - (d / p)).toFixed(4)} = ${Imax.toFixed(4)}`,
      desc: "Nivel más alto de stock que se acumulará antes de apagar las máquinas."
    },
    {
      title: "Paso 4: Duración de producción (tp)",
      math: `t_p = \\frac{Q^*}{p} = \\frac{${Q.toFixed(4)}}{${p}} = ${tp.toFixed(4)}`,
      desc: "Tiempo activo de las máquinas en cada ciclo."
    },
    {
      title: "Paso 5: Número de corridas (N)",
      math: `N = \\frac{D}{Q^*} = \\frac{${D}}{${Q.toFixed(4)}} = ${N.toFixed(4)}`,
      desc: "Frecuencia de lotes al año."
    },
    {
      title: "Paso 6: Costo Total (CT)",
      math: `CT = \\left(\\frac{D}{Q^*}\\right)C_o + \\left(\\frac{I_{max}}{2}\\right)C_h = ${CT.toFixed(4)}`,
      desc: "Costo de las configuraciones de máquina (setups) y almacenamiento de inventario."
    }
  ];

  const conclusion = `Para que la fábrica opere al menor costo sin interrumpir las ventas, debe programar lotes u órdenes de fabricación de ${Q.toFixed(2)} unidades por corrida. Se efectuarán ${N.toFixed(2)} corridas de producción al año. Cada corrida tomará ${tp.toFixed(4)} años en completarse. El inventario máximo en planta será de ${Imax.toFixed(2)} unidades. Costo Total asociado: $${CT.toFixed(2)}.`;

  return { Q, Imax, tp, N, CT, steps, conclusion };
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
    
    // Si justo el elemento pasa el 80% y antes estaba por debajo, entra en A (criterio estándar más inclusivo).
    // Para simplificar usamos un límite rígido.

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
      math: `\\text{VMA} = D \\cdot C`,
      desc: `Se multiplicó la Demanda por el Costo Unitario para determinar el Valor Monetario Anual de cada uno de los ${items.length} artículos.`
    },
    {
      title: "Paso 2: Calcular VMA Total",
      math: `\\text{VMA}_{total} = \\sum \\text{VMA} = ${totalVMA.toFixed(2)}`,
      desc: `Sumatoria total que representa el 100% de la inversión económica del almacén.`
    },
    {
      title: "Paso 3: Clasificación Zona A",
      math: `\\text{Artículos A} \\le 80\\% \\text{ del } \\text{VMA}_{total}`,
      desc: `Se asignó prioridad A a los productos de más impacto que concentran hasta ~80% de los costos.`
    },
    {
      title: "Paso 4: Clasificación Zona B",
      math: `80\\% < \\text{Artículos B} \\le 95\\%`,
      desc: `Los artículos con impacto intermedio conforman la zona B.`
    },
    {
      title: "Paso 5: Clasificación Zona C",
      math: `\\text{Artículos C} > 95\\%`,
      desc: `El resto de los artículos, generalmente gran volumen pero bajísimo costo, caen en C.`
    }
  ];

  const conclusion = `El sistema ha clasificado el inventario con éxito. Se determinó que ${classA} artículo(s) pertenecen a la Clase A, y por ende, representan la mayor inversión económica y requieren un control estricto de inventario. Hay ${classB} artículo(s) Clase B y ${classC} artículo(s) Clase C. Enfoca tus políticas de compras y resurtido según esta prioridad para optimizar gastos.`;

  return { items: result, totalVMA, steps, conclusion };
}
