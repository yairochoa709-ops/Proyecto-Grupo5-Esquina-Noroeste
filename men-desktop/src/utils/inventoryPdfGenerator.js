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

  const overrideId = '__pdf_katex_inv_override__';
  let overrideStyle = document.getElementById(overrideId);
  if (!overrideStyle) {
    overrideStyle = document.createElement('style');
    overrideStyle.id = overrideId;
    overrideStyle.textContent = [
      '#__pdf_katex_inv_container__ {',
      '  all: initial !important;',
      '  display: inline-block !important;',
      '  background: #ffffff !important;',
      '  color: #000000 !important;',
      '  font-family: KaTeX_Main, "Times New Roman", serif !important;',
      '  font-size: 18px !important;',
      '  padding: 4px 12px !important;',
      '  line-height: 1 !important;',
      '}',
      '#__pdf_katex_inv_container__ * {',
      '  color: #000000 !important;',
      '  background: transparent !important;',
      '  border-color: #000000 !important;',
      '}',
      '#__pdf_katex_inv_container__ .katex-display {',
      '  margin: 0 !important;',
      '  padding: 0 !important;',
      '}',
      '#__pdf_katex_inv_container__ .katex { font-size: 1.35em !important; }',
    ].join('\n');
    document.head.appendChild(overrideStyle);
  }

  const container = document.createElement('div');
  container.id = '__pdf_katex_inv_container__';
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
  top = Math.max(0, top - padding);
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

export async function exportInventoryToPDF(method, inputs, result, chartRef = null) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  function checkPage(needed = 50) {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  }

  // ENCABEZADO
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(15, 23, 42);
  doc.text('Reporte de Teoria de Inventarios', margin, y); y += 26;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(71, 85, 105);
  doc.text('Modelo: ' + method.toUpperCase(), margin, y); y += 20;

  // CONTEXTO
  if (inputs.statement) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text('Contexto del Problema', margin, y); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(71, 85, 105);
    y = addText(doc, safe(inputs.statement), margin, y, contentW) + 10;
  }

  if (method === 'abc') {
    // CLASIFICACIÓN ABC
    checkPage(80);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text('Clasificacion ABC', margin, y); y += 8;

    const body = result.items.map(r => [
      r.name,
      '$' + r.vma.toFixed(2),
      r.vmaPercentage.toFixed(2) + '%',
      r.accumulatedPercentage.toFixed(2) + '%',
      r.zone
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Articulo', 'VMA', '% VMA', '% Acumulado', 'Zona']],
      body,
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 11 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 18;
  } else {
    // PARÁMETROS
    checkPage(80);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text('Parametros de Entrada', margin, y); y += 8;

    const inputsBody = [
      ['Demanda (D)', String(inputs.D)],
      ['Costo de Orden (K)', String(inputs.Co)],
      ['Costo de Mantener (h)', String(inputs.Ch)],
    ];
    if (inputs.Cf) inputsBody.push(['Costo Faltante (Cf)', String(inputs.Cf)]);
    if (inputs.p)  inputsBody.push(['Tasa de Produccion (p)', String(inputs.p)]);
    if (inputs.d)  inputsBody.push(['Tasa de Demanda (d)', String(inputs.d)]);
    if (inputs.C)  inputsBody.push(['Costo Unitario (C)', String(inputs.C)]);

    autoTable(doc, {
      startY: y,
      head: [['Parametro', 'Valor']],
      body: inputsBody,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 11 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 18;

    // RESULTADOS
    checkPage(80);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text('Resultados', margin, y); y += 8;

    const resultsBody = [
      ['Cantidad Optima (Q*)', result.Q.toFixed(2)],
      ['Costo Total Anual (TC)', '$' + (result.TC ?? result.CT).toFixed(2)],
    ];
    if (result.N       !== undefined) resultsBody.push(['Numero de Ordenes (N)',        result.N.toFixed(2)]);
    if (result.T_days  !== undefined) resultsBody.push(['Tiempo entre Ordenes (T)',     result.T_days.toFixed(2) + ' dias habiles']);
    if (result.d_daily !== undefined) resultsBody.push(['Demanda por Dia (d)',          result.d_daily.toFixed(4) + ' und/dia']);
    if (result.R !== null && result.R !== undefined) resultsBody.push(['Punto de Reorden (R)', result.R.toFixed(2) + ' unidades']);
    if (result.S       !== undefined) resultsBody.push(['Faltante Maximo (S*)',         result.S.toFixed(2)]);
    if (result.Imax    !== undefined) resultsBody.push(['Inventario Maximo (Imax)',     result.Imax.toFixed(2)]);

    autoTable(doc, {
      startY: y,
      head: [['Metrica', 'Valor Calculado']],
      body: resultsBody,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 11 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 18;

    // GRÁFICA DE COMPORTAMIENTO DEL INVENTARIO
    if (chartRef && chartRef.current) {
      try {
        await document.fonts.ready;
        const { default: html2canvas } = await import('html2canvas');
        const chartCanvas = await html2canvas(chartRef.current, {
          backgroundColor: '#0f172a',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const chartImg = chartCanvas.toDataURL('image/png');
        const pxToPt   = 72 / 96;
        let chartW = (chartCanvas.width  / 2) * pxToPt;
        let chartH = (chartCanvas.height / 2) * pxToPt;
        if (chartW > contentW) { chartH *= contentW / chartW; chartW = contentW; }

        checkPage(chartH + 30);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
        doc.text('Comportamiento del Inventario', margin, y); y += 12;
        doc.addImage(chartImg, 'PNG', margin, y, chartW, chartH);
        y += chartH + 16;
      } catch (_) { /* Si falla la captura, se omite la gráfica */ }
    }

    // RESOLUCIÓN PASO A PASO
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

    // CONCLUSIÓN
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
  }

  // PIE DE PÁGINA
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text(
      'Suite de Investigacion de Operaciones  |  Pagina ' + p + ' de ' + totalPages,
      pageW / 2, pageH - 18, { align: 'center' }
    );
  }

  // DESCARGAR
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Inventarios_' + method + '.pdf'; a.click();
    URL.revokeObjectURL(url);
  } catch (_) {
    doc.save('Inventarios_' + method + '.pdf');
  }
}
