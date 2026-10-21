import React from 'react';
import { X, Download, Printer, ShieldCheck, Calendar, FileText, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAviation } from '../context/AviationContext';
import { formatDateSpanish, getStatusBadgeData } from '../utils/aviationUtils';

export const DocumentViewerModal: React.FC = () => {
  const { selectedDocForViewer, closeDocumentViewer } = useAviation();

  if (!selectedDocForViewer) return null;

  const doc = selectedDocForViewer;
  const badge = getStatusBadgeData(doc.status, doc.daysRemaining);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-sky-400">
                Expediente Digital Oficial · {doc.category}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
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
            <h2 className="text-lg font-bold text-white mt-0.5 truncate max-w-xl">
              {doc.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Imprimir documento"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Descargar archivo"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={closeDocumentViewer}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Titular / Aeronave:</span>
              <span className="text-xs font-semibold text-white mt-0.5 block truncate">
                {doc.entityName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Número de Folio:</span>
              <span className="text-xs font-mono font-semibold text-sky-400 mt-0.5 block">
                {doc.documentNumber}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Fecha de Expedición:</span>
              <span className="text-xs font-mono text-slate-200 mt-0.5 block">
                {formatDateSpanish(doc.issueDate)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Vencimiento / Revalidación:</span>
              <span className="text-xs font-mono font-bold text-slate-100 mt-0.5 block">
                {formatDateSpanish(doc.expiryDate)}
              </span>
            </div>
          </div>

          {/* Visual Document Frame */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-center justify-center min-h-[360px]">
            {doc.fileUrl ? (
              <img
                src={doc.fileUrl}
                alt={doc.title}
                className="max-h-[500px] w-auto object-contain rounded-lg shadow-lg border border-slate-800"
              />
            ) : (
              <div className="text-center p-8">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Archivo no cargado</p>
              </div>
            )}
          </div>

          {/* Security & Authenticity Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Verificación de Integridad de Documento Aeronáutico OACI</span>
            </div>
            <div className="font-mono text-slate-500">
              Ref: {doc.originalRefId} · Archivo: {doc.fileName}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={closeDocumentViewer}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Copia Oficial</span>
          </button>
        </div>

      </div>
    </div>
  );
};
