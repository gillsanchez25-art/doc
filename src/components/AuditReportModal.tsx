import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, Plane, Award, HeartPulse } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { formatDateSpanish, calculateDaysRemaining } from '../utils/aviationUtils';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({ isOpen, onClose }) => {
  const {
    pilots,
    licenses,
    medicalCertificates,
    aircraft,
    airworthinessRecords,
    totalValidCount,
    expiringSoonCount,
    expiredCount,
  } = useAviation();

  if (!isOpen) return null;

  const totalDocs = licenses.length + medicalCertificates.length + airworthinessRecords.length;
  const complianceRate = totalDocs > 0 ? Math.round((totalValidCount / totalDocs) * 100) : 100;
  const currentDateFormatted = formatDateSpanish(new Date().toISOString().slice(0, 10));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header - Screen Only */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Informe Técnico Oficial
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Carpeta de Cumplimiento Técnico, Licencias y Aeronavegabilidad
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Document Content (Ready for Print) */}
        <div className="overflow-y-auto p-8 space-y-8 flex-1 print:p-0 print:space-y-6">
          
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500 tracking-widest uppercase">
                EXPEDIENTE DE VUELO Y AUDITORÍA DE SEGURIDAD OPERACIONAL
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                AeroDoc Compliance Report · OACI / AFAC
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Verificación de vigencias de Licencias de Vuelo, Aptitud Médica y Certificados de Aeronavegabilidad
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-600">
              <div><strong className="text-slate-900">Fecha de Emisión:</strong> {currentDateFormatted}</div>
              <div className="font-mono text-[11px] text-slate-500 mt-0.5">FOLIO: AUD-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</div>
              <div className="mt-1 inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Índice Cumplimiento: {complianceRate}%</span>
              </div>
            </div>
          </div>

          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-4 gap-3 text-center border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Documentos</span>
              <span className="font-bold text-slate-900 text-lg tabular-nums">{totalDocs}</span>
            </div>
            <div>
              <span className="text-emerald-600 block text-[11px] font-medium">Vigentes al Día</span>
              <span className="font-bold text-emerald-700 text-lg tabular-nums">{totalValidCount}</span>
            </div>
            <div>
              <span className="text-amber-600 block text-[11px] font-medium">Por Vencer (&lt; 30d)</span>
              <span className="font-bold text-amber-700 text-lg tabular-nums">{expiringSoonCount}</span>
            </div>
            <div>
              <span className="text-rose-600 block text-[11px] font-medium">Expirados / AOG</span>
              <span className="font-bold text-rose-700 text-lg tabular-nums">{expiredCount}</span>
            </div>
          </div>

          {/* Section 1: Crew Flight Licenses */}
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
              <Award className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Estado de Licencias de Vuelo del Personal de Vuelo
              </h3>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 uppercase text-[10px] bg-slate-100/80">
                  <th className="py-2 px-3">Piloto</th>
                  <th className="py-2 px-3">Cat.</th>
                  <th className="py-2 px-3">Número Licencia</th>
                  <th className="py-2 px-3">Autoridad</th>
                  <th className="py-2 px-3">Vencimiento</th>
                  <th className="py-2 px-3">Días</th>
                  <th className="py-2 px-3 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {licenses.map((lic) => {
                  const days = calculateDaysRemaining(lic.expiryDate);
                  const isExpired = days < 0;
                  const isExpiring = days >= 0 && days <= 30;

                  return (
                    <tr key={lic.id} className="text-slate-800">
                      <td className="py-2 px-3 font-semibold">{lic.pilotName}</td>
                      <td className="py-2 px-3 font-bold text-sky-700">{lic.category}</td>
                      <td className="py-2 px-3 font-mono">{lic.licenseNumber}</td>
                      <td className="py-2 px-3 truncate max-w-[150px]">{lic.issuingAuthority}</td>
                      <td className="py-2 px-3 font-mono tabular-nums">{formatDateSpanish(lic.expiryDate)}</td>
                      <td className="py-2 px-3 font-mono tabular-nums">{days} d</td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {isExpired ? (
                          <span className="text-rose-600">Vencida</span>
                        ) : isExpiring ? (
                          <span className="text-amber-600">Por Vencer</span>
                        ) : (
                          <span className="text-emerald-700">Vigente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 2: Medical Exams */}
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Certificación Médica y Aptitud Psicofísica
              </h3>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 uppercase text-[10px] bg-slate-100/80">
                  <th className="py-2 px-3">Piloto</th>
                  <th className="py-2 px-3">Clase</th>
                  <th className="py-2 px-3">Certificado No.</th>
                  <th className="py-2 px-3">Médico / AME</th>
                  <th className="py-2 px-3">Vencimiento</th>
                  <th className="py-2 px-3">Limitaciones</th>
                  <th className="py-2 px-3 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {medicalCertificates.map((med) => {
                  const days = calculateDaysRemaining(med.expiryDate);
                  const isExpired = days < 0;
                  const isExpiring = days >= 0 && days <= 30;

                  return (
                    <tr key={med.id} className="text-slate-800">
                      <td className="py-2 px-3 font-semibold">{med.pilotName}</td>
                      <td className="py-2 px-3 font-bold text-emerald-700">{med.medicalClass}</td>
                      <td className="py-2 px-3 font-mono">{med.certificateNumber}</td>
                      <td className="py-2 px-3 truncate max-w-[140px]">{med.authorizedExaminer}</td>
                      <td className="py-2 px-3 font-mono tabular-nums">{formatDateSpanish(med.expiryDate)}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-600 truncate max-w-[140px]">
                        {med.limitations.join(', ')}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {isExpired ? (
                          <span className="text-rose-600">Vencido</span>
                        ) : isExpiring ? (
                          <span className="text-amber-600">Por Vencer</span>
                        ) : (
                          <span className="text-emerald-700">Vigente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 3: Aircraft Fleet Airworthiness */}
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
              <Plane className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                3. Certificados de Aeronavegabilidad e Inspecciones Técnicas de Flota
              </h3>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 uppercase text-[10px] bg-slate-100/80">
                  <th className="py-2 px-3">Matrícula</th>
                  <th className="py-2 px-3">Aeronave</th>
                  <th className="py-2 px-3">Certificado / Inspección</th>
                  <th className="py-2 px-3">Folio</th>
                  <th className="py-2 px-3">Vencimiento</th>
                  <th className="py-2 px-3">Horas / Próx</th>
                  <th className="py-2 px-3 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {airworthinessRecords.map((air) => {
                  const days = calculateDaysRemaining(air.expiryDate);
                  const isExpired = days < 0;
                  const isExpiring = days >= 0 && days <= 30;

                  return (
                    <tr key={air.id} className="text-slate-800">
                      <td className="py-2 px-3 font-mono font-bold text-sky-800">{air.aircraftRegistration}</td>
                      <td className="py-2 px-3 truncate max-w-[120px]">{air.aircraftModel}</td>
                      <td className="py-2 px-3 font-medium truncate max-w-[160px]">{air.title}</td>
                      <td className="py-2 px-3 font-mono text-[11px]">{air.documentNumber}</td>
                      <td className="py-2 px-3 font-mono tabular-nums">{formatDateSpanish(air.expiryDate)}</td>
                      <td className="py-2 px-3 font-mono tabular-nums text-[11px]">
                        {air.nextInspectionDueHours ? `${air.nextInspectionDueHours} hrs` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {isExpired ? (
                          <span className="text-rose-600">Vencido</span>
                        ) : isExpiring ? (
                          <span className="text-amber-600">Por Vencer</span>
                        ) : (
                          <span className="text-emerald-700">Vigente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legal Certification and Inspector Signatures */}
          <div className="pt-8 border-t-2 border-slate-900 mt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                Cap. Jefe de Operaciones / Mantenimiento
              </div>
              <span className="text-slate-500 text-[11px]">Firma de Responsable Técnico y Operativo</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                Inspector Verificador AFAC / OACI
              </div>
              <span className="text-slate-500 text-[11px]">Sello y Aprobación de Rampa Aeronáutica</span>
            </div>
          </div>

        </div>

        {/* Modal Footer - Screen Only */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500">
            Formato apto para inspecciones de rampa y archivo de auditoría interna
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Imprimir Carpeta de Auditoría</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
