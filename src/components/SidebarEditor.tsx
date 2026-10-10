import React, { useState, useEffect } from 'react';
import {
  Code,
  Settings2,
  Copy,
  Check,
  Download,
  AlertCircle,
  HelpCircle,
  Trash2,
  Info
} from 'lucide-react';
import { AppliedStep, Column, ColumnType, StepType, Dataset } from '../types';
import { runPipeline } from '../utils/engine';

interface SidebarEditorProps {
  activeStep: AppliedStep;
  columns: Column[]; // Columns at the point of the previous step (or raw dataset columns)
  allColumns: string[]; // All column names currently available
  onUpdateStepParams: (stepId: string, label: string, description: string, params: any) => void;
  generatedCode: string;
  steps: AppliedStep[];
  allDatasets: Dataset[];
}

export default function SidebarEditor({
  activeStep,
  columns,
  allColumns,
  onUpdateStepParams,
  generatedCode,
  steps,
  allDatasets,
}: SidebarEditorProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'config'>('code');
  const [copied, setCopied] = useState(false);

  // Local Form States
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');

  const [changeTypeCol, setChangeTypeCol] = useState('');
  const [changeTypeTo, setChangeTypeTo] = useState<ColumnType>('string');

  const [filterCol, setFilterCol] = useState('');
  const [filterOp, setFilterOp] = useState('');
  const [filterVal, setFilterVal] = useState('');

  const [dropCols, setDropCols] = useState<string[]>([]);

  const [addColName, setAddColName] = useState('');
  const [addColType, setAddColType] = useState('');
  const [addColA, setAddColA] = useState('');
  const [addColOp, setAddColOp] = useState<any>('+');
  const [addColB, setAddColB] = useState('');
  const [addColConst, setAddColConst] = useState('');
  const [addColCustom, setAddColCustom] = useState('');

  const [groupByCols, setGroupByCols] = useState<string[]>([]);
  const [groupByAggCol, setGroupByAggCol] = useState('');
  const [groupByAggFunc, setGroupByAggFunc] = useState<'sum' | 'mean' | 'count' | 'max' | 'min'>('sum');
  const [groupByTarget, setGroupByTarget] = useState('');

  const [sortCol, setSortCol] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const [dropDupCols, setDropDupCols] = useState<string[]>([]);

  const [fillnaCol, setFillnaCol] = useState('');
  const [fillnaMethod, setFillnaMethod] = useState<'value' | 'mean' | 'median' | 'ffill' | 'bfill'>('value');
  const [fillnaVal, setFillnaVal] = useState('');

  const [sliceLimit, setSliceLimit] = useState(10);

  // New Step states
  const [joinOtherDatasetId, setJoinOtherDatasetId] = useState('employees');
  const [joinType, setJoinType] = useState<'left' | 'inner' | 'right' | 'outer'>('left');
  const [joinLeftOn, setJoinLeftOn] = useState('');
  const [joinRightOn, setJoinRightOn] = useState('');
  const [joinPrefix, setJoinPrefix] = useState('');

  const [pivotIndexCols, setPivotIndexCols] = useState<string[]>([]);
  const [pivotCol, setPivotCol] = useState('');
  const [pivotValCol, setPivotValCol] = useState('');
  const [pivotAggFunc, setPivotAggFunc] = useState<'sum' | 'mean' | 'count' | 'max' | 'min'>('sum');

  const [unpivotIdVars, setUnpivotIdVars] = useState<string[]>([]);
  const [unpivotValueVars, setUnpivotValueVars] = useState<string[]>([]);
  const [unpivotVarName, setUnpivotVarName] = useState('atributo');
  const [unpivotValueName, setUnpivotValueName] = useState('valor');

  const [customCodeText, setCustomCodeText] = useState('');

  // Resolve other dataset columns
  const otherDatasetColumns = React.useMemo(() => {
    if (!joinOtherDatasetId) return [];
    if (joinOtherDatasetId === 'base_original') {
      const sourceStep = steps.find((s) => s.type === 'source');
      if (sourceStep) {
        const found = allDatasets.find((d) => d.id === sourceStep.params.datasetId);
        return found ? found.columns.map((c) => c.name) : [];
      }
      return [];
    }
    if (joinOtherDatasetId.startsWith('step_')) {
      const sourceStep = steps.find((s) => s.type === 'source');
      if (sourceStep && allDatasets.length > 0) {
        const foundRaw = allDatasets.find((d) => d.id === sourceStep.params.datasetId);
        if (foundRaw) {
          try {
            const result = runPipeline(foundRaw, steps, joinOtherDatasetId, allDatasets);
            return result.columns.map((c) => c.name);
          } catch (e) {
            console.error(e);
          }
        }
      }
      return [];
    }
    const found = allDatasets.find((d) => d.id === joinOtherDatasetId);
    return found ? found.columns.map((c) => c.name) : [];
  }, [joinOtherDatasetId, allDatasets, steps]);

  // Sync Form States when Active Step changes
  useEffect(() => {
    if (!activeStep) return;

    const p = activeStep.params;
    switch (activeStep.type) {
      case 'rename_column':
        setRenameFrom(p.from || '');
        setRenameTo(p.to || '');
        break;
      case 'change_type':
        setChangeTypeCol(p.column || '');
        setChangeTypeTo(p.toType || 'string');
        break;
      case 'filter_rows':
        setFilterCol(p.column || '');
        setFilterOp(p.operator || 'equals');
        setFilterVal(p.value || '');
        break;
      case 'drop_column':
        setDropCols(p.columns || []);
        break;
      case 'add_column':
        setAddColName(p.columnName || '');
        setAddColType(p.expressionType || 'constant');
        setAddColA(p.colA || '');
        setAddColOp(p.operator || '+');
        setAddColB(p.colB || '');
        setAddColConst(p.constantValue || '');
        setAddColCustom(p.customExpression || '');
        break;
      case 'group_by':
        setGroupByCols(p.groupByColumns || []);
        setGroupByAggCol(p.aggColumn || '');
        setGroupByAggFunc(p.aggFunction || 'sum');
        setGroupByTarget(p.targetColumnName || '');
        break;
      case 'sort_rows':
        setSortCol(p.column || '');
        setSortAsc(p.ascending !== false);
        break;
      case 'drop_duplicates':
        setDropDupCols(p.columns || []);
        break;
      case 'fillna':
        setFillnaCol(p.column || '');
        setFillnaMethod(p.method || 'value');
        setFillnaVal(p.customValue || '');
        break;
      case 'slice_rows':
        setSliceLimit(p.limit || 5);
        break;
      case 'join_dataset':
        setJoinOtherDatasetId(p.otherDatasetId || 'employees');
        setJoinType(p.joinType || 'left');
        setJoinLeftOn(p.leftOn || '');
        setJoinRightOn(p.rightOn || '');
        setJoinPrefix(p.prefix || '');
        break;
      case 'pivot':
        setPivotIndexCols(p.indexColumns || []);
        setPivotCol(p.pivotColumn || '');
        setPivotValCol(p.valueColumn || '');
        setPivotAggFunc(p.aggFunction || 'sum');
        break;
      case 'unpivot':
        setUnpivotIdVars(p.idVars || []);
        setUnpivotValueVars(p.valueVars || []);
        setUnpivotVarName(p.varName || 'atributo');
        setUnpivotValueName(p.valueName || 'valor');
        break;
      case 'custom_code':
        setCustomCodeText(p.code || '# Código customizado\ndf["Preco_Calculado"] = df["Preco_Unitario"] * 1.1\n');
        break;
    }

    // Auto switch to config tab when user clicks non-source steps to configure
    if (activeStep.type !== 'source') {
      setActiveTab('config');
    } else {
      setActiveTab('code');
    }
  }, [activeStep]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Triggers updates back to parent state
  const handleSaveConfig = () => {
    let updatedParams: any = {};
    let label = activeStep.label;
    let description = activeStep.description;

    switch (activeStep.type) {
      case 'rename_column':
        updatedParams = { from: renameFrom, to: renameTo };
        label = `Renomear ${renameFrom} para ${renameTo}`;
        description = `Renomeia a coluna ${renameFrom} para ${renameTo}`;
        break;

      case 'change_type':
        updatedParams = { column: changeTypeCol, toType: changeTypeTo };
        const typeLabel = changeTypeTo === 'number' ? 'Número' : changeTypeTo === 'string' ? 'Texto' : changeTypeTo === 'boolean' ? 'Booleano' : 'Data';
        label = `Alterar tipo de ${changeTypeCol} para ${typeLabel}`;
        description = `Converte ${changeTypeCol} para tipo ${changeTypeTo}`;
        break;

      case 'filter_rows':
        updatedParams = { column: filterCol, operator: filterOp, value: filterVal };
        let opLabel = '';
        if (filterOp === 'equals') opLabel = `== "${filterVal}"`;
        else if (filterOp === 'not_equals') opLabel = `!= "${filterVal}"`;
        else if (filterOp === 'greater_than') opLabel = `> ${filterVal}`;
        else if (filterOp === 'less_than') opLabel = `< ${filterVal}`;
        else if (filterOp === 'contains') opLabel = `contém "${filterVal}"`;
        else if (filterOp === 'is_null') opLabel = 'é Nulo';
        else if (filterOp === 'is_not_null') opLabel = 'não é Nulo';
        label = `Filtrar ${filterCol} ${opLabel}`;
        description = `Filtra linhas onde ${filterCol} ${opLabel}`;
        break;

      case 'drop_column':
        updatedParams = { columns: dropCols };
        label = `Remover ${dropCols.length} colunas`;
        description = `Drop de: ${dropCols.join(', ')}`;
        break;

      case 'add_column':
        updatedParams = {
          columnName: addColName,
          expressionType: addColType,
          colA: addColA,
          operator: addColOp,
          colB: addColB,
          constantValue: addColConst,
          customExpression: addColCustom,
        };
        label = `Adicionar coluna "${addColName}"`;
        description = addColType === 'constant'
          ? `Constante: "${addColConst}"`
          : addColType === 'math'
            ? `Cálculo: ${addColA} ${addColOp} ${addColB}`
            : `Fórmula Pandas customizada`;
        break;

      case 'group_by':
        updatedParams = {
          groupByColumns: groupByCols,
          aggColumn: groupByAggCol,
          aggFunction: groupByAggFunc,
          targetColumnName: groupByTarget,
        };
        label = `Agrupar por ${groupByCols.join(', ')}`;
        description = `Métrica ${groupByAggFunc}(${groupByAggCol}) salva em ${groupByTarget}`;
        break;

      case 'sort_rows':
        updatedParams = { column: sortCol, ascending: sortAsc };
        label = `Ordenar por ${sortCol} (${sortAsc ? 'Asc' : 'Desc'})`;
        description = `Ordena por ${sortCol} ${sortAsc ? 'crescente' : 'decrescente'}`;
        break;

      case 'drop_duplicates':
        updatedParams = { columns: dropDupCols };
        label = `Remover duplicados de ${dropDupCols.length > 0 ? dropDupCols.join(', ') : 'Tabela'}`;
        description = `Remove registros redundantes`;
        break;

      case 'fillna':
        updatedParams = { column: fillnaCol, method: fillnaMethod, customValue: fillnaVal };
        label = `Preencher nulos em ${fillnaCol}`;
        description = `Trata nulos usando método: ${fillnaMethod}`;
        break;

      case 'slice_rows':
        updatedParams = { limit: Number(sliceLimit) };
        label = `Limitar linhas para ${sliceLimit}`;
        description = `Retorna os primeiros ${sliceLimit} registros`;
        break;

      case 'join_dataset': {
        let otherName = joinOtherDatasetId;
        if (otherName === 'sales') otherName = 'Vendas';
        else if (otherName === 'employees') otherName = 'Funcionários';
        else if (otherName === 'inventory') otherName = 'Estoque';
        else if (otherName === 'base_original') otherName = 'Tabela Original';
        else if (otherName.startsWith('step_')) {
          const matchedStep = steps.find(s => s.id === otherName);
          otherName = matchedStep ? matchedStep.label : `Passo ${otherName.substring(5, 12)}`;
        } else {
          otherName = otherName.replace('custom_', '');
        }
        updatedParams = {
          otherDatasetId: joinOtherDatasetId,
          joinType,
          leftOn: joinLeftOn,
          rightOn: joinRightOn,
          prefix: joinPrefix
        };
        label = `Join ${joinType.toUpperCase()} com ${otherName}`;
        description = `Cruza a tabela atual com ${otherName} em ${joinLeftOn} = ${joinRightOn}`;
        break;
      }

      case 'pivot':
        updatedParams = {
          indexColumns: pivotIndexCols,
          pivotColumn: pivotCol,
          valueColumn: pivotValCol,
          aggFunction: pivotAggFunc
        };
        label = `Pivot (${pivotAggFunc} de ${pivotValCol})`;
        description = `Pivot (${pivotAggFunc} de ${pivotValCol}) por ${pivotCol}, agrupando por ${pivotIndexCols.join(', ')}`;
        break;

      case 'unpivot':
        updatedParams = {
          idVars: unpivotIdVars,
          valueVars: unpivotValueVars,
          varName: unpivotVarName,
          valueName: unpivotValueName
        };
        label = `Unpivot de ${unpivotValueVars.length} colunas`;
        description = `Transpõe as colunas (${unpivotValueVars.join(', ')}) para o par chave-valor (${unpivotVarName}, ${unpivotValueName})`;
        break;

      case 'custom_code': {
        updatedParams = {
          code: customCodeText
        };
        const firstLine = customCodeText.trim().split('\n')[0] || '';
        const summary = firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine;
        label = `Script Python: ${summary || 'Código Customizado'}`;
        description = `Executa transformações usando Pandas customizado`;
        break;
      }
    }

    onUpdateStepParams(activeStep.id, label, description, updatedParams);
  };

  const toggleColumnSelection = (col: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(col)) {
      setList(list.filter((c) => c !== col));
    } else {
      setList([...list, col]);
    }
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden">
      {/* Tab select header */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'code' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Código Python</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          disabled={activeStep?.type === 'source'}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
            activeTab === 'config' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Configuração</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
        {activeTab === 'code' ? (
          /* CODE BLOCK TAB */
          <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3 h-3 text-emerald-400" />
                <span>Script Pandas Gerado</span>
              </span>
              <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded border border-slate-700 transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Code Block */}
            <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-3 overflow-auto font-mono text-[11px] text-slate-300 shadow-inner relative leading-relaxed select-text">
              <pre>{generatedCode}</pre>
            </div>

            {/* Code Instruction Panel */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 font-normal shrink-0">
              <p className="font-semibold text-slate-300 mb-1">Como rodar localmente:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Instale o Pandas: <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded text-[10px]">pip install pandas numpy</code></li>
                <li>Salve o arquivo como <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded text-[10px]">pipeline.py</code></li>
                <li>Execute: <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded text-[10px]">python pipeline.py</code></li>
              </ol>
            </div>
          </div>
        ) : (
          /* CONFIGURATION TAB */
          <div className="flex-1 flex flex-col justify-between min-h-0">
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-300">Configurar: {activeStep.label}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-400 capitalize">
                  {activeStep.type}
                </span>
              </div>

              {/* RENAME COLUMN FORM */}
              {activeStep.type === 'rename_column' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna Original</label>
                    <select
                      value={renameFrom}
                      onChange={(e) => setRenameFrom(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Novo Nome</label>
                    <input
                      type="text"
                      value={renameTo}
                      onChange={(e) => setRenameTo(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* CHANGE TYPE FORM */}
              {activeStep.type === 'change_type' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select
                      value={changeTypeCol}
                      onChange={(e) => setChangeTypeCol(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Novo Tipo Pandas</label>
                    <select
                      value={changeTypeTo}
                      onChange={(e: any) => setChangeTypeTo(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="string">Texto (object/str)</option>
                      <option value="number">Número (float64)</option>
                      <option value="boolean">Booleano (bool)</option>
                      <option value="date">Data (datetime64)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* FILTER ROWS FORM */}
              {activeStep.type === 'filter_rows' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna de Filtro</label>
                    <select
                      value={filterCol}
                      onChange={(e) => setFilterCol(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Operador</label>
                    <select
                      value={filterOp}
                      onChange={(e) => setFilterOp(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="equals">Igual a</option>
                      <option value="not_equals">Diferente de</option>
                      <option value="contains">Contém texto</option>
                      <option value="not_contains">Não contém texto</option>
                      <option value="greater_than">Maior que (&gt;)</option>
                      <option value="less_than">Menor que (&lt;)</option>
                      <option value="is_null">É Nulo</option>
                      <option value="is_not_null">Não é Nulo</option>
                    </select>
                  </div>
                  {filterOp !== 'is_null' && filterOp !== 'is_not_null' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor de Comparação</label>
                      <input
                        type="text"
                        value={filterVal}
                        onChange={(e) => setFilterVal(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* DROP COLUMN FORM */}
              {activeStep.type === 'drop_column' && (
                <div className="space-y-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Colunas a Excluir (Drop)</label>
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 max-h-56 overflow-y-auto space-y-2">
                    {allColumns.map((col) => {
                      const isChecked = dropCols.includes(col);
                      return (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumnSelection(col, dropCols, setDropCols)}
                            className="rounded text-blue-500 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0"
                          />
                          <span className="font-mono">{col}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ADD COLUMN FORM */}
              {activeStep.type === 'add_column' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da Nova Coluna</label>
                    <input
                      type="text"
                      value={addColName}
                      onChange={(e) => setAddColName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expressão</label>
                    <select
                      value={addColType}
                      onChange={(e) => setAddColType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                    >
                      <option value="constant">Valor Fixo Constante</option>
                      <option value="math">Cálculo Matemático (+ - * /)</option>
                      <option value="concatenate">Concatenar Textos</option>
                      <option value="custom_python">Fórmula Pandas Customizada</option>
                    </select>
                  </div>

                  {addColType === 'constant' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor Constante</label>
                      <input
                        type="text"
                        value={addColConst}
                        onChange={(e) => setAddColConst(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  )}

                  {(addColType === 'math' || addColType === 'concatenate') && (
                    <div className="space-y-3.5 bg-slate-950 p-3 rounded-lg border border-slate-850">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Coluna A</label>
                        <select
                          value={addColA}
                          onChange={(e) => setAddColA(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="">Selecione...</option>
                          {allColumns.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {addColType === 'math' && (
                        <div>
                          <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Operador</label>
                          <select
                            value={addColOp}
                            onChange={(e: any) => setAddColOp(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="+">Soma (+)</option>
                            <option value="-">Subtração (-)</option>
                            <option value="*">Multiplicação (*)</option>
                            <option value="/">Divisão (/)</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Coluna B</label>
                        <select
                          value={addColB}
                          onChange={(e) => setAddColB(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                        >
                          <option value="">Selecione...</option>
                          {allColumns.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {addColType === 'custom_python' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expressão Pandas</label>
                      <textarea
                        value={addColCustom}
                        onChange={(e) => setAddColCustom(e.target.value)}
                        placeholder="Ex: [Preco_Venda] - [Preco_Custo]"
                        rows={3}
                        className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* GROUP BY FORM */}
              {activeStep.type === 'group_by' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Agrupar por (Group By)</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={groupByCols.includes(col)}
                            onChange={() => toggleColumnSelection(col, groupByCols, setGroupByCols)}
                            className="rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-0"
                          />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna para Métrica</label>
                    <select
                      value={groupByAggCol}
                      onChange={(e) => setGroupByAggCol(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Função de Agregação</label>
                    <select
                      value={groupByAggFunc}
                      onChange={(e: any) => setGroupByAggFunc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="sum">Soma (sum)</option>
                      <option value="mean">Média (mean)</option>
                      <option value="count">Contar Registros (count)</option>
                      <option value="max">Valor Máximo (max)</option>
                      <option value="min">Valor Mínimo (min)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da Coluna Destino</label>
                    <input
                      type="text"
                      value={groupByTarget}
                      onChange={(e) => setGroupByTarget(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* SORT ROWS FORM */}
              {activeStep.type === 'sort_rows' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna de Ordenação</label>
                    <select
                      value={sortCol}
                      onChange={(e) => setSortCol(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Ordem</label>
                    <select
                      value={sortAsc ? 'true' : 'false'}
                      onChange={(e) => setSortAsc(e.target.value === 'true')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="true">Crescente (A-Z / Menor para Maior)</option>
                      <option value="false">Decrescente (Z-A / Maior para Menor)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* DROP DUPLICATES FORM */}
              {activeStep.type === 'drop_duplicates' && (
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Analisar Duplicados em</label>
                  <div className="bg-slate-950 rounded-lg p-2.5 max-h-56 overflow-y-auto space-y-1.5 border border-slate-800">
                    {allColumns.map((col) => (
                      <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dropDupCols.includes(col)}
                          onChange={() => toggleColumnSelection(col, dropDupCols, setDropDupCols)}
                          className="rounded text-teal-500 bg-slate-800 border-slate-700 focus:ring-0"
                        />
                        <span className="font-mono">{col}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    * Se nenhuma coluna for selecionada, o Pandas irá comparar a linha inteira.
                  </p>
                </div>
              )}

              {/* FILLNA FORM */}
              {activeStep.type === 'fillna' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna com Nulos</label>
                    <select
                      value={fillnaCol}
                      onChange={(e) => setFillnaCol(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Método</label>
                    <select
                      value={fillnaMethod}
                      onChange={(e: any) => setFillnaMethod(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="value">Substituir por Valor Fixo</option>
                      <option value="mean">Substituir pela Média</option>
                      <option value="median">Substituir pela Mediana</option>
                      <option value="ffill">Forward Fill (ffill)</option>
                      <option value="bfill">Backward Fill (bfill)</option>
                    </select>
                  </div>
                  {fillnaMethod === 'value' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor de Substituição</label>
                      <input
                        type="text"
                        value={fillnaVal}
                        onChange={(e) => setFillnaVal(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SLICE FORM */}
              {activeStep.type === 'slice_rows' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Manter Primeiras N Linhas</label>
                    <input
                      type="number"
                      value={sliceLimit}
                      onChange={(e) => setSliceLimit(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      min={1}
                    />
                  </div>
                </div>
              )}

              {/* JOIN DATASET FORM */}
              {activeStep.type === 'join_dataset' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tabela para Cruzamento (Join)</label>
                    <select
                      value={joinOtherDatasetId}
                      onChange={(e) => setJoinOtherDatasetId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      <optgroup label="Bases de Dados (Presets)">
                        <option value="sales">Vendas (Sales)</option>
                        <option value="employees">Recursos Humanos (Employees)</option>
                        <option value="inventory">Estoque (Inventory)</option>
                      </optgroup>
                      <optgroup label="Tabela de Entrada">
                        <option value="base_original">Tabela Original de Origem</option>
                      </optgroup>
                      {steps.filter(s => s.id !== activeStep.id && s.type !== 'source').length > 0 && (
                        <optgroup label="Passos Anteriores do Fluxo (ETL)">
                          {steps.filter(s => s.id !== activeStep.id && s.type !== 'source').map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label} ({s.description.substring(0, 20)}...)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Tipo de Join (Looker Style)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'left', label: 'Left Join', desc: 'Mantém todas da atual' },
                        { id: 'inner', label: 'Inner Join', desc: 'Apenas correspondências' },
                        { id: 'right', label: 'Right Join', desc: 'Mantém todas da externa' },
                        { id: 'outer', label: 'Full Outer', desc: 'Mantém todas de ambas' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setJoinType(t.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition duration-200 cursor-pointer ${
                            joinType === t.id
                              ? 'bg-blue-600/20 border-blue-500 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs font-bold">{t.label}</div>
                          <div className="text-[9px] opacity-70 mt-0.5 leading-tight">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Chave na Tabela Atual</label>
                    <select
                      value={joinLeftOn}
                      onChange={(e) => setJoinLeftOn(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Chave na Tabela Externa</label>
                    <select
                      value={joinRightOn}
                      onChange={(e) => setJoinRightOn(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {otherDatasetColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {otherDatasetColumns.length === 0 && joinOtherDatasetId && (
                      <p className="text-[9px] text-amber-400/95 mt-1">
                        * Nenhuma coluna encontrada ou tabela em carregamento.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Prefixo de Coluna (Opcional)</label>
                    <input
                      type="text"
                      value={joinPrefix}
                      onChange={(e) => setJoinPrefix(e.target.value)}
                      placeholder="Ex: ext_"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* PIVOT FORM */}
              {activeStep.type === 'pivot' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Colunas de Linha (Index Columns)</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pivotIndexCols.includes(col)}
                            onChange={() => toggleColumnSelection(col, pivotIndexCols, setPivotIndexCols)}
                            className="rounded text-blue-500 bg-slate-800 border-slate-700 focus:ring-0"
                          />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna para Pivotear (Colunas Dinâmicas)</label>
                    <select
                      value={pivotCol}
                      onChange={(e) => setPivotCol(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna de Valores (Métrica)</label>
                    <select
                      value={pivotValCol}
                      onChange={(e) => setPivotValCol(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Função de Agregação</label>
                    <select
                      value={pivotAggFunc}
                      onChange={(e: any) => setPivotAggFunc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="sum">Soma (sum)</option>
                      <option value="mean">Média (mean)</option>
                      <option value="count">Contar (count)</option>
                      <option value="max">Máximo (max)</option>
                      <option value="min">Mínimo (min)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* UNPIVOT FORM */}
              {activeStep.type === 'unpivot' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Colunas de Identidade (Manter Fixas)</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unpivotIdVars.includes(col)}
                            onChange={() => toggleColumnSelection(col, unpivotIdVars, setUnpivotIdVars)}
                            className="rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-0"
                          />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Colunas para Transpor (Melt/Unpivot)</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unpivotValueVars.includes(col)}
                            onChange={() => toggleColumnSelection(col, unpivotValueVars, setUnpivotValueVars)}
                            className="rounded text-purple-500 bg-slate-800 border-slate-700 focus:ring-0"
                          />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da Coluna de Atributo</label>
                    <input
                      type="text"
                      value={unpivotVarName}
                      onChange={(e) => setUnpivotVarName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da Coluna de Valor</label>
                    <input
                      type="text"
                      value={unpivotValueName}
                      onChange={(e) => setUnpivotValueName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* CUSTOM CODE FORM */}
              {activeStep.type === 'custom_code' && (
                <div className="space-y-3.5">
                  <div className="bg-emerald-950/30 border border-emerald-900/60 p-2.5 rounded-xl text-[10px] text-emerald-400 leading-normal font-normal">
                    <p className="font-bold mb-1">💡 Código de Simulação Interativo:</p>
                    <p className="mb-1.5">Insira um script Python compatível com Pandas. Para simulação em tempo real no navegador, você pode atribuir novos valores a colunas ou criar fórmulas linha a linha:</p>
                    <code className="block bg-slate-950 p-1.5 rounded text-[9px] font-mono leading-relaxed text-slate-300">
                      df["Novo_Valor"] = df["Quantidade"] * 5
                    </code>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Script Python / Pandas</label>
                    <textarea
                      value={customCodeText}
                      onChange={(e) => setCustomCodeText(e.target.value)}
                      rows={12}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-700 leading-relaxed"
                      placeholder="# Escreva seu código Python aqui&#10;df['coluna'] = df['outra'] * 2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Save Buttons */}
            <div className="pt-4 border-t border-slate-800 mt-4 bg-slate-900 sticky bottom-0">
              <button
                onClick={handleSaveConfig}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2 rounded-xl text-xs font-bold transition shadow-md hover:shadow-blue-600/10 cursor-pointer text-center"
              >
                Aplicar Alterações
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
