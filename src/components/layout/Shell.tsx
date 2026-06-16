import React from "react";
import Sidebar, { ActiveView } from "./Sidebar";

interface ShellProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  children: React.ReactNode;
}

export default function Shell({ activeView, onViewChange, children }: ShellProps) {
  return (
    <div className="w-screen h-screen flex p-4 gap-4 bg-[#050811] overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={onViewChange} />

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
