import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportInventoryToPDF(method, inputs, result) {
  const doc = new jsPDF();
  let currentY = 15;

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`Reporte de Teoría de Inventarios`, 14, currentY);
  currentY += 10;

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`Modelo: ${method.toUpperCase()}`, 14, currentY);
  currentY += 10;

  if (inputs.statement) {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Contexto del Problema", 14, currentY);
    currentY += 6;
    
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    const splitStatement = doc.splitTextToSize(inputs.statement, 180);
    doc.text(splitStatement, 14, currentY);
    currentY += (splitStatement.length * 5) + 8;
  }

  if (method !== 'abc') {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Parámetros de Entrada", 14, currentY);
    currentY += 6;

    const inputsBody = [
      ['Demanda (D)', inputs.D],
      ['Costo de Ordenar (Co)', inputs.Co],
      ['Costo de Mantener (Ch)', inputs.Ch]
    ];
    if (inputs.Cf) inputsBody.push(['Costo Faltante (Cf)', inputs.Cf]);
    if (inputs.p) inputsBody.push(['Tasa de Producción (p)', inputs.p]);
    if (inputs.d) inputsBody.push(['Tasa de Demanda (d)', inputs.d]);

    autoTable(doc, {
      startY: currentY,
      head: [['Parámetro', 'Valor']],
      body: inputsBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    currentY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Resultados", 14, currentY);
    currentY += 6;

    const resultsBody = [
      ['Cantidad Óptima (Q*)', result.Q.toFixed(2)],
      ['Costo Total (CT)', `$${result.CT.toFixed(2)}`]
    ];
    if (result.N !== undefined) resultsBody.push(['Número de Pedidos (N)', result.N.toFixed(2)]);
    if (result.T_days !== undefined) resultsBody.push(['Tiempo entre pedidos (T)', `${result.T_days.toFixed(2)} días`]);
    if (result.S !== undefined) resultsBody.push(['Faltante Máximo (S*)', result.S.toFixed(2)]);
    if (result.Imax !== undefined) resultsBody.push(['Inventario Máximo (Imax)', result.Imax.toFixed(2)]);

    autoTable(doc, {
      startY: currentY,
      head: [['Métrica', 'Valor Calculado']],
      body: resultsBody,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });
  } else {
    // ABC
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Clasificación ABC", 14, currentY);
    currentY += 6;

    const body = result.items.map(r => [
      r.name, 
      `$${r.vma.toFixed(2)}`, 
      `${r.vmaPercentage.toFixed(2)}%`, 
      `${r.accumulatedPercentage.toFixed(2)}%`, 
      r.zone
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Artículo', 'VMA', '% VMA', '% Acumulado', 'Zona']],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });
  }

  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventarios_${method}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    doc.save(`Inventarios_${method}.pdf`);
  }
}
