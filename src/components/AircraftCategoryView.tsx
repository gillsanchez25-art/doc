import React, { useState } from 'react';
import { Plane, Volume2, Radio, ShieldCheck, Plus, Scan, Eye, Edit2, Trash2, Calendar, FileText, CheckCircle2, AlertTriangle, AlertCircle, Wrench, Search, Filter } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { Aircraft, AirworthinessRecord, AirworthinessCertType } from '../types/aviation';
import { formatDateSpanish, getStatusBadgeData, calculateDaysRemaining, getAirworthinessCertLabel } from '../utils/aviationUtils';

export type AircraftSubcategory = 'expediente' | 'aeronavegabilidad' | 'ruido' | 'estacion';

interface AircraftCategoryViewProps {
  onNewAirworthiness: (type?: AirworthinessCertType) => void;
  onEditAirworthiness: (record: AirworthinessRecord) => void;
  onNewAircraft: () => void;
  onOpenScanner: (hint?: 'certificado_aeronavegabilidad') => void;
  initialSubcategory?: AircraftSubcategory;
  selectedAircraftIdProp?: string;
}

export const AircraftCategoryView: React.FC<AircraftCategoryViewProps> = ({
  onNewAirworthiness,
  onEditAirworthiness,
  onNewAircraft,
  onOpenScanner,
  initialSubcategory = 'expediente',
  selectedAircraftIdProp,
}) => {
  const {
    aircraft,
    airworthinessRecords,
    deleteAirworthinessRecord,
    toggleAircraftAirworthy,
    openDocumentViewer,
    allDocuments,
  } = useAviation();

  const [activeSubcategory, setActiveSubcategory] = useState<AircraftSubcategory>(initialSubcategory);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(() => {
    return selectedAircraftIdProp || (aircraft.length > 0 ? aircraft[0].id : '');
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const activeAircraft = aircraft.find((a) => a.id === selectedAircraftId) || (aircraft.length > 0 ? aircraft[0] : null);

  // Filter records by subcategory
  const getSubcategoryRecords = (sub: AircraftSubcategory) => {
    return airworthinessRecords.filter((record) => {
      let matchesSub = true;
      if (sub === 'aeronavegabilidad') {
        matchesSub = record.type === 'standard_airworthiness' || record.type === 'annual_inspection' || record.type === 'hundred_hour_check';
      } else if (sub === 'ruido') {
        matchesSub = record.type === 'noise_cert';
      } else if (sub === 'estacion') {
        matchesSub = record.type === 'radio_station_license';
      }

      const matchesSearch =
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.aircraftRegistration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.aircraftModel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

      return matchesSub && matchesSearch && matchesStatus;
    });
  };

  const handleViewDoc = (record: AirworthinessRecord) => {
    const docItem = allDocuments.find((d) => d.originalRefId === record.id);
    if (docItem) openDocumentViewer(docItem);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`¿Está seguro de eliminar el certificado "${title}"?`)) {
      deleteAirworthinessRecord(id);
    }
  };

  // Aircraft Unified Dossier Data
  const aircraftAirworthinessCert = activeAircraft
    ? airworthinessRecords.find((r) => r.aircraftId === activeAircraft.id && r.type === 'standard_airworthiness')
    : null;

  const aircraftNoiseCert = activeAircraft
    ? airworthinessRecords.find((r) => r.aircraftId === activeAircraft.id && r.type === 'noise_cert')
    : null;

  const aircraftStationCert = activeAircraft
    ? airworthinessRecords.find((r) => r.aircraftId === activeAircraft.id && r.type === 'radio_station_license')
    : null;

  const allThreeValid = Boolean(
    aircraftAirworthinessCert && aircraftAirworthinessCert.status !== 'expired' &&
    aircraftNoiseCert && aircraftNoiseCert.status !== 'expired' &&
    aircraftStationCert && aircraftStationCert.status !== 'expired'
  );

  return (
    <div className="space-y-6">
      {/* Category Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                CATEGORÍA PRINCIPAL · FLOTA DE AERONAVES
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Aeronaves y Certificados de Vuelo
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Control técnico de Aeronavegabilidad, Certificados de Ruido Acústico y Licencias de Estación de Radio
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenScanner('certificado_aeronavegabilidad')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <Scan className="w-3.5 h-3.5 text-indigo-400" />
              <span>Escanear con IA</span>
            </button>
            <button
              onClick={onNewAircraft}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span>Nueva Aeronave</span>
            </button>
            <button
              onClick={() => onNewAirworthiness('standard_airworthiness')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Certificado</span>
            </button>
          </div>
        </div>

        {/* Subcategories Tabs */}
        <div className="pt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1">Subcategorías:</span>

          <button
            onClick={() => setActiveSubcategory('expediente')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubcategory === 'expediente'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Expediente de Aeronave (3 Certificados)</span>
          </button>

          <button
            onClick={() => setActiveSubcategory('aeronavegabilidad')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubcategory === 'aeronavegabilidad'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1. Certificado de Aeronavegabilidad</span>
          </button>

          <button
            onClick={() => setActiveSubcategory('ruido')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubcategory === 'ruido'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>2. Certificado de Ruido (Acústica)</span>
          </button>

          <button
            onClick={() => setActiveSubcategory('estacion')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubcategory === 'estacion'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>3. Certificado de Estación (Radio)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: EXPEDIENTE COMPLETO DE LA AERONAVE (Muestra Aeronavegabilidad + Ruido + Estación) */}
      {activeSubcategory === 'expediente' && (
        <div className="space-y-6">
          {/* Aircraft Selector Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {aircraft.map((ac) => {
              const isSelected = activeAircraft?.id === ac.id;
              const acRecords = airworthinessRecords.filter((r) => r.aircraftId === ac.id);
              const hasExpired = acRecords.some((r) => r.status === 'expired');

              return (
                <button
                  key={ac.id}
                  onClick={() => setSelectedAircraftId(ac.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500 shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-sm font-bold text-sky-400">{ac.registration}</span>
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        ac.isAirworthy && !hasExpired ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {ac.isAirworthy && !hasExpired ? 'Aeronavegable' : 'En Mantenimiento'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {ac.make} {ac.model}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span className="font-mono tabular-nums">{ac.totalAirframeHours} TT</span>
                    <span aria-hidden="true">·</span>
                    <span>{ac.baseAirport}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {activeAircraft && (
            <>
              {/* Selected Aircraft Overview Box */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-extrabold text-sky-400 font-mono tracking-wider">
                        {activeAircraft.registration}
                      </span>
                      <span className="text-base font-bold text-white">
                        {activeAircraft.make} {activeAircraft.model} ({activeAircraft.year})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span>S/N: {activeAircraft.serialNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>Operador: {activeAircraft.operator}</span>
                      <span aria-hidden="true">·</span>
                      <span>Base: {activeAircraft.baseAirport}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{activeAircraft.totalAirframeHours} TT hrs</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => toggleAircraftAirworthy(activeAircraft.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                        activeAircraft.isAirworthy
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                      }`}
                    >
                      {activeAircraft.isAirworthy ? (
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

                <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
                  <span>Expediente de certificación técnica obligatoria OACI / AFAC / FAA</span>
                  <button
                    onClick={() => onOpenScanner('certificado_aeronavegabilidad')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Escanear certificado para este avión con IA</span>
                  </button>
                </div>
              </div>

              {/* THREE MAIN SUBCATEGORIES DISPLAYED FOR THIS AIRCRAFT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Certificado de Aeronavegabilidad */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                            SUBCATEGORÍA 1
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Aeronavegabilidad
                          </h4>
                        </div>
                      </div>

                      {aircraftAirworthinessCert && (
                        <span
                          className={`text-xs font-semibold ${
                            aircraftAirworthinessCert.status === 'valid'
                              ? 'text-emerald-400'
                              : aircraftAirworthinessCert.status === 'expiring_soon'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {getStatusBadgeData(aircraftAirworthinessCert.status, calculateDaysRemaining(aircraftAirworthinessCert.expiryDate)).label}
                        </span>
                      )}
                    </div>

                    {aircraftAirworthinessCert ? (
                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Folio Oficial:</span>
                          <span className="font-mono text-slate-100 font-semibold">{aircraftAirworthinessCert.documentNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Autoridad Emisora:</span>
                          <span className="text-slate-300 truncate max-w-[150px]">{aircraftAirworthinessCert.issuingAuthority}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Vencimiento / Reval:</span>
                          <span className="font-mono text-slate-100 font-bold tabular-nums">{formatDateSpanish(aircraftAirworthinessCert.expiryDate)}</span>
                        </div>
                        {aircraftAirworthinessCert.maintenanceOrg && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Taller Aprobado:</span>
                            <span className="text-slate-300 truncate max-w-[150px]">{aircraftAirworthinessCert.maintenanceOrg}</span>
                          </div>
                        )}
                        {aircraftAirworthinessCert.notes && (
                          <div className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                            "{aircraftAirworthinessCert.notes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <p>Sin Certificado de Aeronavegabilidad cargado.</p>
                        <button
                          onClick={() => onNewAirworthiness('standard_airworthiness')}
                          className="mt-2 text-xs text-indigo-400 hover:underline font-semibold"
                        >
                          + Registrar Certificado
                        </button>
                      </div>
                    )}
                  </div>

                  {aircraftAirworthinessCert && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleViewDoc(aircraftAirworthinessCert)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ver Certificado</span>
                      </button>
                      <button
                        onClick={() => onEditAirworthiness(aircraftAirworthinessCert)}
                        className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Certificado de Ruido (Acústica OACI Anexo 16) */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                            SUBCATEGORÍA 2
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Certificado de Ruido
                          </h4>
                        </div>
                      </div>

                      {aircraftNoiseCert && (
                        <span
                          className={`text-xs font-semibold ${
                            aircraftNoiseCert.status === 'valid'
                              ? 'text-emerald-400'
                              : aircraftNoiseCert.status === 'expiring_soon'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {getStatusBadgeData(aircraftNoiseCert.status, calculateDaysRemaining(aircraftNoiseCert.expiryDate)).label}
                        </span>
                      )}
                    </div>

                    {aircraftNoiseCert ? (
                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Folio Homologación:</span>
                          <span className="font-mono text-slate-100 font-semibold">{aircraftNoiseCert.documentNumber}</span>
                        </div>
                        {aircraftNoiseCert.noiseChapter && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Capítulo OACI:</span>
                            <span className="text-sky-300 font-semibold">{aircraftNoiseCert.noiseChapter}</span>
                          </div>
                        )}
                        {aircraftNoiseCert.noiseLevelEPNdB && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Niveles Sonoros (EPNdB):</span>
                            <span className="text-slate-200 font-mono text-[11px] block">{aircraftNoiseCert.noiseLevelEPNdB}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Vigencia:</span>
                          <span className="font-mono text-slate-100 font-bold tabular-nums">{formatDateSpanish(aircraftNoiseCert.expiryDate)}</span>
                        </div>
                        {aircraftNoiseCert.notes && (
                          <div className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                            "{aircraftNoiseCert.notes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <p>Sin Certificado de Ruido registrado.</p>
                        <button
                          onClick={() => onNewAirworthiness('noise_cert')}
                          className="mt-2 text-xs text-sky-400 hover:underline font-semibold"
                        >
                          + Registrar Certificado de Ruido
                        </button>
                      </div>
                    )}
                  </div>

                  {aircraftNoiseCert && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleViewDoc(aircraftNoiseCert)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Ver Certificado</span>
                      </button>
                      <button
                        onClick={() => onEditAirworthiness(aircraftNoiseCert)}
                        className="p-1 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Certificado de Estación (Radio) */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                            SUBCATEGORÍA 3
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Certificado de Estación
                          </h4>
                        </div>
                      </div>

                      {aircraftStationCert && (
                        <span
                          className={`text-xs font-semibold ${
                            aircraftStationCert.status === 'valid'
                              ? 'text-emerald-400'
                              : aircraftStationCert.status === 'expiring_soon'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {getStatusBadgeData(aircraftStationCert.status, calculateDaysRemaining(aircraftStationCert.expiryDate)).label}
                        </span>
                      )}
                    </div>

                    {aircraftStationCert ? (
                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Folio Estación:</span>
                          <span className="font-mono text-slate-100 font-semibold">{aircraftStationCert.documentNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Autoridad Telecom:</span>
                          <span className="text-slate-300 truncate max-w-[150px]">{aircraftStationCert.issuingAuthority}</span>
                        </div>
                        {aircraftStationCert.callSignOrFrequencies && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Equipos y Frecuencias Autorizadas:</span>
                            <span className="text-slate-200 font-mono text-[11px] block line-clamp-2">{aircraftStationCert.callSignOrFrequencies}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Vigencia Licencia:</span>
                          <span className="font-mono text-slate-100 font-bold tabular-nums">{formatDateSpanish(aircraftStationCert.expiryDate)}</span>
                        </div>
                        {aircraftStationCert.notes && (
                          <div className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                            "{aircraftStationCert.notes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <p>Sin Certificado de Estación de Radio registrado.</p>
                        <button
                          onClick={() => onNewAirworthiness('radio_station_license')}
                          className="mt-2 text-xs text-emerald-400 hover:underline font-semibold"
                        >
                          + Registrar Licencia de Estación
                        </button>
                      </div>
                    )}
                  </div>

                  {aircraftStationCert && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleViewDoc(aircraftStationCert)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ver Certificado</span>
                      </button>
                      <button
                        onClick={() => onEditAirworthiness(aircraftStationCert)}
                        className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      )}

      {/* VIEWS FOR INDIVIDUAL SUBCATEGORIES: AERONAVEGABILIDAD, RUIDO O ESTACION */}
      {activeSubcategory !== 'expediente' && (
        <div className="space-y-4">
          {/* Subcategory Specific Header & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por documento, matrícula, número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
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

          {/* Records List */}
          {getSubcategoryRecords(activeSubcategory).length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
              <Plane className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">
                No hay registros en esta subcategoría
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Registra un nuevo certificado para tu flota de aeronaves.
              </p>
              <button
                onClick={() => onNewAirworthiness(
                  activeSubcategory === 'ruido'
                    ? 'noise_cert'
                    : activeSubcategory === 'estacion'
                    ? 'radio_station_license'
                    : 'standard_airworthiness'
                )}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Ahora</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getSubcategoryRecords(activeSubcategory).map((record) => {
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
                          <span className="text-slate-400">Folio / Documento:</span>
                          <span className="font-mono text-slate-200 font-semibold">{record.documentNumber}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Autoridad Emisora:</span>
                          <span className="text-slate-300 truncate max-w-[200px]">{record.issuingAuthority}</span>
                        </div>

                        {record.noiseChapter && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Capítulo de Ruido:</span>
                            <span className="text-sky-300 font-semibold">{record.noiseChapter}</span>
                          </div>
                        )}

                        {record.noiseLevelEPNdB && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Niveles EPNdB:</span>
                            <span className="text-slate-200 font-mono text-[11px] block">{record.noiseLevelEPNdB}</span>
                          </div>
                        )}

                        {record.callSignOrFrequencies && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Equipos de Radio:</span>
                            <span className="text-slate-200 font-mono text-[11px] block">{record.callSignOrFrequencies}</span>
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
                          <span>Ver</span>
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
      )}
    </div>
  );
};
