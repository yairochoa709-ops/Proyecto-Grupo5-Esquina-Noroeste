import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DijkstraExercise, DijkstraSolution } from '../types';

export function exportDijkstraToPDF(exercise: DijkstraExercise, solution: DijkstraSolution): void {
  try {
    const doc = new jsPDF();
    let nextY = 20;

    // Título General
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129); // Verde Esmeralda
    doc.text(`Reporte de Ruta Más Corta (Algoritmo de Dijkstra)`, 14, nextY);
    nextY += 8;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Proyecto: ${exercise.name}`, 14, nextY);
    nextY += 10;

    // Resumen de la Solución
    const targetNode = exercise.targetNodeId;
    const distanceToTarget = targetNode ? solution.distances[targetNode] : null;

    doc.setFontSize(11);
    doc.text(`Nodo Origen (Source): ${exercise.sourceNodeId}`, 14, nextY);
    nextY += 6;
    if (targetNode) {
      doc.text(`Nodo Destino (Sink): ${targetNode}`, 14, nextY);
      nextY += 6;
      const distStr = distanceToTarget === Infinity ? 'Inalcanzable' : `${distanceToTarget}`;
      doc.text(`Distancia Mínima al Destino: ${distStr}`, 14, nextY);
      nextY += 8;
      
      if (distanceToTarget !== Infinity && solution.shortestPath.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(59, 130, 246); // Azul
        doc.text(`Ruta Óptima: ${solution.shortestPath.join(" -> ")}`, 14, nextY);
        doc.setTextColor(0, 0, 0);
        nextY += 12;
      } else {
        nextY += 4;
      }
    }

    // Tabla de Distancias Finales a todos los nodos
    doc.setFontSize(13);
    doc.text("Tabla de Distancias y Predecesores Finales", 14, nextY);
    nextY += 6;

    const headCols = ["Nodo", "Distancia Mínima", "Predecesor (Padre)", "Ruta Completa"];
    
    const bodyRows = exercise.graph.nodes.map(node => {
      const dist = solution.distances[node.id];
      const distStr = dist === Infinity ? 'Infinito (∞)' : `${dist}`;
      const prev = solution.previous[node.id] || '-';
      
      // Reconstruir la ruta para este nodo específico
      const path: string[] = [];
      let curr: string | null = node.id;
      while (curr) {
        path.unshift(curr);
        curr = solution.previous[curr];
      }
      const pathStr = dist === Infinity ? 'Ninguna' : path.join(" -> ");

      return [
        node.label || node.id,
        distStr,
        prev,
        pathStr
      ];
    });

    autoTable(doc, {
      startY: nextY,
      head: [headCols],
      body: bodyRows,
      theme: 'striped',
      styles: { halign: 'center', fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    const lastTable = (doc as any).lastAutoTable;
    if (lastTable && lastTable.finalY) {
      nextY = lastTable.finalY + 15;
    } else {
      nextY += 60;
    }

    // Descarga del PDF
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dijkstra_${exercise.name.replace(/ /g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al generar PDF de Dijkstra:", error);
    alert("Hubo un error al generar el PDF de Dijkstra. Revisa la consola.");
  }
}
