import React from 'react';
import { Award, HeartPulse, ShieldCheck, Plane, Users, CheckCircle2, AlertTriangle, FileSpreadsheet, Clock, ArrowDown } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { ActiveTab } from './Header';
import { OperationalExpirationsMenu } from './OperationalExpirationsMenu';
import { ScannerDocHint } from './AviationScannerModal';

interface StatsOverviewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewRecord: () => void;
  onOpenAuditReport: () => void;
  onSelectPilot?: (pilotId: string) => void;
  onNavigateToPilots?: (sub?: 'expediente' | 'licencia' | 'medico') => void;
  onNavigateToAircraft?: (sub?: 'expediente' | 'aeronavegabilidad' | 'ruido' | 'estacion') => void;
  onOpenScanner?: (hint?: ScannerDocHint) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  setActiveTab,
  onOpenNewRecord,
  onOpenAuditReport,
  onSelectPilot,
  onNavigateToPilots,
  onNavigateToAircraft,
  onOpenScanner,
}) => {
  const {
    pilots,
    licenses,
    medicalCertificates,
    aircraft,
    airworthinessRecords,
    expiringSoonCount,
    expiredCount,
    totalValidCount,
    allDocuments,
  } = useAviation();

  const totalDocuments = allDocuments.length;
  const complianceRate =
    totalDocuments > 0
      ? Math.round((totalValidCount / totalDocuments) * 100)
      : 100;

  const activeAircraft = aircraft.filter((a) => a.isAirworthy).length;

  const handlePilotClick = (pilotId: string) => {
    if (onSelectPilot) {
      onSelectPilot(pilotId);
    } else {
      setActiveTab('pilots');
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Operational Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/aviation_aircraft_hangar_1792541240992.jpg"
            alt="Hangar de operaciones y mantenimiento aeronáutico"
            className="w-full h-full object-cover object-center opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/60" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-widest mb-3">
            <span>Operaciones de Vuelo & Aeronavegabilidad</span>
            <span aria-hidden="true">/</span>
            <span>Estándares OACI & AFAC</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-balance">
            Biblioteca Digital y Control de Licencias, Médicos y Aeronaves
          </h1>
          
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Plataforma centralizada para salvaguardar expedientes de vuelo, vigencias de aptitudes psicofísicas y certificados de aeronavegabilidad técnica con control riguroso de vencimientos.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => (onNavigateToPilots ? onNavigateToPilots('licencia') : setActiveTab('pilots'))}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors shadow-sm whitespace-nowrap"
            >
              Consultar Licencias
            </button>
            <button
              onClick={() => (onNavigateToAircraft ? onNavigateToAircraft('expediente') : setActiveTab('aircraft'))}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 transition-colors whitespace-nowrap"
            >
              Expedientes de Flota
            </button>
            <button
              onClick={onOpenAuditReport}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-sky-300 border border-sky-500/30 transition-colors whitespace-nowrap"
            >
              Generar Carpeta de Auditoría
            </button>
            {(expiredCount > 0 || expiringSoonCount > 0) && (
              <button
                onClick={() => document.getElementById('menu-operativo-vencimientos')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Control de Vencimientos ({expiredCount + expiringSoonCount})</span>
                <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* High-Density Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Licencias de Vuelo</span>
            <Award className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {licenses.length}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{pilots.length} pilotos registrados</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Aptitudes Médicas</span>
            <HeartPulse className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {medicalCertificates.length}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Clases 1, 2 y 3</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Aeronaves & Certificados</span>
            <Plane className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {airworthinessRecords.length}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">{activeAircraft} de {aircraft.length}</span>
              <span>aviones al día</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cumplimiento OACI</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {complianceRate}%
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
              {expiredCount > 0 ? (
                <button
                  type="button"
                  onClick={() => document.getElementById('menu-operativo-vencimientos')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-rose-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{expiredCount} vencidos</span>
                </button>
              ) : (
                <span className="text-emerald-400 font-semibold">Sin vencimientos críticos</span>
              )}
              {expiringSoonCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => document.getElementById('menu-operativo-vencimientos')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{expiringSoonCount} por vencer</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Pilots & Fleet Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pilots & Licenses Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-semibold text-white">Tripulaciones y Pilotos</h3>
              </div>
              <button
                onClick={() => setActiveTab('pilots')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                Ver expedientes ({pilots.length})
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 mt-2">
              {pilots.map((p) => {
                const pilotLic = licenses.find((l) => l.pilotId === p.id);
                const pilotMed = medicalCertificates.find((m) => m.pilotId === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handlePilotClick(p.id)}
                    className="py-3 px-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2">
                        <span>{p.fullName}</span>
                        <span className="text-xs text-slate-400 font-normal">({p.role})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Base: {p.baseAirport}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{p.totalFlightHours} hrs</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs">
                        {pilotLic ? (
                          <span
                            className={`font-semibold ${
                              pilotLic.status === 'valid'
                                ? 'text-emerald-400'
                                : pilotLic.status === 'expiring_soon'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            Lic: {pilotLic.category}
                          </span>
                        ) : (
                          <span className="text-slate-500">Sin licencia</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {pilotMed ? (
                          <span>Médico: {pilotMed.medicalClass}</span>
                        ) : (
                          <span className="text-slate-500">Médico pendiente</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total: {pilots.length} pilotos registrados</span>
            <button
              onClick={() => setActiveTab('pilots')}
              className="text-xs font-medium text-slate-300 hover:text-white"
            >
              Consultar expedientes de piloto →
            </button>
          </div>
        </div>

        {/* Fleet & Airworthiness Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Plane className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Flota de Aeronaves</h3>
              </div>
              <button
                onClick={() => (onNavigateToAircraft ? onNavigateToAircraft('expediente') : setActiveTab('aircraft'))}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                Ver registros ({airworthinessRecords.length})
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 mt-2">
              {aircraft.map((ac) => {
                const acRecords = airworthinessRecords.filter((r) => r.aircraftId === ac.id);
                const hasExpired = acRecords.some((r) => r.status === 'expired');
                return (
                  <div key={ac.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="font-mono text-sky-400">{ac.registration}</span>
                        <span className="font-medium text-slate-300">· {ac.make} {ac.model}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Base: {ac.baseAirport}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{ac.totalAirframeHours} TT</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold">
                        {ac.isAirworthy && !hasExpired ? (
                          <span className="text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aeronavegable
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center justify-end gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Requiere Atención
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {acRecords.length} docs registrados
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total: {aircraft.length} aviones en registro</span>
            <button
              onClick={() => (onNavigateToAircraft ? onNavigateToAircraft('expediente') : setActiveTab('aircraft'))}
              className="text-xs font-medium text-slate-300 hover:text-white"
            >
              Auditar certificados →
            </button>
          </div>
        </div>

      </div>

      {/* Menú Operativo de Vencimientos y Próximas Expiraciones (ubicado abajo para un inicio limpio y despejado) */}
      <OperationalExpirationsMenu
        onNavigateToVault={() => setActiveTab('vault')}
        onNavigateToPilots={(pId, sub) => {
          if (pId && onSelectPilot) onSelectPilot(pId);
          if (onNavigateToPilots) onNavigateToPilots(sub);
          else setActiveTab('pilots');
        }}
        onNavigateToAircraft={(acId, sub) => {
          if (onNavigateToAircraft) onNavigateToAircraft(sub);
          else setActiveTab('aircraft');
        }}
        onOpenScanner={onOpenScanner}
      />

    </div>
  );
};
