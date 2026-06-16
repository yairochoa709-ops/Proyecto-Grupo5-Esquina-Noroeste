import { useState } from "react";
import Shell from "./components/layout/Shell";
import { ActiveView } from "./components/layout/Sidebar";
import EsquinaNoroesteView from "./features/esquina-noroeste/components/EsquinaNoroesteView";
import DijkstraView from "./features/dijkstra/components/DijkstraView";
import KruskalView from "./features/kruskal/components/KruskalView";
import FordFulkersonView from "./features/ford-fulkerson/components/FordFulkersonView";

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('esquina-noroeste');

  return (
    <Shell activeView={activeView} onViewChange={setActiveView}>
      {activeView === 'esquina-noroeste' && <EsquinaNoroesteView />}
      {activeView === 'dijkstra' && <DijkstraView />}
      {activeView === 'kruskal' && <KruskalView />}
      {activeView === 'ford-fulkerson' && <FordFulkersonView />}
    </Shell>
  );
}

export default App;
