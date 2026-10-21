import React, { useState } from 'react';
import { AviationProvider, useAviation } from './context/AviationContext';
import { Header, ActiveTab } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { PilotsCategoryView, PilotSubcategory } from './components/PilotsCategoryView';
import { AircraftCategoryView, AircraftSubcategory } from './components/AircraftCategoryView';
import { DocumentVault } from './components/DocumentVault';
import { ItemFormModal, FormModalMode } from './components/ItemFormModal';
import { PilotFleetModal } from './components/PilotFleetModal';
import { AuditReportModal } from './components/AuditReportModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { AviationScannerModal, ScannerDocHint } from './components/AviationScannerModal';
import { FlightLicense, MedicalCertificate, AirworthinessRecord, AirworthinessCertType } from './types/aviation';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedPilotId, setSelectedPilotId] = useState<string>('');
  const [pilotSubcategory, setPilotSubcategory] = useState<PilotSubcategory>('expediente');

  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('');
  const [aircraftSubcategory, setAircraftSubcategory] = useState<AircraftSubcategory>('expediente');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormModalMode>('license');
  const [editItem, setEditItem] = useState<FlightLicense | MedicalCertificate | AirworthinessRecord | null>(null);

  const [isPilotFleetModalOpen, setIsPilotFleetModalOpen] = useState(false);
  const [pilotFleetDefaultTab, setPilotFleetDefaultTab] = useState<'pilot' | 'aircraft'>('pilot');

  const [isAuditReportOpen, setIsAuditReportOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerDocHint, setScannerDocHint] = useState<ScannerDocHint>('licencia_vuelo');

  const { exportDatabaseJSON, resetToDefaultData } = useAviation();

  const handleOpenScanner = (hint: ScannerDocHint = 'licencia_vuelo') => {
    setScannerDocHint(hint);
    setIsScannerModalOpen(true);
  };

  const handleOpenNewRecord = (mode: FormModalMode = 'license') => {
    setEditItem(null);
    setFormMode(mode);
    setIsFormModalOpen(true);
  };

  const handleEditLicense = (license: FlightLicense) => {
    setEditItem(license);
    setFormMode('license');
    setIsFormModalOpen(true);
  };

  const handleEditMedical = (medical: MedicalCertificate) => {
    setEditItem(medical);
    setFormMode('medical');
    setIsFormModalOpen(true);
  };

  const handleEditAirworthiness = (record: AirworthinessRecord) => {
    setEditItem(record);
    setFormMode('airworthiness');
    setIsFormModalOpen(true);
  };

  const handleOpenNewPilot = () => {
    setPilotFleetDefaultTab('pilot');
    setIsPilotFleetModalOpen(true);
  };

  const handleOpenNewAircraft = () => {
    setPilotFleetDefaultTab('aircraft');
    setIsPilotFleetModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewRecord={() => handleOpenNewRecord('license')}
        onOpenScanner={() => handleOpenScanner('licencia_vuelo')}
        onOpenAuditReport={() => setIsAuditReportOpen(true)}
        onExportBackup={exportDatabaseJSON}
        onResetData={resetToDefaultData}
        onSelectPilot={(pilotId) => {
          setSelectedPilotId(pilotId);
          setPilotSubcategory('expediente');
          setActiveTab('pilots');
        }}
        onSelectAircraft={(aircraftId) => {
          setSelectedAircraftId(aircraftId);
          setAircraftSubcategory('expediente');
          setActiveTab('aircraft');
        }}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* View Switcher: Overview, 2 Main Categories (Pilots & Aircraft), and Vault */}
        {activeTab === 'overview' && (
          <StatsOverview
            setActiveTab={setActiveTab}
            onOpenNewRecord={() => handleOpenNewRecord('license')}
            onOpenAuditReport={() => setIsAuditReportOpen(true)}
            onOpenScanner={(hint) => handleOpenScanner(hint || 'licencia_vuelo')}
            onSelectPilot={(pId) => {
              setSelectedPilotId(pId);
              setPilotSubcategory('expediente');
              setActiveTab('pilots');
            }}
            onNavigateToPilots={(sub) => {
              if (sub) setPilotSubcategory(sub);
              setActiveTab('pilots');
            }}
            onNavigateToAircraft={(sub) => {
              if (sub) setAircraftSubcategory(sub);
              setActiveTab('aircraft');
            }}
          />
        )}

        {/* Categoría Principal 1: PILOTOS (con subcategorías Licencia y Examen Médico, y agrupado por piloto) */}
        {activeTab === 'pilots' && (
          <PilotsCategoryView
            initialSubcategory={pilotSubcategory}
            selectedPilotIdProp={selectedPilotId}
            onNewLicense={() => handleOpenNewRecord('license')}
            onNewMedical={() => handleOpenNewRecord('medical')}
            onNewPilot={handleOpenNewPilot}
            onEditLicense={handleEditLicense}
            onEditMedical={handleEditMedical}
            onOpenScanner={(hint) => handleOpenScanner(hint || 'licencia_vuelo')}
          />
        )}

        {/* Categoría Principal 2: AERONAVES (con subcategorías Aeronavegabilidad, Ruido y Estación) */}
        {activeTab === 'aircraft' && (
          <AircraftCategoryView
            initialSubcategory={aircraftSubcategory}
            selectedAircraftIdProp={selectedAircraftId}
            onNewAirworthiness={(certType?: AirworthinessCertType) => handleOpenNewRecord('airworthiness')}
            onEditAirworthiness={handleEditAirworthiness}
            onNewAircraft={handleOpenNewAircraft}
            onOpenScanner={(hint) => handleOpenScanner(hint || 'certificado_aeronavegabilidad')}
          />
        )}

        {/* Bóveda Documental Central */}
        {activeTab === 'vault' && (
          <DocumentVault
            onOpenNewRecord={() => handleOpenNewRecord('license')}
            onOpenScanner={() => handleOpenScanner('licencia_vuelo')}
          />
        )}

      </main>

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-850 bg-slate-900/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">AeroDoc Ops</span>
            <span aria-hidden="true">·</span>
            <span>Sistema de Gestión de Licencias, Médicos y Aeronavegabilidad</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Conforme a Anexo 1 (Licencias) y Anexo 8 (Aeronavegabilidad) OACI</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={exportDatabaseJSON}
              className="text-sky-400 hover:text-sky-300 transition-colors"
            >
              Exportar Respaldo
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <ItemFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialMode={formMode}
        editItem={editItem}
      />

      <PilotFleetModal
        isOpen={isPilotFleetModalOpen}
        onClose={() => setIsPilotFleetModalOpen(false)}
        defaultTab={pilotFleetDefaultTab}
      />

      <AuditReportModal
        isOpen={isAuditReportOpen}
        onClose={() => setIsAuditReportOpen(false)}
      />

      <AviationScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        defaultDocHint={scannerDocHint}
      />

      <DocumentViewerModal />
    </div>
  );
}

export default function App() {
  return (
    <AviationProvider>
      <AppContent />
    </AviationProvider>
  );
}
