import { useState } from "react";
import Shell from "./components/layout/Shell";
import { ActiveView } from "./components/layout/Sidebar";
import EsquinaNoroesteView from "./features/esquina-noroeste/components/EsquinaNoroesteView";
import DijkstraView from "./features/dijkstra/components/DijkstraView";
import { Network, Activity, Wrench } from "lucide-react";

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('esquina-noroeste');

  const renderPlaceholder = (title: string, desc: string, icon: any, color: string) => {
    const Icon = icon;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 glass-panel rounded-xl text-center">
        <div className="p-5 bg-white/2 rounded-full border border-white/5 mb-6">
          <Icon className={`w-16 h-16 ${color} animate-pulse`} />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">{title}</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm leading-relaxed">{desc}</p>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/3 border border-white/5 px-3 py-1.5 rounded-lg">
          <Wrench className="w-4 h-4 text-blue-400 animate-spin" />
          <span>Estructura modular lista para la implementación del algoritmo</span>
        </div>
      </div>
    );
  };

  return (
    <Shell activeView={activeView} onViewChange={setActiveView}>
      {activeView === 'esquina-noroeste' && <EsquinaNoroesteView />}
      {activeView === 'dijkstra' && <DijkstraView />}
      {activeView === 'kruskal' && renderPlaceholder(
        "Árbol de Expansión Mínima (Algoritmo de Kruskal)",
        "Conecta todos los nodos de la red con el menor costo total posible, ordenando las aristas por peso y previniendo ciclos.",
        Network,
        "text-amber-400"
      )}
      {activeView === 'ford-fulkerson' && renderPlaceholder(
        "Flujo Máximo (Algoritmo de Ford-Fulkerson)",
        "Calcula la cantidad máxima de flujo que puede transitar desde un nodo origen (fuente) hasta un nodo destino (sumidero) en una red con capacidades de arista limitadas.",
        Activity,
        "text-rose-400"
      )}
    </Shell>
  );
}

export default App;
