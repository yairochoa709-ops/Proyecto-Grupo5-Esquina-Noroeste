import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportQueueToPDF(method, inputs, result) {
  const doc = new jsPDF();
  let currentY = 15;

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`Reporte de Teoría de Colas`, 14, currentY);
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

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Parámetros de Entrada", 14, currentY);
  currentY += 6;

  const inputsBody = [
    ['Tasa de Llegada (λ)', inputs.lambda],
    ['Tasa de Servicio (μ)', inputs.mu]
  ];
  if (inputs.k) inputsBody.push(['Capacidad del Sistema (K)', inputs.k]);
  if (inputs.s) inputsBody.push(['Número de Servidores (s)', inputs.s]);

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
    ['Utilización del sistema (ρ)', `${(result.rho * 100).toFixed(2)} %`],
    ['Probabilidad de sistema vacío (P0)', `${(result.p0 * 100).toFixed(2)} %`]
  ];
  if (result.pk !== undefined) {
    resultsBody.push(['Probabilidad de sistema lleno (Pk)', `${(result.pk * 100).toFixed(2)} %`]);
    resultsBody.push(['Tasa efectiva de llegada (λ efec)', result.lambdaEfec.toFixed(3)]);
  }
  resultsBody.push(['Clientes promedio en sistema (L)', result.l.toFixed(3)]);
  resultsBody.push(['Clientes promedio en cola (Lq)', result.lq.toFixed(3)]);
  resultsBody.push(['Tiempo promedio en sistema (W)', result.w.toFixed(3)]);
  resultsBody.push(['Tiempo promedio en cola (Wq)', result.wq.toFixed(3)]);

  autoTable(doc, {
    startY: currentY,
    head: [['Métrica', 'Valor Calculado']],
    body: resultsBody,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }
  });

  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Teoria_Colas_${method}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    doc.save(`Teoria_Colas_${method}.pdf`);
  }
}
