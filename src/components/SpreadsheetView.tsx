import React, { useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpZA,
  Filter,
  Type,
  Trash2,
  ChevronDown,
  Sparkles,
  CopyX,
  Plus,
  HelpCircle,
  MoreVertical,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Column, ColumnType, StepType } from '../types';

interface SpreadsheetViewProps {
  data: any[];
  columns: Column[];
  onAddStep: (type: StepType, label: string, params: any) => void;
}

export default function SpreadsheetView({ data, columns, onAddStep }: SpreadsheetViewProps) {
  const [activeMenuColumn, setActiveMenuColumn] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'rename' | 'filter' | 'fillna' | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);

  // Form States for Modals
  const [renameTo, setRenameTo] = useState('');
  const [filterOperator, setFilterOperator] = useState<'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_null' | 'is_not_null'>('equals');
  const [filterValue, setFilterValue] = useState('');
  const [fillnaMethod, setFillnaMethod] = useState<'value' | 'mean' | 'median' | 'ffill' | 'bfill'>('value');
  const [fillnaValue, setFillnaValue] = useState('');

  // Column Addition Modal State
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColExpType, setNewColExpType] = useState<'constant' | 'concatenate' | 'math' | 'custom_python'>('constant');
  const [newColColA, setNewColColA] = useState('');
  const [newColOperator, setNewColOperator] = useState<'+' | '-' | '*' | '/' | 'concat'>('+');
  const [newColColB, setNewColColB] = useState('');
  const [newColConstant, setNewColConstant] = useState('');
  const [newColCustomExp, setNewColCustomExp] = useState('');

  const getTypeBadge = (type: ColumnType) => {
    switch (type) {
      case 'string':
        return <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-mono font-bold">abc</span>;
      case 'number':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">123</span>;
      case 'boolean':
        return <span className="text-[10px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded font-mono font-bold">T/F</span>;
      case 'date':
        return <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">📅</span>;
      default:
        return <span className="text-[10px] bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">obj</span>;
    }
  };

  const handleHeaderActionClick = (column: Column, action: 'rename' | 'filter' | 'fillna') => {
    setSelectedColumn(column);
    setActiveMenuColumn(null);
    setActiveModal(action);

    if (action === 'rename') {
      setRenameTo(column.name);
    } else if (action === 'filter') {
      setFilterOperator('equals');
      setFilterValue('');
    } else if (action === 'fillna') {
      setFillnaMethod('value');
      setFillnaValue('0');
    }
  };

  const handleSort = (columnName: string, ascending: boolean) => {
    setActiveMenuColumn(null);
    onAddStep('sort_rows', `Ordenar ${columnName} (${ascending ? 'A-Z' : 'Z-A'})`, {
      column: columnName,
      ascending,
    });
  };

  const handleDropColumn = (columnName: string) => {
    setActiveMenuColumn(null);
    onAddStep('drop_column', `Remover coluna ${columnName}`, {
      columns: [columnName],
    });
  };

  const handleDropDuplicates = (columnName: string) => {
    setActiveMenuColumn(null);
    onAddStep('drop_duplicates', `Remover duplicados de ${columnName}`, {
      columns: [columnName],
    });
  };

  const handleChangeType = (columnName: string, toType: ColumnType) => {
    setActiveMenuColumn(null);
    let typeLabel = toType === 'number' ? 'Número' : toType === 'string' ? 'Texto' : toType === 'boolean' ? 'Booleano' : 'Data';
    onAddStep('change_type', `Alterar tipo de ${columnName} para ${typeLabel}`, {
      column: columnName,
      toType,
    });
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumn || !renameTo.trim() || renameTo.trim() === selectedColumn.name) {
      setActiveModal(null);
      return;
    }
    onAddStep('rename_column', `Renomear ${selectedColumn.name} para ${renameTo.trim()}`, {
      from: selectedColumn.name,
      to: renameTo.trim(),
    });
    setActiveModal(null);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumn) return;

    let opLabel = '';
    switch (filterOperator) {
      case 'equals': opLabel = `igual a "${filterValue}"`; break;
      case 'not_equals': opLabel = `diferente de "${filterValue}"`; break;
      case 'greater_than': opLabel = `maior que ${filterValue}`; break;
      case 'less_than': opLabel = `menor que ${filterValue}`; break;
      case 'contains': opLabel = `contém "${filterValue}"`; break;
      case 'not_contains': opLabel = `não contém "${filterValue}"`; break;
      case 'is_null': opLabel = 'é nulo/vazio'; break;
      case 'is_not_null': opLabel = 'não é nulo'; break;
    }

    onAddStep('filter_rows', `Filtrar ${selectedColumn.name} (${opLabel})`, {
      column: selectedColumn.name,
      operator: filterOperator,
      value: filterValue,
    });
    setActiveModal(null);
  };

  const handleFillnaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumn) return;

    let methodLabel = '';
    if (fillnaMethod === 'value') methodLabel = `por "${fillnaValue}"`;
    else if (fillnaMethod === 'mean') methodLabel = 'pela Média';
    else if (fillnaMethod === 'median') methodLabel = 'pela Mediana';
    else if (fillnaMethod === 'ffill') methodLabel = 'por Forward Fill';
    else if (fillnaMethod === 'bfill') methodLabel = 'por Backward Fill';

    onAddStep('fillna', `Preencher nulos em ${selectedColumn.name} ${methodLabel}`, {
      column: selectedColumn.name,
      method: fillnaMethod,
      customValue: fillnaValue,
    });
    setActiveModal(null);
  };

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    let desc = '';
    if (newColExpType === 'constant') desc = `Adicionar coluna "${newColName}" com constante "${newColConstant}"`;
    else if (newColExpType === 'concatenate') desc = `Adicionar coluna "${newColName}" concatenando ${newColColA} e ${newColColB}`;
    else if (newColExpType === 'math') desc = `Adicionar coluna "${newColName}" de cálculo: ${newColColA} ${newColOperator} ${newColColB}`;
    else if (newColExpType === 'custom_python') desc = `Adicionar coluna "${newColName}" com expressão Pandas: ${newColCustomExp}`;

    onAddStep('add_column', desc, {
      columnName: newColName.trim(),
      expressionType: newColExpType,
      colA: newColColA,
      operator: newColOperator,
      colB: newColColB,
      constantValue: newColConstant,
      customExpression: newColCustomExp,
    });

    setShowAddColModal(false);
    // Reset Form
    setNewColName('');
    setNewColExpType('constant');
    setNewColColA('');
    setNewColColB('');
    setNewColConstant('');
    setNewColCustomExp('');
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 flex flex-col min-w-0 overflow-hidden relative select-none">
      {/* Title & Toolbar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">
            Visualizador de Planilha (DataFrame Preview)
          </h3>
        </div>

        {/* Add calculated Column button */}
        <button
          onClick={() => {
            if (columns.length > 0) {
              setNewColColA(columns[0].name);
              setNewColColB(columns[0].name);
            }
            setShowAddColModal(true);
          }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nova Coluna Calculada</span>
        </button>
      </div>

      {/* Grid Container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-auto relative shadow-inner">
        {columns.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <HelpCircle className="w-12 h-12 text-slate-600 mb-2.5 animate-bounce" />
            <p className="text-sm font-semibold text-slate-400">Nenhum dado carregado</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Faça upload de um arquivo CSV ou selecione um dataset de exemplo no cabeçalho.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-auto">
            {/* Header */}
            <thead className="sticky top-0 bg-slate-900 z-20">
              <tr className="border-b border-slate-800">
                {columns.map((col) => (
                  <th
                    key={col.name}
                    className="p-3 text-xs font-bold text-slate-300 border-r border-slate-800 bg-slate-900/95 backdrop-blur min-w-36 hover:bg-slate-850 transition relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {getTypeBadge(col.type)}
                        <span className="truncate font-mono" title={col.name}>
                          {col.name}
                        </span>
                      </div>

                      {/* Dropdown Menu Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuColumn(activeMenuColumn === col.name ? null : col.name);
                        }}
                        className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition shrink-0 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Header Context Dropdown Menu */}
                    {activeMenuColumn === col.name && (
                      <>
                        {/* Overlay to close menu */}
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setActiveMenuColumn(null)}
                        />
                        <div className="absolute top-full right-1 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 w-48 text-left z-40 text-slate-300 font-normal animate-in fade-in slide-in-from-top-1 duration-100">
                          {/* Sorters */}
                          <button
                            onClick={() => handleSort(col.name, true)}
                            className="flex items-center gap-2 px-3.5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left"
                          >
                            <ArrowDownAZ className="w-3.5 h-3.5 text-blue-400" />
                            <span>Ordenar A a Z</span>
                          </button>
                          <button
                            onClick={() => handleSort(col.name, false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left"
                          >
                            <ArrowUpZA className="w-3.5 h-3.5 text-blue-400" />
                            <span>Ordenar Z a A</span>
                          </button>

                          <div className="border-t border-slate-800 my-1.5" />

                          {/* Filters */}
                          <button
                            onClick={() => handleHeaderActionClick(col, 'filter')}
                            className="flex items-center gap-2 px-3.5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left"
                          >
                            <Filter className="w-3.5 h-3.5 text-amber-400" />
                            <span>Filtrar Coluna...</span>
                          </button>

                          <button
                            onClick={() => handleHeaderActionClick(col, 'fillna')}
                            className="flex items-center gap-2 px-3.5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            <span>Preencher Nulos...</span>
                          </button>

                          <button
                            onClick={() => handleDropDuplicates(col.name)}
                            className="flex items-center gap-2 px-3.5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left"
                          >
                            <CopyX className="w-3.5 h-3.5 text-teal-400" />
                            <span>Remover Duplicados</span>
                          </button>

                          <div className="border-t border-slate-800 my-1.5" />

                          {/* Data Type Conversion Submenu */}
                          <div className="px-3.5 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Converter Tipo
                          </div>
                          <button
                            onClick={() => handleChangeType(col.name, 'string')}
                            className={`flex items-center justify-between px-5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left ${col.type === 'string' ? 'text-blue-400 font-semibold' : ''}`}
                          >
                            <span>Texto (String)</span>
                            <span className="text-[9px] opacity-60">abc</span>
                          </button>
                          <button
                            onClick={() => handleChangeType(col.name, 'number')}
                            className={`flex items-center justify-between px-5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left ${col.type === 'number' ? 'text-blue-400 font-semibold' : ''}`}
                          >
                            <span>Número (Float/Int)</span>
                            <span className="text-[9px] opacity-60">123</span>
                          </button>
                          <button
                            onClick={() => handleChangeType(col.name, 'date')}
                            className={`flex items-center justify-between px-5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left ${col.type === 'date' ? 'text-blue-400 font-semibold' : ''}`}
                          >
                            <span>Data (Datetime)</span>
                            <span className="text-[9px] opacity-60">📅</span>
                          </button>
                          <button
                            onClick={() => handleChangeType(col.name, 'boolean')}
                            className={`flex items-center justify-between px-5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left ${col.type === 'boolean' ? 'text-blue-400 font-semibold' : ''}`}
                          >
                            <span>Booleano (Bool)</span>
                            <span className="text-[9px] opacity-60">T/F</span>
                          </button>

                          <div className="border-t border-slate-800 my-1.5" />

                          {/* Actions */}
                          <button
                            onClick={() => handleHeaderActionClick(col, 'rename')}
                            className="flex items-center gap-2 px-3.5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-white transition cursor-pointer text-left"
                          >
                            <Type className="w-3.5 h-3.5 text-purple-400" />
                            <span>Renomear Coluna...</span>
                          </button>
                          <button
                            onClick={() => handleDropColumn(col.name)}
                            className="flex items-center gap-2 px-3.5 py-1.5 w-full text-xs hover:bg-slate-800 hover:text-rose-400 text-rose-300 transition cursor-pointer text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Remover Coluna</span>
                          </button>
                        </div>
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-slate-500 font-mono text-xs"
                  >
                    [DataFrame vazio ou sem linhas correspondentes aos filtros aplicados]
                  </td>
                </tr>
              ) : (
                data.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-slate-850 hover:bg-slate-800/40 transition"
                  >
                    {columns.map((col) => {
                      const val = row[col.name];
                      const isNull = val === null || val === undefined || val === '';

                      return (
                        <td
                          key={col.name}
                          className={`p-3 text-xs font-mono border-r border-slate-850 text-slate-300 max-w-sm truncate ${
                            isNull
                              ? 'bg-amber-500/5 text-amber-500/70 italic font-bold'
                              : col.type === 'number'
                                ? 'text-emerald-400 text-right'
                                : col.type === 'boolean'
                                  ? 'text-pink-400'
                                  : 'text-slate-300'
                          }`}
                        >
                          {isNull ? (
                            <span className="flex items-center gap-1">
                              <span className="text-[10px] uppercase font-bold tracking-widest">null</span>
                            </span>
                          ) : col.type === 'boolean' ? (
                            val ? 'True' : 'False'
                          ) : typeof val === 'number' ? (
                            val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Stats Bar */}
      {columns.length > 0 && (
        <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-3 shrink-0 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span>
              Colunas: <strong className="text-slate-200">{columns.length}</strong>
            </span>
            <span>
              Linhas: <strong className="text-slate-200">{data.length}</strong>
            </span>
            <span>
              Tamanho: <strong className="text-slate-200">{data.length * columns.length} células</strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Dica: Clique no <strong className="text-slate-400">▾</strong> das colunas para limpar, filtrar ou formatar dados.
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* MODALS / OVERLAYS */}
      {/* =================================================== */}

      {/* 1. Rename Column Modal */}
      {activeModal === 'rename' && selectedColumn && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 w-96 animate-in fade-in scale-in duration-150">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-400" />
              <span>Renomear Coluna: {selectedColumn.name}</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4 font-normal">
              Insira o novo nome para esta coluna no DataFrame do Pandas.
            </p>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Novo Nome</label>
                <input
                  type="text"
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-transparent rounded-lg hover:bg-slate-850 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg shadow cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Filter Rows Modal */}
      {activeModal === 'filter' && selectedColumn && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 w-96 animate-in fade-in scale-in duration-150">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Filtrar Linhas: {selectedColumn.name}</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4 font-normal">
              Filtre as linhas do DataFrame usando condições do Pandas.
            </p>
            <form onSubmit={handleFilterSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Condição / Operador</label>
                  <select
                    value={filterOperator}
                    onChange={(e: any) => setFilterOperator(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="equals">Igual a</option>
                    <option value="not_equals">Diferente de</option>
                    <option value="contains">Contém o texto</option>
                    <option value="not_contains">Não contém o texto</option>
                    {selectedColumn.type === 'number' && (
                      <>
                        <option value="greater_than">Maior que (&gt;)</option>
                        <option value="less_than">Menor que (&lt;)</option>
                      </>
                    )}
                    <option value="is_null">É Nulo (Missing)</option>
                    <option value="is_not_null">Não é Nulo (Not Missing)</option>
                  </select>
                </div>

                {filterOperator !== 'is_null' && filterOperator !== 'is_not_null' && (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor de Comparação</label>
                    <input
                      type="text"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder={selectedColumn.type === 'number' ? 'Ex: 100' : 'Ex: São Paulo'}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
                      autoFocus
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-transparent rounded-lg hover:bg-slate-850 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg shadow cursor-pointer"
                >
                  Filtrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Fill Missing Values (FillNa) Modal */}
      {activeModal === 'fillna' && selectedColumn && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 w-96 animate-in fade-in scale-in duration-150">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Tratar Nulos: {selectedColumn.name}</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4 font-normal">
              Substitua os valores vazios (<code className="font-mono text-amber-500">NaN</code>) nesta coluna.
            </p>
            <form onSubmit={handleFillnaSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Método de Preenchimento</label>
                  <select
                    value={fillnaMethod}
                    onChange={(e: any) => setFillnaMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="value">Valor Estático Fixo</option>
                    {selectedColumn.type === 'number' && (
                      <>
                        <option value="mean">Média dos Valores</option>
                        <option value="median">Mediana dos Valores</option>
                      </>
                    )}
                    <option value="ffill">Forward Fill (ffill)</option>
                    <option value="bfill">Backward Fill (bfill)</option>
                  </select>
                </div>

                {fillnaMethod === 'value' && (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Substituir por</label>
                    <input
                      type="text"
                      value={fillnaValue}
                      onChange={(e) => setFillnaValue(e.target.value)}
                      placeholder="Ex: 0 ou Sem Registro"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
                      autoFocus
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-transparent rounded-lg hover:bg-slate-850 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg shadow cursor-pointer"
                >
                  Aplicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Calculated Column Modal */}
      {showAddColModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-[500px] max-h-[90vh] overflow-y-auto animate-in fade-in scale-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Nova Coluna Calculada (Feature Engineering)</span>
              </h4>
              <button
                onClick={() => setShowAddColModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddColumnSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da Nova Coluna</label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Ex: Preco_Liquido ou Total_Vendas"
                  required
                  className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tipo de Expressão</label>
                <select
                  value={newColExpType}
                  onChange={(e: any) => setNewColExpType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                >
                  <option value="constant">Valor Estático Fixo (Constante)</option>
                  <option value="math">Cálculo Matemático entre Duas Colunas</option>
                  <option value="concatenate">Concatenar Duas Colunas como Texto</option>
                  <option value="custom_python">Fórmula Customizada (Linguagem Pandas)</option>
                </select>
              </div>

              {/* Constant UI */}
              {newColExpType === 'constant' && (
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor Constante</label>
                  <input
                    type="text"
                    value={newColConstant}
                    onChange={(e) => setNewColConstant(e.target.value)}
                    placeholder="Ex: 100 ou Ativo"
                    required
                    className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              )}

              {/* Concatenate UI */}
              {newColExpType === 'concatenate' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Coluna A (Texto)</label>
                    <select
                      value={newColColA}
                      onChange={(e) => setNewColColA(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      {columns.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Coluna B (Texto)</label>
                    <select
                      value={newColColB}
                      onChange={(e) => setNewColColB(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      {columns.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Math UI */}
              {newColExpType === 'math' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-3 gap-2.5 items-end">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Coluna A (Numérica)</label>
                      <select
                        value={newColColA}
                        onChange={(e) => setNewColColA(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        {columns.filter(c => c.type === 'number').map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Operador</label>
                      <select
                        value={newColOperator}
                        onChange={(e: any) => setNewColOperator(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                      >
                        <option value="+">Somar (+)</option>
                        <option value="-">Subtrair (-)</option>
                        <option value="*">Multiplicar (*)</option>
                        <option value="/">Dividir (/)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Coluna B (Numérica)</label>
                      <select
                        value={newColColB}
                        onChange={(e) => setNewColColB(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        {columns.filter(c => c.type === 'number').map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Expression Pandas UI */}
              {newColExpType === 'custom_python' && (
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Fórmula Pandas / Python</label>
                    <textarea
                      value={newColCustomExp}
                      onChange={(e) => setNewColCustomExp(e.target.value)}
                      placeholder="Ex: [Preco_Venda] - [Preco_Custo] ou [Quantidade] * 1.2"
                      required
                      rows={3}
                      className="w-full bg-slate-850 border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p>• Coloque os nomes das colunas existentes entre colchetes, ex: <code className="text-slate-400">[Quantidade]</code></p>
                    <p>• O Pandas interpretará como: <code className="text-emerald-500">df['Quantidade'] * 1.2</code></p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddColModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-transparent rounded-lg hover:bg-slate-850 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Coluna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
