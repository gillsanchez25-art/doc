import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, Award, HeartPulse, Plane, Check, AlertCircle } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { FlightLicense, MedicalCertificate, AirworthinessRecord, LicenseCategory, MedicalClass, AirworthinessCertType } from '../types/aviation';

export type FormModalMode = 'license' | 'medical' | 'airworthiness';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: FormModalMode;
  editItem?: FlightLicense | MedicalCertificate | AirworthinessRecord | null;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  editItem,
}) => {
  const {
    pilots,
    aircraft,
    addLicense,
    updateLicense,
    addMedicalCertificate,
    updateMedicalCertificate,
    addAirworthinessRecord,
    updateAirworthinessRecord,
  } = useAviation();

  const [mode, setMode] = useState<FormModalMode>(initialMode);

  // Common Fields
  const [pilotId, setPilotId] = useState('');
  const [pilotName, setPilotName] = useState('');
  const [aircraftId, setAircraftId] = useState('');
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');

  // License Fields
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory>('CPL');
  const [ratingsText, setRatingsText] = useState('IFR, Monomotor, Multimotor');
  const [typeRatingsText, setTypeRatingsText] = useState('Cessna 172S');

  // Medical Fields
  const [medicalClass, setMedicalClass] = useState<MedicalClass>('Clase 1');
  const [authorizedExaminer, setAuthorizedExaminer] = useState('Dr. Fernando Morales (AME #412)');
  const [clinicName, setClinicName] = useState('Centro Nacional de Medicina de Aviación (CEMA)');
  const [limitationsText, setLimitationsText] = useState('Ninguna limitación');

  // Airworthiness Fields
  const [airCertType, setAirCertType] = useState<AirworthinessCertType>('standard_airworthiness');
  const [title, setTitle] = useState('Certificado de Aeronavegabilidad Estándar');
  const [lastHours, setLastHours] = useState('');
  const [nextHours, setNextHours] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [maintenanceOrg, setMaintenanceOrg] = useState('');

  // Sync mode with prop
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (editItem) {
        // Load edit data
        if ('category' in editItem) {
          // Flight License
          setMode('license');
          setPilotId(editItem.pilotId);
          setPilotName(editItem.pilotName);
          setLicenseCategory(editItem.category);
          setDocumentNumber(editItem.licenseNumber);
          setIssuingAuthority(editItem.issuingAuthority);
          setIssueDate(editItem.issueDate);
          setExpiryDate(editItem.expiryDate);
          setRatingsText(editItem.ratings.join(', '));
          setTypeRatingsText(editItem.typeRatings?.join(', ') || '');
          setNotes(editItem.notes || '');
          setFileUrl(editItem.documentUrl || '');
          setFileName(editItem.fileName || '');
        } else if ('medicalClass' in editItem) {
          // Medical
          setMode('medical');
          setPilotId(editItem.pilotId);
          setPilotName(editItem.pilotName);
          setMedicalClass(editItem.medicalClass);
          setDocumentNumber(editItem.certificateNumber);
          setAuthorizedExaminer(editItem.authorizedExaminer);
          setClinicName(editItem.clinicName);
          setIssueDate(editItem.issueDate);
          setExpiryDate(editItem.expiryDate);
          setLimitationsText(editItem.limitations.join(', '));
          setNotes(editItem.notes || '');
          setFileUrl(editItem.documentUrl || '');
          setFileName(editItem.fileName || '');
        } else if ('aircraftRegistration' in editItem) {
          // Airworthiness
          setMode('airworthiness');
          setAircraftId(editItem.aircraftId);
          setAircraftRegistration(editItem.aircraftRegistration);
          setTitle(editItem.title);
          setAirCertType(editItem.type);
          setDocumentNumber(editItem.documentNumber);
          setIssuingAuthority(editItem.issuingAuthority);
          setIssueDate(editItem.issueDate);
          setExpiryDate(editItem.expiryDate);
          setLastHours(editItem.lastInspectionHours?.toString() || '');
          setNextHours(editItem.nextInspectionDueHours?.toString() || '');
          setInspectorName(editItem.inspectorName || '');
          setMaintenanceOrg(editItem.maintenanceOrg || '');
          setNotes(editItem.notes || '');
          setFileUrl(editItem.documentUrl || '');
          setFileName(editItem.fileName || '');
        }
      } else {
        // Defaults for new item
        if (pilots.length > 0) {
          setPilotId(pilots[0].id);
          setPilotName(pilots[0].fullName);
        }
        if (aircraft.length > 0) {
          setAircraftId(aircraft[0].id);
          setAircraftRegistration(aircraft[0].registration);
        }
        setDocumentNumber(`AERO-${Math.floor(100000 + Math.random() * 900000)}`);
        setIssuingAuthority('AFAC México');
      }
    }
  }, [isOpen, initialMode, editItem, pilots, aircraft]);

  if (!isOpen) return null;

  const handlePilotChange = (id: string) => {
    setPilotId(id);
    const p = pilots.find((pilot) => pilot.id === id);
    if (p) setPilotName(p.fullName);
  };

  const handleAircraftChange = (id: string) => {
    setAircraftId(id);
    const ac = aircraft.find((a) => a.id === id);
    if (ac) setAircraftRegistration(ac.registration);
  };

  const handleQuickExpiry = (months: number) => {
    const base = new Date(issueDate || new Date());
    base.setMonth(base.getMonth() + months);
    setExpiryDate(base.toISOString().slice(0, 10));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFileUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'license') {
      const ratingsArray = ratingsText
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
      const typeRatingsArray = typeRatingsText
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      const licenseData = {
        pilotId: pilotId || 'pilot-custom',
        pilotName: pilotName || 'Piloto Titular',
        category: licenseCategory,
        licenseNumber: documentNumber,
        issuingAuthority: issuingAuthority || 'Autoridad Aeronáutica',
        issueDate,
        expiryDate,
        ratings: ratingsArray.length > 0 ? ratingsArray : ['IFR', 'Monomotor'],
        typeRatings: typeRatingsArray,
        notes,
        documentUrl: fileUrl,
        fileName: fileName || `${documentNumber.toLowerCase()}_licencia.pdf`,
        fileSize: fileSize || '1.8 MB',
      };

      if (editItem && 'category' in editItem) {
        updateLicense(editItem.id, licenseData);
      } else {
        addLicense(licenseData);
      }
    } else if (mode === 'medical') {
      const limitationsArray = limitationsText
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const medicalData = {
        pilotId: pilotId || 'pilot-custom',
        pilotName: pilotName || 'Piloto Titular',
        medicalClass,
        certificateNumber: documentNumber,
        authorizedExaminer: authorizedExaminer || 'Médico Examinador Aéreo',
        clinicName: clinicName || 'Centro Médico Aeronáutico',
        issueDate,
        expiryDate,
        limitations: limitationsArray.length > 0 ? limitationsArray : ['Ninguna limitación'],
        notes,
        documentUrl: fileUrl,
        fileName: fileName || `${documentNumber.toLowerCase()}_medico.pdf`,
        fileSize: fileSize || '1.4 MB',
      };

      if (editItem && 'medicalClass' in editItem) {
        updateMedicalCertificate(editItem.id, medicalData);
      } else {
        addMedicalCertificate(medicalData);
      }
    } else if (mode === 'airworthiness') {
      const selectedAc = aircraft.find((a) => a.id === aircraftId);
      const airData = {
        aircraftId: aircraftId || 'ac-custom',
        aircraftRegistration: selectedAc ? selectedAc.registration : aircraftRegistration || 'XB-AERO',
        aircraftModel: selectedAc ? `${selectedAc.make} ${selectedAc.model}` : 'Aeronave Registrada',
        type: airCertType,
        title: title || 'Certificado de Aeronavegabilidad',
        documentNumber,
        issuingAuthority: issuingAuthority || 'AFAC México',
        issueDate,
        expiryDate,
        lastInspectionHours: lastHours ? parseFloat(lastHours) : undefined,
        nextInspectionDueHours: nextHours ? parseFloat(nextHours) : undefined,
        inspectorName,
        maintenanceOrg,
        notes,
        documentUrl: fileUrl,
        fileName: fileName || `${documentNumber.toLowerCase()}_aero.pdf`,
        fileSize: fileSize || '2.5 MB',
      };

      if (editItem && 'aircraftRegistration' in editItem) {
        updateAirworthinessRecord(editItem.id, airData);
      } else {
        addAirworthinessRecord(airData);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white">
              {editItem ? 'Editar Documento Aeronáutico' : 'Nuevo Registro en Base de Datos'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control reglamentario de licencias, médicos y aeronavegabilidad
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher (only for new records) */}
        {!editItem && (
          <div className="px-6 pt-4 pb-1">
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setMode('license')}
                className={`py-2 px-3 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'license'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Licencia de Vuelo</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('medical')}
                className={`py-2 px-3 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'medical'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Examen Médico</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('airworthiness')}
                className={`py-2 px-3 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'airworthiness'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plane className="w-4 h-4" />
                <span>Aeronavegabilidad</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 text-xs">
          
          {/* Target Pilot / Aircraft */}
          {mode !== 'airworthiness' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Piloto Titular *</label>
                <select
                  value={pilotId}
                  onChange={(e) => handlePilotChange(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                >
                  {pilots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Completo Titular</label>
                <input
                  type="text"
                  value={pilotName}
                  onChange={(e) => setPilotName(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Aeronave Asignada *</label>
                <select
                  value={aircraftId}
                  onChange={(e) => handleAircraftChange(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                >
                  {aircraft.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.registration} - {ac.make} {ac.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título del Certificado *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Certificado de Aeronavegabilidad Estándar"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Mode-specific Fields */}
          {mode === 'license' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoría de Licencia</label>
                  <select
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value as LicenseCategory)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="PPL">PPL - Piloto Privado</option>
                    <option value="CPL">CPL - Piloto Comercial</option>
                    <option value="ATPL">ATPL - Transporte de Línea Aérea</option>
                    <option value="FI">FI - Instructor de Vuelo</option>
                    <option value="ULM">ULM - Ultraligero</option>
                    <option value="GLIDER">Planeador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Número de Licencia / Folio *</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                    placeholder="Ej. CPL-049281-MX"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Habilitaciones (separadas por coma)</label>
                  <input
                    type="text"
                    value={ratingsText}
                    onChange={(e) => setRatingsText(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                    placeholder="IFR, Monomotor, Multimotor, VFR Nocturno"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Habilitación de Tipo de Avión</label>
                  <input
                    type="text"
                    value={typeRatingsText}
                    onChange={(e) => setTypeRatingsText(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                    placeholder="B737, King Air B200, C172S"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'medical' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Clase de Aptitud Médica</label>
                  <select
                    value={medicalClass}
                    onChange={(e) => setMedicalClass(e.target.value as MedicalClass)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Clase 1">Clase 1 - Piloto Comercial & Aerolínea</option>
                    <option value="Clase 2">Clase 2 - Piloto Privado & Recreativo</option>
                    <option value="Clase 3">Clase 3 - Controlador de Tránsito / Tripulante</option>
                    <option value="LAPL">LAPL - Licencia Ligera</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Número de Certificado Médico *</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="Ej. MED-1-MX-89240"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Médico Examinador Aéreo (AME)</label>
                  <input
                    type="text"
                    value={authorizedExaminer}
                    onChange={(e) => setAuthorizedExaminer(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Clínica / Centro Evaluador</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Limitaciones Médicas (separadas por coma)</label>
                <input
                  type="text"
                  value={limitationsText}
                  onChange={(e) => setLimitationsText(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Uso de lentes correctores (VML), Válido solo con copiloto, Ninguna limitación"
                />
              </div>
            </>
          )}

          {mode === 'airworthiness' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Registro Técnico</label>
                  <select
                    value={airCertType}
                    onChange={(e) => {
                      const val = e.target.value as AirworthinessCertType;
                      setAirCertType(val);
                      if (val === 'noise_cert') setTitle('Certificado de Homologación Acústica (Ruido)');
                      else if (val === 'radio_station_license') setTitle('Licencia de Estación de Radio Aeronáutica');
                      else if (val === 'standard_airworthiness') setTitle('Certificado de Aeronavegabilidad Estándar');
                    }}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="standard_airworthiness">1. Certificado de Aeronavegabilidad Estándar</option>
                    <option value="noise_cert">2. Certificado de Ruido (Homologación Acústica OACI Anexo 16)</option>
                    <option value="radio_station_license">3. Certificado de Estación (Licencia de Radio Aeronáutica)</option>
                    <option value="annual_inspection">Inspección Anual (12 Meses)</option>
                    <option value="hundred_hour_check">Inspección Periódica 100 Horas</option>
                    <option value="registration_cert">Certificado de Matrícula</option>
                    <option value="insurance_policy">Póliza de Seguro Casco y RC</option>
                    <option value="elt_inspection">Inspección Transmisor ELT</option>
                    <option value="pitot_static_transponder">Pitot-Estática y Transponder</option>
                    <option value="weight_and_balance">Pesaje y Centrado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Folio / Número de Registro *</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. CA-MX-2024-912"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Inspector Responsable</label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="Nombre y licencia del inspector"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Taller Aprobado / OMA</label>
                  <input
                    type="text"
                    value={maintenanceOrg}
                    onChange={(e) => setMaintenanceOrg(e.target.value)}
                    placeholder="Ej. Taller Aeronáutico TAA-120"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Horas en la Inspección</label>
                  <input
                    type="number"
                    step="0.1"
                    value={lastHours}
                    onChange={(e) => setLastHours(e.target.value)}
                    placeholder="Ej. 1820.5"
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Próxima Inspección Vence a las (hrs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nextHours}
                    onChange={(e) => setNextHours(e.target.value)}
                    placeholder="Ej. 1920.5"
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Dates & Authority (Common) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Autoridad Emisora</label>
                <input
                  type="text"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  placeholder="AFAC, FAA, EASA, DGAC"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fecha de Emisión *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fecha de Vencimiento *</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Quick Expiration Helpers */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Ajuste rápido de vigencia:</span>
              <button
                type="button"
                onClick={() => handleQuickExpiry(6)}
                className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                +6 Meses
              </button>
              <button
                type="button"
                onClick={() => handleQuickExpiry(12)}
                className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                +1 Año
              </button>
              <button
                type="button"
                onClick={() => handleQuickExpiry(24)}
                className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                +2 Años
              </button>
              <button
                type="button"
                onClick={() => handleQuickExpiry(48)}
                className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                +4 Años
              </button>
            </div>
          </div>

          {/* Document Attachment Upload */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-slate-300 font-semibold mb-1">Adjuntar Archivo Digital (PDF o Imagen)</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Seleccionar Archivo</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-slate-400 font-mono text-[11px] truncate max-w-xs">
                {fileName ? `${fileName} (${fileSize || 'cargado'})` : 'Sin archivo adjunto (se generará certificado digital)'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Observaciones / Bitácora</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de verificación técnica, restricciones de vuelo, etc."
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editItem ? 'Guardar Cambios' : 'Registrar en Base de Datos'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
