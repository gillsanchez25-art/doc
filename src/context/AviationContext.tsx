import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Pilot,
  FlightLicense,
  MedicalCertificate,
  Aircraft,
  AirworthinessRecord,
  DocumentItem,
  DocumentStatus
} from '../types/aviation';
import {
  initialPilots,
  initialLicenses,
  initialMedicalCertificates,
  initialAircraft,
  initialAirworthinessRecords
} from '../data/initialAviationData';
import { calculateDaysRemaining, getDocumentStatus, generateSimulatedCertificateSVG } from '../utils/aviationUtils';

interface AviationContextType {
  pilots: Pilot[];
  licenses: FlightLicense[];
  medicalCertificates: MedicalCertificate[];
  aircraft: Aircraft[];
  airworthinessRecords: AirworthinessRecord[];
  allDocuments: DocumentItem[];
  
  // Expirations & Alerts
  expiringSoonCount: number;
  expiredCount: number;
  totalValidCount: number;

  // Actions
  addLicense: (license: Omit<FlightLicense, 'id' | 'status'>) => void;
  updateLicense: (id: string, license: Partial<FlightLicense>) => void;
  deleteLicense: (id: string) => void;

  addMedicalCertificate: (medical: Omit<MedicalCertificate, 'id' | 'status'>) => void;
  updateMedicalCertificate: (id: string, medical: Partial<MedicalCertificate>) => void;
  deleteMedicalCertificate: (id: string) => void;

  addAirworthinessRecord: (record: Omit<AirworthinessRecord, 'id' | 'status'>) => void;
  updateAirworthinessRecord: (id: string, record: Partial<AirworthinessRecord>) => void;
  deleteAirworthinessRecord: (id: string) => void;

  addPilot: (pilot: Omit<Pilot, 'id'>) => Pilot;
  deletePilot: (id: string) => void;
  addAircraft: (ac: Omit<Aircraft, 'id'>) => Aircraft;
  deleteAircraft: (id: string) => void;
  toggleAircraftAirworthy: (id: string) => void;

  // Reset & Backup
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonString: string) => boolean;

  // Viewer Modal
  selectedDocForViewer: DocumentItem | null;
  openDocumentViewer: (doc: DocumentItem) => void;
  closeDocumentViewer: () => void;
}

const STORAGE_KEY = 'aerodoc_aviation_db_v2';

const AviationContext = createContext<AviationContextType | undefined>(undefined);

export const AviationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pilots, setPilots] = useState<Pilot[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pilots`);
    return saved ? JSON.parse(saved) : initialPilots;
  });

  const [licenses, setLicenses] = useState<FlightLicense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_licenses`);
    return saved ? JSON.parse(saved) : initialLicenses;
  });

  const [medicalCertificates, setMedicalCertificates] = useState<MedicalCertificate[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_medicals`);
    return saved ? JSON.parse(saved) : initialMedicalCertificates;
  });

  const [aircraft, setAircraft] = useState<Aircraft[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_aircraft`);
    return saved ? JSON.parse(saved) : initialAircraft;
  });

  const [airworthinessRecords, setAirworthinessRecords] = useState<AirworthinessRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_airworthiness`);
    return saved ? JSON.parse(saved) : initialAirworthinessRecords;
  });

  const [selectedDocForViewer, setSelectedDocForViewer] = useState<DocumentItem | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pilots`, JSON.stringify(pilots));
  }, [pilots]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_licenses`, JSON.stringify(licenses));
  }, [licenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_medicals`, JSON.stringify(medicalCertificates));
  }, [medicalCertificates]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_aircraft`, JSON.stringify(aircraft));
  }, [aircraft]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_airworthiness`, JSON.stringify(airworthinessRecords));
  }, [airworthinessRecords]);

  // Recalculate status dynamically based on current date
  const processedLicenses = useMemo(() => {
    return licenses.map((lic) => ({
      ...lic,
      status: getDocumentStatus(lic.expiryDate),
    }));
  }, [licenses]);

  const processedMedicals = useMemo(() => {
    return medicalCertificates.map((med) => ({
      ...med,
      status: getDocumentStatus(med.expiryDate),
    }));
  }, [medicalCertificates]);

  const processedAirworthiness = useMemo(() => {
    return airworthinessRecords.map((air) => ({
      ...air,
      status: getDocumentStatus(air.expiryDate),
    }));
  }, [airworthinessRecords]);

  // Unified document library
  const allDocuments = useMemo<DocumentItem[]>(() => {
    const docs: DocumentItem[] = [];

    // Licenses
    processedLicenses.forEach((lic) => {
      const days = calculateDaysRemaining(lic.expiryDate);
      docs.push({
        id: `doc-${lic.id}`,
        title: `Licencia de Vuelo ${lic.category} - ${lic.pilotName}`,
        category: 'licencia',
        entityType: 'pilot',
        entityName: lic.pilotName,
        documentNumber: lic.licenseNumber,
        issueDate: lic.issueDate,
        expiryDate: lic.expiryDate,
        status: lic.status,
        daysRemaining: days,
        fileUrl: lic.documentUrl || generateSimulatedCertificateSVG(
          `Licencia de Vuelo ${lic.category}`,
          lic.issuingAuthority,
          lic.licenseNumber,
          lic.pilotName,
          lic.expiryDate
        ),
        fileName: lic.fileName || `${lic.licenseNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
        fileSize: lic.fileSize || '1.8 MB',
        tags: [lic.category, 'Licencia Oficial', ...lic.ratings.slice(0, 2)],
        originalRefId: lic.id,
      });
    });

    // Medicals
    processedMedicals.forEach((med) => {
      const days = calculateDaysRemaining(med.expiryDate);
      docs.push({
        id: `doc-${med.id}`,
        title: `Aptitud Psicofísica ${med.medicalClass} - ${med.pilotName}`,
        category: 'medico',
        entityType: 'pilot',
        entityName: med.pilotName,
        documentNumber: med.certificateNumber,
        issueDate: med.issueDate,
        expiryDate: med.expiryDate,
        status: med.status,
        daysRemaining: days,
        fileUrl: med.documentUrl || generateSimulatedCertificateSVG(
          `Certificado Médico ${med.medicalClass}`,
          med.authorizedExaminer,
          med.certificateNumber,
          med.pilotName,
          med.expiryDate
        ),
        fileName: med.fileName || `${med.certificateNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
        fileSize: med.fileSize || '1.4 MB',
        tags: [med.medicalClass, 'Examen Médico', med.authorizedExaminer],
        originalRefId: med.id,
      });
    });

    // Airworthiness Records
    processedAirworthiness.forEach((air) => {
      const days = calculateDaysRemaining(air.expiryDate);
      docs.push({
        id: `doc-${air.id}`,
        title: `${air.title} - ${air.aircraftRegistration}`,
        category: 'aeronavegabilidad',
        entityType: 'aircraft',
        entityName: `${air.aircraftRegistration} (${air.aircraftModel})`,
        documentNumber: air.documentNumber,
        issueDate: air.issueDate,
        expiryDate: air.expiryDate,
        status: air.status,
        daysRemaining: days,
        fileUrl: air.documentUrl || generateSimulatedCertificateSVG(
          air.title,
          air.issuingAuthority,
          air.documentNumber,
          `${air.aircraftRegistration} · ${air.aircraftModel}`,
          air.expiryDate
        ),
        fileName: air.fileName || `${air.documentNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
        fileSize: air.fileSize || '2.2 MB',
        tags: ['Aeronavegabilidad', air.aircraftRegistration, air.type],
        originalRefId: air.id,
      });
    });

    return docs.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [processedLicenses, processedMedicals, processedAirworthiness]);

  // Aggregate stats
  const expiringSoonCount = useMemo(() => {
    return allDocuments.filter((d) => d.status === 'expiring_soon').length;
  }, [allDocuments]);

  const expiredCount = useMemo(() => {
    return allDocuments.filter((d) => d.status === 'expired').length;
  }, [allDocuments]);

  const totalValidCount = useMemo(() => {
    return allDocuments.filter((d) => d.status === 'valid').length;
  }, [allDocuments]);

  // Actions
  const addLicense = (licenseData: Omit<FlightLicense, 'id' | 'status'>) => {
    const newLicense: FlightLicense = {
      ...licenseData,
      id: `lic-${Date.now()}`,
      status: getDocumentStatus(licenseData.expiryDate),
    };
    setLicenses((prev) => [newLicense, ...prev]);
  };

  const updateLicense = (id: string, updatedData: Partial<FlightLicense>) => {
    setLicenses((prev) =>
      prev.map((lic) => {
        if (lic.id === id) {
          const updated = { ...lic, ...updatedData };
          return {
            ...updated,
            status: getDocumentStatus(updated.expiryDate),
          };
        }
        return lic;
      })
    );
  };

  const deleteLicense = (id: string) => {
    setLicenses((prev) => prev.filter((lic) => lic.id !== id));
  };

  const addMedicalCertificate = (medicalData: Omit<MedicalCertificate, 'id' | 'status'>) => {
    const newMed: MedicalCertificate = {
      ...medicalData,
      id: `med-${Date.now()}`,
      status: getDocumentStatus(medicalData.expiryDate),
    };
    setMedicalCertificates((prev) => [newMed, ...prev]);
  };

  const updateMedicalCertificate = (id: string, updatedData: Partial<MedicalCertificate>) => {
    setMedicalCertificates((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          const updated = { ...med, ...updatedData };
          return {
            ...updated,
            status: getDocumentStatus(updated.expiryDate),
          };
        }
        return med;
      })
    );
  };

  const deleteMedicalCertificate = (id: string) => {
    setMedicalCertificates((prev) => prev.filter((med) => med.id !== id));
  };

  const addAirworthinessRecord = (recordData: Omit<AirworthinessRecord, 'id' | 'status'>) => {
    const newRecord: AirworthinessRecord = {
      ...recordData,
      id: `air-${Date.now()}`,
      status: getDocumentStatus(recordData.expiryDate),
    };
    setAirworthinessRecords((prev) => [newRecord, ...prev]);
  };

  const updateAirworthinessRecord = (id: string, updatedData: Partial<AirworthinessRecord>) => {
    setAirworthinessRecords((prev) =>
      prev.map((air) => {
        if (air.id === id) {
          const updated = { ...air, ...updatedData };
          return {
            ...updated,
            status: getDocumentStatus(updated.expiryDate),
          };
        }
        return air;
      })
    );
  };

  const deleteAirworthinessRecord = (id: string) => {
    setAirworthinessRecords((prev) => prev.filter((air) => air.id !== id));
  };

  const addPilot = (pilotData: Omit<Pilot, 'id'>): Pilot => {
    const newPilot: Pilot = {
      ...pilotData,
      id: `pilot-${Date.now()}`,
    };
    setPilots((prev) => [...prev, newPilot]);
    return newPilot;
  };

  const deletePilot = (id: string) => {
    setPilots((prev) => prev.filter((p) => p.id !== id));
    setLicenses((prev) => prev.filter((l) => l.pilotId !== id));
    setMedicalCertificates((prev) => prev.filter((m) => m.pilotId !== id));
  };

  const addAircraft = (acData: Omit<Aircraft, 'id'>): Aircraft => {
    const newAc: Aircraft = {
      ...acData,
      id: `ac-${Date.now()}`,
    };
    setAircraft((prev) => [...prev, newAc]);
    return newAc;
  };

  const deleteAircraft = (id: string) => {
    setAircraft((prev) => prev.filter((a) => a.id !== id));
    setAirworthinessRecords((prev) => prev.filter((r) => r.aircraftId !== id));
  };

  const toggleAircraftAirworthy = (id: string) => {
    setAircraft((prev) =>
      prev.map((ac) => (ac.id === id ? { ...ac, isAirworthy: !ac.isAirworthy } : ac))
    );
  };

  const resetToDefaultData = () => {
    setPilots(initialPilots);
    setLicenses(initialLicenses);
    setMedicalCertificates(initialMedicalCertificates);
    setAircraft(initialAircraft);
    setAirworthinessRecords(initialAirworthinessRecords);
    localStorage.removeItem(`${STORAGE_KEY}_pilots`);
    localStorage.removeItem(`${STORAGE_KEY}_licenses`);
    localStorage.removeItem(`${STORAGE_KEY}_medicals`);
    localStorage.removeItem(`${STORAGE_KEY}_aircraft`);
    localStorage.removeItem(`${STORAGE_KEY}_airworthiness`);
  };

  const exportDatabaseJSON = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      appName: 'AeroDoc Aviation Manager',
      version: '2.0',
      pilots,
      licenses,
      medicalCertificates,
      aircraft,
      airworthinessRecords,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aerodoc_respaldo_aviacion_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.pilots && parsed.licenses && parsed.medicalCertificates && parsed.aircraft) {
        setPilots(parsed.pilots);
        setLicenses(parsed.licenses);
        setMedicalCertificates(parsed.medicalCertificates);
        setAircraft(parsed.aircraft);
        if (parsed.airworthinessRecords) {
          setAirworthinessRecords(parsed.airworthinessRecords);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  };

  const openDocumentViewer = (doc: DocumentItem) => {
    setSelectedDocForViewer(doc);
  };

  const closeDocumentViewer = () => {
    setSelectedDocForViewer(null);
  };

  return (
    <AviationContext.Provider
      value={{
        pilots,
        licenses: processedLicenses,
        medicalCertificates: processedMedicals,
        aircraft,
        airworthinessRecords: processedAirworthiness,
        allDocuments,
        expiringSoonCount,
        expiredCount,
        totalValidCount,
        addLicense,
        updateLicense,
        deleteLicense,
        addMedicalCertificate,
        updateMedicalCertificate,
        deleteMedicalCertificate,
        addAirworthinessRecord,
        updateAirworthinessRecord,
        deleteAirworthinessRecord,
        addPilot,
        deletePilot,
        addAircraft,
        deleteAircraft,
        toggleAircraftAirworthy,
        resetToDefaultData,
        exportDatabaseJSON,
        importDatabaseJSON,
        selectedDocForViewer,
        openDocumentViewer,
        closeDocumentViewer,
      }}
    >
      {children}
    </AviationContext.Provider>
  );
};

export const useAviation = () => {
  const context = useContext(AviationContext);
  if (!context) {
    throw new Error('useAviation must be used within an AviationProvider');
  }
  return context;
};
