import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KruskalExercise, KruskalSolution } from '../types';

export function exportKruskalToPDF(exercise: KruskalExercise, solution: KruskalSolution): void {
  try {
    const doc = new jsPDF();
    let nextY = 20;

    // Título General
    doc.setFontSize(18);
    doc.setTextColor(217, 119, 6); // Color Ámbar
    doc.text(`Reporte de Árbol de Expansión Mínima (Algoritmo de Kruskal)`, 14, nextY);
    nextY += 8;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Proyecto: ${exercise.name}`, 14, nextY);
    nextY += 10;

    // Resumen
    doc.setFontSize(11);
    doc.text(`Nodos de la red: ${exercise.graph.nodes.length}`, 14, nextY);
    nextY += 6;
    doc.text(`Total aristas evaluadas: ${exercise.graph.edges.length}`, 14, nextY);
    nextY += 6;
    doc.text(`Aristas en el MST final: ${solution.mstEdges.length}`, 14, nextY);
    nextY += 8;

    doc.setFontSize(13);
    doc.setTextColor(217, 119, 6);
    doc.text(`Costo Total Mínimo de Conexión: ${solution.totalCost}`, 14, nextY);
    doc.setTextColor(0, 0, 0);
    nextY += 12;

    // Tabla de Aristas Ordenadas y su Estado
    doc.setFontSize(12);
    doc.text("Historial de Evaluación de Aristas (Orden Ascendente)", 14, nextY);
    nextY += 6;

    const headCols = ["Orden", "Conexión", "Peso", "Estado de Decisión", "Costo MST"];

    // Ordenar las aristas por peso tal como hace el solver
    const sortedEdges = [...exercise.graph.edges].sort((a, b) => {
      const wA = a.weight !== undefined ? a.weight : 1;
      const wB = b.weight !== undefined ? b.weight : 1;
      return wA - wB;
    });

    let accumCost = 0;
    const bodyRows = sortedEdges.map((edge, idx) => {
      const isApproved = solution.mstEdges.includes(edge.id);
      const weight = edge.weight !== undefined ? edge.weight : 1;
      let status = "Rechazada (Genera Ciclo)";
      
      if (isApproved) {
        accumCost += weight;
        status = "APROBADA (Entra al MST)";
      }

      return [
        `${idx + 1}`,
        `Nodo ${edge.source} <-> Nodo ${edge.target}`,
        `${weight}`,
        status,
        isApproved ? `${accumCost}` : '-'
      ];
    });

    autoTable(doc, {
      startY: nextY,
      head: [headCols],
      body: bodyRows,
      theme: 'striped',
      styles: { halign: 'center', fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [217, 119, 6] },
      didParseCell: function(data) {
         if (data.section === 'body' && data.column.index === 3) {
             if (data.cell.text[0] && data.cell.text[0].includes('APROBADA')) {
                 data.cell.styles.textColor = [5, 150, 105]; // Verde Esmeralda
                 data.cell.styles.fontStyle = 'bold';
             } else {
                 data.cell.styles.textColor = [220, 38, 38]; // Rojo
             }
         }
      }
    });

    // Descarga del PDF
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kruskal_${exercise.name.replace(/ /g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al generar PDF de Kruskal:", error);
    alert("Hubo un error al generar el PDF de Kruskal. Revisa la consola.");
  }
}
