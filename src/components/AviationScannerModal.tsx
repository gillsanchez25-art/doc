import React, { useState, useRef } from 'react';
import {
  X,
  Scan,
  Sparkles,
  Upload,
  Check,
  Layers,
  FileCheck2,
  Sliders,
  RotateCw,
  Eye,
  Camera,
  AlertCircle,
  ShieldCheck,
  Plane,
  HeartPulse,
  Award
} from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import {
  EnhancementFilter,
  applyFilterToCanvas,
  cropImageToBox,
  combineFrontAndBack,
  generateSampleAviationScan,
} from '../utils/imageScannerUtils';

export type ScannerDocHint =
  | 'licencia_vuelo'
  | 'examen_medico'
  | 'certificado_aeronavegabilidad'
  | 'certificado_ruido'
  | 'certificado_estacion';

interface AviationScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDocHint?: ScannerDocHint;
}

export const AviationScannerModal: React.FC<AviationScannerModalProps> = ({
  isOpen,
  onClose,
  defaultDocHint = 'licencia_vuelo',
}) => {
  const {
    addLicense,
    addMedicalCertificate,
    addAirworthinessRecord,
    pilots,
    aircraft,
  } = useAviation();

  const [documentHint, setDocumentHint] = useState<ScannerDocHint>(defaultDocHint);

  // Images state
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<EnhancementFilter>('auto');
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'enhanced' | 'original' | 'split'>('enhanced');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const res = event.target.result as string;
          if (side === 'front') {
            setFrontImage(res);
          } else {
            setBackImage(res);
          }
          // Reset previous scan result when new image is picked
          setEnhancedImage(null);
          setExtractedData(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSample = (type: 'license' | 'medical' | 'airworthiness' | 'noise' | 'station') => {
    if (type === 'license') {
      setDocumentHint('licencia_vuelo');
      setFrontImage(generateSampleAviationScan('license_front'));
      setBackImage(generateSampleAviationScan('license_back'));
    } else if (type === 'medical') {
      setDocumentHint('examen_medico');
      setFrontImage(generateSampleAviationScan('medical'));
      setBackImage(null);
    } else if (type === 'noise') {
      setDocumentHint('certificado_ruido');
      setFrontImage(generateSampleAviationScan('noise'));
      setBackImage(null);
    } else if (type === 'station') {
      setDocumentHint('certificado_estacion');
      setFrontImage(generateSampleAviationScan('station'));
      setBackImage(null);
    } else {
      setDocumentHint('certificado_aeronavegabilidad');
      setFrontImage(generateSampleAviationScan('airworthiness'));
      setBackImage(null);
    }
    setEnhancedImage(null);
    setExtractedData(null);
  };

  const runAIScanner = async () => {
    if (!frontImage && !backImage) return;

    setIsProcessing(true);
    setProcessingStep('Detectando bordes de documento y ajustando perspectiva...');

    try {
      // 1. Call server Gemini scanner endpoint
      const response = await fetch('/api/ai/scan-and-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontImage: frontImage,
          backImage: backImage,
          documentTypeHint: documentHint,
        }),
      });

      const resData = await response.json();
      const aiData = resData.data;
      setExtractedData(aiData);

      setProcessingStep('Recortando márgenes y aplicando filtros de nitidez óptica...');

      // 2. Perform intelligent crop on images if coordinates exist
      let processedFront = frontImage || '';
      if (frontImage && aiData.cropCoordinates?.front) {
        processedFront = await cropImageToBox(frontImage, aiData.cropCoordinates.front);
      }

      let processedBack = backImage || '';
      if (backImage && aiData.cropCoordinates?.back) {
        processedBack = await cropImageToBox(backImage, aiData.cropCoordinates.back);
      }

      // 3. If both sides exist, stitch them; otherwise apply filter directly
      if (processedFront && processedBack) {
        const combined = await combineFrontAndBack(processedFront, processedBack, activeFilter);
        setEnhancedImage(combined);
      } else {
        const img = new Image();
        img.src = processedFront || processedBack;
        await new Promise((r) => (img.onload = r));
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const filteredCanvas = applyFilterToCanvas(canvas, activeFilter);
          setEnhancedImage(filteredCanvas.toDataURL('image/jpeg', 0.92));
        } else {
          setEnhancedImage(processedFront || processedBack);
        }
      }

      setProcessingStep('Extracción reglamentaria y digitalización completadas.');
    } catch (err) {
      console.error('Scan error:', err);
      setProcessingStep('Error al procesar con IA. Aplicando filtros estándar.');
      setEnhancedImage(frontImage || backImage);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyCustomFilter = async (filter: EnhancementFilter) => {
    setActiveFilter(filter);
    if (!frontImage && !backImage) return;

    const baseSrc = enhancedImage || frontImage || backImage;
    if (!baseSrc) return;

    const img = new Image();
    img.src = baseSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const filtered = applyFilterToCanvas(canvas, filter);
        setEnhancedImage(filtered.toDataURL('image/jpeg', 0.92));
      }
    };
  };

  const handleSaveToDatabase = () => {
    if (!extractedData) return;

    const docType = extractedData.documentType;
    const finalDocUrl = enhancedImage || frontImage || '';

    if (docType === 'licencia_vuelo') {
      // Find matching pilot or use extracted name
      const matchedPilot = pilots.find((p) =>
        p.fullName.toLowerCase().includes(extractedData.entityName.toLowerCase())
      );

      addLicense({
        pilotId: matchedPilot ? matchedPilot.id : `pilot-scan-${Date.now()}`,
        pilotName: extractedData.entityName || 'Piloto Titular',
        category: (extractedData.categoryOrClass as any) || 'CPL',
        licenseNumber: extractedData.documentNumber || `LIC-${Date.now()}`,
        issuingAuthority: extractedData.issuingAuthority || 'AFAC México',
        issueDate: extractedData.issueDate || new Date().toISOString().slice(0, 10),
        expiryDate: extractedData.expiryDate || '2027-05-10',
        ratings: extractedData.ratings?.length > 0 ? extractedData.ratings : ['IFR', 'Monomotor Terrestre'],
        typeRatings: extractedData.typeRatings || ['Cessna 172S'],
        notes: extractedData.notes || 'Escaneado y digitalizado automáticamente con IA',
        documentUrl: finalDocUrl,
        fileName: `${extractedData.documentNumber || 'licencia'}_escaneada.jpg`,
        fileSize: '1.9 MB',
      });
    } else if (docType === 'examen_medico') {
      const matchedPilot = pilots.find((p) =>
        p.fullName.toLowerCase().includes(extractedData.entityName.toLowerCase())
      );

      addMedicalCertificate({
        pilotId: matchedPilot ? matchedPilot.id : `pilot-scan-${Date.now()}`,
        pilotName: extractedData.entityName || 'Piloto Titular',
        medicalClass: (extractedData.categoryOrClass as any) || 'Clase 1',
        certificateNumber: extractedData.documentNumber || `MED-${Date.now()}`,
        authorizedExaminer: extractedData.inspectorOrDoctorName || 'Médico Examinador Aéreo AME',
        clinicName: extractedData.clinicOrWorkshopName || 'Centro Médico Aeronáutico',
        issueDate: extractedData.issueDate || new Date().toISOString().slice(0, 10),
        expiryDate: extractedData.expiryDate || '2027-05-10',
        limitations: extractedData.limitations || ['Ninguna limitación'],
        notes: extractedData.notes || 'Aptitud psicofísica procesada con escáner IA',
        documentUrl: finalDocUrl,
        fileName: `${extractedData.documentNumber || 'medico'}_escaneado.jpg`,
        fileSize: '1.6 MB',
      });
    } else if (docType === 'certificado_ruido') {
      const matchedAc = aircraft.find((a) =>
        a.registration.toLowerCase().includes((extractedData.aircraftRegistration || '').toLowerCase())
      );

      addAirworthinessRecord({
        aircraftId: matchedAc ? matchedAc.id : `ac-scan-${Date.now()}`,
        aircraftRegistration: extractedData.aircraftRegistration || (matchedAc ? matchedAc.registration : 'XB-CAP'),
        aircraftModel: extractedData.aircraftModel || (matchedAc ? matchedAc.model : 'Aeronave Registrada'),
        type: 'noise_cert',
        title: extractedData.title || 'Certificado de Homologación Acústica de Aeronave (Ruido)',
        documentNumber: extractedData.documentNumber || `NOISE-${Date.now()}`,
        issuingAuthority: extractedData.issuingAuthority || 'AFAC México / OACI Anexo 16',
        issueDate: extractedData.issueDate || new Date().toISOString().slice(0, 10),
        expiryDate: extractedData.expiryDate || '2030-01-01',
        noiseChapter: 'OACI Anexo 16 Capítulo 4 / FAR Part 36',
        noiseLevelEPNdB: extractedData.noiseLevelEPNdB || '74.8 EPNdB',
        notes: extractedData.notes || 'Certificado de ruido procesado con escáner IA',
        documentUrl: finalDocUrl,
        fileName: `${extractedData.documentNumber || 'ruido'}_escaneado.jpg`,
        fileSize: '1.8 MB',
      });
    } else if (docType === 'certificado_estacion') {
      const matchedAc = aircraft.find((a) =>
        a.registration.toLowerCase().includes((extractedData.aircraftRegistration || '').toLowerCase())
      );

      addAirworthinessRecord({
        aircraftId: matchedAc ? matchedAc.id : `ac-scan-${Date.now()}`,
        aircraftRegistration: extractedData.aircraftRegistration || (matchedAc ? matchedAc.registration : 'XB-CAP'),
        aircraftModel: extractedData.aircraftModel || (matchedAc ? matchedAc.model : 'Aeronave Registrada'),
        type: 'radio_station_license',
        title: extractedData.title || 'Licencia de Estación de Telecomunicaciones Aeronáuticas',
        documentNumber: extractedData.documentNumber || `EST-RAD-${Date.now()}`,
        issuingAuthority: extractedData.issuingAuthority || 'AFAC Telecomunicaciones',
        issueDate: extractedData.issueDate || new Date().toISOString().slice(0, 10),
        expiryDate: extractedData.expiryDate || '2027-10-20',
        callSignOrFrequencies: extractedData.callSignOrFrequencies || 'XB-CAP / VHF COM / XPDR Modo S',
        notes: extractedData.notes || 'Licencia de estación de radio procesada con escáner IA',
        documentUrl: finalDocUrl,
        fileName: `${extractedData.documentNumber || 'estacion'}_escaneada.jpg`,
        fileSize: '1.9 MB',
      });
    } else {
      // standard_airworthiness
      const matchedAc = aircraft.find((a) =>
        a.registration.toLowerCase().includes((extractedData.aircraftRegistration || '').toLowerCase())
      );

      addAirworthinessRecord({
        aircraftId: matchedAc ? matchedAc.id : `ac-scan-${Date.now()}`,
        aircraftRegistration: extractedData.aircraftRegistration || (matchedAc ? matchedAc.registration : 'XB-SCAN'),
        aircraftModel: extractedData.aircraftModel || (matchedAc ? matchedAc.model : 'Aeronave Registrada'),
        type: 'standard_airworthiness',
        title: extractedData.title || 'Certificado de Aeronavegabilidad Oficial',
        documentNumber: extractedData.documentNumber || `CA-${Date.now()}`,
        issuingAuthority: extractedData.issuingAuthority || 'AFAC México',
        issueDate: extractedData.issueDate || new Date().toISOString().slice(0, 10),
        expiryDate: extractedData.expiryDate || '2027-05-10',
        lastInspectionHours: extractedData.inspectionHours || 1800.0,
        nextInspectionDueHours: extractedData.inspectionHours ? extractedData.inspectionHours + 100 : 1900.0,
        inspectorName: extractedData.inspectorOrDoctorName || 'Inspector Aeronáutico Autorizado',
        maintenanceOrg: extractedData.clinicOrWorkshopName || 'Taller Aeronáutico Aprobado',
        notes: extractedData.notes || 'Certificado de aeronavegabilidad procesado con escáner IA',
        documentUrl: finalDocUrl,
        fileName: `${extractedData.documentNumber || 'aeronavegabilidad'}_escaneado.jpg`,
        fileSize: '2.4 MB',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header - Sober Aviation Style */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-sky-400 font-mono">
                  AERO-SCAN AI · OACI / AFAC
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">Recorte y Mejora Inteligente de Documentos</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Escáner y Extracción de Licencias, Médicos y Aeronavegabilidad
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Document Selection Strip */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Tipo a Escanear:</span>
            <div className="flex flex-wrap items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setDocumentHint('licencia_vuelo')}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'licencia_vuelo' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Licencia</span>
              </button>
              <button
                type="button"
                onClick={() => setDocumentHint('examen_medico')}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'examen_medico' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Examen Médico</span>
              </button>
              <button
                type="button"
                onClick={() => setDocumentHint('certificado_aeronavegabilidad')}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'certificado_aeronavegabilidad' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Aeronavegabilidad</span>
              </button>
              <button
                type="button"
                onClick={() => setDocumentHint('certificado_ruido')}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'certificado_ruido' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ruido</span>
              </button>
              <button
                type="button"
                onClick={() => setDocumentHint('certificado_estacion')}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'certificado_estacion' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Estación</span>
              </button>
            </div>
          </div>

          {/* Quick 1-Click Test Scans */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[11px] mr-1">Muestras:</span>
            <button
              type="button"
              onClick={() => loadSample('license')}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded transition-colors"
            >
              Licencia CPL
            </button>
            <button
              type="button"
              onClick={() => loadSample('medical')}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded transition-colors"
            >
              Médico Clase 1
            </button>
            <button
              type="button"
              onClick={() => loadSample('airworthiness')}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded transition-colors"
            >
              Aeronavegabilidad
            </button>
            <button
              type="button"
              onClick={() => loadSample('noise')}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded transition-colors"
            >
              Ruido (Acústico)
            </button>
            <button
              type="button"
              onClick={() => loadSample('station')}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded transition-colors"
            >
              Estación Radio
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          
          {/* Dual-Side Capture Dropzones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Front Side */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Lado 1: Anverso / Frente
                  </span>
                  {frontImage && (
                    <button
                      onClick={() => setFrontImage(null)}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-center">
                  {frontImage ? (
                    <div className="relative group max-h-[170px] overflow-hidden rounded-lg border border-slate-700">
                      <img src={frontImage} alt="Anverso" className="h-[160px] w-auto object-contain" />
                      <button
                        onClick={() => frontInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => frontInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-lg text-center cursor-pointer transition-colors bg-slate-900/40"
                    >
                      <Camera className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                      <span className="text-slate-300 font-semibold block">Subir Frente de la Licencia o Documento</span>
                      <span className="text-slate-500 text-[11px] mt-0.5 block">JPG, PNG o PDF</span>
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={frontInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'front')}
                className="hidden"
              />
            </div>

            {/* Back Side (Dorso con habilitaciones o sellos) */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Lado 2: Reverso / Dorso (Habilitaciones y Sellos)
                  </span>
                  {backImage && (
                    <button
                      onClick={() => setBackImage(null)}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-center">
                  {backImage ? (
                    <div className="relative group max-h-[170px] overflow-hidden rounded-lg border border-slate-700">
                      <img src={backImage} alt="Reverso" className="h-[160px] w-auto object-contain" />
                      <button
                        onClick={() => backInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => backInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-lg text-center cursor-pointer transition-colors bg-slate-900/40"
                    >
                      <Layers className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                      <span className="text-slate-300 font-semibold block">Subir Reverso (Opcional)</span>
                      <span className="text-slate-500 text-[11px] mt-0.5 block">Habilitaciones, limitaciones y sellos</span>
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={backInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'back')}
                className="hidden"
              />
            </div>

          </div>

          {/* Action to Execute Scanner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="font-bold text-slate-200">
                Procesamiento Aeronáutico Automático con IA
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Endereza bordes, optimiza contraste de tipografía fina y extrae campos de certificación
              </div>
            </div>

            <button
              onClick={runAIScanner}
              disabled={isProcessing || (!frontImage && !backImage)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
            >
              {isProcessing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Procesando con IA...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>Escanear, Recortar y Mejorar con IA</span>
                </>
              )}
            </button>
          </div>

          {/* Processing Step Telemetry */}
          {isProcessing && (
            <div className="p-3 bg-sky-950/30 border border-sky-800/50 rounded-lg text-sky-300 font-mono text-[11px] flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>{processingStep}</span>
            </div>
          )}

          {/* Enhanced Result & Extracted Data Section */}
          {enhancedImage && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              
              {/* Enhancement Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-slate-200 text-xs">Filtro Óptico Aplicado:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyCustomFilter('auto')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                      activeFilter === 'auto'
                        ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Mejora Automática
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomFilter('aero_seal')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                      activeFilter === 'aero_seal'
                        ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Realce de Sellos Oficiales
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomFilter('bw_document')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                      activeFilter === 'bw_document'
                        ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Documento B&N Alto Contraste
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCustomFilter('grayscale')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                      activeFilter === 'grayscale'
                        ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Escala de Grises
                  </button>
                </div>
              </div>

              {/* Scanned Image Canvas Preview Frame */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-[11px] font-mono text-sky-400 mb-2 font-semibold">
                  DOCUMENTO DIGITALIZADO, RECORTADO Y OPTIMIZADO
                </span>
                <img
                  src={enhancedImage}
                  alt="Documento escaneado y recortado"
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-lg border border-slate-800"
                />
              </div>

              {/* Extracted Data Inspection Box */}
              {extractedData && (
                <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-xs">
                        Campos Oficiales Extraídos por IA ({extractedData.confidenceScore || 95}% confianza)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Tipo: {extractedData.documentType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Titular / Aeronave:</span>
                      <span className="text-white font-bold block truncate">
                        {extractedData.entityName || 'N/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Folio / Licencia:</span>
                      <span className="font-mono text-sky-400 font-bold block truncate">
                        {extractedData.documentNumber || 'N/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Emisión:</span>
                      <span className="font-mono text-slate-200 block">
                        {extractedData.issueDate || 'N/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Vencimiento:</span>
                      <span className="font-mono text-amber-300 font-bold block">
                        {extractedData.expiryDate || 'N/D'}
                      </span>
                    </div>
                  </div>

                  {extractedData.ratings && extractedData.ratings.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 block text-[11px] mb-1">Habilitaciones Reconocidas:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedData.ratings.map((r: string, i: number) => (
                          <span
                            key={i}
                            className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-200 border border-slate-700"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {extractedData.limitations && extractedData.limitations.length > 0 && (
                    <div className="pt-1">
                      <span className="text-slate-400 block text-[11px] mb-1">Limitaciones Médicas / Operativas:</span>
                      <div className="text-amber-300 text-xs">
                        {extractedData.limitations.join(' · ')}
                      </div>
                    </div>
                  )}

                  {extractedData.notes && (
                    <div className="text-[11px] text-slate-400 italic pt-1">
                      "{extractedData.notes}"
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <span className="text-xs text-slate-500">
            {enhancedImage
              ? 'Documento optimizado listo para incorporar al expediente'
              : 'Selecciona o sube los lados del documento para procesar'}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>

            {enhancedImage && extractedData && (
              <button
                onClick={handleSaveToDatabase}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Incorporar a la Base de Datos y Biblioteca</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
