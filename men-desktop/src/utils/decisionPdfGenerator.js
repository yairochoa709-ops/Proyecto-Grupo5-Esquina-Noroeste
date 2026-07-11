import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import katex from 'katex';

// ═══════════════════════════════════════════════════════════════════
//  UTILIDADES
// ═══════════════════════════════════════════════════════════════════

function safe(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ρ/g, 'rho').replace(/λ/g, 'lambda').replace(/μ/g, 'mu')
    .replace(/₀/g, '0').replace(/₁/g, '1').replace(/₂/g, '2')
    .replace(/₃/g, '3').replace(/[^\x00-\x7F]/g, '');
}

async function latexToPng(latex) {
  await document.fonts.ready;

  const overrideId = '__pdf_katex_dec_override__';
  let overrideStyle = document.getElementById(overrideId);
  if (!overrideStyle) {
    overrideStyle = document.createElement('style');
    overrideStyle.id = overrideId;
    overrideStyle.textContent = [
      '#__pdf_katex_dec_container__ {',
      '  all: initial !important;',
      '  display: inline-block !important;',
      '  background: #ffffff !important;',
      '  color: #000000 !important;',
      '  font-family: KaTeX_Main, "Times New Roman", serif !important;',
      '  font-size: 18px !important;',
      '  padding: 4px 12px !important;',
      '  line-height: 1 !important;',
      '}',
      '#__pdf_katex_dec_container__ * {',
      '  color: #000000 !important;',
      '  background: transparent !important;',
      '  border-color: #000000 !important;',
      '}',
      '#__pdf_katex_dec_container__ .katex-display {',
      '  margin: 0 !important;',
      '  padding: 0 !important;',
      '}',
      '#__pdf_katex_dec_container__ .katex { font-size: 1.35em !important; }',
    ].join('\n');
    document.head.appendChild(overrideStyle);
  }

  const container = document.createElement('div');
  container.id = '__pdf_katex_dec_container__';
  container.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'z-index:-1',
    'pointer-events:none', 'opacity:1', 'visibility:visible',
    'background:#ffffff',
  ].join(';');
  document.body.appendChild(container);

  try {
    katex.render(latex, container, { displayMode: true, throwOnError: false, output: 'html' });
    await new Promise(r => setTimeout(r, 150));

    const { default: html2canvas } = await import('html2canvas');
    const rawCanvas = await html2canvas(container, {
      backgroundColor: '#ffffff', scale: 3, useCORS: true,
      allowTaint: true, logging: false, removeContainer: false,
    });

    const canvas = trimCanvasVertically(rawCanvas, 6);
    const dataUrl = canvas.toDataURL('image/png');
    const pxToPt = 72 / 96;
    return { dataUrl, widthPt: (canvas.width / 3) * pxToPt, heightPt: (canvas.height / 3) * pxToPt };
  } finally {
    document.body.removeChild(container);
  }
}

function trimCanvasVertically(src, padding = 6) {
  const ctx = src.getContext('2d');
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;

  function rowIsBlank(y) {
    const base = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = base + x * 4;
      if (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250) return false;
    }
    return true;
  }

  let top = 0;
  while (top < height && rowIsBlank(top)) top++;
  let bottom = height - 1;
  while (bottom > top && rowIsBlank(bottom)) bottom--;
  top    = Math.max(0, top - padding);
  bottom = Math.min(height - 1, bottom + padding);
  const newH = bottom - top + 1;

  const dst = document.createElement('canvas');
  dst.width = width; dst.height = newH;
  const dctx = dst.getContext('2d');
  dctx.fillStyle = '#ffffff';
  dctx.fillRect(0, 0, width, newH);
  dctx.drawImage(src, 0, top, width, newH, 0, 0, width, newH);
  return dst;
}

function addText(doc, text, x, y, maxWidth, lineHeight = 5.5) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addFormulaImg(doc, imgData, pageW, y, maxW = 500) {
  let w = imgData.widthPt, h = imgData.heightPt;
  if (w > maxW) { h *= maxW / w; w = maxW; }
  const x = (pageW - w) / 2;
  doc.addImage(imgData.dataUrl, 'PNG', x, y, w, h);
  return y + h + 4;
}

// ═══════════════════════════════════════════════════════════════════
//  EXPORTADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export async function exportDecisionToPDF(method, inputs, result) {
  const doc     = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW   = doc.internal.pageSize.getWidth();
  const pageH   = doc.internal.pageSize.getHeight();
  const margin  = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  function checkPage(needed = 50) {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  }

  // ── ENCABEZADO ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(15, 23, 42);
  doc.text('Reporte de Teoria de Decisiones', margin, y); y += 26;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(71, 85, 105);
  const criterioLabel = method === 'incertidumbre'
    ? 'Incertidumbre (Maximax, Maximin, Laplace)' : 'Riesgo (VME)';
  doc.text('Criterio: ' + criterioLabel, margin, y); y += 14;
  doc.text('Enfoque: ' + (inputs.isCost ? 'Costos (Minimizar)' : 'Ganancias (Maximizar)'), margin, y);
  y += 20;

  // ── CONTEXTO ────────────────────────────────────────────────────────────
  if (inputs.statement) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text('Contexto del Problema', margin, y); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(71, 85, 105);
    y = addText(doc, safe(inputs.statement), margin, y, contentW) + 10;
  }

  // ── MATRIZ DE PAGOS ──────────────────────────────────────────────────────
  checkPage(80);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
  doc.text('Matriz de Pagos', margin, y); y += 8;

  const head = [['Alternativa']];
  for (let c = 0; c < inputs.matrix[0].length; c++) {
    head[0].push('Estado ' + (c + 1));
  }
  const body = inputs.matrix.map((row, r) => ['A' + (r + 1), ...row]);
  if (method === 'riesgo') {
    body.push(['Probabilidad P(E)', ...inputs.probabilities]);
  }

  autoTable(doc, {
    startY: y, head, body, theme: 'grid',
    styles: { font: 'helvetica', fontSize: 11 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });
  y = doc.lastAutoTable.finalY + 18;

  // ── RESULTADOS ──────────────────────────────────────────────────────────
  checkPage(80);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
  doc.text('Resultados del Analisis', margin, y); y += 8;

  const resHead = [['Alternativa']];
  if (method === 'incertidumbre') {
    resHead[0].push('Maximo', 'Minimo', 'Laplace');
  } else {
    resHead[0].push('VME');
  }
  const resBody = result.results.map(r => {
    const row = ['A' + (r.altIndex + 1)];
    if (method === 'incertidumbre') {
      row.push(r.maxVal, r.minVal, r.laplace.toFixed(2));
    } else {
      row.push(r.vme.toFixed(2));
    }
    return row;
  });

  autoTable(doc, {
    startY: y, head: resHead, body: resBody, theme: 'striped',
    styles: { font: 'helvetica', fontSize: 11 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });
  y = doc.lastAutoTable.finalY + 18;

  // ── RESOLUCIÓN PASO A PASO ──────────────────────────────────────────────
  if (result.steps && result.steps.length > 0) {
    checkPage(40);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(15, 23, 42);
    doc.text('Resolucion Paso a Paso', margin, y); y += 20;

    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i];
      checkPage(100);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(37, 99, 235);
      doc.text(safe(step.title), margin, y); y += 14;

      try {
        const imgData = await latexToPng(step.math);
        checkPage(imgData.heightPt + 12);
        y = addFormulaImg(doc, imgData, pageW, y, contentW);
      } catch (_) {
        doc.setFont('courier', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
        doc.text(step.math, margin + 8, y); y += 12;
      }

      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(71, 85, 105);
      y = addText(doc, safe(step.desc), margin + 4, y + 2, contentW - 8) + 4;

      doc.setDrawColor(210, 220, 230); doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y); y += 12;
    }
  }

  // ── DECISIÓN ÓPTIMA ──────────────────────────────────────────────────────
  checkPage(60);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
  doc.text('Decision Optima', margin, y); y += 14;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(21, 128, 61);
  if (method === 'incertidumbre') {
    doc.text('Maximax: A' + result.optimalMaximax.map(i => i+1).join(', A') + '  (Valor: ' + result.bestMaximax + ')', margin, y); y += 14;
    doc.text('Maximin: A' + result.optimalMaximin.map(i => i+1).join(', A') + '  (Valor: ' + result.bestMaximin + ')', margin, y); y += 14;
    doc.text('Laplace: A' + result.optimalLaplace.map(i => i+1).join(', A') + '  (Valor: ' + result.bestLaplace.toFixed(2) + ')', margin, y); y += 14;
  } else {
    doc.text('VME Optimo: A' + result.optimalVME.map(i => i+1).join(', A') + '  (Valor: ' + result.bestVME.toFixed(2) + ')', margin, y); y += 14;
  }

  // ── CONCLUSIÓN ──────────────────────────────────────────────────────────
  if (result.conclusion) {
    checkPage(70);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text('Conclusion', margin, y); y += 14;

    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(51, 65, 85);
    const conclLines = doc.splitTextToSize(safe(result.conclusion), contentW - 16);
    const boxH = conclLines.length * 5.5 + 16;
    doc.setFillColor(241, 245, 249); doc.setDrawColor(148, 163, 184);
    doc.roundedRect(margin, y - 6, contentW, boxH, 4, 4, 'FD');
    doc.text(conclLines, margin + 8, y + 4); y += boxH + 8;
  }

  // ── PIE DE PÁGINA ───────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text(
      'Suite de Investigacion de Operaciones  |  Pagina ' + p + ' de ' + totalPages,
      pageW / 2, pageH - 18, { align: 'center' }
    );
  }

  // ── DESCARGAR ───────────────────────────────────────────────────────────
  try {
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'Decisiones_' + method + '.pdf'; a.click();
    URL.revokeObjectURL(url);
  } catch (_) {
    doc.save('Decisiones_' + method + '.pdf');
  }
}
