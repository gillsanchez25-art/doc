import React, { useState, useRef } from 'react';
import { FolderGit2, Search, Filter, Eye, Download, UploadCloud, FileText, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Tag, Plus } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { DocumentItem } from '../types/aviation';
import { formatDateSpanish, getStatusBadgeData } from '../utils/aviationUtils';

interface DocumentVaultProps {
  onOpenNewRecord: () => void;
  onOpenScanner: () => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ onOpenNewRecord, onOpenScanner }) => {
  const { allDocuments, openDocumentViewer, pilots, aircraft } = useAviation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'licencia' | 'medico' | 'aeronavegabilidad'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = allDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onOpenScanner();
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-sky-400" />
            <span>Biblioteca y Bóveda Documental Aeronáutica</span>
          </h2>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Repositorio centralizado de expedientes técnicos digitales</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{allDocuments.length} documentos resguardados</span>
          </div>
        </div>

        <button
          onClick={onOpenNewRecord}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Subir o Registrar Documento</span>
        </button>
      </div>

      {/* Drag & Drop Quick Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onOpenScanner}
        className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer text-center transition-all ${
          dragActive
            ? 'border-sky-400 bg-sky-950/30'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
        }`}
      >
        <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2">
          <span>Arrastra licencias o certificados para Escaneo y Recorte Automático con IA</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
          Optimiza la nitidez de sellos, recorta fondos de mesa y detecta habilitaciones OACI / AFAC / FAA en ambos lados.
        </p>
        <div className="mt-3 inline-flex items-center gap-2">
          <span className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            Iniciar Escáner con IA
          </span>
        </div>
      </div>

      {/* Category Folders Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
            categoryFilter === 'all'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Todos los Documentos ({allDocuments.length})
        </button>
        <button
          onClick={() => setCategoryFilter('licencia')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
            categoryFilter === 'licencia'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Licencias de Vuelo ({allDocuments.filter((d) => d.category === 'licencia').length})
        </button>
        <button
          onClick={() => setCategoryFilter('medico')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
            categoryFilter === 'medico'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Aptitudes Médicas ({allDocuments.filter((d) => d.category === 'medico').length})
        </button>
        <button
          onClick={() => setCategoryFilter('aeronavegabilidad')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
            categoryFilter === 'aeronavegabilidad'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Aeronavegabilidad & Flota ({allDocuments.filter((d) => d.category === 'aeronavegabilidad').length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, piloto, matrícula, folio o etiqueta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Cualquier Estado</option>
            <option value="valid">Vigentes al día</option>
            <option value="expiring_soon">Por Vencer en &lt; 30 días</option>
            <option value="expired">Vencidos (Atención inmediata)</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No hay documentos que coincidan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Ajusta los filtros o registra un nuevo archivo en la biblioteca de aviación.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const badge = getStatusBadgeData(doc.status, doc.daysRemaining);

            return (
              <div
                key={doc.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {doc.category}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        doc.status === 'valid'
                          ? 'text-emerald-400'
                          : doc.status === 'expiring_soon'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Title and Entity */}
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-white line-clamp-1" title={doc.title}>
                      {doc.title}
                    </h3>
                    <div className="text-xs text-sky-400 font-medium mt-0.5 truncate">
                      {doc.entityName}
                    </div>
                  </div>

                  {/* Metadata: Folio and Expiration */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Folio Oficial:</span>
                      <span className="font-mono text-slate-200 font-semibold">{doc.documentNumber}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Vencimiento:</span>
                      <span className="font-mono text-slate-300 tabular-nums">
                        {formatDateSpanish(doc.expiryDate)}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="pt-2 flex flex-wrap items-center gap-1">
                      {doc.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File info & action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]">
                    {doc.fileName} · {doc.fileSize}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openDocumentViewer(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>Ver</span>
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800 transition-colors"
                      title="Descargar copia del expediente"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
