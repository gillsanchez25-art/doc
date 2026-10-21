import React from 'react';
import { Plane, PlusCircle, Printer, Download, RotateCcw } from 'lucide-react';

export type ActiveTab = 'overview' | 'pilots' | 'aircraft' | 'vault';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewRecord: () => void;
  onOpenScanner: () => void;
  onOpenAuditReport: () => void;
  onExportBackup: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewRecord,
  onOpenScanner,
  onOpenAuditReport,
  onExportBackup,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Plane className="w-5 h-5 rotate-45" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('overview');
              }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-sky-300 transition-colors"
            >
              AeroDoc <span className="text-sky-400 text-xs font-semibold tracking-normal font-mono px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/40 ml-1">OPS</span>
            </a>
          </div>

          {/* Zone 2: Navigation Links - 2 Main Categories: PILOTOS and AERONAVES */}
          <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-sky-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Centro de Control
            </button>
            <button
              onClick={() => setActiveTab('pilots')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'pilots'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Pilotos
            </button>
            <button
              onClick={() => setActiveTab('aircraft')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'aircraft'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Aeronaves
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'vault'
                  ? 'bg-slate-800 text-sky-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Bóveda Documental
            </button>
          </nav>

          {/* Zone 3: Primary Action & Quick Audit buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenAuditReport}
              title="Generar Carpeta de Cumplimiento / Reporte de Auditoría OACI"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Auditoría</span>
            </button>
            
            <button
              onClick={onExportBackup}
              title="Descargar copia de seguridad JSON"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              title="Restaurar datos de ejemplo"
              className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* AI Scanner Button */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>Escanear con IA</span>
            </button>

            <button
              onClick={onOpenNewRecord}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Registro</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'overview' ? 'bg-slate-800 text-sky-300 border border-slate-700' : 'text-slate-400'
            }`}
          >
            Control
          </button>
          <button
            onClick={() => setActiveTab('pilots')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'pilots' ? 'bg-sky-600 text-white' : 'text-slate-300'
            }`}
          >
            Pilotos
          </button>
          <button
            onClick={() => setActiveTab('aircraft')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'aircraft' ? 'bg-indigo-600 text-white' : 'text-slate-300'
            }`}
          >
            Aeronaves
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'vault' ? 'bg-slate-800 text-sky-300 border border-slate-700' : 'text-slate-400'
            }`}
          >
            Bóveda
          </button>
          <button
            onClick={onOpenAuditReport}
            className="px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap text-slate-400 border border-slate-700/60"
          >
            Auditoría
          </button>
        </div>
      </div>
    </header>
  );
};
