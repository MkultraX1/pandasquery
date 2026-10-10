import React, { useState } from 'react';
import {
  Database,
  Type,
  Filter,
  Trash2,
  Calculator,
  Layers,
  ArrowDownAZ,
  CopyX,
  Sparkles,
  Scissors,
  Plus,
  Settings,
  GitFork,
  Table2,
  Columns,
  Code2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Search,
  Wand2,
  CalendarRange,
  FileText,
  Hash,
  Braces,
} from 'lucide-react';
import { AppliedStep, StepType } from '../types';

interface SidebarStepsProps {
  steps: AppliedStep[];
  activeStepId: string;
  onSelectStep: (id: string) => void;
  onDeleteStep: (id: string) => void;
  onAddStep: (type: StepType, label: string, params: any, position?: { x: number; y: number }, insertAfterId?: string) => void;
  onMoveStep?: (stepId: string, direction: 'up' | 'down') => void;
  onDuplicateStep?: (stepId: string) => void;
  availableColumns?: string[];
}

interface NodeCatalogItem {
  type: StepType;
  label: string;
  shortDesc: string;
  category: 'Origem' | 'Limpeza' | 'Textos' | 'Datas' | 'Colunas' | 'Filtros' | 'Agregação' | 'Junções' | 'Tabela' | 'Avançado';
  accentClass: string;
}

export const NODE_CATALOG: NodeCatalogItem[] = [
  { type: 'source_csv', label: 'CSV', shortDesc: 'Carregar arquivo CSV', category: 'Origem', accentClass: 'text-blue-400' },
  { type: 'source_excel', label: 'Excel', shortDesc: 'Carregar planilha Excel', category: 'Origem', accentClass: 'text-blue-400' },
  { type: 'source_json', label: 'JSON', shortDesc: 'Carregar objeto JSON', category: 'Origem', accentClass: 'text-blue-400' },
  { type: 'source_parquet', label: 'Parquet', shortDesc: 'Carregar Parquet', category: 'Origem', accentClass: 'text-blue-400' },
  { type: 'source_database', label: 'Banco', shortDesc: 'Conectar a fonte externa', category: 'Origem', accentClass: 'text-blue-400' },
  { type: 'source_api', label: 'API', shortDesc: 'Consumir serviço HTTP', category: 'Origem', accentClass: 'text-blue-400' },
  { type: 'source_manual_table', label: 'Tabela Manual', shortDesc: 'Criar dados inline', category: 'Origem', accentClass: 'text-blue-400' },

  { type: 'drop_nulls', label: 'Remover Nulos', shortDesc: 'Remove linhas com valor nulo', category: 'Limpeza', accentClass: 'text-violet-400' },
  { type: 'fill_missing', label: 'Preencher Falta', shortDesc: 'Substitui valores ausentes', category: 'Limpeza', accentClass: 'text-violet-400' },
  { type: 'trim_whitespace', label: 'Remover Espaços', shortDesc: 'Limpa espaços em torno do texto', category: 'Limpeza', accentClass: 'text-violet-400' },
  { type: 'remove_duplicates', label: 'Remover Duplicados', shortDesc: 'Deduplicar por coluna ou linha', category: 'Limpeza', accentClass: 'text-teal-400' },
  { type: 'rename_column', label: 'Renomear Coluna', shortDesc: 'Alterar identificador do campo', category: 'Limpeza', accentClass: 'text-purple-400' },
  { type: 'drop_column', label: 'Remover Colunas', shortDesc: 'Descarta colunas selecionadas', category: 'Limpeza', accentClass: 'text-rose-400' },

  { type: 'lower_case', label: 'Lower Case', shortDesc: 'Converte para minúsculas', category: 'Textos', accentClass: 'text-pink-400' },
  { type: 'upper_case', label: 'Upper Case', shortDesc: 'Converte para maiúsculas', category: 'Textos', accentClass: 'text-pink-400' },
  { type: 'title_case', label: 'Title Case', shortDesc: 'Primeiras letras em maiúsculas', category: 'Textos', accentClass: 'text-pink-400' },
  { type: 'replace_text', label: 'Substituir Texto', shortDesc: 'Troca valor por outro valor', category: 'Textos', accentClass: 'text-pink-400' },
  { type: 'split_column', label: 'Separar Texto', shortDesc: 'Divide uma coluna por delimitador', category: 'Textos', accentClass: 'text-pink-400' },
  { type: 'substring', label: 'Extrair Trecho', shortDesc: 'Pega parte do texto', category: 'Textos', accentClass: 'text-pink-400' },
  { type: 'concat_columns', label: 'Concatenar Colunas', shortDesc: 'Junta vários campos numa nova coluna', category: 'Textos', accentClass: 'text-pink-400' },
  { type: 'text_length', label: 'Comprimento', shortDesc: 'Calcula tamanho do texto', category: 'Textos', accentClass: 'text-pink-400' },

  { type: 'parse_date', label: 'Converter Data', shortDesc: 'Interpreta texto como data', category: 'Datas', accentClass: 'text-amber-500' },
  { type: 'format_date', label: 'Formatar Data', shortDesc: 'Altera máscara de data', category: 'Datas', accentClass: 'text-amber-500' },
  { type: 'add_days', label: 'Adicionar Dias', shortDesc: 'Incrementa datas', category: 'Datas', accentClass: 'text-amber-500' },
  { type: 'date_difference', label: 'Diferença de Datas', shortDesc: 'Calcula intervalo entre datas', category: 'Datas', accentClass: 'text-amber-500' },
  { type: 'extract_year', label: 'Ano', shortDesc: 'Extrai o ano', category: 'Datas', accentClass: 'text-amber-500' },
  { type: 'extract_month', label: 'Mês', shortDesc: 'Extrai o mês', category: 'Datas', accentClass: 'text-amber-500' },

  { type: 'add_column', label: 'Coluna Calculada', shortDesc: 'Fórmula matemática ou constante', category: 'Colunas', accentClass: 'text-emerald-400' },
  { type: 'multiply_columns', label: 'Multiplicar Colunas', shortDesc: 'Multiplica valores de duas colunas', category: 'Colunas', accentClass: 'text-emerald-400' },
  { type: 'divide_columns', label: 'Dividir Colunas', shortDesc: 'Divide uma coluna por outra', category: 'Colunas', accentClass: 'text-emerald-400' },
  { type: 'percentage_of', label: 'Percentual', shortDesc: 'Calcula percentual de um total', category: 'Colunas', accentClass: 'text-emerald-400' },
  { type: 'round_number', label: 'Arredondar', shortDesc: 'Ajusta casas decimais', category: 'Colunas', accentClass: 'text-emerald-400' },
  { type: 'abs_value', label: 'Valor Absoluto', shortDesc: 'Remove sinal negativo', category: 'Colunas', accentClass: 'text-emerald-400' },

  { type: 'filter_equals', label: 'Igual a', shortDesc: 'Mantém registros iguais ao valor', category: 'Filtros', accentClass: 'text-amber-400' },
  { type: 'filter_not_equals', label: 'Diferente de', shortDesc: 'Exclui valor específico', category: 'Filtros', accentClass: 'text-amber-400' },
  { type: 'filter_between', label: 'Entre valores', shortDesc: 'Filtra intervalo numérico', category: 'Filtros', accentClass: 'text-amber-400' },
  { type: 'filter_contains', label: 'Contém texto', shortDesc: 'Filtra por substring', category: 'Filtros', accentClass: 'text-amber-400' },
  { type: 'filter_not_contains', label: 'Não contém', shortDesc: 'Exclui registros com texto', category: 'Filtros', accentClass: 'text-amber-400' },
  { type: 'if_else', label: 'If / Else', shortDesc: 'Cria lógica condicional', category: 'Filtros', accentClass: 'text-amber-400' },

  { type: 'group_by', label: 'Agrupar', shortDesc: 'Soma, média ou contagem por grupo', category: 'Agregação', accentClass: 'text-blue-400' },
  { type: 'aggregate_sum', label: 'Somar', shortDesc: 'Soma valores da coluna', category: 'Agregação', accentClass: 'text-blue-400' },
  { type: 'aggregate_mean', label: 'Média', shortDesc: 'Calcula média da coluna', category: 'Agregação', accentClass: 'text-blue-400' },
  { type: 'aggregate_count', label: 'Contagem', shortDesc: 'Conta registros', category: 'Agregação', accentClass: 'text-blue-400' },
  { type: 'aggregate_max', label: 'Máximo', shortDesc: 'Valor máximo da coluna', category: 'Agregação', accentClass: 'text-blue-400' },
  { type: 'aggregate_min', label: 'Mínimo', shortDesc: 'Valor mínimo da coluna', category: 'Agregação', accentClass: 'text-blue-400' },
  { type: 'top_n', label: 'Top N', shortDesc: 'Mantém os maiores registros', category: 'Agregação', accentClass: 'text-blue-400' },

  { type: 'join_dataset', label: 'Join / Merge', shortDesc: 'Cruzar duas tabelas por chave', category: 'Junções', accentClass: 'text-indigo-400' },
  { type: 'join_left', label: 'Left Join', shortDesc: 'Mantém todas da tabela principal', category: 'Junções', accentClass: 'text-indigo-400' },
  { type: 'join_inner', label: 'Inner Join', shortDesc: 'Mantém apenas correspondências', category: 'Junções', accentClass: 'text-indigo-400' },
  { type: 'join_outer', label: 'Full Join', shortDesc: 'Mantém todas de ambas', category: 'Junções', accentClass: 'text-indigo-400' },
  { type: 'lookup_value', label: 'Lookup', shortDesc: 'Busca valor em tabela de referência', category: 'Junções', accentClass: 'text-indigo-400' },

  { type: 'pivot', label: 'Tabela Dinâmica', shortDesc: 'Transforma valores em colunas', category: 'Tabela', accentClass: 'text-fuchsia-400' },
  { type: 'unpivot', label: 'Unpivot', shortDesc: 'Transforma colunas em linhas', category: 'Tabela', accentClass: 'text-purple-400' },
  { type: 'reorder_columns', label: 'Reordenar Colunas', shortDesc: 'Organiza ordem das colunas', category: 'Tabela', accentClass: 'text-fuchsia-400' },
  { type: 'transpose', label: 'Transpor', shortDesc: 'Troca linhas por colunas', category: 'Tabela', accentClass: 'text-fuchsia-400' },

  { type: 'custom_code', label: 'Script Python', shortDesc: 'Transformação livre em Pandas', category: 'Avançado', accentClass: 'text-emerald-400' },
  { type: 'custom_sql', label: 'SQL Custom', shortDesc: 'Consulta SQL sobre os dados', category: 'Avançado', accentClass: 'text-emerald-400' },
  { type: 'ai_classify_text', label: 'IA: Classificar', shortDesc: 'Classifica texto por categoria', category: 'Avançado', accentClass: 'text-cyan-400' },
  { type: 'ai_extract_entity', label: 'IA: Extrair Entidade', shortDesc: 'Identifica nomes, datas e valores', category: 'Avançado', accentClass: 'text-cyan-400' },
  { type: 'semantic_join', label: 'Juncão Semântica', shortDesc: 'Relaciona registros por similaridade', category: 'Avançado', accentClass: 'text-cyan-400' },
];

export function buildDefaultStepPayload(type: StepType, availableColumns: string[] = []): { label: string; params: any } {
  const firstCol = availableColumns[0] || '';
  const secondCol = availableColumns[1] || firstCol;
  const numCol = availableColumns.find((c) => ['Quantidade', 'Preco_Unitario', 'Desconto', 'Salario', 'Estoque_Atual', 'Preco_Venda', 'Valor'].includes(c)) || firstCol;

  switch (type) {
    case 'filter_rows':
      return { label: 'Filtrar Linhas', params: { column: firstCol, operator: 'is_not_null', value: '' } };
    case 'filter_equals':
      return { label: 'Igual a', params: { column: firstCol, value: '', operator: 'equals' } };
    case 'filter_not_equals':
      return { label: 'Diferente de', params: { column: firstCol, value: '', operator: 'not_equals' } };
    case 'filter_between':
      return { label: 'Entre valores', params: { column: numCol || firstCol, min: '0', max: '100', operator: 'between' } };
    case 'filter_contains':
      return { label: 'Contém texto', params: { column: firstCol, value: '', operator: 'contains' } };
    case 'filter_not_contains':
      return { label: 'Não contém', params: { column: firstCol, value: '', operator: 'not_contains' } };
    case 'sort_rows':
      return { label: 'Ordenar Linhas', params: { column: numCol || firstCol, ascending: false } };
    case 'drop_column':
      return { label: 'Remover Colunas', params: { columns: secondCol ? [secondCol] : [] } };
    case 'rename_column':
      return { label: 'Renomear Coluna', params: { from: firstCol, to: firstCol ? `${firstCol}_novo` : 'coluna_renomeada' } };
    case 'change_type':
      return { label: 'Converter Tipo', params: { column: firstCol, toType: 'string' } };
    case 'add_column':
      return {
        label: 'Coluna Calculada',
        params: {
          columnName: 'Receita_Bruta',
          expressionType: availableColumns.includes('Quantidade') && availableColumns.includes('Preco_Unitario') ? 'math' : 'constant',
          colA: availableColumns.includes('Quantidade') ? 'Quantidade' : firstCol,
          operator: '*',
          colB: availableColumns.includes('Preco_Unitario') ? 'Preco_Unitario' : secondCol,
          constantValue: '100',
        },
      };
    case 'fill_missing':
    case 'fillna':
      return { label: 'Preencher Falta', params: { column: availableColumns.includes('Quantidade') ? 'Quantidade' : numCol, method: 'value', customValue: '0' } };
    case 'drop_nulls':
      return { label: 'Remover Nulos', params: { column: firstCol } };
    case 'remove_duplicates':
    case 'drop_duplicates':
      return { label: 'Remover Duplicados', params: { columns: [] } };
    case 'group_by':
      return { label: 'Agrupar', params: { groupByColumns: availableColumns.includes('Regiao') ? ['Regiao'] : firstCol ? [firstCol] : [], aggColumn: numCol, aggFunction: 'sum', targetColumnName: 'Total_Agrupado' } };
    case 'aggregate_sum':
      return { label: 'Somar', params: { column: numCol || firstCol, groupByColumns: [], aggFunction: 'sum', targetColumnName: 'total' } };
    case 'aggregate_mean':
      return { label: 'Média', params: { column: numCol || firstCol, groupByColumns: [], aggFunction: 'mean', targetColumnName: 'media' } };
    case 'slice_rows':
      return { label: 'Limitar Linhas', params: { limit: 8 } };
    case 'join_dataset':
    case 'join_left':
    case 'join_inner':
    case 'join_outer':
      return { label: 'Join com Estoque', params: { otherDatasetId: 'inventory', joinType: 'left', leftOn: availableColumns.includes('Produto') ? 'Produto' : firstCol, rightOn: 'Nome_Produto', prefix: 'est_' } };
    case 'pivot':
      return { label: 'Tabela Dinâmica', params: { indexColumns: availableColumns.includes('Regiao') ? ['Regiao'] : firstCol ? [firstCol] : [], pivotColumn: availableColumns.includes('Produto') ? 'Produto' : secondCol, valueColumn: numCol, aggFunction: 'sum' } };
    case 'unpivot':
      return { label: 'Unpivot', params: { idVars: firstCol ? [firstCol] : [], valueVars: secondCol ? [secondCol] : [], varName: 'atributo', valueName: 'valor' } };
    case 'lower_case':
      return { label: 'Lower Case', params: { column: firstCol } };
    case 'upper_case':
      return { label: 'Upper Case', params: { column: firstCol } };
    case 'trim_whitespace':
      return { label: 'Remover Espaços', params: { column: firstCol } };
    case 'replace_text':
      return { label: 'Substituir Texto', params: { column: firstCol, find: '', replace: '' } };
    case 'substring':
      return { label: 'Extrair Trecho', params: { column: firstCol, start: 0, length: 5 } };
    case 'concat_columns':
      return { label: 'Concatenar Colunas', params: { columns: [firstCol, secondCol], target: 'texto_combinado', separator: ' ' } };
    case 'split_column':
      return { label: 'Separar Texto', params: { column: firstCol, delimiter: ',', newColumns: ['valor_1', 'valor_2'] } };
    case 'parse_date':
      return { label: 'Converter Data', params: { column: firstCol, format: 'YYYY-MM-DD' } };
    case 'custom_code':
      return { label: 'Script Python', params: { code: '# O DataFrame atual está disponível como df\ndf["Margem_Estimada"] = df["Preco_Unitario"] * 0.35\n' } };
    default:
      return { label: 'Transformação', params: {} };
  }
}

export default function SidebarSteps({
  steps,
  activeStepId,
  onSelectStep,
  onDeleteStep,
  onAddStep,
  onMoveStep,
  onDuplicateStep,
  availableColumns = [],
}: SidebarStepsProps) {
  const [sidebarTab, setSidebarTab] = useState<'palette' | 'pipeline'>('palette');
  const [searchQuery, setSearchQuery] = useState('');

  const getStepIcon = (type: StepType, className = 'w-4 h-4 shrink-0') => {
    switch (type) {
      case 'source':
      case 'source_csv':
      case 'source_excel':
      case 'source_json':
      case 'source_parquet':
      case 'source_database':
      case 'source_api':
      case 'source_sql':
      case 'source_google_sheet':
      case 'source_manual_table':
        return <Database className={`${className} text-blue-400`} />;
      case 'rename_column':
      case 'lower_case':
      case 'upper_case':
      case 'title_case':
      case 'capitalize':
      case 'normalize_case':
        return <Type className={`${className} text-purple-400`} />;
      case 'change_type':
      case 'cast_to_string':
      case 'cast_to_number':
      case 'cast_to_boolean':
      case 'parse_date':
      case 'format_date':
      case 'extract_year':
      case 'extract_month':
      case 'extract_day':
        return <Type className={`${className} text-pink-400`} />;
      case 'filter_rows':
      case 'filter_equals':
      case 'filter_not_equals':
      case 'filter_between':
      case 'filter_contains':
      case 'filter_not_contains':
      case 'filter_is_null':
      case 'filter_is_not_null':
      case 'filter_in_list':
      case 'filter_not_in_list':
      case 'if_else':
        return <Filter className={`${className} text-amber-400`} />;
      case 'drop_column':
      case 'drop_nulls':
        return <Trash2 className={`${className} text-rose-400`} />;
      case 'add_column':
      case 'add_columns':
      case 'multiply_columns':
      case 'divide_columns':
      case 'percentage_of':
      case 'abs_value':
      case 'round_number':
      case 'floor_value':
      case 'ceil_value':
      case 'cumulative_sum':
      case 'running_total':
        return <Calculator className={`${className} text-emerald-400`} />;
      case 'group_by':
      case 'aggregate_sum':
      case 'aggregate_mean':
      case 'aggregate_min':
      case 'aggregate_max':
      case 'aggregate_count':
      case 'aggregate_median':
      case 'aggregate_unique_count':
      case 'top_n':
      case 'bottom_n':
        return <Layers className={`${className} text-indigo-400`} />;
      case 'sort_rows':
        return <ArrowDownAZ className={`${className} text-cyan-400`} />;
      case 'drop_duplicates':
      case 'remove_duplicates':
        return <CopyX className={`${className} text-teal-400`} />;
      case 'fillna':
      case 'fill_missing':
        return <Sparkles className={`${className} text-violet-400`} />;
      case 'slice_rows':
        return <Scissors className={`${className} text-orange-400`} />;
      case 'join_dataset':
      case 'join_left':
      case 'join_inner':
      case 'join_right':
      case 'join_outer':
      case 'lookup_value':
      case 'semantic_join':
        return <GitFork className={`${className} text-indigo-400 rotate-90`} />;
      case 'pivot':
      case 'unpivot':
      case 'reorder_columns':
      case 'transpose':
        return <Table2 className={`${className} text-fuchsia-400`} />;
      case 'replace_text':
      case 'split_column':
      case 'substring':
      case 'concat_columns':
      case 'merge_columns':
      case 'text_length':
      case 'regex_extract':
      case 'regex_replace':
        return <FileText className={`${className} text-pink-400`} />;
      case 'custom_code':
      case 'custom_sql':
        return <Code2 className={`${className} text-emerald-400`} />;
      case 'ai_classify_text':
      case 'ai_extract_entity':
      case 'ai_translate_text':
      case 'ai_summarize_text':
        return <Wand2 className={`${className} text-cyan-400`} />;
      default:
        return <Settings className={`${className} text-slate-400`} />;
    }
  };

  const handleQuickAdd = (type: StepType) => {
    const { label, params } = buildDefaultStepPayload(type, availableColumns);
    onAddStep(type, label, params);
  };

  const handleDragStart = (e: React.DragEvent, type: StepType) => {
    e.dataTransfer.setData('application/etl-node-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const filteredCatalog = NODE_CATALOG.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filteredCatalog.map((i) => i.category)));

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1">
          <button
            onClick={() => setSidebarTab('palette')}
            className={`flex-1 py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              sidebarTab === 'palette'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Biblioteca de Nós
          </button>
          <button
            onClick={() => setSidebarTab('pipeline')}
            className={`flex-1 py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              sidebarTab === 'pipeline'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Grafo ({steps.length})
          </button>
        </div>
      </div>

      {sidebarTab === 'palette' ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar nó de transformação..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-snug">
              Arraste um nó para o canvas ou clique para conectar ao nó selecionado.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
            {categories.map((cat) => (
              <div key={cat} className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 px-1 pt-1">{cat}</div>
                <div className="space-y-1.5">
                  {filteredCatalog
                    .filter((item) => item.category === cat)
                    .map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.type)}
                        onClick={() => handleQuickAdd(item.type)}
                        className="group flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-blue-500/60 hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Arraste para o editor de nós ou clique para adicionar"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                        <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          {getStepIcon(item.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">{item.label}</div>
                          <div className="text-[11px] text-slate-500 truncate">{item.shortDesc}</div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0" />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-[11px] text-slate-400 px-1 pb-1">Ordem topológica de execução dos nós no pipeline:</p>
          {steps.map((step, idx) => {
            const isActive = step.id === activeStepId;
            const isSource = step.type === 'source';

            return (
              <div
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`group flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-600/15 border-blue-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                  {getStepIcon(step.type, 'w-3.5 h-3.5')}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold truncate">
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">0{idx + 1}.</span>
                    <span className="truncate">{step.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{step.description}</p>
                </div>

                {!isSource && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onMoveStep && idx > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); onMoveStep(step.id, 'up'); }} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer" title="Mover para cima">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}
                    {onMoveStep && idx < steps.length - 1 && (
                      <button onClick={(e) => { e.stopPropagation(); onMoveStep(step.id, 'down'); }} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer" title="Mover para baixo">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}
                    {onDuplicateStep && (
                      <button onClick={(e) => { e.stopPropagation(); onDuplicateStep(step.id); }} className="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800 cursor-pointer" title="Duplicar nó">
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDeleteStep(step.id); }} className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer" title="Remover nó">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
