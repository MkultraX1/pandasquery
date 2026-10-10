import React, { useState, useEffect } from 'react';
import {
  Code,
  Settings2,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  Trash2,
  Info,
} from 'lucide-react';
import { AppliedStep, Column, ColumnType, StepType, Dataset } from '../types';
import { runPipeline } from '../utils/engine';

interface SidebarEditorProps {
  activeStep: AppliedStep;
  columns: Column[];
  allColumns: string[];
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

  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [changeTypeCol, setChangeTypeCol] = useState('');
  const [changeTypeTo, setChangeTypeTo] = useState<ColumnType>('string');

  const [filterCol, setFilterCol] = useState('');
  const [filterOp, setFilterOp] = useState('equals');
  const [filterVal, setFilterVal] = useState('');
  const [filterBetweenMin, setFilterBetweenMin] = useState('');
  const [filterBetweenMax, setFilterBetweenMax] = useState('');

  const [dropCols, setDropCols] = useState<string[]>([]);

  const [addColName, setAddColName] = useState('');
  const [addColType, setAddColType] = useState('constant');
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

  const [caseColumn, setCaseColumn] = useState('');
  const [textReplaceCol, setTextReplaceCol] = useState('');
  const [textReplaceFind, setTextReplaceFind] = useState('');
  const [textReplaceValue, setTextReplaceValue] = useState('');
  const [substringCol, setSubstringCol] = useState('');
  const [substringStart, setSubstringStart] = useState(0);
  const [substringLength, setSubstringLength] = useState(5);
  const [concatCols, setConcatCols] = useState<string[]>([]);
  const [concatTarget, setConcatTarget] = useState('');
  const [concatSeparator, setConcatSeparator] = useState(' ');
  const [splitCol, setSplitCol] = useState('');
  const [splitDelimiter, setSplitDelimiter] = useState(',');
  const [splitTargetCols, setSplitTargetCols] = useState<string[]>([]);
  const [dateCol, setDateCol] = useState('');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

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

  useEffect(() => {
    if (!activeStep) return;

    const p = activeStep.params ?? {};
    switch (activeStep.type) {
      case 'rename_column':
        setRenameFrom(p.from || '');
        setRenameTo(p.to || '');
        break;
      case 'change_type':
      case 'cast_to_string':
      case 'cast_to_number':
      case 'cast_to_boolean':
        setChangeTypeCol(p.column || '');
        setChangeTypeTo(p.toType || 'string');
        break;
      case 'filter_rows':
      case 'filter_equals':
      case 'filter_not_equals':
      case 'filter_contains':
      case 'filter_not_contains':
        setFilterCol(p.column || '');
        setFilterOp(p.operator || 'equals');
        setFilterVal(p.value || '');
        break;
      case 'filter_between':
        setFilterCol(p.column || '');
        setFilterBetweenMin(String(p.min ?? ''));
        setFilterBetweenMax(String(p.max ?? ''));
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
      case 'remove_duplicates':
        setDropDupCols(p.columns || []);
        break;
      case 'fillna':
      case 'fill_missing':
        setFillnaCol(p.column || '');
        setFillnaMethod(p.method || 'value');
        setFillnaVal(p.customValue || '');
        break;
      case 'slice_rows':
        setSliceLimit(Number(p.limit || 10));
        break;
      case 'join_dataset':
      case 'join_left':
      case 'join_inner':
      case 'join_outer':
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
        setCustomCodeText(p.code || '# Código customizado\ndf["Nova_Coluna"] = df["Quantidade"] * 2\n');
        break;
      case 'lower_case':
      case 'upper_case':
      case 'trim_whitespace':
      case 'title_case':
      case 'capitalize':
        setCaseColumn(p.column || '');
        break;
      case 'replace_text':
        setTextReplaceCol(p.column || '');
        setTextReplaceFind(p.find || '');
        setTextReplaceValue(p.replace || '');
        break;
      case 'substring':
        setSubstringCol(p.column || '');
        setSubstringStart(Number(p.start ?? 0));
        setSubstringLength(Number(p.length ?? 5));
        break;
      case 'concat_columns':
        setConcatCols(p.columns || []);
        setConcatTarget(p.target || '');
        setConcatSeparator(p.separator ?? ' ');
        break;
      case 'split_column':
        setSplitCol(p.column || '');
        setSplitDelimiter(p.delimiter ?? ',');
        setSplitTargetCols(p.newColumns || []);
        break;
      case 'parse_date':
        setDateCol(p.column || '');
        setDateFormat(p.format || 'YYYY-MM-DD');
        break;
    }

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
      case 'cast_to_string':
      case 'cast_to_number':
      case 'cast_to_boolean':
        updatedParams = { column: changeTypeCol, toType: changeTypeTo };
        label = `Alterar tipo de ${changeTypeCol}`;
        description = `Converte ${changeTypeCol} para ${changeTypeTo}`;
        break;
      case 'filter_rows':
      case 'filter_equals':
      case 'filter_not_equals':
      case 'filter_contains':
      case 'filter_not_contains':
        updatedParams = { column: filterCol, operator: filterOp, value: filterVal };
        label = `Filtrar ${filterCol}`;
        description = `Aplica filtro ${filterOp} em ${filterCol}`;
        break;
      case 'filter_between':
        updatedParams = { column: filterCol, min: filterBetweenMin, max: filterBetweenMax, operator: 'between' };
        label = `Filtrar ${filterCol} entre ${filterBetweenMin} e ${filterBetweenMax}`;
        description = `Mantém registros entre ${filterBetweenMin} e ${filterBetweenMax}`;
        break;
      case 'drop_column':
        updatedParams = { columns: dropCols };
        label = `Remover ${dropCols.length} colunas`;
        description = `Exclui: ${dropCols.join(', ')}`;
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
        label = `Adicionar coluna ${addColName}`;
        description = `${addColType === 'math' ? 'Cálculo' : addColType === 'constant' ? 'Constante' : 'Fórmula'} em ${addColName}`;
        break;
      case 'group_by':
        updatedParams = {
          groupByColumns: groupByCols,
          aggColumn: groupByAggCol,
          aggFunction: groupByAggFunc,
          targetColumnName: groupByTarget,
        };
        label = `Agrupar por ${groupByCols.join(', ')}`;
        description = `Agrupa por ${groupByCols.join(', ')} e calcula ${groupByAggFunc}(${groupByAggCol})`;
        break;
      case 'sort_rows':
        updatedParams = { column: sortCol, ascending: sortAsc };
        label = `Ordenar por ${sortCol}`;
        description = `Ordena ${sortCol} ${sortAsc ? 'crescente' : 'decrescente'}`;
        break;
      case 'drop_duplicates':
      case 'remove_duplicates':
        updatedParams = { columns: dropDupCols };
        label = `Remover duplicados`;
        description = `Deduplicação por ${dropDupCols.length ? dropDupCols.join(', ') : 'tabela inteira'}`;
        break;
      case 'fillna':
      case 'fill_missing':
        updatedParams = { column: fillnaCol, method: fillnaMethod, customValue: fillnaVal };
        label = `Preencher nulos em ${fillnaCol}`;
        description = `Preenche ${fillnaCol} com ${fillnaMethod}`;
        break;
      case 'slice_rows':
        updatedParams = { limit: Number(sliceLimit) };
        label = `Limitar linhas para ${sliceLimit}`;
        description = `Mantém os primeiros ${sliceLimit} registros`;
        break;
      case 'join_dataset':
      case 'join_left':
      case 'join_inner':
      case 'join_outer':
        updatedParams = {
          otherDatasetId: joinOtherDatasetId,
          joinType,
          leftOn: joinLeftOn,
          rightOn: joinRightOn,
          prefix: joinPrefix,
        };
        label = `Join ${joinType.toUpperCase()} com ${joinOtherDatasetId}`;
        description = `Cruzamento em ${joinLeftOn} = ${joinRightOn}`;
        break;
      case 'pivot':
        updatedParams = {
          indexColumns: pivotIndexCols,
          pivotColumn: pivotCol,
          valueColumn: pivotValCol,
          aggFunction: pivotAggFunc,
        };
        label = `Pivot ${pivotValCol}`;
        description = `Transforma ${pivotCol} em colunas usando ${pivotAggFunc}`;
        break;
      case 'unpivot':
        updatedParams = {
          idVars: unpivotIdVars,
          valueVars: unpivotValueVars,
          varName: unpivotVarName,
          valueName: unpivotValueName,
        };
        label = `Unpivot ${unpivotValueVars.length} colunas`;
        description = `Transforma colunas em chave/valor`;
        break;
      case 'custom_code':
        updatedParams = { code: customCodeText };
        label = `Script personalizado`;
        description = `Executa código Python customizado`;
        break;
      case 'lower_case':
      case 'upper_case':
      case 'title_case':
      case 'trim_whitespace':
      case 'capitalize':
        updatedParams = { column: caseColumn };
        label = `Normalizar ${caseColumn}`;
        description = `Aplica transformação em ${caseColumn}`;
        break;
      case 'replace_text':
        updatedParams = { column: textReplaceCol, find: textReplaceFind, replace: textReplaceValue };
        label = `Substituir texto em ${textReplaceCol}`;
        description = `Troca '${textReplaceFind}' por '${textReplaceValue}'`;
        break;
      case 'substring':
        updatedParams = { column: substringCol, start: substringStart, length: substringLength };
        label = `Extrair trecho de ${substringCol}`;
        description = `Pega substring de ${substringCol}`;
        break;
      case 'concat_columns':
        updatedParams = { columns: concatCols, target: concatTarget, separator: concatSeparator };
        label = `Concatenar colunas em ${concatTarget}`;
        description = `Concatena colunas com separador '${concatSeparator}'`;
        break;
      case 'split_column':
        updatedParams = { column: splitCol, delimiter: splitDelimiter, newColumns: splitTargetCols };
        label = `Separar ${splitCol}`;
        description = `Divide ${splitCol} em múltiplas colunas`;
        break;
      case 'parse_date':
        updatedParams = { column: dateCol, format: dateFormat };
        label = `Converter data em ${dateCol}`;
        description = `Transforma ${dateCol} em data`;
        break;
    }

    onUpdateStepParams(activeStep.id, label, description, updatedParams);
  };

  const toggleColumnSelection = (col: string, list: string[], setList: (value: string[]) => void) => {
    if (list.includes(col)) {
      setList(list.filter((c) => c !== col));
    } else {
      setList([...list, col]);
    }
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden">
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
        {activeTab === 'code' ? (
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

            <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-3 overflow-auto font-mono text-[11px] text-slate-300 shadow-inner leading-relaxed select-text">
              <pre>{generatedCode}</pre>
            </div>

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
          <div className="flex-1 flex flex-col justify-between min-h-0">
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-300">Configurar: {activeStep.label}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-400 capitalize">
                  {activeStep.type}
                </span>
              </div>

              {activeStep.type === 'rename_column' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna Original</label>
                    <select value={renameFrom} onChange={(e) => setRenameFrom(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Novo Nome</label>
                    <input value={renameTo} onChange={(e) => setRenameTo(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {(activeStep.type === 'change_type' || activeStep.type === 'cast_to_string' || activeStep.type === 'cast_to_number' || activeStep.type === 'cast_to_boolean') && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select value={changeTypeCol} onChange={(e) => setChangeTypeCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Novo Tipo</label>
                    <select value={changeTypeTo} onChange={(e) => setChangeTypeTo(e.target.value as ColumnType)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="string">Texto</option>
                      <option value="number">Número</option>
                      <option value="boolean">Booleano</option>
                      <option value="date">Data</option>
                    </select>
                  </div>
                </div>
              )}

              {(activeStep.type === 'filter_rows' || activeStep.type === 'filter_equals' || activeStep.type === 'filter_not_equals' || activeStep.type === 'filter_contains' || activeStep.type === 'filter_not_contains') && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select value={filterCol} onChange={(e) => setFilterCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Operador</label>
                    <select value={filterOp} onChange={(e) => setFilterOp(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="equals">Igual a</option>
                      <option value="not_equals">Diferente de</option>
                      <option value="contains">Contém</option>
                      <option value="not_contains">Não contém</option>
                      <option value="greater_than">Maior que</option>
                      <option value="less_than">Menor que</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor</label>
                    <input value={filterVal} onChange={(e) => setFilterVal(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'filter_between' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna Numérica</label>
                    <select value={filterCol} onChange={(e) => setFilterCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Mínimo</label>
                    <input value={filterBetweenMin} onChange={(e) => setFilterBetweenMin(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Máximo</label>
                    <input value={filterBetweenMax} onChange={(e) => setFilterBetweenMax(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'drop_column' && (
                <div className="space-y-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Colunas a Excluir</label>
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 max-h-56 overflow-y-auto space-y-2">
                    {allColumns.map((col) => (
                      <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                        <input type="checkbox" checked={dropCols.includes(col)} onChange={() => toggleColumnSelection(col, dropCols, setDropCols)} className="rounded text-blue-500 bg-slate-800 border-slate-700 focus:ring-0" />
                        <span className="font-mono">{col}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeStep.type === 'add_column' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da Nova Coluna</label>
                    <input value={addColName} onChange={(e) => setAddColName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expressão</label>
                    <select value={addColType} onChange={(e) => setAddColType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="constant">Valor fixo</option>
                      <option value="math">Cálculo</option>
                      <option value="concatenate">Concatenação</option>
                      <option value="custom_python">Fórmula customizada</option>
                    </select>
                  </div>
                  {addColType === 'constant' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor constante</label>
                      <input value={addColConst} onChange={(e) => setAddColConst(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                  )}
                  {(addColType === 'math' || addColType === 'concatenate') && (
                    <div className="space-y-3.5 bg-slate-950 p-3 rounded-lg border border-slate-850">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Coluna A</label>
                        <select value={addColA} onChange={(e) => setAddColA(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white">
                          <option value="">Selecione...</option>
                          {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {addColType === 'math' && (
                        <div>
                          <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Operador</label>
                          <select value={addColOp} onChange={(e) => setAddColOp(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white">
                            <option value="+">Soma</option>
                            <option value="-">Subtração</option>
                            <option value="*">Multiplicação</option>
                            <option value="/">Divisão</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Coluna B</label>
                        <select value={addColB} onChange={(e) => setAddColB(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white">
                          <option value="">Selecione...</option>
                          {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeStep.type === 'group_by' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Agrupar por</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input type="checkbox" checked={groupByCols.includes(col)} onChange={() => toggleColumnSelection(col, groupByCols, setGroupByCols)} className="rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-0" />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna de Métrica</label>
                    <select value={groupByAggCol} onChange={(e) => setGroupByAggCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Função</label>
                    <select value={groupByAggFunc} onChange={(e) => setGroupByAggFunc(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="sum">Soma</option>
                      <option value="mean">Média</option>
                      <option value="count">Contagem</option>
                      <option value="max">Máximo</option>
                      <option value="min">Mínimo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da coluna destino</label>
                    <input value={groupByTarget} onChange={(e) => setGroupByTarget(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'sort_rows' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select value={sortCol} onChange={(e) => setSortCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Ordem</label>
                    <select value={sortAsc ? 'true' : 'false'} onChange={(e) => setSortAsc(e.target.value === 'true')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="true">Crescente</option>
                      <option value="false">Decrescente</option>
                    </select>
                  </div>
                </div>
              )}

              {(activeStep.type === 'drop_duplicates' || activeStep.type === 'remove_duplicates') && (
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Colunas para analisar</label>
                  <div className="bg-slate-950 rounded-lg p-2.5 max-h-56 overflow-y-auto space-y-1.5 border border-slate-800">
                    {allColumns.map((col) => (
                      <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                        <input type="checkbox" checked={dropDupCols.includes(col)} onChange={() => toggleColumnSelection(col, dropDupCols, setDropDupCols)} className="rounded text-teal-500 bg-slate-800 border-slate-700 focus:ring-0" />
                        <span className="font-mono">{col}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(activeStep.type === 'fillna' || activeStep.type === 'fill_missing') && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select value={fillnaCol} onChange={(e) => setFillnaCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Método</label>
                    <select value={fillnaMethod} onChange={(e) => setFillnaMethod(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="value">Valor fixo</option>
                      <option value="mean">Média</option>
                      <option value="median">Mediana</option>
                      <option value="ffill">Forward Fill</option>
                      <option value="bfill">Backward Fill</option>
                    </select>
                  </div>
                  {fillnaMethod === 'value' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor de substituição</label>
                      <input value={fillnaVal} onChange={(e) => setFillnaVal(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                    </div>
                  )}
                </div>
              )}

              {activeStep.type === 'slice_rows' && (
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Qtde de linhas</label>
                  <input type="number" value={sliceLimit} onChange={(e) => setSliceLimit(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" min={1} />
                </div>
              )}

              {(activeStep.type === 'join_dataset' || activeStep.type === 'join_left' || activeStep.type === 'join_inner' || activeStep.type === 'join_outer') && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tabela externa</label>
                    <select value={joinOtherDatasetId} onChange={(e) => setJoinOtherDatasetId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      <option value="sales">Vendas</option>
                      <option value="employees">Funcionários</option>
                      <option value="inventory">Estoque</option>
                      <option value="base_original">Tabela original</option>
                      {steps.filter((s) => s.id !== activeStep.id && s.type !== 'source').map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tipo de join</label>
                    <select value={joinType} onChange={(e) => setJoinType(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="left">Left</option>
                      <option value="inner">Inner</option>
                      <option value="right">Right</option>
                      <option value="outer">Outer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Chave atual</label>
                    <select value={joinLeftOn} onChange={(e) => setJoinLeftOn(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Chave externa</label>
                    <select value={joinRightOn} onChange={(e) => setJoinRightOn(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {otherDatasetColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Prefixo opcional</label>
                    <input value={joinPrefix} onChange={(e) => setJoinPrefix(e.target.value)} placeholder="ext_" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'pivot' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Índices</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input type="checkbox" checked={pivotIndexCols.includes(col)} onChange={() => toggleColumnSelection(col, pivotIndexCols, setPivotIndexCols)} className="rounded text-blue-500 bg-slate-800 border-slate-700 focus:ring-0" />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna pivô</label>
                    <select value={pivotCol} onChange={(e) => setPivotCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Valor</label>
                    <select value={pivotValCol} onChange={(e) => setPivotValCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Função de agregação</label>
                    <select value={pivotAggFunc} onChange={(e) => setPivotAggFunc(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="sum">Soma</option>
                      <option value="mean">Média</option>
                      <option value="count">Contagem</option>
                      <option value="max">Máximo</option>
                      <option value="min">Mínimo</option>
                    </select>
                  </div>
                </div>
              )}

              {activeStep.type === 'unpivot' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">ID columns</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input type="checkbox" checked={unpivotIdVars.includes(col)} onChange={() => toggleColumnSelection(col, unpivotIdVars, setUnpivotIdVars)} className="rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-0" />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Colunas para transformar</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input type="checkbox" checked={unpivotValueVars.includes(col)} onChange={() => toggleColumnSelection(col, unpivotValueVars, setUnpivotValueVars)} className="rounded text-purple-500 bg-slate-800 border-slate-700 focus:ring-0" />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da coluna de atributo</label>
                    <input value={unpivotVarName} onChange={(e) => setUnpivotVarName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da coluna de valor</label>
                    <input value={unpivotValueName} onChange={(e) => setUnpivotValueName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'custom_code' && (
                <div className="space-y-3.5">
                  <div className="bg-emerald-950/30 border border-emerald-900/60 p-2.5 rounded-xl text-[10px] text-emerald-400 leading-normal font-normal">
                    <p className="font-bold mb-1">💡 Código de Simulação Interativo:</p>
                    <p className="mb-1.5">Use o DataFrame <code className="bg-slate-950 px-1 py-0.5 rounded text-[9px]">df</code> e atribua valores em Python.</p>
                    <code className="block bg-slate-950 p-1.5 rounded text-[9px] font-mono leading-relaxed text-slate-300">df["Novo_Valor"] = df["Quantidade"] * 5</code>
                  </div>
                  <textarea value={customCodeText} onChange={(e) => setCustomCodeText(e.target.value)} rows={12} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-700 leading-relaxed" placeholder="# Escreva seu código Python aqui" />
                </div>
              )}

              {(activeStep.type === 'lower_case' || activeStep.type === 'upper_case' || activeStep.type === 'title_case' || activeStep.type === 'trim_whitespace' || activeStep.type === 'capitalize') && (
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                  <select value={caseColumn} onChange={(e) => setCaseColumn(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="">Selecione...</option>
                    {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {activeStep.type === 'replace_text' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select value={textReplaceCol} onChange={(e) => setTextReplaceCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Substituir</label>
                    <input value={textReplaceFind} onChange={(e) => setTextReplaceFind(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Por</label>
                    <input value={textReplaceValue} onChange={(e) => setTextReplaceValue(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'substring' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select value={substringCol} onChange={(e) => setSubstringCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Início</label>
                    <input type="number" value={substringStart} onChange={(e) => setSubstringStart(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tamanho</label>
                    <input type="number" value={substringLength} onChange={(e) => setSubstringLength(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'concat_columns' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Colunas a concatenar</label>
                    <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 border border-slate-800">
                      {allColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                          <input type="checkbox" checked={concatCols.includes(col)} onChange={() => toggleColumnSelection(col, concatCols, setConcatCols)} className="rounded text-pink-500 bg-slate-800 border-slate-700 focus:ring-0" />
                          <span className="font-mono">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nome da nova coluna</label>
                    <input value={concatTarget} onChange={(e) => setConcatTarget(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Separador</label>
                    <input value={concatSeparator} onChange={(e) => setConcatSeparator(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'split_column' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select value={splitCol} onChange={(e) => setSplitCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Delimitador</label>
                    <input value={splitDelimiter} onChange={(e) => setSplitDelimiter(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Novas colunas</label>
                    <input value={splitTargetCols.join(',')} onChange={(e) => setSplitTargetCols(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

              {activeStep.type === 'parse_date' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coluna</label>
                    <select value={dateCol} onChange={(e) => setDateCol(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecione...</option>
                      {allColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Formato</label>
                    <input value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              )}

            </div>

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
