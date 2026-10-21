import React, { useState, useRef, useEffect } from 'react';
import {
  Plane,
  PlusCircle,
  Printer,
  Download,
  RotateCcw,
  Search,
  X,
  Users,
  Award,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { Pilot, Aircraft } from '../types/aviation';

export type ActiveTab = 'overview' | 'pilots' | 'aircraft' | 'vault';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewRecord: () => void;
  onOpenScanner: () => void;
  onOpenAuditReport: () => void;
  onExportBackup: () => void;
  onResetData: () => void;
  onSelectPilot?: (pilotId: string) => void;
  onSelectAircraft?: (aircraftId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewRecord,
  onOpenScanner,
  onOpenAuditReport,
  onExportBackup,
  onResetData,
  onSelectPilot,
  onSelectAircraft,
}) => {
  const { pilots, aircraft, licenses, airworthinessRecords } = useAviation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global hotkey Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter pilots & aircraft in real time
  const cleanQ = searchQuery.trim().toLowerCase();

  const matchingPilots: Pilot[] = cleanQ
    ? pilots.filter(
        (p) =>
          p.fullName.toLowerCase().includes(cleanQ) ||
          p.role.toLowerCase().includes(cleanQ) ||
          p.baseAirport.toLowerCase().includes(cleanQ) ||
          p.nationalId.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchingAircraft: Aircraft[] = cleanQ
    ? aircraft.filter(
        (a) =>
          a.registration.toLowerCase().includes(cleanQ) ||
          a.model.toLowerCase().includes(cleanQ) ||
          a.make.toLowerCase().includes(cleanQ) ||
          a.baseAirport.toLowerCase().includes(cleanQ) ||
          a.serialNumber.toLowerCase().includes(cleanQ)
      )
    : [];

  const totalResults = matchingPilots.length + matchingAircraft.length;

  // Flattened items for keyboard navigation
  const flatItems: Array<
    | { type: 'pilot'; item: Pilot }
    | { type: 'aircraft'; item: Aircraft }
  > = [
    ...matchingPilots.map((p) => ({ type: 'pilot' as const, item: p })),
    ...matchingAircraft.map((a) => ({ type: 'aircraft' as const, item: a })),
  ];

  const handleSelectPilotItem = (p: Pilot) => {
    onSelectPilot?.(p.id);
    setActiveTab('pilots');
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSelectAircraftItem = (a: Aircraft) => {
    onSelectAircraft?.(a.id);
    setActiveTab('aircraft');
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatItems[selectedIndex];
      if (current) {
        if (current.type === 'pilot') {
          handleSelectPilotItem(current.item);
        } else {
          handleSelectAircraftItem(current.item);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 md:gap-6 h-16">
          
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
          <nav className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-sky-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Control
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
              Bóveda
            </button>
          </nav>

          {/* Zone 3: Real-Time Quick Search Bar (Pilotos / Matrículas) */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  setSelectedIndex(0);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar piloto o matrícula..."
                className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-950/70 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
              />
              
              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 select-none">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Floating Dropdown Results */}
            {isSearchOpen && cleanQ && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in duration-100 max-h-[380px] overflow-y-auto">
                {totalResults === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    <p className="font-medium">No se encontraron resultados</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      No hay pilotos o matrículas que coincidan con "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    
                    {/* Pilots Group */}
                    {matchingPilots.length > 0 && (
                      <div className="p-2">
                        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Pilotos ({matchingPilots.length})</span>
                          </span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {matchingPilots.map((p, idx) => {
                            const isSelected = selectedIndex === idx;
                            const pilotLic = licenses.find(
                              (l) => l.pilotId === p.id || l.pilotName.toLowerCase().includes(p.fullName.toLowerCase())
                            );
                            const isExpiring = pilotLic?.status === 'expiring_soon';
                            const isExpired = pilotLic?.status === 'expired';

                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectPilotItem(p)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                                  isSelected
                                    ? 'bg-sky-600 text-white'
                                    : 'hover:bg-slate-800/80 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-sky-950 text-sky-300 border border-sky-800/60'
                                    }`}
                                  >
                                    {p.fullName.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <div className="font-semibold text-xs truncate">{p.fullName}</div>
                                    <div
                                      className={`text-[11px] truncate ${
                                        isSelected ? 'text-sky-100' : 'text-slate-400'
                                      }`}
                                    >
                                      {p.role} · Base {p.baseAirport}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isExpired ? (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                                      VENCIDO
                                    </span>
                                  ) : isExpiring ? (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                                      POR VENCER
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                                      VIGENTE
                                    </span>
                                  )}
                                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Aircraft Group */}
                    {matchingAircraft.length > 0 && (
                      <div className="p-2">
                        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                          <span className="flex items-center gap-1.5">
                            <Plane className="w-3.5 h-3.5" />
                            <span>Aeronaves ({matchingAircraft.length})</span>
                          </span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {matchingAircraft.map((a, i) => {
                            const actualIdx = matchingPilots.length + i;
                            const isSelected = selectedIndex === actualIdx;
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => handleSelectAircraftItem(a)}
                                onMouseEnter={() => setSelectedIndex(actualIdx)}
                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'hover:bg-slate-800/80 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`px-2 py-1 rounded font-mono font-bold text-xs shrink-0 ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                                    }`}
                                  >
                                    {a.registration}
                                  </div>
                                  <div className="truncate">
                                    <div className="font-semibold text-xs truncate">
                                      {a.make} {a.model}
                                    </div>
                                    <div
                                      className={`text-[11px] truncate ${
                                        isSelected ? 'text-indigo-100' : 'text-slate-400'
                                      }`}
                                    >
                                      Base {a.baseAirport} · {a.totalAirframeHours.toLocaleString()} hrs
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      a.isAirworthy
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                        : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                                    }`}
                                  >
                                    {a.isAirworthy ? 'AERONAVEGABLE' : 'NO OPERATIVA'}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone 4: Primary Action & Quick Audit buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={onOpenAuditReport}
              title="Generar Carpeta de Cumplimiento / Reporte de Auditoría OACI"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
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
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Escanear con IA</span>
              <span className="sm:hidden">Escanear</span>
            </button>

            <button
              onClick={onOpenNewRecord}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden md:inline">Nuevo Registro</span>
              <span className="md:hidden">Nuevo</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-800/80 scrollbar-none">
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
