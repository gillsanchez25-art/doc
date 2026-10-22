import React, { useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera as NativeCamera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
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
  Award,
  Users,
  Crop,
  Maximize2,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import {
  EnhancementFilter,
  FramingPreset,
  CropBox,
  applyFilterToCanvas,
  cropImageToBox,
  combineFrontAndBack,
  rotateImage,
  detectDocumentEdges,
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
    addPilot,
    addAircraft,
    pilots,
    aircraft,
  } = useAviation();

  const findMatchingPilot = (name?: string) => {
    if (!name) return null;
    const clean = name.toLowerCase().replace(/^(cap\.|capitán|p\.a\.|lic\.|ing\.|dr\.)\s+/i, '').trim();
    if (!clean) return null;
    return pilots.find((p) => {
      const pClean = p.fullName.toLowerCase().replace(/^(cap\.|capitán|p\.a\.|lic\.|ing\.|dr\.)\s+/i, '').trim();
      return pClean.includes(clean) || clean.includes(pClean);
    });
  };

  const [documentHint, setDocumentHint] = useState<ScannerDocHint>(defaultDocHint);

  // Raw original images (preserved for re-framing / re-cropping at high resolution)
  const [rawFrontImage, setRawFrontImage] = useState<string | null>(null);
  const [rawBackImage, setRawBackImage] = useState<string | null>(null);

  // Active working images (may be rotated)
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);

  // Framing & Cropping Controls
  const [framingPreset, setFramingPreset] = useState<FramingPreset>(() =>
    defaultDocHint === 'licencia_vuelo' ? 'id_card' : 'a4_cert'
  );
  const [showFramingAdjuster, setShowFramingAdjuster] = useState(false);
  const [manualMargins, setManualMargins] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<EnhancementFilter>('auto');
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Sync default framing preset when doc hint changes
  useEffect(() => {
    if (documentHint === 'licencia_vuelo') {
      setFramingPreset('id_card');
    } else {
      setFramingPreset('a4_cert');
    }
  }, [documentHint]);

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
            setRawFrontImage(res);
          } else {
            setBackImage(res);
            setRawBackImage(res);
          }
          // Reset previous scan result when new image is picked
          setEnhancedImage(null);
          setExtractedData(null);
          setManualMargins({ top: 0, bottom: 0, left: 0, right: 0 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotate = async (side: 'front' | 'back') => {
    if (side === 'front' && frontImage) {
      setIsProcessing(true);
      setProcessingStep('Rotando imagen frontal 90°...');
      const rotated = await rotateImage(frontImage, 90);
      setFrontImage(rotated);
      setRawFrontImage(rotated);
      setEnhancedImage(null);
      setIsProcessing(false);
    } else if (side === 'back' && backImage) {
      setIsProcessing(true);
      setProcessingStep('Rotando imagen de reverso 90°...');
      const rotated = await rotateImage(backImage, 90);
      setBackImage(rotated);
      setRawBackImage(rotated);
      setEnhancedImage(null);
      setIsProcessing(false);
    }
  };

  const loadSample = (type: 'license' | 'medical' | 'airworthiness' | 'noise' | 'station') => {
    setManualMargins({ top: 0, bottom: 0, left: 0, right: 0 });
    if (type === 'license') {
      setDocumentHint('licencia_vuelo');
      setFramingPreset('id_card');
      const f = generateSampleAviationScan('license_front');
      const b = generateSampleAviationScan('license_back');
      setFrontImage(f);
      setRawFrontImage(f);
      setBackImage(b);
      setRawBackImage(b);
    } else if (type === 'medical') {
      setDocumentHint('examen_medico');
      setFramingPreset('a4_cert');
      const f = generateSampleAviationScan('medical');
      setFrontImage(f);
      setRawFrontImage(f);
      setBackImage(null);
      setRawBackImage(null);
    } else if (type === 'noise') {
      setDocumentHint('certificado_ruido');
      setFramingPreset('a4_cert');
      const f = generateSampleAviationScan('noise');
      setFrontImage(f);
      setRawFrontImage(f);
      setBackImage(null);
      setRawBackImage(null);
    } else if (type === 'station') {
      setDocumentHint('certificado_estacion');
      setFramingPreset('a4_cert');
      const f = generateSampleAviationScan('station');
      setFrontImage(f);
      setRawFrontImage(f);
      setBackImage(null);
      setRawBackImage(null);
    } else {
      setDocumentHint('certificado_aeronavegabilidad');
      setFramingPreset('a4_cert');
      const f = generateSampleAviationScan('airworthiness');
      setFrontImage(f);
      setRawFrontImage(f);
      setBackImage(null);
      setRawBackImage(null);
    }
    setEnhancedImage(null);
    setExtractedData(null);
  };

  /**
   * Applies framing and cropping (using AI bounding box, manual adjustments, and framing preset)
   */
  const processAndFrameImages = async (
    targetPreset: FramingPreset = framingPreset,
    margins = manualMargins,
    aiBoxes?: { front?: CropBox | null; back?: CropBox | null }
  ) => {
    const baseFront = frontImage || rawFrontImage;
    const baseBack = backImage || rawBackImage;
    if (!baseFront && !baseBack) return;

    let processedFront = '';
    if (baseFront) {
      let boxToUse: CropBox | null = null;
      if (margins.top > 0 || margins.bottom > 0 || margins.left > 0 || margins.right > 0) {
        boxToUse = {
          ymin: Math.round(margins.top * 10),
          xmin: Math.round(margins.left * 10),
          ymax: Math.round(1000 - margins.bottom * 10),
          xmax: Math.round(1000 - margins.right * 10),
        };
      } else if (aiBoxes?.front) {
        boxToUse = aiBoxes.front;
      }

      processedFront = await cropImageToBox(baseFront, boxToUse, targetPreset);
    }

    let processedBack = '';
    if (baseBack) {
      let boxToUse: CropBox | null = null;
      if (margins.top > 0 || margins.bottom > 0 || margins.left > 0 || margins.right > 0) {
        boxToUse = {
          ymin: Math.round(margins.top * 10),
          xmin: Math.round(margins.left * 10),
          ymax: Math.round(1000 - margins.bottom * 10),
          xmax: Math.round(1000 - margins.right * 10),
        };
      } else if (aiBoxes?.back) {
        boxToUse = aiBoxes.back;
      }

      processedBack = await cropImageToBox(baseBack, boxToUse, targetPreset);
    }

    // Stitch or single image
    if (processedFront && processedBack) {
      const combined = await combineFrontAndBack(processedFront, processedBack, activeFilter);
      setEnhancedImage(combined);
    } else {
      const single = processedFront || processedBack;
      const img = new Image();
      img.src = single;
      await new Promise((r) => (img.onload = r));
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const filteredCanvas = applyFilterToCanvas(canvas, activeFilter);
        setEnhancedImage(filteredCanvas.toDataURL('image/jpeg', 0.94));
      } else {
        setEnhancedImage(single);
      }
    }
  };

  const runAIScanner = async () => {
    if (!frontImage && !backImage) return;

    setIsProcessing(true);
    setProcessingStep('Analizando bordes y cuadrantes oficiales con IA...');

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

      setProcessingStep('Ajustando encuadre y aplicando filtros de contraste aeronáutico...');

      // 2. Perform intelligent crop with the chosen preset
      await processAndFrameImages(framingPreset, manualMargins, aiData.cropCoordinates);

      setProcessingStep('Extracción reglamentaria y digitalización completadas.');
    } catch (err) {
      console.error('Scan error:', err);
      setProcessingStep('Error al procesar con IA. Aplicando recorte estándar.');
      await processAndFrameImages(framingPreset, manualMargins);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPresetChange = async (newPreset: FramingPreset) => {
    setFramingPreset(newPreset);
    if (enhancedImage || frontImage || backImage) {
      setIsProcessing(true);
      setProcessingStep(`Ajustando encuadre a formato ${newPreset === 'id_card' ? 'Tarjeta ID' : newPreset === 'a4_cert' ? 'Hoja A4' : newPreset}...`);
      await processAndFrameImages(newPreset, manualMargins, extractedData?.cropCoordinates);
      setIsProcessing(false);
    }
  };

  const handleApplyMarginAdjustment = async () => {
    setIsProcessing(true);
    setProcessingStep('Re-encuadrando con márgenes personalizados...');
    await processAndFrameImages(framingPreset, manualMargins);
    setIsProcessing(false);
  };

  const applyCustomFilter = async (filter: EnhancementFilter) => {
    setActiveFilter(filter);
    if (!frontImage && !backImage) return;

    setIsProcessing(true);
    setProcessingStep('Aplicando filtro de realce óptico...');
    try {
      await processAndFrameImages(framingPreset, manualMargins, extractedData?.cropCoordinates);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = () => {
    if (!extractedData) return;

    const docType = extractedData.documentType;
    const finalDocUrl = enhancedImage || frontImage || '';

    if (docType === 'licencia_vuelo') {
      const cleanName = (extractedData.entityName || '').trim();
      let matchedPilot = findMatchingPilot(cleanName);
      let finalPilotId = matchedPilot?.id;
      let finalPilotName = matchedPilot?.fullName || cleanName || 'Capitán Titular';

      // Auto-register crew member if not already registered!
      if (!matchedPilot) {
        const cat = (extractedData.categoryOrClass as any) || 'CPL';
        const role = cat === 'ATPL' ? 'Capitán' : cat === 'FI' ? 'Instructor' : cat === 'PPL' ? 'Piloto Privado' : 'Primer Oficial';
        const newPilot = addPilot({
          fullName: cleanName || 'Cap. Piloto Escaneado',
          nationalId: extractedData.documentNumber || `ID-${Date.now().toString().slice(-6)}`,
          email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@aerodoc.ops`,
          phone: '+52 (55) 5500-0000',
          role: role,
          baseAirport: 'MMMX',
          totalFlightHours: cat === 'ATPL' ? 1800 : cat === 'CPL' ? 320 : 80,
        });
        finalPilotId = newPilot.id;
        finalPilotName = newPilot.fullName;
      }

      addLicense({
        pilotId: finalPilotId!,
        pilotName: finalPilotName,
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
      const cleanName = (extractedData.entityName || '').trim();
      let matchedPilot = findMatchingPilot(cleanName);
      let finalPilotId = matchedPilot?.id;
      let finalPilotName = matchedPilot?.fullName || cleanName || 'Piloto Titular';

      // Auto-register crew member if not already registered!
      if (!matchedPilot) {
        const newPilot = addPilot({
          fullName: cleanName || 'P.A. Piloto Escaneado',
          nationalId: extractedData.documentNumber || `MED-${Date.now().toString().slice(-6)}`,
          email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@aerodoc.ops`,
          phone: '+52 (55) 5500-0000',
          role: 'Primer Oficial',
          baseAirport: 'MMMX',
          totalFlightHours: 250,
        });
        finalPilotId = newPilot.id;
        finalPilotName = newPilot.fullName;
      }

      addMedicalCertificate({
        pilotId: finalPilotId!,
        pilotName: finalPilotName,
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
      const reg = (extractedData.aircraftRegistration || 'XB-CAP').trim().toUpperCase();
      let matchedAc = aircraft.find((a) => a.registration.trim().toUpperCase() === reg);
      let finalAircraftId = matchedAc?.id;
      let finalRegistration = matchedAc?.registration || reg;
      let finalModel = matchedAc?.model || extractedData.aircraftModel || 'Aeronave Registrada';

      if (!matchedAc) {
        const newAc = addAircraft({
          registration: reg,
          make: (extractedData.aircraftModel || 'Cessna').split(' ')[0],
          model: extractedData.aircraftModel || 'Cessna 172S',
          serialNumber: `SN-${Date.now().toString().slice(-6)}`,
          year: 2021,
          operator: 'Operaciones Aéreas AeroDoc',
          baseAirport: 'MMMX',
          totalAirframeHours: extractedData.inspectionHours || 1450,
          engineHours: extractedData.inspectionHours || 1450,
          isAirworthy: true,
          notes: 'Aeronave registrada automáticamente tras escaneo de certificado oficial',
        });
        finalAircraftId = newAc.id;
        finalRegistration = newAc.registration;
        finalModel = newAc.model;
      }

      addAirworthinessRecord({
        aircraftId: finalAircraftId!,
        aircraftRegistration: finalRegistration,
        aircraftModel: finalModel,
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
      const reg = (extractedData.aircraftRegistration || 'XB-CAP').trim().toUpperCase();
      let matchedAc = aircraft.find((a) => a.registration.trim().toUpperCase() === reg);
      let finalAircraftId = matchedAc?.id;
      let finalRegistration = matchedAc?.registration || reg;
      let finalModel = matchedAc?.model || extractedData.aircraftModel || 'Aeronave Registrada';

      if (!matchedAc) {
        const newAc = addAircraft({
          registration: reg,
          make: (extractedData.aircraftModel || 'Cessna').split(' ')[0],
          model: extractedData.aircraftModel || 'Cessna 172S',
          serialNumber: `SN-${Date.now().toString().slice(-6)}`,
          year: 2021,
          operator: 'Operaciones Aéreas AeroDoc',
          baseAirport: 'MMMX',
          totalAirframeHours: extractedData.inspectionHours || 1450,
          engineHours: extractedData.inspectionHours || 1450,
          isAirworthy: true,
          notes: 'Aeronave registrada automáticamente tras escaneo de certificado oficial',
        });
        finalAircraftId = newAc.id;
        finalRegistration = newAc.registration;
        finalModel = newAc.model;
      }

      addAirworthinessRecord({
        aircraftId: finalAircraftId!,
        aircraftRegistration: finalRegistration,
        aircraftModel: finalModel,
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
      const reg = (extractedData.aircraftRegistration || 'XB-SCAN').trim().toUpperCase();
      let matchedAc = aircraft.find((a) => a.registration.trim().toUpperCase() === reg);
      let finalAircraftId = matchedAc?.id;
      let finalRegistration = matchedAc?.registration || reg;
      let finalModel = matchedAc?.model || extractedData.aircraftModel || 'Aeronave Registrada';

      if (!matchedAc) {
        const newAc = addAircraft({
          registration: reg,
          make: (extractedData.aircraftModel || 'Cessna').split(' ')[0],
          model: extractedData.aircraftModel || 'Cessna 172S',
          serialNumber: `SN-${Date.now().toString().slice(-6)}`,
          year: 2021,
          operator: 'Operaciones Aéreas AeroDoc',
          baseAirport: 'MMMX',
          totalAirframeHours: extractedData.inspectionHours || 1800,
          engineHours: extractedData.inspectionHours || 1800,
          isAirworthy: true,
          notes: 'Aeronave registrada automáticamente tras escaneo de certificado oficial',
        });
        finalAircraftId = newAc.id;
        finalRegistration = newAc.registration;
        finalModel = newAc.model;
      }

      addAirworthinessRecord({
        aircraftId: finalAircraftId!,
        aircraftRegistration: finalRegistration,
        aircraftModel: finalModel,
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
                  AERO-SCAN AI · ENCUADRE DE PRECISIÓN
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">Recorte y Corrección Óptica de Documentos</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Escáner Inteligente con Encuadre Automático y Manual
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
            <span className="text-slate-400 font-medium">Tipo:</span>
            <div className="flex flex-wrap items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setDocumentHint('licencia_vuelo');
                  setFramingPreset('id_card');
                }}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'licencia_vuelo' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Licencia</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocumentHint('examen_medico');
                  setFramingPreset('a4_cert');
                }}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'examen_medico' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Examen Médico</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocumentHint('certificado_aeronavegabilidad');
                  setFramingPreset('a4_cert');
                }}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'certificado_aeronavegabilidad' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Aeronavegabilidad</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocumentHint('certificado_ruido');
                  setFramingPreset('a4_cert');
                }}
                className={`px-2.5 py-1 font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  documentHint === 'certificado_ruido' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ruido</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocumentHint('certificado_estacion');
                  setFramingPreset('a4_cert');
                }}
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
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between min-h-[230px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Lado 1: Anverso / Frente
                  </span>
                  
                  {frontImage && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRotate('front')}
                        className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-sky-300 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 rounded transition-colors"
                        title="Rotar imagen 90 grados a la derecha"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Rotar 90°</span>
                      </button>
                      <button
                        onClick={() => {
                          setFrontImage(null);
                          setRawFrontImage(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
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
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between min-h-[230px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Lado 2: Reverso / Dorso (Habilitaciones y Sellos)
                  </span>
                  
                  {backImage && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRotate('back')}
                        className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-sky-300 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 rounded transition-colors"
                        title="Rotar imagen 90 grados a la derecha"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Rotar 90°</span>
                      </button>
                      <button
                        onClick={() => {
                          setBackImage(null);
                          setRawBackImage(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
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

          {/* Framing Presets Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block text-xs">Formato y Proporción de Encuadre:</span>
                <span className="text-slate-400 text-[11px] block">
                  Alinea automáticamente las dimensiones al estándar del documento
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPresetChange('id_card')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  framingPreset === 'id_card'
                    ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                💳 Tarjeta ID (85×54 mm)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetChange('a4_cert')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  framingPreset === 'a4_cert'
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                📄 Hoja A4 / Carta
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetChange('auto')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  framingPreset === 'auto'
                    ? 'bg-slate-700 border-slate-500 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                ⚡ Auto-Bordes IA
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetChange('full')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  framingPreset === 'full'
                    ? 'bg-slate-700 border-slate-500 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                🖼 Completo
              </button>
            </div>
          </div>

          {/* Action to Execute Scanner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <div className="font-bold text-slate-200 text-xs sm:text-sm">
                Procesamiento Aeronáutico Automático con IA
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Detecta y encuadra bordes físicos, remueve mesas y sombras, optimiza sellos y extrae campos oficiales
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
                  <span>Escanear, Recortar y Encuadrar</span>
                </>
              )}
            </button>
          </div>

          {/* Processing Step Telemetry */}
          {isProcessing && (
            <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-lg text-sky-300 font-mono text-[11px] flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>{processingStep}</span>
            </div>
          )}

          {/* Enhanced Result & Extracted Data Section */}
          {enhancedImage && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              
              {/* Enhancement Filter & Framing Controls Strip */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-slate-200 text-xs">Filtro Óptico:</span>
                  <div className="flex flex-wrap items-center gap-1.5 ml-1">
                    <button
                      type="button"
                      onClick={() => applyCustomFilter('auto')}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                        activeFilter === 'auto'
                          ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      Automático
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCustomFilter('aero_seal')}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                        activeFilter === 'aero_seal'
                          ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      Sellos y Firmas
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCustomFilter('bw_document')}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                        activeFilter === 'bw_document'
                          ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      B&N Alto Contraste
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCustomFilter('grayscale')}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                        activeFilter === 'grayscale'
                          ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      Grises
                    </button>
                  </div>
                </div>

                {/* Button to toggle manual framing adjuster */}
                <button
                  type="button"
                  onClick={() => setShowFramingAdjuster(!showFramingAdjuster)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors ${
                    showFramingAdjuster
                      ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ajustar Encuadre y Recorte</span>
                  {showFramingAdjuster ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Manual Framing Adjuster Drawer */}
              {showFramingAdjuster && (
                <div className="p-4 rounded-xl bg-slate-950 border border-sky-900/50 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
                      <Crop className="w-3.5 h-3.5" />
                      Calibración Manual de Márgenes de Recorte
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setManualMargins({ top: 0, bottom: 0, left: 0, right: 0 });
                        handleApplyMarginAdjustment();
                      }}
                      className="text-[11px] text-slate-400 hover:text-sky-300 underline"
                    >
                      Restablecer márgenes
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Usa los controles para recortar bordes de mesas, sombras o dedos si el documento original no quedó perfectamente encuadrado:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Margen Superior:</span>
                        <span className="font-mono text-sky-400">{manualMargins.top}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={manualMargins.top}
                        onChange={(e) => setManualMargins({ ...manualMargins, top: Number(e.target.value) })}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Margen Inferior:</span>
                        <span className="font-mono text-sky-400">{manualMargins.bottom}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={manualMargins.bottom}
                        onChange={(e) => setManualMargins({ ...manualMargins, bottom: Number(e.target.value) })}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Margen Izquierdo:</span>
                        <span className="font-mono text-sky-400">{manualMargins.left}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={manualMargins.left}
                        onChange={(e) => setManualMargins({ ...manualMargins, left: Number(e.target.value) })}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Margen Derecho:</span>
                        <span className="font-mono text-sky-400">{manualMargins.right}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={manualMargins.right}
                        onChange={(e) => setManualMargins({ ...manualMargins, right: Number(e.target.value) })}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleApplyMarginAdjustment}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar Recorte y Actualizar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Scanned Image Canvas Preview Frame */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-[11px] font-mono text-sky-400 mb-2 font-semibold">
                  DOCUMENTO DIGITALIZADO, RECORTADO Y ENCUADRADO
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
                        Campos Oficiales Extraídos ({extractedData.confidenceScore || 95}% confianza)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Tipo: {extractedData.documentType}
                    </span>
                  </div>

                  {/* Crew member or Aircraft Auto-registration Banner */}
                  {(extractedData.documentType === 'licencia_vuelo' || extractedData.documentType === 'examen_medico') && (
                    (() => {
                      const matched = findMatchingPilot(extractedData.entityName);
                      return matched ? (
                        <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/60 text-sky-200 text-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Users className="w-4 h-4 text-sky-400 shrink-0" />
                            <span className="truncate">
                              Tripulante encontrado en el padrón: <strong>{matched.fullName}</strong> ({matched.role}) · Base {matched.baseAirport}.
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900/60 border border-sky-700 text-sky-300 shrink-0">
                            REGISTRO EXISTENTE
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-700/60 text-emerald-200 text-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">
                              <strong>Nuevo Tripulante Detectado:</strong> No existe registro previo para "{extractedData.entityName || 'Titular'}". Se registrará automáticamente como nuevo piloto en el sistema.
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-600 text-emerald-300 shrink-0">
                            ALTA AUTOMÁTICA
                          </span>
                        </div>
                      );
                    })()
                  )}

                  {(extractedData.documentType === 'certificado_ruido' || extractedData.documentType === 'certificado_estacion' || extractedData.documentType === 'certificado_aeronavegabilidad') && (
                    (() => {
                      const reg = (extractedData.aircraftRegistration || '').trim().toUpperCase();
                      const matched = aircraft.find(a => a.registration.trim().toUpperCase() === reg);
                      return matched ? (
                        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 text-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Plane className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="truncate">
                              Aeronave en flota: <strong>{matched.registration}</strong> ({matched.make} {matched.model}). El certificado se anexará a su expediente.
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700 text-indigo-300 shrink-0">
                            AERONAVE REGISTRADA
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-700/60 text-emerald-200 text-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">
                              <strong>Nueva Aeronave Detectada:</strong> Matrícula "{reg || 'Desconocida'}". Se creará automáticamente en la flota de aeronaves.
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-600 text-emerald-300 shrink-0">
                            ALTA AUTOMÁTICA
                          </span>
                        </div>
                      );
                    })()
                  )}

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
