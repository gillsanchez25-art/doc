import React, { useState } from 'react';
import { Plane, Search, Plus, Filter, Eye, Edit2, Trash2, CheckCircle2, AlertTriangle, Wrench, Shield, Gauge, FileText } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { AirworthinessRecord, Aircraft } from '../types/aviation';
import { formatDateSpanish, getStatusBadgeData, getAirworthinessCertLabel, calculateDaysRemaining } from '../utils/aviationUtils';

interface AirworthinessManagerProps {
  onNewAirworthiness: () => void;
  onEditAirworthiness: (record: AirworthinessRecord) => void;
  onNewAircraft: () => void;
  onOpenScanner?: () => void;
}

export const AirworthinessManager: React.FC<AirworthinessManagerProps> = ({
  onNewAirworthiness,
  onEditAirworthiness,
  onNewAircraft,
  onOpenScanner,
}) => {
  const {
    aircraft,
    airworthinessRecords,
    deleteAirworthinessRecord,
    toggleAircraftAirworthy,
    openDocumentViewer,
    allDocuments,
  } = useAviation();

  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRecords = airworthinessRecords.filter((record) => {
    const matchesAircraft = selectedAircraftId === 'all' || record.aircraftId === selectedAircraftId;
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.aircraftRegistration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.aircraftModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesAircraft && matchesType && matchesStatus && matchesSearch;
  });

  const selectedAircraft = aircraft.find((a) => a.id === selectedAircraftId);

  const handleViewDoc = (record: AirworthinessRecord) => {
    const docItem = allDocuments.find((d) => d.originalRefId === record.id);
    if (docItem) {
      openDocumentViewer(docItem);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`¿Está seguro de eliminar el certificado "${title}"?`)) {
      deleteAirworthinessRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plane className="w-5 h-5 text-indigo-400" />
            <span>Certificados de Aeronavegabilidad y Flota</span>
          </h2>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Expedientes técnicos de aeronaves, inspecciones periódicas y matrículas</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{aircraft.length} aviones</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{filteredRecords.length} certificados</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plane className="w-3.5 h-3.5 text-indigo-400" />
              <span>Escanear Certificado IA</span>
            </button>
          )}

          <button
            onClick={onNewAircraft}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Nueva Aeronave</span>
          </button>
          
          <button
            onClick={onNewAirworthiness}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Certificado</span>
          </button>
        </div>
      </div>

      {/* Fleet Aircraft Strip Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedAircraftId('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedAircraftId === 'all'
              ? 'bg-slate-800 border-indigo-500/60 shadow-sm'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs font-semibold text-indigo-400">Toda la Flota</div>
          <div className="text-base font-bold text-white mt-1">Todos los Aviones</div>
          <div className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
            {aircraft.length} aeronaves registradas
          </div>
        </button>

        {aircraft.map((ac) => {
          const isSelected = selectedAircraftId === ac.id;
          const recordsCount = airworthinessRecords.filter((r) => r.aircraftId === ac.id).length;
          const hasExpired = airworthinessRecords.some(
            (r) => r.aircraftId === ac.id && r.status === 'expired'
          );

          return (
            <button
              key={ac.id}
              onClick={() => setSelectedAircraftId(ac.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-800 border-indigo-500/60 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-mono font-bold text-sky-400">{ac.registration}</span>
                <span
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    ac.isAirworthy && !hasExpired ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {ac.isAirworthy && !hasExpired ? 'Aeronavegable' : 'En Tierra'}
                </span>
              </div>
              <div className="text-sm font-semibold text-white mt-1 truncate">
                {ac.make} {ac.model}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span className="font-mono tabular-nums">{ac.totalAirframeHours} TT</span>
                <span aria-hidden="true">·</span>
                <span>{recordsCount} docs</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Aircraft Detail Card (if a single aircraft is selected) */}
      {selectedAircraft && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-extrabold text-sky-400 font-mono tracking-wider">
                  {selectedAircraft.registration}
                </span>
                <span className="text-sm font-semibold text-white">
                  {selectedAircraft.make} {selectedAircraft.model} ({selectedAircraft.year})
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Serie: {selectedAircraft.serialNumber}</span>
                <span aria-hidden="true">·</span>
                <span>Base: {selectedAircraft.baseAirport}</span>
                <span aria-hidden="true">·</span>
                <span>Operador: {selectedAircraft.operator}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleAircraftAirworthy(selectedAircraft.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  selectedAircraft.isAirworthy
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
                }`}
              >
                {selectedAircraft.isAirworthy ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Liberado para Vuelo</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5" />
                    <span>En Mantenimiento (AOG)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Horas Totales Fuselaje (TT):</span>
              <span className="font-mono text-white font-bold text-sm tabular-nums">
                {selectedAircraft.totalAirframeHours} hrs
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Horas Motor (TSO/TSN):</span>
              <span className="font-mono text-white font-bold text-sm tabular-nums">
                {selectedAircraft.engineHours} hrs
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Base de Operación:</span>
              <span className="text-slate-200 font-semibold">{selectedAircraft.baseAirport}</span>
            </div>
            <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Notas de Mantenimiento:</span>
              <span className="text-slate-300 truncate block" title={selectedAircraft.notes || 'Ninguna'}>
                {selectedAircraft.notes || 'Sin discrepancias'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por documento, matrícula, número, taller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los Tipos de Certificado</option>
            <option value="standard_airworthiness">Certificado de Aeronavegabilidad Estándar</option>
            <option value="annual_inspection">Inspección Anual</option>
            <option value="hundred_hour_check">Inspección 100 Horas</option>
            <option value="insurance_policy">Póliza de Seguro</option>
            <option value="elt_inspection">Inspección ELT</option>
            <option value="pitot_static_transponder">Pitot-Estática / Altímetro</option>
            <option value="registration_cert">Certificado de Matrícula</option>
            <option value="radio_station_license">Licencia de Estación de Radio</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="valid">Vigentes</option>
            <option value="expiring_soon">Por Vencer (&lt; 30 días)</option>
            <option value="expired">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Records Grid */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800">
          <Plane className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No se encontraron registros de aeronavegabilidad</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Prueba ajustando los filtros o registra un nuevo certificado o inspección para tu aeronave.
          </p>
          <button
            onClick={onNewAirworthiness}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Certificado Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => {
            const days = calculateDaysRemaining(record.expiryDate);
            const badge = getStatusBadgeData(record.status, days);

            return (
              <div
                key={record.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">
                          {record.aircraftRegistration}
                        </span>
                        <span className="text-xs text-slate-400 font-medium truncate max-w-[180px]">
                          {record.aircraftModel}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5" title={record.title}>
                        {record.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-semibold ${
                          record.status === 'valid'
                            ? 'text-emerald-400'
                            : record.status === 'expiring_soon'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {badge.label}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Vence: {formatDateSpanish(record.expiryDate)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tipo Técnico:</span>
                      <span className="text-slate-300 font-medium">{getAirworthinessCertLabel(record.type)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Número de Folio / Documento:</span>
                      <span className="font-mono text-slate-200 font-semibold">{record.documentNumber}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Autoridad / Taller Emisor:</span>
                      <span className="text-slate-300 truncate max-w-[200px]" title={record.issuingAuthority}>
                        {record.issuingAuthority}
                      </span>
                    </div>

                    {record.inspectorName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Inspector Responsable:</span>
                        <span className="text-slate-300">{record.inspectorName}</span>
                      </div>
                    )}

                    {record.maintenanceOrg && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Taller Aeronáutico:</span>
                        <span className="text-slate-300">{record.maintenanceOrg}</span>
                      </div>
                    )}

                    {record.lastInspectionHours !== undefined && (
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-400">Horas en Inspección:</span>
                        <span className="text-slate-200 tabular-nums">{record.lastInspectionHours} hrs</span>
                      </div>
                    )}

                    {record.nextInspectionDueHours !== undefined && (
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-400">Próxima Inspección a las:</span>
                        <span className="text-indigo-300 font-semibold tabular-nums">{record.nextInspectionDueHours} hrs</span>
                      </div>
                    )}

                    {record.notes && (
                      <div className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                        "{record.notes}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {record.fileName || 'certificado.pdf'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDoc(record)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Certificado</span>
                    </button>
                    <button
                      onClick={() => onEditAirworthiness(record)}
                      className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id, record.title)}
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
      )}
    </div>
  );
};
