import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FordFulkersonExercise, FordFulkersonSolution } from '../types';

export function exportFordFulkersonToPDF(exercise: FordFulkersonExercise, solution: FordFulkersonSolution): void {
  try {
    const doc = new jsPDF();
    let nextY = 20;

    // Título General
    doc.setFontSize(18);
    doc.setTextColor(225, 29, 72); // Color Rosado/Rojo
    doc.text(`Reporte de Flujo Máximo (Algoritmo de Ford-Fulkerson)`, 14, nextY);
    nextY += 8;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Proyecto: ${exercise.name}`, 14, nextY);
    nextY += 10;

    // Resumen
    doc.setFontSize(11);
    doc.text(`Nodo Fuente (Source): ${exercise.sourceNodeId}`, 14, nextY);
    nextY += 6;
    doc.text(`Nodo Sumidero (Sink): ${exercise.targetNodeId}`, 14, nextY);
    nextY += 8;

    doc.setFontSize(13);
    doc.setTextColor(225, 29, 72);
    doc.text(`Flujo Máximo Total de la Red: ${solution.maxFlow} unidades`, 14, nextY);
    doc.setTextColor(0, 0, 0);
    nextY += 12;

    // Tabla de Flujos Finales
    doc.setFontSize(12);
    doc.text("Asignación de Flujo Final por Conexión", 14, nextY);
    nextY += 6;

    const headCols = ["Conexión", "Capacidad Máx.", "Flujo Asignado", "Capacidad Residual", "Estado"];

    const bodyRows = exercise.graph.edges.map(edge => {
      const finalFlow = solution.flows[edge.id] || 0;
      const capacity = edge.capacity !== undefined ? edge.capacity : 10;
      const residual = capacity - finalFlow;
      const isSaturated = finalFlow === capacity;
      
      const status = isSaturated 
        ? "SATURADA (Cuello de Botella)" 
        : finalFlow > 0 
          ? "Activa (Con Flujo)" 
          : "Inactiva (Sin Flujo)";

      return [
        `Nodo ${edge.source} → Nodo ${edge.target}`,
        `${capacity}`,
        `${finalFlow}`,
        `${residual}`,
        status
      ];
    });

    autoTable(doc, {
      startY: nextY,
      head: [headCols],
      body: bodyRows,
      theme: 'striped',
      styles: { halign: 'center', fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [225, 29, 72] },
      didParseCell: function(data) {
         if (data.section === 'body' && data.column.index === 4) {
             if (data.cell.text[0] && data.cell.text[0].includes('SATURADA')) {
                 data.cell.styles.textColor = [220, 38, 38]; // Rojo (Saturada)
                 data.cell.styles.fontStyle = 'bold';
             } else if (data.cell.text[0] && data.cell.text[0].includes('Activa')) {
                 data.cell.styles.textColor = [5, 150, 105]; // Verde Esmeralda
             }
         }
      }
    });

    const lastTable = (doc as any).lastAutoTable;
    nextY = lastTable.finalY + 15;

    // Listado de caminos de aumento encontrados
    if (nextY > 240) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFontSize(12);
    doc.text("Caminos de Aumento Detectados (Secuencial)", 14, nextY);
    nextY += 6;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    // Filtrar los frames de búsqueda de caminos
    const pathFrames = solution.frames.filter(f => f.step > 0 && f.activePath.length > 0 && f.step % 2 === 1);
    
    if (pathFrames.length > 0) {
      pathFrames.forEach((frame, idx) => {
        if (nextY > 270) {
          doc.addPage();
          nextY = 20;
        }
        doc.text(
          `Camino ${idx + 1}: ${frame.activePath.join(" -> ")} | Flujo Enviado (Cuello Botella): +${frame.bottleNeck}`,
          14, nextY
        );
        nextY += 6;
      });
    } else {
      doc.text("No se registraron caminos de aumento o la red ya estaba saturada.", 14, nextY);
    }

    // Descarga del PDF
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FordFulkerson_${exercise.name.replace(/ /g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al generar PDF de Ford-Fulkerson:", error);
    alert("Hubo un error al generar el PDF. Revisa la consola.");
  }
}
