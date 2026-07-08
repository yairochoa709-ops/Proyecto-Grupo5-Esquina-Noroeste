import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportDecisionToPDF(method, inputs, result) {
  const doc = new jsPDF();
  let currentY = 15;

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`Reporte de Teoría de Decisiones`, 14, currentY);
  currentY += 10;

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`Criterio: ${method === 'incertidumbre' ? 'Incertidumbre (Maximax, Maximin, Laplace)' : 'Riesgo (VME)'}`, 14, currentY);
  currentY += 6;
  doc.text(`Enfoque: ${inputs.isCost ? 'Costos (Minimizar)' : 'Ganancias (Maximizar)'}`, 14, currentY);
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
  doc.text("Matriz de Pagos", 14, currentY);
  currentY += 6;

  const head = [['Alternativa']];
  for (let c = 0; c < inputs.matrix[0].length; c++) {
    head[0].push(`Estado ${c + 1}`);
  }
  
  const body = inputs.matrix.map((row, r) => [`A${r + 1}`, ...row]);
  
  if (method === 'riesgo') {
    body.push(['Probabilidad P(E)', ...inputs.probabilities]);
  }

  autoTable(doc, {
    startY: currentY,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  });
  currentY = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Resultados del Análisis", 14, currentY);
  currentY += 6;

  const resHead = [['Alternativa']];
  if (method === 'incertidumbre') {
    resHead[0].push('Máximo', 'Mínimo', 'Laplace');
  } else {
    resHead[0].push('VME');
  }

  const resBody = result.results.map(r => {
    const row = [`A${r.altIndex + 1}`];
    if (method === 'incertidumbre') {
      row.push(r.maxVal, r.minVal, r.laplace.toFixed(2));
    } else {
      row.push(r.vme.toFixed(2));
    }
    return row;
  });

  autoTable(doc, {
    startY: currentY,
    head: resHead,
    body: resBody,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] }
  });
  currentY = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Decisión Óptima", 14, currentY);
  currentY += 6;

  doc.setFontSize(12);
  doc.setTextColor(21, 128, 61);
  if (method === 'incertidumbre') {
    doc.text(`Maximax: A${result.optimalMaximax.map(i => i + 1).join(', A')} (Valor: ${result.bestMaximax})`, 14, currentY);
    currentY += 6;
    doc.text(`Maximin: A${result.optimalMaximin.map(i => i + 1).join(', A')} (Valor: ${result.bestMaximin})`, 14, currentY);
    currentY += 6;
    doc.text(`Laplace: A${result.optimalLaplace.map(i => i + 1).join(', A')} (Valor: ${result.bestLaplace.toFixed(2)})`, 14, currentY);
  } else {
    doc.text(`VME Óptimo: A${result.optimalVME.map(i => i + 1).join(', A')} (Valor: ${result.bestVME.toFixed(2)})`, 14, currentY);
  }

  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Decisiones_${method}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    doc.save(`Decisiones_${method}.pdf`);
  }
}
