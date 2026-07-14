import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import katex from 'katex';

// ═══════════════════════════════════════════════════════════════════
//  UTILIDADES
// ═══════════════════════════════════════════════════════════════════

/**
 * Elimina acentos y reemplaza símbolos griegos por sus nombres ASCII.
 * Necesario porque la fuente Helvetica de jsPDF no soporta Unicode pleno.
 */
function safe(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quitar diacríticos (á→a, ó→o...)
    .replace(/ρ/g, 'rho')
    .replace(/λ/g, 'lambda')
    .replace(/μ/g, 'mu')
    .replace(/₀/g, '0').replace(/₁/g, '1').replace(/₂/g, '2')
    .replace(/₃/g, '3').replace(/ₖ/g, 'k')
    .replace(/[^\x00-\x7F]/g, '');     // eliminar cualquier otro no-ASCII
}

/**
 * Renderiza una fórmula LaTeX a PNG usando KaTeX + html2canvas.
 * Inyecta estilos !important para forzar fondo blanco y texto negro,
 * anulando el tema oscuro de la aplicación.
 * @returns {{ dataUrl, widthPt, heightPt }}
 */
async function latexToPng(latex) {
  // Asegurar que las fuentes KaTeX estén cargadas
  await document.fonts.ready;

  // --- Inyectar hoja de estilos de anulación ---
  const overrideId = '__pdf_katex_override__';
  let overrideStyle = document.getElementById(overrideId);
  if (!overrideStyle) {
    overrideStyle = document.createElement('style');
    overrideStyle.id = overrideId;
    overrideStyle.textContent = [
      '#__pdf_katex_container__ {',
      '  all: initial !important;',
      '  display: inline-block !important;',
      '  background: #ffffff !important;',
      '  color: #000000 !important;',
      '  font-family: KaTeX_Main, "Times New Roman", serif !important;',
      '  font-size: 18px !important;',
      '  padding: 4px 12px !important;',   // padding mínimo para evitar clipping
      '  line-height: 1 !important;',
      '}',
      '#__pdf_katex_container__ * {',
      '  color: #000000 !important;',
      '  background: transparent !important;',
      '  border-color: #000000 !important;',
      '}',
      // Suprimir el margen vertical de 1em que KaTeX agrega en displayMode
      '#__pdf_katex_container__ .katex-display {',
      '  margin: 0 !important;',
      '  padding: 0 !important;',
      '}',
      '#__pdf_katex_container__ .katex { font-size: 1.35em !important; }',
    ].join('\n');
    document.head.appendChild(overrideStyle);
  }

  // --- Contenedor de captura ---
  const container = document.createElement('div');
  container.id = '__pdf_katex_container__';
  // Visible pero fuera de pantalla (necesario para que html2canvas funcione bien)
  container.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'z-index:-1',
    'pointer-events:none',
    'opacity:1',
    'visibility:visible',
    'background:#ffffff',
  ].join(';');

  document.body.appendChild(container);

  try {
    katex.render(latex, container, {
      displayMode: true,
      throwOnError: false,
      output: 'html',
    });

    // Tiempo de gracia para que el navegador pinte la fuente
    await new Promise(r => setTimeout(r, 150));

    const { default: html2canvas } = await import('html2canvas');
    const rawCanvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      removeContainer: false,
    });

    // Recortar filas en blanco de arriba y abajo para eliminar espacio extra
    const canvas = trimCanvasVertically(rawCanvas, 6); // 6 px de margen

    const dataUrl = canvas.toDataURL('image/png');
    // Convertir píxeles (a scale:3, 96 dpi) a puntos PDF (72 dpi)
    const pxToPt = 72 / 96;
    return {
      dataUrl,
      widthPt:  (canvas.width  / 3) * pxToPt,
      heightPt: (canvas.height / 3) * pxToPt,
    };
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Recorta las filas blancas (vacías) de arriba y abajo de un canvas.
 * Mantiene `padding` píxeles de margen alrededor del contenido real.
 */
function trimCanvasVertically(src, padding = 6) {
  const ctx = src.getContext('2d');
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;

  function rowIsBlank(y) {
    const base = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = base + x * 4;
      // Si el píxel no es casi blanco (255,255,255), la fila tiene contenido
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
  dst.width  = width;
  dst.height = newH;
  const dctx = dst.getContext('2d');
  dctx.fillStyle = '#ffffff';
  dctx.fillRect(0, 0, width, newH);
  dctx.drawImage(src, 0, top, width, newH, 0, 0, width, newH);
  return dst;
}

/**
 * Inserta texto con auto-wrap. Devuelve Y final.
 */
function addText(doc, text, x, y, maxWidth, lineHeight = 5.5) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

/**
 * Inserta la imagen de una fórmula centrada. Devuelve Y final.
 */
function addFormulaImg(doc, imgData, pageW, y, maxW = 500) {
  let w = imgData.widthPt;
  let h = imgData.heightPt;
  if (w > maxW) { h *= maxW / w; w = maxW; }
  const x = (pageW - w) / 2;
  doc.addImage(imgData.dataUrl, 'PNG', x, y, w, h);
  return y + h + 4;
}

// ═══════════════════════════════════════════════════════════════════
//  EXPORTADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export async function exportQueueToPDF(method, inputs, result) {
  const doc     = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW   = doc.internal.pageSize.getWidth();   // 595 pt
  const pageH   = doc.internal.pageSize.getHeight();  // 842 pt
  const margin  = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  /** Agrega nueva página si el contenido no cabe */
  function checkPage(needed = 50) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // ── ENCABEZADO ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Reporte de Teoria de Colas', margin, y);
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text('Modelo: ' + method.toUpperCase(), margin, y);
  y += 20;

  // ── CONTEXTO ────────────────────────────────────────────────────────────
  if (inputs.statement) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Contexto del Problema', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    y = addText(doc, safe(inputs.statement), margin, y, contentW) + 10;
  }

  // ── PARÁMETROS DE ENTRADA ───────────────────────────────────────────────
  checkPage(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Parametros de Entrada', margin, y);
  y += 8;

  let inputsBody = [];
  if (method === 'birth-death') {
    inputsBody.push(['Capacidad del Sistema (N)', String(inputs.bdN)]);
  } else if (method === 'markov') {
    inputsBody.push(['Estados (N)', String(inputs.markovN)]);
    inputsBody.push(['Iteraciones (n)', String(inputs.markovSteps)]);
  } else {
    inputsBody.push(['Tasa de Llegada (lambda)',  String(inputs.lambda)]);
    inputsBody.push(['Tasa de Servicio (mu)',     String(inputs.mu)]);
    if (inputs.k) inputsBody.push(['Capacidad del Sistema (K)', String(inputs.k)]);
    if (inputs.s) inputsBody.push(['Numero de Servidores (s)',  String(inputs.s)]);
  }

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

  // ── RESULTADOS ──────────────────────────────────────────────────────────
  checkPage(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Resultados', margin, y);
  y += 8;

  let resultsBody = [];
  if (method === 'markov') {
    resultsBody.push(['Estado a los n pasos', 'Ver reporte detallado (seccion final)']);
    resultsBody.push(['Probabilidades Estado Estable', 'Ver reporte detallado (seccion final)']);
  } else if (method === 'birth-death') {
    resultsBody.push(['Probabilidad de sistema vacio (P0)', (result.p0 * 100).toFixed(2) + ' %']);
    resultsBody.push(['Clientes promedio en sistema (L)',  result.l.toFixed(3)]);
    resultsBody.push(['Tiempo promedio en sistema (W)',    result.w.toFixed(3)]);
    resultsBody.push(['Tasa efectiva de llegada (lambda efec)', result.lambdaEfec.toFixed(3)]);
  } else {
    resultsBody.push(['Utilizacion del sistema (rho)', (result.rho * 100).toFixed(2) + ' %']);
    resultsBody.push(['Probabilidad de sistema vacio (P0)', (result.p0 * 100).toFixed(2) + ' %']);
    if (result.pk !== undefined) {
      resultsBody.push(['Probabilidad de sistema lleno (Pk)', (result.pk * 100).toFixed(2) + ' %']);
      resultsBody.push(['Tasa efectiva de llegada (lambda efec)', result.lambdaEfec.toFixed(3)]);
    }
    resultsBody.push(['Clientes promedio en sistema (L)',  result.l.toFixed(3)]);
    resultsBody.push(['Clientes promedio en cola (Lq)',    result.lq.toFixed(3)]);
    resultsBody.push(['Tiempo promedio en sistema (W)',    result.w.toFixed(3)]);
    resultsBody.push(['Tiempo promedio en cola (Wq)',      result.wq.toFixed(3)]);
  }

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

  // ── RESOLUCIÓN PASO A PASO ──────────────────────────────────────────────
  checkPage(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('Resolucion Paso a Paso', margin, y);
  y += 20;

  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];

    checkPage(100);

    // · Título del paso (ASCII seguro)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text(safe(step.title), margin, y);
    y += 14;

    // · Fórmula renderizada con KaTeX → PNG
    try {
      const imgData = await latexToPng(step.math);
      checkPage(imgData.heightPt + 12);
      y = addFormulaImg(doc, imgData, pageW, y, contentW);
    } catch (_err) {
      // Fallback: texto plano
      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(step.math, margin + 8, y);
      y += 12;
    }

    // · Descripción
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    y = addText(doc, safe(step.desc), margin + 4, y + 2, contentW - 8) + 4;

    // · Separador
    doc.setDrawColor(210, 220, 230);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
  }

  // ── CONCLUSIÓN ──────────────────────────────────────────────────────────
  if (result.conclusion) {
    checkPage(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Conclusion', margin, y);
    y += 14;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const conclLines = doc.splitTextToSize(safe(result.conclusion), contentW - 16);
    const boxH = conclLines.length * 5.5 + 16;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(148, 163, 184);
    doc.roundedRect(margin, y - 6, contentW, boxH, 4, 4, 'FD');
    doc.text(conclLines, margin + 8, y + 4);
    y += boxH + 18;
  }

  // ── MATRICES ADICIONALES (MARKOV) ───────────────────────────────────────
  if (method === 'markov') {
    checkPage(120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Matriz de Transicion P', margin, y);
    y += 8;

    const n = inputs.markovN;
    const pHead = [''].concat(Array.from({length: n}, (_, i) => 'E' + i));
    const pBody = inputs.markovMatrix.map((row, i) => ['E' + i].concat(row.map(v => v.toFixed(4))));
    
    autoTable(doc, {
      startY: y, head: [pHead], body: pBody, theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10, halign: 'center' },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      margin: { left: margin, right: margin }
    });
    y = doc.lastAutoTable.finalY + 18;

    checkPage(120);
    doc.text('Probabilidades de Estado', margin, y);
    y += 8;
    
    const stateHead = ['Estado', 'Inicial π(0)', `En paso n=${inputs.markovSteps}`, 'Estable π(∞)'];
    const stateBody = Array.from({length: n}).map((_, i) => [
      'E' + i, 
      inputs.markovInitial[i].toFixed(4), 
      result.stateAtN[i].toFixed(4), 
      result.steadyState[i].toFixed(4)
    ]);

    autoTable(doc, {
      startY: y, head: [stateHead], body: stateBody, theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10, halign: 'center' },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      margin: { left: margin, right: margin }
    });
    y = doc.lastAutoTable.finalY + 18;
  }

  // ── PIE DE PÁGINA ───────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Suite de Investigacion de Operaciones  |  Pagina ' + p + ' de ' + totalPages,
      pageW / 2,
      pageH - 18,
      { align: 'center' }
    );
  }

  // ── DESCARGAR ───────────────────────────────────────────────────────────
  try {
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'Teoria_Colas_' + method + '.pdf';
    a.click();
    URL.revokeObjectURL(url);
  } catch (_) {
    doc.save('Teoria_Colas_' + method + '.pdf');
  }
}
