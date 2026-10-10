import React, { useRef, useState } from 'react';
import { Table, Workflow, Download, Upload, RotateCcw, FileCode, Database } from 'lucide-react';
import { Column } from '../types';
import { parseCSV } from '../utils/csvHelper';
import { SAMPLE_DATASETS } from '../datasets';

interface HeaderProps {
  activeView: 'table' | 'nodes';
  setActiveView: (view: 'table' | 'nodes') => void;
  selectedDatasetId: string;
  onSelectDataset: (id: string) => void;
  onUploadCSV: (fileName: string, columns: Column[], data: any[]) => void;
  onExportCode: () => void;
  onExportCSV: () => void;
  onReset: () => void;
  stepsCount: number;
}

export default function Header({
  activeView,
  setActiveView,
  selectedDatasetId,
  onSelectDataset,
  onUploadCSV,
  onExportCode,
  onExportCSV,
  onReset,
  stepsCount,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const { columns, data } = parseCSV(text);
          if (columns.length > 0) {
            onUploadCSV(file.name, columns, data);
          } else {
            setUploadError('Arquivo CSV vazio ou inválido.');
          }
        } catch (error) {
          console.error(error);
          setUploadError('Erro ao processar o arquivo CSV.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Brand Wordmark + Breadcrumb */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
          <Workflow className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold tracking-tight text-white">Pandas Query</span>
          <span className="text-slate-600" aria-hidden="true">/</span>
          <span className="text-slate-400 font-medium text-xs">Node Editor ETL</span>
        </div>
      </div>

      {/* Zone 2: Workspace Mode & Dataset Controls */}
      <div className="flex items-center gap-3 overflow-x-auto">
        {/* View Switcher (Node Editor Flow first) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 shrink-0">
          <button
            onClick={() => setActiveView('nodes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'nodes'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Node Editor Flow</span>
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeView === 'table'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Grade Completa</span>
          </button>
        </div>

        {/* Source Dataset Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs shrink-0">
          <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-slate-400 font-medium whitespace-nowrap">Fonte:</span>
          <select
            value={selectedDatasetId}
            onChange={(e) => onSelectDataset(e.target.value)}
            className="bg-transparent text-slate-100 border-none focus:outline-none cursor-pointer font-medium pr-1 text-xs"
          >
            {SAMPLE_DATASETS.map((ds) => (
              <option key={ds.id} value={ds.id} className="bg-slate-900 text-white text-xs">
                {ds.name}
              </option>
            ))}
            {selectedDatasetId.startsWith('custom_') && (
              <option value={selectedDatasetId} className="bg-slate-900 text-white text-xs">
                Importado: {selectedDatasetId.replace('custom_', '')}
              </option>
            )}
          </select>
        </div>

        {/* Upload CSV */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
          title="Importar arquivo CSV local"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Importar CSV</span>
        </button>

        <button
          onClick={onReset}
          disabled={stepsCount <= 1}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
          title="Reiniciar fluxo para o estado padrão"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar</span>
        </button>

        {uploadError && (
          <span className="text-xs text-rose-400 whitespace-nowrap shrink-0">
            {uploadError}
          </span>
        )}
      </div>

      {/* Zone 3: Primary Export Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onExportCode}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3.5 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Exportar script Python/Pandas (.py)"
        >
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Exportar .py</span>
        </button>

        <button
          onClick={onExportCSV}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Baixar dataset processado (.csv)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar CSV</span>
        </button>
      </div>
    </header>
  );
}
