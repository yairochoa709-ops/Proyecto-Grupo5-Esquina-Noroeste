import { Grid3x3, Route, GitFork, Activity, ShieldAlert, Cpu } from "lucide-react";

export type ActiveView = 'esquina-noroeste' | 'dijkstra' | 'kruskal' | 'ford-fulkerson';

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const items = [
    {
      id: 'esquina-noroeste' as ActiveView,
      name: 'Esquina Noroeste',
      description: 'Problemas de Transporte',
      icon: Grid3x3,
      color: 'text-blue-400 hover:text-blue-300',
      activeBg: 'bg-blue-600/10 border-blue-500/50 text-blue-400',
    },
    {
      id: 'dijkstra' as ActiveView,
      name: 'Ruta Más Corta (Dijkstra)',
      description: 'Caminos óptimos en grafos',
      icon: Route,
      color: 'text-emerald-400 hover:text-emerald-300',
      activeBg: 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400',
    },
    {
      id: 'kruskal' as ActiveView,
      name: 'Árbol Mínimo (Kruskal)',
      description: 'Expansión óptima sin ciclos',
      icon: GitFork,
      color: 'text-amber-400 hover:text-amber-300',
      activeBg: 'bg-amber-600/10 border-amber-500/50 text-amber-400',
    },
    {
      id: 'ford-fulkerson' as ActiveView,
      name: 'Flujo Máximo (F-Fulkerson)',
      description: 'Capacidad de red residual',
      icon: Activity,
      color: 'text-rose-400 hover:text-rose-300',
      activeBg: 'bg-rose-600/10 border-rose-500/50 text-rose-400',
    },
  ];

  return (
    <aside className="w-72 h-full flex flex-col glass-panel border-r border-white/5 p-6 shrink-0 rounded-l-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
          <Cpu className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide m-0 leading-none">Dashboard IO</h1>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1 block">Investigación de Operaciones</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3.5 p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                isActive 
                  ? item.activeBg 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-white/3 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-white/5' : 'bg-slate-900/50'}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <span className="block font-semibold text-sm leading-tight text-slate-100">{item.name}</span>
                <span className="block text-[11px] text-slate-500 leading-tight mt-0.5">{item.description}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-2 text-slate-500 text-xs font-semibold">
        <ShieldAlert className="w-4 h-4 text-slate-600" />
        <span>Versión 2.0.0 (Tauri)</span>
      </div>
    </aside>
  );
}
