import React, { useState } from 'react';
import { HeartPulse, Search, Plus, Filter, Eye, Edit2, Trash2, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { MedicalCertificate, MedicalClass } from '../types/aviation';
import { formatDateSpanish, getStatusBadgeData, calculateDaysRemaining } from '../utils/aviationUtils';

interface MedicalManagerProps {
  onNewMedical: () => void;
  onEditMedical: (medical: MedicalCertificate) => void;
  onOpenScanner?: () => void;
  onSelectPilot?: (pilotId: string) => void;
}

export const MedicalManager: React.FC<MedicalManagerProps> = ({
  onNewMedical,
  onEditMedical,
  onOpenScanner,
  onSelectPilot,
}) => {
  const { medicalCertificates, deleteMedicalCertificate, openDocumentViewer, allDocuments } = useAviation();
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredMedicals = medicalCertificates.filter((med) => {
    const matchesSearch =
      med.pilotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.authorizedExaminer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.clinicName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = classFilter === 'all' || med.medicalClass === classFilter;
    const matchesStatus = statusFilter === 'all' || med.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleViewDoc = (med: MedicalCertificate) => {
    const docItem = allDocuments.find((d) => d.originalRefId === med.id);
    if (docItem) {
      openDocumentViewer(docItem);
    }
  };

  const handleDelete = (id: string, _name?: string) => {
    deleteMedicalCertificate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            <span>Exámenes Médicos y Aptitud Psicofísica</span>
          </h2>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Certificación aeromédica de tripulaciones</span>
            <span aria-hidden="true">·</span>
            <span>Clases 1 (Comercial), 2 (Privado) y 3 (Control/Cabina)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{filteredMedicals.length} registrados</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'cards' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'table' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tabla
            </button>
            {onSelectPilot && (
              <button
                onClick={() => onSelectPilot('')}
                className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-emerald-300 rounded transition-colors"
                title="Agrupar por piloto y ver licencia + examen"
              >
                Por Piloto
              </button>
            )}
          </div>

          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
              <span>Escanear Médico IA</span>
            </button>
          )}

          <button
            onClick={onNewMedical}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Examen Médico</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por piloto, certificado, médico o clínica..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas las Clases Médicas</option>
            <option value="Clase 1">Clase 1 - Aerolínea & Comercial</option>
            <option value="Clase 2">Clase 2 - Aviación General & Privada</option>
            <option value="Clase 3">Clase 3 - Tránsito Aéreo & Tripulación</option>
            <option value="LAPL">LAPL - Aviación Ligera</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="valid">Vigentes</option>
            <option value="expiring_soon">Por Vencer (&lt; 30 días)</option>
            <option value="expired">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredMedicals.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800">
          <HeartPulse className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No hay exámenes médicos encontrados</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Ajusta los filtros de búsqueda o registra una nueva constancia médica aeronáutica.
          </p>
          <button
            onClick={onNewMedical}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Certificado Ahora</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMedicals.map((med) => {
            const days = calculateDaysRemaining(med.expiryDate);
            const badge = getStatusBadgeData(med.status, days);

            return (
              <div
                key={med.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 tracking-wider">
                        {med.medicalClass} · Aptitud Psicofísica
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {med.pilotName}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-semibold ${
                          med.status === 'valid'
                            ? 'text-emerald-400'
                            : med.status === 'expiring_soon'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {badge.label}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Vence: {formatDateSpanish(med.expiryDate)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Certificado Médico No:</span>
                      <span className="font-mono text-slate-200 font-semibold">{med.certificateNumber}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Médico Examinador Aéreo:</span>
                      <span className="text-slate-300 truncate max-w-[200px]" title={med.authorizedExaminer}>
                        {med.authorizedExaminer}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Centro Clínico / CEMA:</span>
                      <span className="text-slate-300 truncate max-w-[200px]" title={med.clinicName}>
                        {med.clinicName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fecha de Evaluación:</span>
                      <span className="text-slate-300 font-mono tabular-nums">{formatDateSpanish(med.issueDate)}</span>
                    </div>

                    {/* Limitations & Restrictions */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1">
                        Limitaciones Médicas / Operativas:
                      </span>
                      <div className="text-xs text-amber-200/90 bg-amber-950/20 border border-amber-900/30 rounded p-2">
                        {med.limitations.length > 0 ? (
                          med.limitations.map((lim, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">·</span>
                              <span>{lim}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Sin limitaciones médicas
                          </span>
                        )}
                      </div>
                    </div>

                    {med.notes && (
                      <div className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                        "{med.notes}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {med.fileName || 'certificado_medico.pdf'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDoc(med)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ver Certificado</span>
                    </button>
                    <button
                      onClick={() => onEditMedical(med)}
                      className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(med.id, med.pilotName)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Piloto</th>
                <th className="py-3 px-4">Clase</th>
                <th className="py-3 px-4">Certificado</th>
                <th className="py-3 px-4">Examinador Aéreo</th>
                <th className="py-3 px-4">Expedición</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredMedicals.map((med) => {
                const days = calculateDaysRemaining(med.expiryDate);
                const badge = getStatusBadgeData(med.status, days);

                return (
                  <tr key={med.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {med.pilotName}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold whitespace-nowrap">
                      {med.medicalClass}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200 whitespace-nowrap">
                      {med.certificateNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {med.authorizedExaminer}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                      {formatDateSpanish(med.issueDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200 tabular-nums whitespace-nowrap font-medium">
                      {formatDateSpanish(med.expiryDate)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          med.status === 'valid'
                            ? 'text-emerald-400'
                            : med.status === 'expiring_soon'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDoc(med)}
                          className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800"
                          title="Ver certificado"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditMedical(med)}
                          className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(med.id, med.pilotName)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
