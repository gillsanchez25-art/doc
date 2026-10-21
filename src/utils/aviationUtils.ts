import { DocumentStatus, LicenseCategory, MedicalClass, AirworthinessCertType } from '../types/aviation';

export function calculateDaysRemaining(expiryDateStr: string): number {
  if (!expiryDateStr) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDocumentStatus(expiryDateStr: string): DocumentStatus {
  const days = calculateDaysRemaining(expiryDateStr);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'valid';
}

export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return 'N/D';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${day} ${months[monthIndex] || parts[1]} ${year}`;
  }
  return dateStr;
}

export function getStatusBadgeData(status: DocumentStatus, daysRemaining: number) {
  switch (status) {
    case 'expired':
      return {
        label: `Vencido (${Math.abs(daysRemaining)} d)`,
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        dotColor: 'bg-rose-500'
      };
    case 'expiring_soon':
      return {
        label: `Vence en ${daysRemaining} días`,
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        dotColor: 'bg-amber-500'
      };
    case 'valid':
    default:
      return {
        label: `Vigente (${daysRemaining} d)`,
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        dotColor: 'bg-emerald-500'
      };
  }
}

export function getLicenseCategoryLabel(cat: LicenseCategory): string {
  const labels: Record<LicenseCategory, string> = {
    PPL: 'Piloto Privado (PPL)',
    CPL: 'Piloto Comercial (CPL)',
    ATPL: 'Piloto de Transporte de Línea Aérea (ATPL)',
    FI: 'Instructor de Vuelo (FI)',
    ULM: 'Ultraligero (ULM)',
    GLIDER: 'Piloto de Planeador'
  };
  return labels[cat] || cat;
}

export function getAirworthinessCertLabel(type: AirworthinessCertType): string {
  const labels: Record<AirworthinessCertType, string> = {
    standard_airworthiness: 'Certificado de Aeronavegabilidad Estándar',
    noise_cert: 'Certificado de Homologación Acústica y Ruido (OACI Anexo 16)',
    radio_station_license: 'Licencia de Estación de Radio Aeronáutica',
    registration_cert: 'Certificado de Matrícula de Aeronave',
    annual_inspection: 'Inspección Anual (12 Meses)',
    hundred_hour_check: 'Inspección Periódica 100 Horas',
    insurance_policy: 'Póliza de Seguro de Casco y RC Aéreo',
    elt_inspection: 'Inspección y Prueba de Transmisor ELT',
    pitot_static_transponder: 'Verificación Pitot-Estática, Altímetro y Transponder',
    weight_and_balance: 'Informe de Pesaje y Centrado Oficial'
  };
  return labels[type] || type;
}

export function generateSimulatedCertificateSVG(title: string, subtitle: string, number: string, entity: string, expiry: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550" width="100%" height="100%" style="font-family: 'Plus Jakarta Sans', sans-serif;">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect width="800" height="550" fill="url(#bg)" rx="16" />
    <rect x="20" y="20" width="760" height="510" fill="none" stroke="#334155" stroke-width="2" rx="12" />
    <rect x="28" y="28" width="744" height="494" fill="none" stroke="#0284c7" stroke-width="1" stroke-dasharray="8 4" rx="8" />

    <!-- Header Seal & Wings -->
    <circle cx="400" cy="85" r="32" fill="#0369a1" fill-opacity="0.2" stroke="#38bdf8" stroke-width="2" />
    <path d="M 376 85 Q 400 68 424 85 Q 400 96 376 85 Z" fill="#38bdf8" />
    <circle cx="400" cy="85" r="4" fill="#ffffff" />
    <path d="M 320 85 Q 360 82 368 85" stroke="#38bdf8" stroke-width="2" fill="none" />
    <path d="M 480 85 Q 440 82 432 85" stroke="#38bdf8" stroke-width="2" fill="none" />

    <!-- Titles -->
    <text x="400" y="145" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="4" font-weight="600">AUTORIDAD DE AVIACIÓN CIVIL · EXPEDIENTE OFICIAL</text>
    <text x="400" y="180" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="700">${title.toUpperCase()}</text>
    <text x="400" y="206" text-anchor="middle" fill="#38bdf8" font-size="14" font-weight="500">${subtitle}</text>

    <!-- Details Box -->
    <rect x="60" y="235" width="680" height="180" fill="#0b1120" rx="8" stroke="#1e293b" />
    
    <text x="90" y="275" fill="#64748b" font-size="11" font-weight="600">TITULAR / AERONAVE</text>
    <text x="90" y="302" fill="#f8fafc" font-size="18" font-weight="700">${entity}</text>

    <text x="90" y="350" fill="#64748b" font-size="11" font-weight="600">NÚMERO DE DOCUMENTO</text>
    <text x="90" y="375" fill="#38bdf8" font-size="16" font-family="'JetBrains Mono', monospace" font-weight="600">${number}</text>

    <text x="480" y="275" fill="#64748b" font-size="11" font-weight="600">FECHA DE VENCIMIENTO / REVAL</text>
    <text x="480" y="302" fill="#f8fafc" font-size="17" font-weight="600">${expiry}</text>

    <text x="480" y="350" fill="#64748b" font-size="11" font-weight="600">ESTADO REGISTRAL</text>
    <text x="480" y="375" fill="#34d399" font-size="15" font-weight="600">DOCUMENTO REGISTRADO EN SISTEMA</text>

    <!-- Signatures & Verification footer -->
    <line x1="90" y1="475" x2="280" y2="475" stroke="#475569" stroke-width="1.5" />
    <text x="185" y="495" text-anchor="middle" fill="#94a3b8" font-size="11">Firma / Sello del Inspector Aéreo</text>

    <line x1="520" y1="475" x2="710" y2="475" stroke="#475569" stroke-width="1.5" />
    <text x="615" y="495" text-anchor="middle" fill="#94a3b8" font-size="11">Titular Responsable</text>

    <!-- Simulated QR Seal in center -->
    <rect x="375" y="445" width="50" height="50" fill="#1e293b" rx="4" stroke="#334155" />
    <rect x="382" y="452" width="14" height="14" fill="#38bdf8" />
    <rect x="404" y="452" width="14" height="14" fill="#38bdf8" />
    <rect x="382" y="474" width="14" height="14" fill="#38bdf8" />
    <circle cx="411" cy="481" r="4" fill="#38bdf8" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
