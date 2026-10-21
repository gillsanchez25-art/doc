import React, { useState } from 'react';
import { Award, Search, Plus, Filter, Eye, Edit2, Trash2, Calendar, FileText } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { FlightLicense, LicenseCategory, DocumentStatus } from '../types/aviation';
import { formatDateSpanish, getStatusBadgeData, getLicenseCategoryLabel, calculateDaysRemaining } from '../utils/aviationUtils';

interface LicenseManagerProps {
  onNewLicense: () => void;
  onEditLicense: (license: FlightLicense) => void;
  onOpenScanner?: () => void;
  onSelectPilot?: (pilotId: string) => void;
}

export const LicenseManager: React.FC<LicenseManagerProps> = ({
  onNewLicense,
  onEditLicense,
  onOpenScanner,
  onSelectPilot,
}) => {
  const { licenses, deleteLicense, openDocumentViewer, allDocuments } = useAviation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredLicenses = licenses.filter((lic) => {
    const matchesSearch =
      lic.pilotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lic.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lic.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lic.ratings.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || lic.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || lic.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleViewDoc = (lic: FlightLicense) => {
    const docItem = allDocuments.find((d) => d.originalRefId === lic.id);
    if (docItem) {
      openDocumentViewer(docItem);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar la licencia de ${name}?`)) {
      deleteLicense(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-400" />
            <span>Licencias de Vuelo y Habilitaciones</span>
          </h2>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Control de competencias de tripulaciones</span>
            <span aria-hidden="true">·</span>
            <span>Estándares OACI / AFAC / FAA</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{filteredLicenses.length} encontradas</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'cards' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Credenciales
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
                className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-sky-300 rounded transition-colors"
                title="Agrupar por piloto y ver licencia + examen"
              >
                Por Piloto
              </button>
            )}
          </div>

          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <Award className="w-3.5 h-3.5 text-sky-400" />
              <span>Escanear Licencia IA</span>
            </button>
          )}

          <button
            onClick={onNewLicense}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Licencia</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por piloto, número, autoridad o habilitación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todas las Categorías</option>
            <option value="PPL">PPL - Piloto Privado</option>
            <option value="CPL">CPL - Piloto Comercial</option>
            <option value="ATPL">ATPL - Línea Aérea</option>
            <option value="FI">FI - Instructor de Vuelo</option>
            <option value="ULM">ULM - Ultraligero</option>
          </select>
        </div>

        {/* Status filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="valid">Vigentes</option>
            <option value="expiring_soon">Por Vencer (&lt; 30 días)</option>
            <option value="expired">Vencidas</option>
          </select>
        </div>
      </div>

      {/* Populated vs Empty State */}
      {filteredLicenses.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800">
          <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No se encontraron licencias</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Prueba cambiando los filtros de búsqueda o registra una nueva licencia de vuelo en la base de datos.
          </p>
          <button
            onClick={onNewLicense}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-400 border border-sky-500/30 rounded-lg hover:bg-sky-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Licencia Ahora</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Credential Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLicenses.map((lic) => {
            const days = calculateDaysRemaining(lic.expiryDate);
            const badge = getStatusBadgeData(lic.status, days);

            return (
              <div
                key={lic.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Top Bar: Category & Status */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-sky-400 tracking-wider">
                        {lic.category} · {getLicenseCategoryLabel(lic.category)}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {lic.pilotName}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-semibold ${
                          lic.status === 'valid'
                            ? 'text-emerald-400'
                            : lic.status === 'expiring_soon'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {badge.label}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Vence: {formatDateSpanish(lic.expiryDate)}
                      </div>
                    </div>
                  </div>

                  {/* License Technical Details */}
                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Número de Licencia:</span>
                      <span className="font-mono text-slate-200 font-semibold">{lic.licenseNumber}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Autoridad Emisora:</span>
                      <span className="text-slate-300">{lic.issuingAuthority}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fecha de Expedición:</span>
                      <span className="text-slate-300 font-mono tabular-nums">{formatDateSpanish(lic.issueDate)}</span>
                    </div>

                    {/* Ratings / Endorsements - Clean zero-pill metadata */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1">
                        Habilitaciones Registradas:
                      </span>
                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
                        {lic.ratings.map((rating, idx) => (
                          <React.Fragment key={idx}>
                            <span>{rating}</span>
                            {idx < lic.ratings.length - 1 && <span className="text-slate-600" aria-hidden="true">·</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {lic.typeRatings && lic.typeRatings.length > 0 && (
                      <div className="pt-1">
                        <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1">
                          Habilitación de Tipo:
                        </span>
                        <div className="text-xs text-sky-300 font-mono">
                          {lic.typeRatings.join(' · ')}
                        </div>
                      </div>
                    )}

                    {lic.notes && (
                      <div className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                        "{lic.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {lic.fileName || 'documento.pdf'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDoc(lic)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>Ver Documento</span>
                    </button>
                    <button
                      onClick={() => onEditLicense(lic)}
                      className="p-1 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800 transition-colors"
                      title="Editar registro"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(lic.id, lic.pilotName)}
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
        /* High-Density Table View */
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Piloto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Número</th>
                <th className="py-3 px-4">Autoridad</th>
                <th className="py-3 px-4">Expedición</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLicenses.map((lic) => {
                const days = calculateDaysRemaining(lic.expiryDate);
                const badge = getStatusBadgeData(lic.status, days);

                return (
                  <tr key={lic.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {lic.pilotName}
                    </td>
                    <td className="py-3 px-4 text-sky-400 font-bold whitespace-nowrap">
                      {lic.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200 whitespace-nowrap">
                      {lic.licenseNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {lic.issuingAuthority}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                      {formatDateSpanish(lic.issueDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200 tabular-nums whitespace-nowrap font-medium">
                      {formatDateSpanish(lic.expiryDate)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          lic.status === 'valid'
                            ? 'text-emerald-400'
                            : lic.status === 'expiring_soon'
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
                          onClick={() => handleViewDoc(lic)}
                          className="p-1 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800"
                          title="Ver documento adjunto"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditLicense(lic)}
                          className="p-1 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lic.id, lic.pilotName)}
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
