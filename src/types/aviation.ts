export type DocumentStatus = 'valid' | 'expiring_soon' | 'expired';

export type LicenseCategory = 'PPL' | 'CPL' | 'ATPL' | 'FI' | 'ULM' | 'GLIDER';

export type MedicalClass = 'Clase 1' | 'Clase 2' | 'Clase 3' | 'LAPL';

export type AirworthinessCertType =
  | 'standard_airworthiness'
  | 'noise_cert'
  | 'radio_station_license'
  | 'registration_cert'
  | 'annual_inspection'
  | 'hundred_hour_check'
  | 'insurance_policy'
  | 'elt_inspection'
  | 'pitot_static_transponder'
  | 'weight_and_balance';

export interface Pilot {
  id: string;
  fullName: string;
  nationalId: string;
  email: string;
  phone: string;
  role: 'Capitán' | 'Primer Oficial' | 'Piloto Privado' | 'Instructor' | 'Estudiante';
  baseAirport: string;
  totalFlightHours: number;
}

export interface FlightLicense {
  id: string;
  pilotId: string;
  pilotName: string;
  category: LicenseCategory;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  ratings: string[];
  typeRatings: string[];
  notes?: string;
  documentUrl?: string;
  fileName?: string;
  fileSize?: string;
  status: DocumentStatus;
}

export interface MedicalCertificate {
  id: string;
  pilotId: string;
  pilotName: string;
  medicalClass: MedicalClass;
  certificateNumber: string;
  authorizedExaminer: string;
  clinicName: string;
  issueDate: string;
  expiryDate: string;
  limitations: string[];
  notes?: string;
  documentUrl?: string;
  fileName?: string;
  fileSize?: string;
  status: DocumentStatus;
}

export interface Aircraft {
  id: string;
  registration: string; // Matrícula (e.g. XB-CAP)
  make: string;
  model: string;
  serialNumber: string;
  year: number;
  operator: string;
  baseAirport: string;
  totalAirframeHours: number;
  engineHours: number;
  isAirworthy: boolean;
  notes?: string;
}

export interface AirworthinessRecord {
  id: string;
  aircraftId: string;
  aircraftRegistration: string;
  aircraftModel: string;
  type: AirworthinessCertType;
  title: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  lastInspectionHours?: number;
  nextInspectionDueHours?: number;
  inspectorName?: string;
  maintenanceOrg?: string;
  noiseChapter?: string; // e.g. "OACI Anexo 16 Capítulo 4 / FAR Part 36"
  noiseLevelEPNdB?: string; // e.g. "82.4 EPNdB sobrevuelo"
  callSignOrFrequencies?: string; // e.g. "Indicativo XB-CAP / VHF 118-136 MHz / XPDR Modo S"
  notes?: string;
  documentUrl?: string;
  fileName?: string;
  fileSize?: string;
  status: DocumentStatus;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'licencia' | 'medico' | 'aeronavegabilidad' | 'manual';
  entityType: 'pilot' | 'aircraft' | 'fleet';
  entityName: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  status: DocumentStatus;
  daysRemaining: number;
  fileUrl?: string;
  fileName: string;
  fileSize: string;
  tags: string[];
  originalRefId: string;
}
