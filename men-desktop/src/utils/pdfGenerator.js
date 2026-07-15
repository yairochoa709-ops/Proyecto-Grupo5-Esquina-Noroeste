import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(exercise, solution) {
  try {
    const doc = new jsPDF();
    
    // Función auxiliar para construir el cuerpo de la tabla para un frame específico
    const buildFrameTableBody = (frame) => {
      const body = [];
      for (let i = 0; i < frame.namesRows.length; i++) {
        const row = [frame.namesRows[i]];
        for (let j = 0; j < frame.namesCols.length; j++) {
          const alloc = frame.allocations[i][j];
          const isCrossed = frame.crossedRows.includes(i) || frame.crossedCols.includes(j);
          
          if (alloc !== null) {
            row.push(`[ ${alloc} ]\n$${frame.balancedCosts[i][j]}`);
          } else if (isCrossed) {
            row.push(`-- x --\n$${frame.balancedCosts[i][j]}`);
          } else {
            row.push(`$${frame.balancedCosts[i][j]}`);
          }
        }
        row.push(frame.balancedSupply[i].toString());
        body.push(row);
      }
      
      const demandRow = ["Demanda"];
      for (let j = 0; j < frame.namesCols.length; j++) {
        demandRow.push(frame.balancedDemand[j].toString());
      }
      demandRow.push(frame.balancedDemand.reduce((a, b) => a + b, 0).toString());
      body.push(demandRow);
      return body;
    };

    const headCols = ["O/D", ...solution.frames[0].namesCols, "Oferta"];
    let nextY = 20;

    // Título General
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(`Reporte: ${exercise.name} (Esquina Noroeste)`, 14, nextY);
    nextY += 8;
    
    doc.setFontSize(11);
    doc.text(`Estado Inicial: ${exercise.isBalanced ? 'Equilibrado' : 'Desequilibrado'}`, 14, nextY);
    nextY += 6;
    if (!exercise.isBalanced) {
       doc.text(`(Se aplicó auto-balanceo lógico agregando fila/columna ficticia con costo 0)`, 14, nextY);
       nextY += 8;
    } else {
       nextY += 4;
    }

    if (exercise.statement) {
       doc.setFontSize(10);
       doc.setTextColor(80, 80, 80);
       const splitStatement = doc.splitTextToSize(exercise.statement, 180);
       doc.text(splitStatement, 14, nextY);
       nextY += (splitStatement.length * 5) + 6;
    }

    // Si es desequilibrado, imprimir la matriz original desbalanceada
    if (!exercise.isBalanced) {
      if (nextY > 250) { doc.addPage(); nextY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(245, 158, 11); // Naranja/Ambar
      doc.text("Matriz Inicial (Desequilibrada)", 14, nextY);
      nextY += 6;
      
      const unbBody = [];
      const oRows = exercise.supply.length;
      const oCols = exercise.demand.length;
      for (let i = 0; i < oRows; i++) {
         const row = [exercise.namesRows ? exercise.namesRows[i] : `O${i+1}`];
         for (let j = 0; j < oCols; j++) {
            row.push(`$${exercise.costs[i][j]}`);
         }
         row.push(exercise.supply[i].toString());
         unbBody.push(row);
      }
      const unbDemandRow = ["Demanda"];
      for (let j = 0; j < oCols; j++) {
         unbDemandRow.push(exercise.demand[j].toString());
      }
      unbDemandRow.push(`${exercise.totalSupply} / ${exercise.totalDemand}`);
      unbBody.push(unbDemandRow);
      
      const unbHeadCols = ["O/D"];
      for (let j = 0; j < oCols; j++) {
         unbHeadCols.push(exercise.namesCols ? exercise.namesCols[j] : `D${j+1}`);
      }
      unbHeadCols.push("Oferta");

      autoTable(doc, {
        startY: nextY,
        head: [unbHeadCols],
        body: unbBody,
        theme: 'grid',
        styles: { halign: 'center', fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [245, 158, 11] },
      });
      nextY = doc.lastAutoTable.finalY + 12;
    }

    // Recorremos todos los frames para imprimir el historial visual completo
    solution.frames.forEach((frame) => {
      // Verificamos si necesitamos una nueva página antes de imprimir el siguiente paso
      if (nextY > 250) {
        doc.addPage();
        nextY = 20;
      }

      if (frame.step === 0) {
        doc.setFontSize(14);
        doc.setTextColor(59, 130, 246); // Azul
        doc.text("Matriz de Costos Inicial (Balanceada)", 14, nextY);
        nextY += 6;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        // Dividir el texto narrativo si es muy largo
        const textLines = doc.splitTextToSize(frame.narrative, 180);
        doc.text(textLines, 14, nextY);
        nextY += (textLines.length * 5) + 2;
      }

      let cellCoords = {};

      autoTable(doc, {
        startY: nextY,
        head: [headCols],
        body: buildFrameTableBody(frame),
        theme: 'grid',
        styles: { halign: 'center', fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: frame.step === solution.frames.length - 1 ? [16, 185, 129] : [59, 130, 246] },
        didParseCell: function(data) {
           // Resaltar visualmente las celdas asignadas (verde) y las tachadas (gris)
           if (data.section === 'body' && data.cell.text[0]) {
               if (data.cell.text[0].includes('[ ')) {
                   data.cell.styles.fillColor = [209, 250, 229]; // Fondo Verde Claro
                   data.cell.styles.textColor = [6, 78, 59]; // Texto Verde Oscuro
                   data.cell.styles.fontStyle = 'bold';
               } else if (data.cell.text[0].includes('-- x --')) {
                   data.cell.styles.textColor = [156, 163, 175]; // Texto Gris
               }
           }
        },
        didDrawCell: function(data) {
           if (frame.step === solution.frames.length - 1 && data.section === 'body') {
               const rowIdx = data.row.index;
               const colIdx = data.column.index - 1;
               if (colIdx >= 0 && colIdx < frame.namesCols.length && rowIdx < frame.namesRows.length) {
                   cellCoords[`${rowIdx}-${colIdx}`] = {
                       x: data.cell.x + data.cell.width / 2,
                       y: data.cell.y + data.cell.height / 2
                   };
               }
           }
        }
      });

      if (frame.step === solution.frames.length - 1) {
          const routeSequence = solution.frames.slice(1).map(f => f.currentCell).filter(c => c);
          doc.setDrawColor(249, 115, 22); // Naranja
          doc.setLineWidth(1.2);
          
          for (let i = 0; i < routeSequence.length - 1; i++) {
              const p1 = cellCoords[`${routeSequence[i].r}-${routeSequence[i].c}`];
              const p2 = cellCoords[`${routeSequence[i+1].r}-${routeSequence[i+1].c}`];
              if (p1 && p2 && (p1.x !== p2.x || p1.y !== p2.y)) {
                  let x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
                  const offset = 5;
                  if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
                      if (x2 > x1) { x1 += offset; x2 -= offset; } else { x1 -= offset; x2 += offset; }
                  } else {
                      if (y2 > y1) { y1 += offset; y2 -= offset; } else { y1 -= offset; y2 += offset; }
                  }
                  doc.line(x1, y1, x2, y2);
                  
                  const angle = Math.atan2(y2 - y1, x2 - x1);
                  const arrowSize = 2.5;
                  doc.setFillColor(249, 115, 22);
                  doc.triangle(
                      x2, y2,
                      x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6),
                      x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6),
                      'F'
                  );
              }
          }
      }

      nextY = doc.lastAutoTable.finalY + 12;
    });

    // --- Costo Total ---
    if (nextY > 270) {
      doc.addPage();
      nextY = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // Verde
    doc.text(`Costo Total de Transporte: $${solution.totalCost}`, 14, nextY);
    
    // Fallback robusto para descargar en Electron
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MEN_${exercise.name.replace(/ /g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Hubo un error al generar el PDF. Revisa la consola.");
  }
}
