import React, { useState } from 'react';
import { X, Plane, Users, Check, Trash2, AlertTriangle, Search, PlusCircle, ShieldAlert } from 'lucide-react';
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
  const { pilots, aircraft, addPilot, addAircraft, deletePilot, deleteAircraft } = useAviation();
  const [tab, setTab] = useState<'pilot' | 'aircraft'>(defaultTab);
  const [mode, setMode] = useState<'create' | 'manage'>('create');
  const [filterQuery, setFilterQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ type: 'pilot' | 'aircraft'; id: string; name: string } | null>(null);

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
      setPilotName('');
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
      setRegistration('');
    }

    onClose();
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'pilot') {
      deletePilot(itemToDelete.id);
    } else {
      deleteAircraft(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const filteredPilotsList = pilots.filter((p) =>
    p.fullName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.baseAirport.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredAircraftList = aircraft.filter((a) =>
    a.registration.toLowerCase().includes(filterQuery.toLowerCase()) ||
    a.model.toLowerCase().includes(filterQuery.toLowerCase()) ||
    a.make.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white">
              {tab === 'pilot' ? 'Padrón de Pilotos y Tripulantes' : 'Padrón de Flota y Aeronaves'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestión, registro y eliminación técnica de registros
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switch (Piloto vs Aeronave) */}
        <div className="px-6 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setTab('pilot');
                setFilterQuery('');
              }}
              className={`py-2 px-3 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                tab === 'pilot'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pilotos ({pilots.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('aircraft');
                setFilterQuery('');
              }}
              className={`py-2 px-3 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                tab === 'aircraft'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Aeronaves ({aircraft.length})</span>
            </button>
          </div>

          {/* Mode Switch (Registrar vs Administrar / Eliminar) */}
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  mode === 'create'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Registrar Nuevo</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('manage')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  mode === 'manage'
                    ? 'bg-slate-800 text-rose-300 border border-rose-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Administrar / Eliminar</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-mono">
              {tab === 'pilot' ? `${pilots.length} pilotos` : `${aircraft.length} aviones`}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {mode === 'create' ? (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
          ) : (
            /* Management / Deletion List */
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={tab === 'pilot' ? 'Filtrar pilotos por nombre, rol, base...' : 'Filtrar por matrícula, modelo, marca...'}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div className="divide-y divide-slate-800 max-h-[350px] overflow-y-auto pr-1">
                {tab === 'pilot' ? (
                  filteredPilotsList.length > 0 ? (
                    filteredPilotsList.map((p) => (
                      <div
                        key={p.id}
                        className="py-2.5 px-3 rounded-lg hover:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{p.fullName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="text-sky-400 font-mono">{p.role}</span>
                            <span aria-hidden="true">·</span>
                            <span>{p.baseAirport}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{p.totalFlightHours} hrs</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setItemToDelete({ type: 'pilot', id: p.id, name: p.fullName })}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                          title="Eliminar piloto y sus licencias asociadas"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No se encontraron pilotos en el padrón
                    </div>
                  )
                ) : (
                  filteredAircraftList.length > 0 ? (
                    filteredAircraftList.map((a) => (
                      <div
                        key={a.id}
                        className="py-2.5 px-3 rounded-lg hover:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-sky-400">{a.registration}</div>
                          <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                            {a.make} {a.model} ({a.year})
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>Base: {a.baseAirport}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{a.totalAirframeHours} TT hrs</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setItemToDelete({ type: 'aircraft', id: a.id, name: `${a.registration} (${a.model})` })}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                          title="Eliminar aeronave y sus certificados asociados"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No se encontraron aeronaves en la flota
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal for Deletion within PilotFleetModal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  ¿Eliminar {itemToDelete.type === 'pilot' ? 'Piloto' : 'Aeronave'}?
                </h3>
                <p className="text-[11px] text-rose-400/80">Acción permanente e irreversible</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div>
                <span className="text-slate-500">{itemToDelete.type === 'pilot' ? 'Piloto:' : 'Aeronave:'}</span>{' '}
                <span className="font-bold text-white">{itemToDelete.name}</span>
              </div>
              <div className="text-[11px] text-amber-300/90 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {itemToDelete.type === 'pilot'
                    ? 'Se eliminarán también en cascada todas sus licencias de vuelo y exámenes médicos.'
                    : 'Se eliminarán también en cascada sus certificados de aeronavegabilidad, ruido y estación.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
