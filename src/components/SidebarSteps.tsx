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
  Search
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
  category: 'Transformação' | 'Limpeza & Filtro' | 'Modelagem & Join' | 'Agregação & Código';
  accentClass: string;
}

export const NODE_CATALOG: NodeCatalogItem[] = [
  {
    type: 'filter_rows',
    label: 'Filtrar Linhas',
    shortDesc: 'Condição lógica (==, >, contém)',
    category: 'Limpeza & Filtro',
    accentClass: 'text-amber-400',
  },
  {
    type: 'fillna',
    label: 'Preencher Nulos',
    shortDesc: 'Imputar média, mediana ou fixo',
    category: 'Limpeza & Filtro',
    accentClass: 'text-violet-400',
  },
  {
    type: 'drop_duplicates',
    label: 'Remover Duplicados',
    shortDesc: 'Deduplicar linhas por chave',
    category: 'Limpeza & Filtro',
    accentClass: 'text-teal-400',
  },
  {
    type: 'slice_rows',
    label: 'Limitar Linhas',
    shortDesc: 'Amostrar N primeiros registros',
    category: 'Limpeza & Filtro',
    accentClass: 'text-orange-400',
  },
  {
    type: 'add_column',
    label: 'Coluna Calculada',
    shortDesc: 'Fórmula matemática ou constante',
    category: 'Transformação',
    accentClass: 'text-emerald-400',
  },
  {
    type: 'rename_column',
    label: 'Renomear Coluna',
    shortDesc: 'Alterar identificador no schema',
    category: 'Transformação',
    accentClass: 'text-purple-400',
  },
  {
    type: 'change_type',
    label: 'Converter Tipo',
    shortDesc: 'Cast para float, str, bool, data',
    category: 'Transformação',
    accentClass: 'text-pink-400',
  },
  {
    type: 'drop_column',
    label: 'Remover Colunas',
    shortDesc: 'Descartar colunas desnecessárias',
    category: 'Transformação',
    accentClass: 'text-rose-400',
  },
  {
    type: 'join_dataset',
    label: 'Join / Merge',
    shortDesc: 'Cruzar duas tabelas por chave',
    category: 'Modelagem & Join',
    accentClass: 'text-indigo-400',
  },
  {
    type: 'pivot',
    label: 'Tabela Dinâmica (Pivot)',
    shortDesc: 'Transformar valores em colunas',
    category: 'Modelagem & Join',
    accentClass: 'text-fuchsia-400',
  },
  {
    type: 'unpivot',
    label: 'Unpivot (Melt)',
    shortDesc: 'Transformar colunas em linhas',
    category: 'Modelagem & Join',
    accentClass: 'text-purple-400',
  },
  {
    type: 'group_by',
    label: 'Agrupar (Group By)',
    shortDesc: 'Soma, média, contagem por grupo',
    category: 'Agregação & Código',
    accentClass: 'text-blue-400',
  },
  {
    type: 'sort_rows',
    label: 'Ordenar Linhas',
    shortDesc: 'Classificação crescente/decrescente',
    category: 'Agregação & Código',
    accentClass: 'text-cyan-400',
  },
  {
    type: 'custom_code',
    label: 'Script Python',
    shortDesc: 'Transformação livre em Pandas',
    category: 'Agregação & Código',
    accentClass: 'text-emerald-400',
  },
];

export function buildDefaultStepPayload(type: StepType, availableColumns: string[] = []): { label: string; params: any } {
  const firstCol = availableColumns[0] || '';
  const secondCol = availableColumns[1] || firstCol;
  const numCol = availableColumns.find((c) =>
    ['Quantidade', 'Preco_Unitario', 'Desconto', 'Salario', 'Estoque_Atual', 'Preco_Venda'].includes(c)
  ) || firstCol;

  switch (type) {
    case 'filter_rows':
      return {
        label: 'Filtrar Linhas',
        params: { column: firstCol, operator: 'is_not_null', value: '' },
      };
    case 'sort_rows':
      return {
        label: 'Ordenar Linhas',
        params: { column: numCol || firstCol, ascending: false },
      };
    case 'drop_column':
      return {
        label: 'Remover Colunas',
        params: { columns: secondCol ? [secondCol] : [] },
      };
    case 'rename_column':
      return {
        label: 'Renomear Coluna',
        params: { from: firstCol, to: firstCol ? `${firstCol}_novo` : 'coluna_renomeada' },
      };
    case 'change_type':
      return {
        label: 'Converter Tipo',
        params: { column: firstCol, toType: 'string' },
      };
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
    case 'fillna':
      return {
        label: 'Preencher Nulos',
        params: {
          column: availableColumns.includes('Quantidade') ? 'Quantidade' : numCol,
          method: 'value',
          customValue: '1',
        },
      };
    case 'drop_duplicates':
      return {
        label: 'Remover Duplicados',
        params: { columns: [] },
      };
    case 'group_by':
      return {
        label: 'Agrupar por (Group By)',
        params: {
          groupByColumns: availableColumns.includes('Regiao') ? ['Regiao'] : firstCol ? [firstCol] : [],
          aggColumn: numCol,
          aggFunction: 'sum',
          targetColumnName: 'Total_Agrupado',
        },
      };
    case 'slice_rows':
      return {
        label: 'Limitar Linhas',
        params: { limit: 8 },
      };
    case 'join_dataset':
      return {
        label: 'Join com Estoque',
        params: {
          otherDatasetId: 'inventory',
          joinType: 'left',
          leftOn: availableColumns.includes('Produto') ? 'Produto' : firstCol,
          rightOn: 'Nome_Produto',
          prefix: 'est_',
        },
      };
    case 'pivot':
      return {
        label: 'Tabela Dinâmica (Pivot)',
        params: {
          indexColumns: availableColumns.includes('Regiao') ? ['Regiao'] : firstCol ? [firstCol] : [],
          pivotColumn: availableColumns.includes('Produto') ? 'Produto' : secondCol,
          valueColumn: numCol,
          aggFunction: 'sum',
        },
      };
    case 'unpivot':
      return {
        label: 'Unpivot (Melt)',
        params: {
          idVars: firstCol ? [firstCol] : [],
          valueVars: secondCol ? [secondCol] : [],
          varName: 'atributo',
          valueName: 'valor',
        },
      };
    case 'custom_code':
      return {
        label: 'Script Python',
        params: {
          code: '# O DataFrame atual está disponível como df\ndf["Margem_Estimada"] = df["Preco_Unitario"] * 0.35\n',
        },
      };
    default:
      return {
        label: 'Transformação',
        params: {},
      };
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
        return <Database className={`${className} text-blue-400`} />;
      case 'rename_column':
        return <Type className={`${className} text-purple-400`} />;
      case 'change_type':
        return <Type className={`${className} text-pink-400`} />;
      case 'filter_rows':
        return <Filter className={`${className} text-amber-400`} />;
      case 'drop_column':
        return <Trash2 className={`${className} text-rose-400`} />;
      case 'add_column':
        return <Calculator className={`${className} text-emerald-400`} />;
      case 'group_by':
        return <Layers className={`${className} text-indigo-400`} />;
      case 'sort_rows':
        return <ArrowDownAZ className={`${className} text-cyan-400`} />;
      case 'drop_duplicates':
        return <CopyX className={`${className} text-teal-400`} />;
      case 'fillna':
        return <Sparkles className={`${className} text-violet-400`} />;
      case 'slice_rows':
        return <Scissors className={`${className} text-orange-400`} />;
      case 'join_dataset':
        return <GitFork className={`${className} text-indigo-400 rotate-90`} />;
      case 'pivot':
        return <Table2 className={`${className} text-fuchsia-400`} />;
      case 'unpivot':
        return <Columns className={`${className} text-purple-400`} />;
      case 'custom_code':
        return <Code2 className={`${className} text-emerald-400`} />;
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
      {/* Segmented Switcher: Node Palette vs Active Graph Sequence */}
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
          {/* Search Input */}
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

          {/* Categorized Draggable Nodes */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
            {categories.map((cat) => (
              <div key={cat} className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 px-1 pt-1">
                  {cat}
                </div>
                <div className="space-y-1.5">
                  {filteredCatalog
                    .filter((item) => item.category === cat)
                    .map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.type)}
                        onClick={() => handleQuickAdd(item.type)}
                        className="group flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-blue-500/60 hover:bg-slate-800/60 transition-colors cursor-grab active:cursor-grabbing"
                        title="Arraste para o editor de nós ou clique para adicionar"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                        <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          {getStepIcon(item.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {item.shortDesc}
                          </div>
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
        /* PIPELINE SEQUENCE LIST */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-[11px] text-slate-400 px-1 pb-1">
            Ordem topológica de execução dos nós no pipeline:
          </p>
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
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {getStepIcon(step.type, 'w-3.5 h-3.5')}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold truncate">
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span className="truncate">{step.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {step.description}
                  </p>
                </div>

                {!isSource && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onMoveStep && idx > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveStep(step.id, 'up');
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}
                    {onMoveStep && idx < steps.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveStep(step.id, 'down');
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}
                    {onDuplicateStep && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateStep(step.id);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800 cursor-pointer"
                        title="Duplicar nó"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStep(step.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                      title="Remover nó"
                    >
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
