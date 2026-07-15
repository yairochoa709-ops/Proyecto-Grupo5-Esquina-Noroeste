import React from 'react';

export default function MarkovGraph({ matrix }) {
  if (!matrix || matrix.length === 0) return null;

  const N = matrix.length;
  const width = 600;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 120;
  const nodeRadius = 25;

  // Calculate node positions
  const nodes = Array.from({ length: N }).map((_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / N;
    return {
      id: i,
      label: `M${i + 1}`,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      angle
    };
  });

  const edges = [];
  let hiddenEdges = false;
  
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const prob = matrix[i][j];
      if (prob >= 0.05) {
        edges.push({ source: i, target: j, prob });
      } else if (prob > 0) {
        hiddenEdges = true;
      }
    }
  }

  // Helper function to draw arrowhead
  const drawArrowhead = (x, y, angle) => {
    const size = 10;
    const x1 = x - size * Math.cos(angle - Math.PI / 6);
    const y1 = y - size * Math.sin(angle - Math.PI / 6);
    const x2 = x - size * Math.cos(angle + Math.PI / 6);
    const y2 = y - size * Math.sin(angle + Math.PI / 6);
    return <polygon points={`${x},${y} ${x1},${y1} ${x2},${y2}`} fill="#3b82f6" />;
  };

  return (
    <div id="markov-diagram-export" style={{ background: '#1e293b', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ margin: 0, color: '#94a3b8' }}>Diagrama de Transición de Estados</h4>
        {hiddenEdges && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>(Se omiten aristas &lt; 0.05)</span>}
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%' }}>
        {edges.map((edge, idx) => {
          const s = nodes[edge.source];
          const t = nodes[edge.target];
          
          if (edge.source === edge.target) {
            // Self loop with Cubic Bezier for precise tangent calculation
            const a1 = s.angle - 0.6;
            const a2 = s.angle + 0.6;
            
            const x1 = s.x + Math.cos(a1) * nodeRadius;
            const y1 = s.y + Math.sin(a1) * nodeRadius;
            
            const x2 = s.x + Math.cos(a2) * nodeRadius;
            const y2 = s.y + Math.sin(a2) * nodeRadius;

            const dist = nodeRadius * 4.5;
            const cx1 = s.x + Math.cos(s.angle - 0.3) * dist;
            const cy1 = s.y + Math.sin(s.angle - 0.3) * dist;
            
            const cx2 = s.x + Math.cos(s.angle + 0.3) * dist;
            const cy2 = s.y + Math.sin(s.angle + 0.3) * dist;

            const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
            const arrowAngle = Math.atan2(y2 - cy2, x2 - cx2);
            
            const dx = Math.cos(s.angle) * (nodeRadius * 1.8);
            const dy = Math.sin(s.angle) * (nodeRadius * 1.8);
            
            return (
              <g key={`edge-${idx}`}>
                <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" />
                {drawArrowhead(x2, y2, arrowAngle)}
                <rect x={s.x + dx * 2 - 15} y={s.y + dy * 2 - 10} width="30" height="20" fill="#1e293b" rx="4" />
                <text x={s.x + dx * 2} y={s.y + dy * 2 + 4} fill="#3b82f6" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {edge.prob.toFixed(2)}
                </text>
              </g>
            );
          } else {
            // Normal curved edge
            // Control point for quadratic curve
            const midX = (s.x + t.x) / 2;
            const midY = (s.y + t.y) / 2;
            
            const vecX = t.x - s.x;
            const vecY = t.y - s.y;
            const len = Math.sqrt(vecX * vecX + vecY * vecY);
            
            const normX = -vecY / len;
            const normY = vecX / len;
            
            const bend = 40; 
            const ctrlX = midX + normX * bend;
            const ctrlY = midY + normY * bend;

            // Calculate intersections with node boundaries
            const startVecX = ctrlX - s.x;
            const startVecY = ctrlY - s.y;
            const startLen = Math.sqrt(startVecX * startVecX + startVecY * startVecY);
            const startX = s.x + (startVecX / startLen) * nodeRadius;
            const startY = s.y + (startVecY / startLen) * nodeRadius;

            const endVecX = t.x - ctrlX;
            const endVecY = t.y - ctrlY;
            const endLen = Math.sqrt(endVecX * endVecX + endVecY * endVecY);
            const endX = t.x - (endVecX / endLen) * nodeRadius;
            const endY = t.y - (endVecY / endLen) * nodeRadius;

            const path = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
            const arrowAngle = Math.atan2(endVecY, endVecX);
            
            return (
              <g key={`edge-${idx}`}>
                <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" />
                {drawArrowhead(endX, endY, arrowAngle)}
                <rect x={ctrlX - 15} y={ctrlY - 10} width="30" height="20" fill="#1e293b" rx="4" />
                <text x={ctrlX} y={ctrlY + 4} fill="#3b82f6" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {edge.prob.toFixed(2)}
                </text>
              </g>
            );
          }
        })}

        {nodes.map(node => (
          <g key={`node-${node.id}`}>
            <circle cx={node.x} cy={node.y} r={nodeRadius} fill="#f59e0b" stroke="#b45309" strokeWidth="3" />
            <text x={node.x} y={node.y + 5} fill="#1e293b" fontSize="14" fontWeight="bold" textAnchor="middle">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
