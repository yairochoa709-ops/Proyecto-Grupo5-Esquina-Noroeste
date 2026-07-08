import { useState } from 'react';
import MenModule from './components/MenModule/MenModule';
import NetworkModule from './components/NetworkModule/NetworkModule';
import DynamicModule from './components/DynamicModule/DynamicModule';
import QueueModule from './components/QueueModule/QueueModule';
import InventoryModule from './components/InventoryModule/InventoryModule';
import DecisionModule from './components/DecisionModule/DecisionModule';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('men');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Navbar Superior */}
      <nav className="glass-panel" style={{ 
        display: 'flex', 
        padding: '10px 20px', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0',
        zIndex: 100
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginRight: 'auto', color: 'var(--primary)' }}>
          Suite de Investigación de Operaciones
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${activeTab === 'men' ? 'active-tab' : ''}`}
            style={activeTab === 'men' ? { background: 'var(--primary)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('men')}
          >
            📦 Transporte
          </button>
          <button 
            className={`btn ${activeTab === 'network' ? 'active-tab' : ''}`}
            style={activeTab === 'network' ? { background: 'var(--primary)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('network')}
          >
            🕸️ Análisis de Redes
          </button>
          <button 
            className={`btn ${activeTab === 'critical' ? 'active-tab' : ''}`}
            style={activeTab === 'critical' ? { background: 'var(--primary)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('critical')}
          >
            📈 Ruta Crítica
          </button>
          <button 
            className={`btn ${activeTab === 'dynamic' ? 'active-tab' : ''}`}
            style={activeTab === 'dynamic' ? { background: 'var(--primary)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('dynamic')}
          >
            🔄 Prog. Dinámica
          </button>
          <button 
            className={`btn ${activeTab === 'queue' ? 'active-tab' : ''}`}
            style={activeTab === 'queue' ? { background: 'var(--primary)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('queue')}
          >
            👥 Colas
          </button>
          <button 
            className={`btn ${activeTab === 'inventory' ? 'active-tab' : ''}`}
            style={activeTab === 'inventory' ? { background: 'var(--primary)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventarios
          </button>
          <button 
            className={`btn ${activeTab === 'decision' ? 'active-tab' : ''}`}
            style={activeTab === 'decision' ? { background: 'var(--primary)', color: '#fff' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
            onClick={() => setActiveTab('decision')}
          >
            ⚖️ Decisiones
          </button>
        </div>
        <div style={{ width: '150px' }}></div> {/* Spacer para centrar los botones */}
      </nav>

      {/* Contenedor Principal */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'men' && <MenModule />}
        {activeTab === 'network' && <NetworkModule />}
        {activeTab === 'critical' && <NetworkModule initialMethod="cpm" viewMode="critical" />}
        {activeTab === 'dynamic' && <DynamicModule />}
        {activeTab === 'queue' && <QueueModule />}
        {activeTab === 'inventory' && <InventoryModule />}
        {activeTab === 'decision' && <DecisionModule />}
      </div>
    </div>
  );
}

export default App;
