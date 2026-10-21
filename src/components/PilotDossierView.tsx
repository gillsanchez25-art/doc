import React, { useState } from 'react';
import {
  Users,
  Award,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Scan,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Printer,
  Search,
  Plane,
  Clock,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { Pilot, FlightLicense, MedicalCertificate } from '../types/aviation';
import { formatDateSpanish, getStatusBadgeData, calculateDaysRemaining, getLicenseCategoryLabel } from '../utils/aviationUtils';

interface PilotDossierViewProps {
  onOpenScannerForPilot: (pilot: Pilot) => void;
  onNewLicenseForPilot: (pilot: Pilot) => void;
  onNewMedicalForPilot: (pilot: Pilot) => void;
  onEditLicense: (license: FlightLicense) => void;
  onEditMedical: (medical: MedicalCertificate) => void;
  onNewPilot: () => void;
  selectedPilotIdProp?: string;
}

export const PilotDossierView: React.FC<PilotDossierViewProps> = ({
  onOpenScannerForPilot,
  onNewLicenseForPilot,
  onNewMedicalForPilot,
  onEditLicense,
  onEditMedical,
  onNewPilot,
  selectedPilotIdProp,
}) => {
  const {
    pilots,
    licenses,
    medicalCertificates,
    openDocumentViewer,
    allDocuments,
    deleteLicense,
    deleteMedicalCertificate,
  } = useAviation();

  const [selectedPilotId, setSelectedPilotId] = useState<string>(() => {
    return selectedPilotIdProp || (pilots.length > 0 ? pilots[0].id : '');
  });

  const [searchQuery, setSearchQuery] = useState('');

  const filteredPilots = pilots.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.baseAirport.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nationalId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePilot = pilots.find((p) => p.id === selectedPilotId) || (filteredPilots.length > 0 ? filteredPilots[0] : null);

  // Get all licenses and medicals for the active pilot
  const pilotLicenses = activePilot
    ? licenses.filter((l) => l.pilotId === activePilot.id || l.pilotName.toLowerCase().includes(activePilot.fullName.toLowerCase()))
    : [];

  const pilotMedicals = activePilot
    ? medicalCertificates.filter((m) => m.pilotId === activePilot.id || m.pilotName.toLowerCase().includes(activePilot.fullName.toLowerCase()))
    : [];

  // Primary (most recent or valid) license and medical
  const primaryLicense = pilotLicenses[0] || null;
  const primaryMedical = pilotMedicals[0] || null;

  // Determine pilot overall operational flight readiness (Currency)
  const isLicenseValid = primaryLicense && primaryLicense.status !== 'expired';
  const isMedicalValid = primaryMedical && primaryMedical.status !== 'expired';
  const isPilotClearedToFly = Boolean(isLicenseValid && isMedicalValid);

  const handleViewLicenseDoc = (lic: FlightLicense) => {
    const docItem = allDocuments.find((d) => d.originalRefId === lic.id);
    if (docItem) openDocumentViewer(docItem);
  };

  const handleViewMedicalDoc = (med: MedicalCertificate) => {
    const docItem = allDocuments.find((d) => d.originalRefId === med.id);
    if (docItem) openDocumentViewer(docItem);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Expedientes de Piloto: Licencia y Examen Médico Unificados</span>
          </h2>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Selecciona un piloto para consultar de forma simultánea su licencia de vuelo y aptitud médica</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{pilots.length} pilotos</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNewPilot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Nuevo Piloto</span>
          </button>

          {activePilot && (
            <button
              onClick={() => onOpenScannerForPilot(activePilot)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <Scan className="w-4 h-4 text-sky-400" />
              <span>Escanear con IA</span>
            </button>
          )}

          <button
            onClick={handlePrintDossier}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            title="Imprimir expediente"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Pilot Directory List on Left + Unified Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Pilot Directory (4 cols on lg) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar piloto por nombre, base, rol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[560px] overflow-y-auto pr-1">
            {filteredPilots.map((p) => {
              const isSelected = activePilot?.id === p.id;
              const pLic = licenses.find((l) => l.pilotId === p.id || l.pilotName.toLowerCase().includes(p.fullName.toLowerCase()));
              const pMed = medicalCertificates.find((m) => m.pilotId === p.id || m.pilotName.toLowerCase().includes(p.fullName.toLowerCase()));
              const cleared = Boolean(pLic && pLic.status !== 'expired' && pMed && pMed.status !== 'expired');

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPilotId(p.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all my-1 flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-800 border border-sky-500/50 shadow-sm'
                      : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate block">
                        {p.fullName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                      <span>{p.role}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{p.totalFlightHours} hrs</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        cleared ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {cleared ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apto</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>No Apto</span>
                        </>
                      )}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {pLic ? pLic.category : 'Sin lic'} / {pMed ? pMed.medicalClass : 'Sin med'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Unified Dossier of Selected Pilot (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          {activePilot ? (
            <>
              {/* Pilot Profile Banner */}
              <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-extrabold text-xl font-mono shrink-0">
                      {activePilot.fullName.replace(/Cap\.|P\.A\.|P\.P\./g, '').trim().slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg sm:text-xl font-extrabold text-white">
                          {activePilot.fullName}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-950/80 text-sky-300 border border-sky-800/60 font-mono">
                          {activePilot.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          Base: {activePilot.baseAirport}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {activePilot.totalFlightHours} Horas Totales
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>ID: {activePilot.nationalId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Flight Clearance Operational Stamp */}
                  <div className="shrink-0 self-start sm:self-auto">
                    {isPilotClearedToFly ? (
                      <div className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold leading-tight">LIBERADO PARA VUELO</div>
                          <div className="text-[10px] text-emerald-400/80">Licencia y Médico Vigentes</div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <div>
                          <div className="text-xs font-bold leading-tight">NO APTO PARA VUELO</div>
                          <div className="text-[10px] text-rose-400/80">
                            {!isLicenseValid && !isMedicalValid
                              ? 'Licencia y Médico Vencidos'
                              : !isLicenseValid
                              ? 'Licencia Vencida o Pendiente'
                              : 'Examen Médico Vencido'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact information footer */}
                <div className="mt-3 pt-1 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {activePilot.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {activePilot.phone}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenScannerForPilot(activePilot)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Escanear credencial con IA</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Unified Dossier: Licencia de Vuelo + Examen Médico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Licencia de Vuelo Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                            Licencia de Vuelo OACI
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            {primaryLicense ? `${primaryLicense.category} · ${getLicenseCategoryLabel(primaryLicense.category)}` : 'Sin Licencia Registrada'}
                          </h4>
                        </div>
                      </div>

                      {primaryLicense && (
                        <div className="text-right">
                          <span
                            className={`text-xs font-semibold ${
                              primaryLicense.status === 'valid'
                                ? 'text-emerald-400'
                                : primaryLicense.status === 'expiring_soon'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {getStatusBadgeData(primaryLicense.status, calculateDaysRemaining(primaryLicense.expiryDate)).label}
                          </span>
                        </div>
                      )}
                    </div>

                    {primaryLicense ? (
                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Número de Folio:</span>
                          <span className="font-mono text-slate-100 font-semibold">{primaryLicense.licenseNumber}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Autoridad Emisora:</span>
                          <span className="text-slate-300 truncate max-w-[180px]">{primaryLicense.issuingAuthority}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Expedición:</span>
                          <span className="font-mono text-slate-300 tabular-nums">{formatDateSpanish(primaryLicense.issueDate)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Vencimiento / Reval:</span>
                          <span className="font-mono text-slate-100 font-bold tabular-nums">{formatDateSpanish(primaryLicense.expiryDate)}</span>
                        </div>

                        {/* Ratings */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1">
                            Habilitaciones de Vuelo:
                          </span>
                          <div className="text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
                            {primaryLicense.ratings.map((r, i) => (
                              <React.Fragment key={i}>
                                <span>{r}</span>
                                {i < primaryLicense.ratings.length - 1 && <span className="text-slate-600" aria-hidden="true">·</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        {primaryLicense.typeRatings && primaryLicense.typeRatings.length > 0 && (
                          <div className="pt-1">
                            <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1">
                              Habilitación de Tipo:
                            </span>
                            <div className="text-xs text-sky-300 font-mono">
                              {primaryLicense.typeRatings.join(' · ')}
                            </div>
                          </div>
                        )}

                        {primaryLicense.notes && (
                          <div className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                            "{primaryLicense.notes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p>No hay licencia registrada para este piloto.</p>
                        <button
                          onClick={() => onNewLicenseForPilot(activePilot)}
                          className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-400 border border-sky-500/30 rounded-lg hover:bg-sky-500/10"
                        >
                          + Registrar Licencia
                        </button>
                      </div>
                    )}
                  </div>

                  {primaryLicense && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[120px]">
                        {primaryLicense.fileName || 'licencia.pdf'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewLicenseDoc(primaryLicense)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>Ver Credencial</span>
                        </button>
                        <button
                          onClick={() => onEditLicense(primaryLicense)}
                          className="p-1 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800 transition-colors"
                          title="Editar Licencia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Examen Médico / Aptitud Psicofísica Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <HeartPulse className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                            Aptitud Psicofísica
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            {primaryMedical ? `${primaryMedical.medicalClass} · Evaluación AME` : 'Sin Examen Médico'}
                          </h4>
                        </div>
                      </div>

                      {primaryMedical && (
                        <div className="text-right">
                          <span
                            className={`text-xs font-semibold ${
                              primaryMedical.status === 'valid'
                                ? 'text-emerald-400'
                                : primaryMedical.status === 'expiring_soon'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {getStatusBadgeData(primaryMedical.status, calculateDaysRemaining(primaryMedical.expiryDate)).label}
                          </span>
                        </div>
                      )}
                    </div>

                    {primaryMedical ? (
                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Certificado Médico No:</span>
                          <span className="font-mono text-slate-100 font-semibold">{primaryMedical.certificateNumber}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Médico Examinador (AME):</span>
                          <span className="text-slate-300 truncate max-w-[180px]">{primaryMedical.authorizedExaminer}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Centro Médico / CEMA:</span>
                          <span className="text-slate-300 truncate max-w-[180px]">{primaryMedical.clinicName}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Vencimiento Médico:</span>
                          <span className="font-mono text-slate-100 font-bold tabular-nums">{formatDateSpanish(primaryMedical.expiryDate)}</span>
                        </div>

                        {/* Limitations */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-1">
                            Limitaciones Dictaminadas:
                          </span>
                          <div className="text-xs text-amber-200/90 bg-amber-950/20 border border-amber-900/30 rounded p-2">
                            {primaryMedical.limitations.length > 0 ? (
                              primaryMedical.limitations.map((lim, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <span className="text-amber-400">·</span>
                                  <span>{lim}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Sin limitaciones médicas
                              </span>
                            )}
                          </div>
                        </div>

                        {primaryMedical.notes && (
                          <div className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                            "{primaryMedical.notes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <HeartPulse className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p>No hay examen médico registrado para este piloto.</p>
                        <button
                          onClick={() => onNewMedicalForPilot(activePilot)}
                          className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10"
                        >
                          + Registrar Examen Médico
                        </button>
                      </div>
                    )}
                  </div>

                  {primaryMedical && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[120px]">
                        {primaryMedical.fileName || 'medico.pdf'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewMedicalDoc(primaryMedical)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ver Certificado</span>
                        </button>
                        <button
                          onClick={() => onEditMedical(primaryMedical)}
                          className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition-colors"
                          title="Editar Examen Médico"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Pilot Expedientes History (if pilot has multiple documents or renewals) */}
              {(pilotLicenses.length > 1 || pilotMedicals.length > 1) && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Historial Registral y Otras Revalidaciones del Piloto
                  </h4>
                  <div className="divide-y divide-slate-800 text-xs">
                    {pilotLicenses.slice(1).map((lic) => (
                      <div key={lic.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white">Licencia {lic.category}</span>
                          <span className="text-slate-400 ml-2 font-mono">Folio: {lic.licenseNumber}</span>
                        </div>
                        <span className="text-slate-400 font-mono">Venció: {formatDateSpanish(lic.expiryDate)}</span>
                      </div>
                    ))}
                    {pilotMedicals.slice(1).map((med) => (
                      <div key={med.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white">Examen Médico {med.medicalClass}</span>
                          <span className="text-slate-400 ml-2 font-mono">Folio: {med.certificateNumber}</span>
                        </div>
                        <span className="text-slate-400 font-mono">Venció: {formatDateSpanish(med.expiryDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No hay piloto seleccionado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Selecciona un piloto del directorio de la izquierda para desplegar su licencia de vuelo y su examen médico unificados.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
