import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  FileText,
  Search,
  CheckCircle2,
  Scan,
  ExternalLink,
  User,
  Plane,
  ChevronRight
} from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { formatDateSpanish } from '../utils/aviationUtils';
import { DocumentItem } from '../types/aviation';
import { ScannerDocHint } from './AviationScannerModal';

interface OperationalExpirationsMenuProps {
  onNavigateToVault?: () => void;
  onNavigateToPilots?: (pilotId?: string, sub?: 'expediente' | 'licencia' | 'medico') => void;
  onNavigateToAircraft?: (aircraftId?: string, sub?: 'expediente' | 'aeronavegabilidad' | 'ruido' | 'estacion') => void;
  onOpenScanner?: (hint?: ScannerDocHint) => void;
}

type ExpirationFilter = 'all_alerts' | 'expired' | 'urgent_30' | 'upcoming_60' | 'pilots' | 'aircraft';

export const OperationalExpirationsMenu: React.FC<OperationalExpirationsMenuProps> = ({
  onNavigateToVault,
  onNavigateToPilots,
  onNavigateToAircraft,
  onOpenScanner,
}) => {
  const { allDocuments, openDocumentViewer } = useAviation();
  const [filter, setFilter] = useState<ExpirationFilter>('all_alerts');
  const [searchQuery, setSearchQuery] = useState('');

  // Identify documents by urgency
  const expiredDocs = useMemo(() => allDocuments.filter((d) => d.status === 'expired'), [allDocuments]);
  const urgent30Docs = useMemo(() => allDocuments.filter((d) => d.status === 'expiring_soon'), [allDocuments]);
  const upcoming60Docs = useMemo(
    () => allDocuments.filter((d) => d.daysRemaining >= 30 && d.daysRemaining <= 60),
    [allDocuments]
  );

  const allAlertDocs = useMemo(() => {
    return allDocuments.filter(
      (d) => d.status === 'expired' || d.status === 'expiring_soon' || (d.daysRemaining >= 0 && d.daysRemaining <= 60)
    );
  }, [allDocuments]);

  // Apply filters
  const filteredDocs = useMemo(() => {
    let list: DocumentItem[] = [];

    switch (filter) {
      case 'expired':
        list = expiredDocs;
        break;
      case 'urgent_30':
        list = urgent30Docs;
        break;
      case 'upcoming_60':
        list = upcoming60Docs;
        break;
      case 'pilots':
        list = allAlertDocs.filter((d) => d.entityType === 'pilot');
        break;
      case 'aircraft':
        list = allAlertDocs.filter((d) => d.entityType === 'aircraft');
        break;
      case 'all_alerts':
      default:
        list = allAlertDocs;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.entityName.toLowerCase().includes(q) ||
          d.documentNumber.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [filter, searchQuery, expiredDocs, urgent30Docs, upcoming60Docs, allAlertDocs]);

  // Helper to determine appropriate scanner hint
  const getScannerHint = (doc: DocumentItem): ScannerDocHint => {
    if (doc.category === 'licencia') return 'licencia_vuelo';
    if (doc.category === 'medico') return 'examen_medico';
    const lowerTitle = doc.title.toLowerCase();
    if (lowerTitle.includes('ruido') || lowerTitle.includes('acústic')) return 'certificado_ruido';
    if (lowerTitle.includes('estación') || lowerTitle.includes('radio') || lowerTitle.includes('telecom')) {
      return 'certificado_estacion';
    }
    return 'certificado_aeronavegabilidad';
  };

  const handleInspect = (doc: DocumentItem) => {
    openDocumentViewer(doc);
  };

  const handleNavigateToEntity = (doc: DocumentItem) => {
    if (doc.entityType === 'pilot') {
      const sub = doc.category === 'medico' ? 'medico' : 'licencia';
      if (onNavigateToPilots) {
        onNavigateToPilots(doc.originalRefId, sub);
      }
    } else if (doc.entityType === 'aircraft') {
      const lowerTitle = doc.title.toLowerCase();
      let sub: 'aeronavegabilidad' | 'ruido' | 'estacion' = 'aeronavegabilidad';
      if (lowerTitle.includes('ruido')) sub = 'ruido';
      else if (lowerTitle.includes('estación') || lowerTitle.includes('radio')) sub = 'estacion';
      
      if (onNavigateToAircraft) {
        onNavigateToAircraft(doc.originalRefId, sub);
      }
    }
  };

  return (
    <div id="menu-operativo-vencimientos" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              {expiredDocs.length > 0 ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <Clock className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Menú Operativo: Control de Vencimientos y Próximas Expiraciones</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {allAlertDocs.length} {allAlertDocs.length === 1 ? 'documento' : 'documentos'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Vigilancia reglamentaria de licencias de vuelo, exámenes médicos y certificados técnicos conforme a normativa OACI / AFAC.
              </p>
            </div>
          </div>
        </div>

        {/* Counter chips */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 text-xs">
          {expiredDocs.length > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-300 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {expiredDocs.length} vencidos
            </span>
          )}
          {urgent30Docs.length > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-800/40 text-amber-300 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {urgent30Docs.length} por vencer &lt; 30d
            </span>
          )}
          {upcoming60Docs.length > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-sky-950/40 border border-sky-800/40 text-sky-300 font-medium">
              {upcoming60Docs.length} en 30-60d
            </span>
          )}
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilter('all_alerts')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'all_alerts'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Todos en Alerta ({allAlertDocs.length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'expired'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Vencidos ({expiredDocs.length})
          </button>
          <button
            onClick={() => setFilter('urgent_30')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'urgent_30'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Por Vencer &lt; 30d ({urgent30Docs.length})
          </button>
          <button
            onClick={() => setFilter('upcoming_60')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'upcoming_60'
                ? 'bg-slate-700 text-sky-300 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Próximos &lt; 60d ({upcoming60Docs.length})
          </button>
          <button
            onClick={() => setFilter('pilots')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'pilots'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Tripulaciones
          </button>
          <button
            onClick={() => setFilter('aircraft')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'aircraft'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Aeronaves
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full lg:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por piloto, matrícula o doc..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-950/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="mt-4">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-200">
              Sin Alertas Operativas en este Criterio
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Todos los documentos e inspecciones cumplen con los márgenes reglamentarios o no coinciden con la búsqueda actual.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDocs.map((doc) => {
              const isExpired = doc.status === 'expired';
              const isExpiringSoon = doc.status === 'expiring_soon';
              const scannerHint = getScannerHint(doc);

              return (
                <div
                  key={doc.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isExpired
                      ? 'bg-rose-950/15 border-rose-900/40 hover:border-rose-700/60'
                      : isExpiringSoon
                      ? 'bg-amber-950/15 border-amber-900/40 hover:border-amber-700/60'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Entity & Document Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
                          isExpired
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : isExpiringSoon
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {isExpired ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            <span>Vencido hace {Math.abs(doc.daysRemaining)} días</span>
                          </>
                        ) : isExpiringSoon ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Vence en {doc.daysRemaining} días</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-sky-400" />
                            <span>Vence en {doc.daysRemaining} días</span>
                          </>
                        )}
                      </span>

                      {/* Category tag */}
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.category === 'licencia'
                          ? 'Licencia de Vuelo'
                          : doc.category === 'medico'
                          ? 'Examen Médico'
                          : doc.title.toLowerCase().includes('ruido')
                          ? 'Cert. Ruido'
                          : doc.title.toLowerCase().includes('estación')
                          ? 'Cert. Estación'
                          : 'Aeronavegabilidad'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h4 className="text-sm font-bold text-white truncate" title={doc.title}>
                        {doc.title}
                      </h4>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-200">
                        {doc.entityType === 'pilot' ? (
                          <User className="w-3 h-3 text-sky-400" />
                        ) : (
                          <Plane className="w-3 h-3 text-indigo-400" />
                        )}
                        <span>{doc.entityName}</span>
                      </span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        Doc: {doc.documentNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span className="font-mono text-slate-400 text-[11px] tabular-nums">
                        Vence: {formatDateSpanish(doc.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Operational Actions */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t border-slate-800/80 lg:border-t-0 shrink-0">
                    {/* Inspect Document button */}
                    <button
                      onClick={() => handleInspect(doc)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      title="Ver digitalización o certificado"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span>Inspeccionar</span>
                    </button>

                    {/* AI Scanner Renewal Button */}
                    {onOpenScanner && (
                      <button
                        onClick={() => onOpenScanner(scannerHint)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        title="Escanear y recortar con IA la renovación de este documento"
                      >
                        <Scan className="w-3.5 h-3.5 text-sky-400" />
                        <span className="hidden sm:inline">Renovar con</span> IA
                      </button>
                    )}

                    {/* Go to Entity Dossier */}
                    {(onNavigateToPilots || onNavigateToAircraft) && (
                      <button
                        onClick={() => handleNavigateToEntity(doc)}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Ir al expediente completo"
                      >
                        <span>Expediente</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
        <span>
          Márgenes recomendados: Renovar exámenes médicos con 30 días de anticipación y certificados de aeronavegabilidad con 45 días.
        </span>
        {onNavigateToVault && (
          <button
            onClick={onNavigateToVault}
            className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Ver biblioteca completa en Bóveda</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

    </div>
  );
};
