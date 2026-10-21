import React, { useState } from 'react';
import { Users, Award, HeartPulse, Scan, Plus, Search, Filter } from 'lucide-react';
import { Pilot, FlightLicense, MedicalCertificate } from '../types/aviation';
import { LicenseManager } from './LicenseManager';
import { MedicalManager } from './MedicalManager';
import { PilotDossierView } from './PilotDossierView';

export type PilotSubcategory = 'expediente' | 'licencia' | 'medico';

interface PilotsCategoryViewProps {
  onNewLicense: () => void;
  onNewMedical: () => void;
  onNewPilot: () => void;
  onEditLicense: (lic: FlightLicense) => void;
  onEditMedical: (med: MedicalCertificate) => void;
  onOpenScanner: (hint?: 'licencia_vuelo' | 'examen_medico') => void;
  initialSubcategory?: PilotSubcategory;
  selectedPilotIdProp?: string;
}

export const PilotsCategoryView: React.FC<PilotsCategoryViewProps> = ({
  onNewLicense,
  onNewMedical,
  onNewPilot,
  onEditLicense,
  onEditMedical,
  onOpenScanner,
  initialSubcategory = 'expediente',
  selectedPilotIdProp,
}) => {
  const [activeSubcategory, setActiveSubcategory] = useState<PilotSubcategory>(initialSubcategory);

  return (
    <div className="space-y-6">
      {/* Category Banner & Subcategory Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                CATEGORÍA PRINCIPAL · TRIPULACIONES
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Pilotos y Personal de Vuelo
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Control de competencias técnicas, licencias de vuelo y aptitud médica psicofísica
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenScanner('licencia_vuelo')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <Scan className="w-3.5 h-3.5 text-sky-400" />
              <span>Escanear con IA</span>
            </button>
            <button
              onClick={onNewPilot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Piloto</span>
            </button>
          </div>
        </div>

        {/* Subcategories Navigation Tabs */}
        <div className="pt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1">Subcategorías:</span>

          <button
            onClick={() => setActiveSubcategory('expediente')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubcategory === 'expediente'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Expediente Integral (Licencia + Examen Médico)</span>
          </button>

          <button
            onClick={() => setActiveSubcategory('licencia')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubcategory === 'licencia'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Licencia de Vuelo</span>
          </button>

          <button
            onClick={() => setActiveSubcategory('medico')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubcategory === 'medico'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Examen Médico</span>
          </button>
        </div>
      </div>

      {/* Subcategory View Render */}
      {activeSubcategory === 'expediente' && (
        <PilotDossierView
          selectedPilotIdProp={selectedPilotIdProp}
          onOpenScannerForPilot={(p) => onOpenScanner('licencia_vuelo')}
          onNewLicenseForPilot={() => onNewLicense()}
          onNewMedicalForPilot={() => onNewMedical()}
          onEditLicense={onEditLicense}
          onEditMedical={onEditMedical}
          onNewPilot={onNewPilot}
        />
      )}

      {activeSubcategory === 'licencia' && (
        <LicenseManager
          onNewLicense={onNewLicense}
          onEditLicense={onEditLicense}
          onOpenScanner={() => onOpenScanner('licencia_vuelo')}
          onSelectPilot={() => setActiveSubcategory('expediente')}
        />
      )}

      {activeSubcategory === 'medico' && (
        <MedicalManager
          onNewMedical={onNewMedical}
          onEditMedical={onEditMedical}
          onOpenScanner={() => onOpenScanner('examen_medico')}
          onSelectPilot={() => setActiveSubcategory('expediente')}
        />
      )}
    </div>
  );
};
