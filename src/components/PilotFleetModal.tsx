import React, { useState } from 'react';
import { X, Plane, Users, Check } from 'lucide-react';
import { useAviation } from '../context/AviationContext';

interface PilotFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'pilot' | 'aircraft';
}

export const PilotFleetModal: React.FC<PilotFleetModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'pilot',
}) => {
  const { addPilot, addAircraft } = useAviation();
  const [tab, setTab] = useState<'pilot' | 'aircraft'>(defaultTab);

  // Pilot fields
  const [pilotName, setPilotName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Capitán' | 'Primer Oficial' | 'Piloto Privado' | 'Instructor' | 'Estudiante'>('Capitán');
  const [baseAirport, setBaseAirport] = useState('MMMX (CDMX)');
  const [flightHours, setFlightHours] = useState('1200');

  // Aircraft fields
  const [registration, setRegistration] = useState('');
  const [make, setMake] = useState('Cessna');
  const [model, setModel] = useState('172S Skyhawk');
  const [serialNumber, setSerialNumber] = useState('');
  const [year, setYear] = useState('2020');
  const [operator, setOperator] = useState('Operador Aéreo Privado');
  const [acBase, setAcBase] = useState('MMTO (Toluca)');
  const [airframeHours, setAirframeHours] = useState('1450.0');
  const [engineHours, setEngineHours] = useState('450.0');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === 'pilot') {
      addPilot({
        fullName: pilotName,
        nationalId: nationalId || `PIL-${Math.floor(10000 + Math.random() * 90000)}`,
        email: email || 'piloto@aero.com',
        phone: phone || '+52 55 0000 0000',
        role,
        baseAirport,
        totalFlightHours: parseFloat(flightHours) || 0,
      });
    } else {
      addAircraft({
        registration: registration.toUpperCase(),
        make,
        model,
        serialNumber: serialNumber || `SN-${Math.floor(1000 + Math.random() * 9000)}`,
        year: parseInt(year, 10) || 2020,
        operator,
        baseAirport: acBase,
        totalAirframeHours: parseFloat(airframeHours) || 0,
        engineHours: parseFloat(engineHours) || 0,
        isAirworthy: true,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white">
              {tab === 'pilot' ? 'Registrar Nuevo Piloto / Tripulante' : 'Registrar Nueva Aeronave en Flota'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Expedientes técnicos y padrón de aviación
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTab('pilot')}
              className={`py-2 px-3 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                tab === 'pilot'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Piloto / Tripulante</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('aircraft')}
              className={`py-2 px-3 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                tab === 'aircraft'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Aeronave / Avión</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          {tab === 'pilot' ? (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Completo del Piloto *</label>
                <input
                  type="text"
                  value={pilotName}
                  onChange={(e) => setPilotName(e.target.value)}
                  placeholder="Ej. Cap. Daniel Salazar Reyes"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rol / Cargo</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Capitán">Capitán</option>
                    <option value="Primer Oficial">Primer Oficial</option>
                    <option value="Piloto Privado">Piloto Privado</option>
                    <option value="Instructor">Instructor de Vuelo</option>
                    <option value="Estudiante">Piloto Alumno / Estudiante</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cédula / Identificación</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="Ej. MEX-AV-99120"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base de Operaciones (OACI)</label>
                  <input
                    type="text"
                    value={baseAirport}
                    onChange={(e) => setBaseAirport(e.target.value)}
                    placeholder="MMMX, MMTO, MMGL, KLAX"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Horas Totales de Vuelo</label>
                  <input
                    type="number"
                    value={flightHours}
                    onChange={(e) => setFlightHours(e.target.value)}
                    placeholder="Ej. 2400"
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="piloto@aerofleet.com"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono Móvil</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Matrícula de Aeronave *</label>
                  <input
                    type="text"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    placeholder="Ej. XB-FLY, N12345"
                    className="w-full py-2 px-3 font-mono font-bold uppercase bg-slate-950 border border-slate-800 rounded-lg text-sky-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fabricante</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Cessna, Beechcraft, Piper, Cirrus"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Modelo de Aeronave *</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ej. 172S Skyhawk, King Air B200"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Número de Serie (S/N)</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Ej. 172-84192"
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Año</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Horas Totales (TT)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={airframeHours}
                    onChange={(e) => setAirframeHours(e.target.value)}
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Horas Motor</label>
                  <input
                    type="number"
                    step="0.1"
                    value={engineHours}
                    onChange={(e) => setEngineHours(e.target.value)}
                    className="w-full py-2 px-3 font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Operador / Propietario</label>
                  <input
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    placeholder="Servicios Aéreos S.A."
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Aeropuerto Base</label>
                  <input
                    type="text"
                    value={acBase}
                    onChange={(e) => setAcBase(e.target.value)}
                    placeholder="MMTO (Toluca)"
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

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
              <span>Registrar {tab === 'pilot' ? 'Piloto' : 'Aeronave'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
