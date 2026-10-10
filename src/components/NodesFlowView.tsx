import React, { useState, useRef, useMemo } from 'react';
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
  Settings,
  ArrowRight,
  GitFork,
  Plus,
  Table2,
  Code2,
  Columns,
  Workflow,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  Hash,
  Calendar,
  ToggleLeft,
  X
} from 'lucide-react';
import { AppliedStep, Column, Dataset, NodePosition, StepType } from '../types';
import { runPipeline } from '../utils/engine';
import { NODE_CATALOG, buildDefaultStepPayload } from './SidebarSteps';

interface NodesFlowViewProps {
  steps: AppliedStep[];
  activeStepId: string;
  onSelectStep: (id: string) => void;
  onDeleteStep: (id: string) => void;
  rawDataset: Dataset;
  allDatasets: Dataset[];
  onAddStep: (
    type: StepType,
    label: string,
    params: any,
    position?: NodePosition,
    insertAfterId?: string
  ) => void;
  onUpdateStepPosition: (
    stepId: string,
    position: NodePosition,
    isExternalNode?: boolean
  ) => void;
  onUpdateStepParams: (
    stepId: string,
    label: string,
    description: string,
    params: any
  ) => void;
  onDuplicateStep: (stepId: string) => void;
  onAutoLayout: () => void;
}

const NODE_WIDTH = 268;
const NODE_HEIGHT = 216;
const EXT_NODE_WIDTH = 220;
const EXT_NODE_HEIGHT = 84;

export default function NodesFlowView({
  steps,
  activeStepId,
  onSelectStep,
  onDeleteStep,
  rawDataset,
  allDatasets,
  onAddStep,
  onUpdateStepPosition,
  onUpdateStepParams,
  onDuplicateStep,
  onAutoLayout,
}: NodesFlowViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Viewport Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 48, y: 120 });
  const [zoom, setZoom] = useState<number>(0.95);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Canvas interaction states
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node dragging state
  const [draggingNode, setDraggingNode] = useState<{
    stepId: string;
    isExternal: boolean;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Wire dragging state (drag from output port to create/connect)
  const [connectingWire, setConnectingWire] = useState<{
    fromStepId: string;
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);

  // Quick Add Node Popover on canvas (when dropping wire or clicking + on wire/port)
  const [nodePickerModal, setNodePickerModal] = useState<{
    insertAfterId: string;
    canvasX: number;
    canvasY: number;
  } | null>(null);

  // Bottom Live Data Drawer state
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(true);
  const [previewSearch, setPreviewSearch] = useState<string>('');

  // Pre-calculate pipeline results at every step for instant metrics, schema diffs & preview
  const stepResults = useMemo(() => {
    const map: Record<string, { data: any[]; columns: Column[] }> = {};
    for (const step of steps) {
      try {
        map[step.id] = runPipeline(rawDataset, steps, step.id, allDatasets);
      } catch (e) {
        map[step.id] = { data: [], columns: [] };
      }
    }
    return map;
  }, [rawDataset, steps, allDatasets]);

  const activeResult = stepResults[activeStepId] || {
    data: rawDataset.data,
    columns: rawDataset.columns,
  };
  const activeStepObj = steps.find((s) => s.id === activeStepId) || steps[0];

  // Resolve guaranteed 2D coordinates for each step
  const getStepCoords = (step: AppliedStep, idx: number): NodePosition => {
    if (step.position) return step.position;
    return {
      x: idx * 340 + 40,
      y: idx % 2 === 0 ? 140 : 170,
    };
  };

  const getExternalNodeCoords = (step: AppliedStep, idx: number): NodePosition => {
    if (step.externalNodePosition) return step.externalNodePosition;
    const mainPos = getStepCoords(step, idx);
    return {
      x: mainPos.x - 280,
      y: mainPos.y + 135,
    };
  };

  // Convert screen clientX/clientY to canvas coordinates
  const screenToCanvas = (clientX: number, clientY: number): NodePosition => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Mouse handlers on the canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // Close picker if open
    if (nodePickerModal) {
      setNodePickerModal(null);
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingNode) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      let nextX = pt.x - draggingNode.offsetX;
      let nextY = pt.y - draggingNode.offsetY;
      if (snapToGrid) {
        nextX = Math.round(nextX / 16) * 16;
        nextY = Math.round(nextY / 16) * 16;
      }
      onUpdateStepPosition(
        draggingNode.stepId,
        { x: nextX, y: nextY },
        draggingNode.isExternal
      );
      return;
    }

    if (connectingWire) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      setConnectingWire((prev) =>
        prev ? { ...prev, currX: pt.x, currY: pt.y } : null
      );
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (connectingWire) {
      // Open Quick Node Picker where the user released the wire
      setNodePickerModal({
        insertAfterId: connectingWire.fromStepId,
        canvasX: connectingWire.currX,
        canvasY: connectingWire.currY - NODE_HEIGHT / 2,
      });
      setConnectingWire(null);
    }
    setDraggingNode(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      const nextZoom = Math.min(Math.max(zoom * factor, 0.45), 1.65);
      setZoom(nextZoom);
    }
  };

  // Drag and drop from left Node Library
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/etl-node-type') as StepType;
    if (!nodeType) return;

    const dropPt = screenToCanvas(e.clientX, e.clientY);
    const availCols = activeResult.columns.map((c) => c.name);
    const { label, params } = buildDefaultStepPayload(nodeType, availCols);

    const pos: NodePosition = {
      x: snapToGrid ? Math.round((dropPt.x - NODE_WIDTH / 2) / 16) * 16 : dropPt.x - NODE_WIDTH / 2,
      y: snapToGrid ? Math.round((dropPt.y - NODE_HEIGHT / 2) / 16) * 16 : dropPt.y - NODE_HEIGHT / 2,
    };

    onAddStep(nodeType, label, params, pos, activeStepId);
  };

  const handleFitView = () => {
    setPan({ x: 48, y: 110 });
    setZoom(0.95);
  };

  // Start dragging a node
  const startNodeDrag = (
    e: React.MouseEvent,
    step: AppliedStep,
    idx: number,
    isExternal = false
  ) => {
    e.stopPropagation();
    const pt = screenToCanvas(e.clientX, e.clientY);
    const currentPos = isExternal
      ? getExternalNodeCoords(step, idx)
      : getStepCoords(step, idx);

    setDraggingNode({
      stepId: step.id,
      isExternal,
      offsetX: pt.x - currentPos.x,
      offsetY: pt.y - currentPos.y,
    });
    onSelectStep(step.id);
  };

  // Start dragging a wire from output socket
  const startWireDrag = (e: React.MouseEvent, step: AppliedStep, idx: number) => {
    e.stopPropagation();
    const pos = getStepCoords(step, idx);
    const startX = pos.x + NODE_WIDTH;
    const startY = pos.y + NODE_HEIGHT / 2;
    setConnectingWire({
      fromStepId: step.id,
      startX,
      startY,
      currX: startX + 40,
      currY: startY,
    });
  };

  // Cycle Join Type directly when clicking the Venn diagram on the Join wire
  const handleCycleJoinType = (e: React.MouseEvent, step: AppliedStep) => {
    e.stopPropagation();
    const order: Array<'left' | 'inner' | 'right' | 'outer'> = [
      'left',
      'inner',
      'right',
      'outer',
    ];
    const current = step.params?.joinType || 'left';
    const nextType = order[(order.indexOf(current) + 1) % order.length];
    const updatedParams = { ...step.params, joinType: nextType };
    const otherName = getExternalDatasetName(step.params?.otherDatasetId || '');
    onUpdateStepParams(
      step.id,
      `Join ${nextType.toUpperCase()} · ${otherName}`,
      `Cruza com ${otherName} (${step.params?.leftOn || '?'} = ${step.params?.rightOn || '?'})`,
      updatedParams
    );
  };

  // Dynamic SVG Venn Diagram based on Join Type
  const renderVennDiagram = (joinType: 'left' | 'inner' | 'right' | 'outer') => {
    return (
      <svg className="w-9 h-6 shrink-0" viewBox="0 0 40 24">
        <circle
          cx="14"
          cy="12"
          r="8.5"
          fill={joinType === 'left' || joinType === 'outer' ? '#3b82f6' : 'none'}
          fillOpacity={joinType === 'left' || joinType === 'outer' ? '0.45' : '0'}
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
        <circle
          cx="26"
          cy="12"
          r="8.5"
          fill={joinType === 'right' || joinType === 'outer' ? '#10b981' : 'none'}
          fillOpacity={joinType === 'right' || joinType === 'outer' ? '0.45' : '0'}
          stroke="#10b981"
          strokeWidth="1.5"
        />
        <path
          d="M 20 5.8 A 8.5 8.5 0 0 1 20 18.2 A 8.5 8.5 0 0 1 20 5.8 Z"
          fill={
            joinType === 'inner'
              ? '#8b5cf6'
              : joinType === 'left'
                ? '#3b82f6'
                : joinType === 'right'
                  ? '#10b981'
                  : '#8b5cf6'
          }
          fillOpacity="0.75"
        />
      </svg>
    );
  };

  const getStepIcon = (type: StepType) => {
    const iconClass = 'w-4 h-4 shrink-0';
    switch (type) {
      case 'source':
        return <Database className={`${iconClass} text-blue-400`} />;
      case 'rename_column':
        return <Type className={`${iconClass} text-purple-400`} />;
      case 'change_type':
        return <Type className={`${iconClass} text-pink-400`} />;
      case 'filter_rows':
        return <Filter className={`${iconClass} text-amber-400`} />;
      case 'drop_column':
        return <Trash2 className={`${iconClass} text-rose-400`} />;
      case 'add_column':
        return <Calculator className={`${iconClass} text-emerald-400`} />;
      case 'group_by':
        return <Layers className={`${iconClass} text-indigo-400`} />;
      case 'sort_rows':
        return <ArrowDownAZ className={`${iconClass} text-cyan-400`} />;
      case 'drop_duplicates':
        return <CopyX className={`${iconClass} text-teal-400`} />;
      case 'fillna':
        return <Sparkles className={`${iconClass} text-violet-400`} />;
      case 'slice_rows':
        return <Scissors className={`${iconClass} text-orange-400`} />;
      case 'join_dataset':
        return <GitFork className={`${iconClass} text-indigo-400 rotate-90`} />;
      case 'pivot':
        return <Table2 className={`${iconClass} text-fuchsia-400`} />;
      case 'unpivot':
        return <Columns className={`${iconClass} text-purple-400`} />;
      case 'custom_code':
        return <Code2 className={`${iconClass} text-emerald-400`} />;
      default:
        return <Settings className={`${iconClass} text-slate-400`} />;
    }
  };

  const getHeaderAccent = (type: StepType) => {
    switch (type) {
      case 'source':
        return 'bg-blue-500/15 border-b border-blue-500/30 text-blue-300';
      case 'join_dataset':
        return 'bg-indigo-500/15 border-b border-indigo-500/30 text-indigo-300';
      case 'pivot':
      case 'unpivot':
        return 'bg-fuchsia-500/15 border-b border-fuchsia-500/30 text-fuchsia-300';
      case 'custom_code':
      case 'add_column':
        return 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300';
      case 'filter_rows':
      case 'slice_rows':
      case 'drop_duplicates':
        return 'bg-amber-500/15 border-b border-amber-500/30 text-amber-300';
      default:
        return 'bg-slate-800/90 border-b border-slate-700 text-slate-300';
    }
  };

  const getStepCategoryLabel = (type: StepType) => {
    if (type === 'source') return 'Dataset Source';
    if (type === 'join_dataset') return 'Join / Merge';
    if (type === 'pivot') return 'Pivot Table';
    if (type === 'unpivot') return 'Unpivot Melt';
    if (type === 'custom_code') return 'Python Script';
    if (type === 'group_by') return 'Group Aggregate';
    if (type === 'filter_rows' || type === 'drop_duplicates' || type === 'slice_rows')
      return 'Row Filter';
    return 'Column Transform';
  };

  const getExternalDatasetName = (id: string) => {
    if (id === 'sales') return 'Vendas (Sales)';
    if (id === 'employees') return 'Funcionários (RH)';
    if (id === 'inventory') return 'Estoque (Inventory)';
    if (id === 'base_original') return 'Tabela de Origem';
    if (id.startsWith('step_')) {
      const stepIdx = steps.findIndex((s) => s.id === id);
      return stepIdx !== -1 ? `Nó 0${stepIdx + 1}: ${steps[stepIdx].label}` : 'Nó Anterior';
    }
    return id.replace('custom_', '');
  };

  const renderNodeBodySummary = (step: AppliedStep) => {
    const p = step.params || {};
    switch (step.type) {
      case 'source':
        return (
          <div className="space-y-1 text-xs">
            <div className="text-slate-400">
              Arquivo: <span className="font-mono text-slate-200">{p.datasetName || rawDataset.name}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              pd.read_csv()
            </div>
          </div>
        );
      case 'rename_column':
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-300 truncate max-w-[95px]">{p.from || '?'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-purple-300 truncate max-w-[95px]">{p.to || '?'}</span>
          </div>
        );
      case 'change_type':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-slate-300 truncate">Col: {p.column || '?'}</div>
            <div className="text-pink-400">astype('{p.toType || 'str'}')</div>
          </div>
        );
      case 'filter_rows':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-slate-200 truncate">{p.column || 'Selecione coluna'}</div>
            <div className="text-amber-400 truncate">
              {p.operator === 'equals'
                ? `== "${p.value}"`
                : p.operator === 'not_equals'
                  ? `!= "${p.value}"`
                  : p.operator === 'greater_than'
                    ? `> ${p.value}`
                    : p.operator === 'less_than'
                      ? `< ${p.value}`
                      : p.operator === 'contains'
                        ? `contém "${p.value}"`
                        : p.operator === 'is_not_null'
                          ? 'notna()'
                          : 'isna()'}
            </div>
          </div>
        );
      case 'drop_column':
        return (
          <div className="text-xs font-mono text-rose-300 truncate">
            drop([{p.columns?.join(', ') || '...'}])
          </div>
        );
      case 'add_column':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-emerald-300 truncate">df['{p.columnName || 'nova'}']</div>
            <div className="text-[11px] text-slate-400 truncate">
              {p.expressionType === 'constant'
                ? `= ${p.constantValue}`
                : p.expressionType === 'math'
                  ? `= ${p.colA || '?'} ${p.operator || '*'} ${p.colB || '?'}`
                  : p.customExpression || 'Fórmula'}
            </div>
          </div>
        );
      case 'group_by':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-indigo-300 truncate">
              by: {p.groupByColumns?.join(', ') || '?'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {p.aggFunction || 'sum'}({p.aggColumn || '?'}) ➔ {p.targetColumnName || 'total'}
            </div>
          </div>
        );
      case 'sort_rows':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-cyan-300 truncate">by: {p.column || '?'}</div>
            <div className="text-[11px] text-slate-400">
              ascending={p.ascending ? 'True' : 'False'}
            </div>
          </div>
        );
      case 'fillna':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-violet-300 truncate">Col: {p.column || '?'}</div>
            <div className="text-[11px] text-slate-400 truncate">
              fillna({p.method === 'value' ? p.customValue : p.method})
            </div>
          </div>
        );
      case 'drop_duplicates':
        return (
          <div className="text-xs font-mono text-teal-300 truncate">
            subset: {p.columns?.length > 0 ? p.columns.join(', ') : 'Todas as colunas'}
          </div>
        );
      case 'slice_rows':
        return (
          <div className="text-xs font-mono text-orange-300">
            df.head({p.limit || 10})
          </div>
        );
      case 'join_dataset':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-indigo-300 truncate">
              {getExternalDatasetName(p.otherDatasetId || '')}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {p.leftOn || '?'} == {p.rightOn || '?'}
            </div>
          </div>
        );
      case 'pivot':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-fuchsia-300 truncate">cols: {p.pivotColumn || '?'}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {p.aggFunction}({p.valueColumn || '?'})
            </div>
          </div>
        );
      case 'unpivot':
        return (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-purple-300 truncate">
              melt({p.valueVars?.length || 0} colunas)
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              ➔ ({p.varName}, {p.valueName})
            </div>
          </div>
        );
      case 'custom_code': {
        const lines = (p.code || '')
          .split('\n')
          .filter((l: string) => l.trim().length > 0 && !l.trim().startsWith('#'));
        return (
          <div className="text-xs font-mono text-emerald-300 truncate">
            {lines[0] || 'df = ...'}
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Helper to compute smooth cubic Bezier SVG path between two points
  const buildBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  // Filtered rows in the bottom live preview
  const filteredPreviewRows = useMemo(() => {
    if (!previewSearch.trim()) return activeResult.data;
    const q = previewSearch.toLowerCase();
    return activeResult.data.filter((row) =>
      Object.values(row).some(
        (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      )
    );
  }, [activeResult.data, previewSearch]);

  const getColTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash className="w-3 h-3 text-emerald-400 shrink-0" />;
      case 'date':
        return <Calendar className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'boolean':
        return <ToggleLeft className="w-3 h-3 text-purple-400 shrink-0" />;
      default:
        return <Type className="w-3 h-3 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col min-w-0 overflow-hidden relative select-none">
      {/* Top Floating Canvas Toolbar */}
      <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap mr-1">
            Adicionar Nó Rápido:
          </span>
          <button
            onClick={() => {
              const availCols = activeResult.columns.map((c) => c.name);
              const { label, params } = buildDefaultStepPayload('filter_rows', availCols);
              onAddStep('filter_rows', label, params);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtro</span>
          </button>

          <button
            onClick={() => {
              const availCols = activeResult.columns.map((c) => c.name);
              const { label, params } = buildDefaultStepPayload('add_column', availCols);
              onAddStep('add_column', label, params);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Coluna Calculada</span>
          </button>

          <button
            onClick={() => {
              const availCols = activeResult.columns.map((c) => c.name);
              const { label, params } = buildDefaultStepPayload('join_dataset', availCols);
              onAddStep('join_dataset', label, params);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-400 rotate-90" />
            <span>Join / Merge</span>
          </button>

          <button
            onClick={() => {
              const availCols = activeResult.columns.map((c) => c.name);
              const { label, params } = buildDefaultStepPayload('group_by', availCols);
              onAddStep('group_by', label, params);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Group By</span>
          </button>

          <button
            onClick={() => {
              const availCols = activeResult.columns.map((c) => c.name);
              const { label, params } = buildDefaultStepPayload('pivot', availCols);
              onAddStep('pivot', label, params);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Table2 className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Pivot</span>
          </button>

          <button
            onClick={() => {
              const availCols = activeResult.columns.map((c) => c.name);
              const { label, params } = buildDefaultStepPayload('custom_code', availCols);
              onAddStep('custom_code', label, params);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Script Python</span>
          </button>
        </div>

        {/* Right Canvas Controls: Auto-Layout, Grid Snap, Zoom */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onAutoLayout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            title="Organizar posição dos nós automaticamente"
          >
            <Workflow className="w-3.5 h-3.5 text-blue-400" />
            <span>Organizar Grafo</span>
          </button>

          <button
            onClick={() => setSnapToGrid((s) => !s)}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              snapToGrid
                ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Alinhar nós à grade (Snap to Grid)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.45, +(z - 0.1).toFixed(2)))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.65, +(z + 0.1).toFixed(2)))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitView}
              className="p-1 text-slate-400 hover:text-white border-l border-slate-800 ml-0.5 pl-1.5 cursor-pointer"
              title="Centralizar Visualização"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive 2D Node Graph Canvas */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex-1 relative overflow-hidden ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.16) 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transformed Plane for Edges and Nodes */}
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          }}
        >
          {/* SVG Layer for Bezier Connections */}
          <svg
            className="overflow-visible pointer-events-none absolute top-0 left-0"
            width={4000}
            height={2400}
          >
            <defs>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
              </marker>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
              <marker
                id="arrow-join"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
            </defs>

            {/* 1. Main Pipeline Edges (Step i -> Step i+1) */}
            {steps.map((step, idx) => {
              if (idx >= steps.length - 1) return null;
              const nextStep = steps[idx + 1];

              const posA = getStepCoords(step, idx);
              const posB = getStepCoords(nextStep, idx + 1);

              const x1 = posA.x + NODE_WIDTH;
              const y1 = posA.y + NODE_HEIGHT / 2;
              const x2 = posB.x;
              // If target is a join step, connect to its primary top-left input port
              const y2 =
                nextStep.type === 'join_dataset'
                  ? posB.y + 78
                  : posB.y + NODE_HEIGHT / 2;

              const pathD = buildBezierPath(x1, y1, x2, y2);
              const isHighlighted =
                step.id === activeStepId || nextStep.id === activeStepId;

              return (
                <g key={`edge-${step.id}-${nextStep.id}`}>
                  {/* Outer subtle halo when active */}
                  {isHighlighted && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="rgba(59, 130, 246, 0.2)"
                      strokeWidth={7}
                    />
                  )}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isHighlighted ? '#3b82f6' : '#334155'}
                    strokeWidth={isHighlighted ? 2.5 : 2}
                    markerEnd={
                      isHighlighted ? 'url(#arrow-active)' : 'url(#arrow-default)'
                    }
                  />
                </g>
              );
            })}

            {/* 2. External Dataset Join Edges (External Node -> Join Step Input Port B) */}
            {steps.map((step, idx) => {
              if (step.type !== 'join_dataset') return null;
              const mainPos = getStepCoords(step, idx);
              const extPos = getExternalNodeCoords(step, idx);

              const x1 = extPos.x + EXT_NODE_WIDTH;
              const y1 = extPos.y + EXT_NODE_HEIGHT / 2;
              const x2 = mainPos.x;
              const y2 = mainPos.y + 152; // Second input port on Join node

              const pathD = buildBezierPath(x1, y1, x2, y2);
              return (
                <g key={`join-edge-${step.id}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    markerEnd="url(#arrow-join)"
                  />
                </g>
              );
            })}

            {/* 3. Live Dragging Connection Wire */}
            {connectingWire && (
              <path
                d={buildBezierPath(
                  connectingWire.startX,
                  connectingWire.startY,
                  connectingWire.currX,
                  connectingWire.currY
                )}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={2.5}
                strokeDasharray="4 4"
              />
            )}
          </svg>

          {/* Mid-Wire Interactive Badges (Row count + Insert Node "+" button between steps) */}
          {steps.map((step, idx) => {
            if (idx >= steps.length - 1) return null;
            const nextStep = steps[idx + 1];
            const posA = getStepCoords(step, idx);
            const posB = getStepCoords(nextStep, idx + 1);

            const x1 = posA.x + NODE_WIDTH;
            const y1 = posA.y + NODE_HEIGHT / 2;
            const x2 = posB.x;
            const y2 =
              nextStep.type === 'join_dataset'
                ? posB.y + 78
                : posB.y + NODE_HEIGHT / 2;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const rowsFlowing = stepResults[step.id]?.data.length ?? 0;

            return (
              <div
                key={`mid-${step.id}`}
                style={{ left: `${midX}px`, top: `${midY}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex items-center gap-1 bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-md px-2 py-0.5 shadow-sm transition-colors"
              >
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                  {rowsFlowing} linhas
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNodePickerModal({
                      insertAfterId: step.id,
                      canvasX: midX - NODE_WIDTH / 2 + 120,
                      canvasY: midY - NODE_HEIGHT / 2,
                    });
                  }}
                  className="w-4 h-4 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Inserir nó nesta conexão"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Draggable External Table Nodes + Interactive Venn Badges for Join Steps */}
          {steps.map((step, idx) => {
            if (step.type !== 'join_dataset') return null;
            const mainPos = getStepCoords(step, idx);
            const extPos = getExternalNodeCoords(step, idx);
            const otherName = getExternalDatasetName(step.params?.otherDatasetId || '');

            // Midpoint of Join cable for the interactive Venn Diagram button
            const vennX = (extPos.x + EXT_NODE_WIDTH + mainPos.x) / 2;
            const vennY = (extPos.y + EXT_NODE_HEIGHT / 2 + (mainPos.y + 152)) / 2;

            return (
              <React.Fragment key={`ext-group-${step.id}`}>
                {/* Draggable External Dataset Input Node */}
                <div
                  style={{
                    left: `${extPos.x}px`,
                    top: `${extPos.y}px`,
                    width: `${EXT_NODE_WIDTH}px`,
                    height: `${EXT_NODE_HEIGHT}px`,
                  }}
                  onMouseDown={(e) => startNodeDrag(e, step, idx, true)}
                  className="absolute bg-slate-900 border border-emerald-500/50 hover:border-emerald-400 rounded-xl p-3 shadow-lg flex flex-col justify-between cursor-move z-10"
                >
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                    <span>Input Secundário (Right)</span>
                    <span className="font-mono">df_other</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {otherName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        Chave: {step.params?.rightOn || 'selecionar'}
                      </div>
                    </div>
                  </div>

                  {/* Output Port on Right Edge */}
                  <div
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950"
                    title="Saída da Tabela Secundária"
                  />
                </div>

                {/* Interactive Venn Diagram Join Type Selector on the Cable */}
                <button
                  type="button"
                  onClick={(e) => handleCycleJoinType(e, step)}
                  style={{ left: `${vennX}px`, top: `${vennY}px` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 bg-slate-900 hover:bg-slate-800 border border-indigo-500/60 rounded-lg px-2.5 py-1 shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                  title="Clique para alternar o tipo de Join (Left, Inner, Right, Outer)"
                >
                  {renderVennDiagram(step.params?.joinType || 'left')}
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-indigo-300 uppercase font-mono leading-none">
                      {step.params?.joinType || 'left'} join
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 leading-none">
                      Clique p/ mudar
                    </div>
                  </div>
                </button>
              </React.Fragment>
            );
          })}

          {/* Primary Pipeline Nodes */}
          {steps.map((step, idx) => {
            const pos = getStepCoords(step, idx);
            const isActive = step.id === activeStepId;
            const isFirst = idx === 0;

            const currStats = stepResults[step.id] || { data: [], columns: [] };
            const prevStats =
              idx > 0
                ? stepResults[steps[idx - 1].id] || { data: [], columns: [] }
                : currStats;

            const rowDelta = currStats.data.length - prevStats.data.length;
            const colDelta = currStats.columns.length - prevStats.columns.length;

            return (
              <div
                key={step.id}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`,
                }}
                onMouseDown={(e) => startNodeDrag(e, step, idx, false)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStep(step.id);
                }}
                className={`absolute rounded-xl border flex flex-col justify-between transition-colors cursor-move z-10 ${
                  isActive
                    ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30 shadow-xl'
                    : 'bg-slate-900/95 border-slate-800 hover:border-slate-600 shadow-lg'
                }`}
              >
                {/* INPUT PORTS (Left Edge) */}
                {!isFirst && step.type !== 'join_dataset' && (
                  <div
                    className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                      isActive ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                    title="Porta de Entrada: DataFrame (df)"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}

                {/* Dual Input Ports for Join Node */}
                {step.type === 'join_dataset' && (
                  <>
                    <div
                      className="absolute -left-2 top-[78px] -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-950 flex items-center justify-center"
                      title="Porta A: Tabela Principal (left_df)"
                    >
                      <span className="text-[8px] font-bold text-white">L</span>
                    </div>
                    <div
                      className="absolute -left-2 top-[152px] -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center"
                      title="Porta B: Tabela Secundária (right_df)"
                    >
                      <span className="text-[8px] font-bold text-white">R</span>
                    </div>
                  </>
                )}

                {/* OUTPUT PORT (Right Edge - Draggable to connect/add new node) */}
                <div
                  onMouseDown={(e) => startWireDrag(e, step, idx)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNodePickerModal({
                      insertAfterId: step.id,
                      canvasX: pos.x + NODE_WIDTH + 72,
                      canvasY: pos.y,
                    });
                  }}
                  className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center cursor-crosshair transition-transform hover:scale-125 ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-blue-500 text-slate-200'
                  }`}
                  title="Arraste para puxar um fio ou clique para conectar novo nó"
                >
                  <Plus className="w-3 h-3" />
                </div>

                {/* Node Top Category Strip */}
                <div
                  className={`px-3.5 py-2 rounded-t-xl flex items-center justify-between ${getHeaderAccent(
                    step.type
                  )}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getStepIcon(step.type)}
                    <span className="text-[11px] font-semibold tracking-tight truncate">
                      0{idx + 1}. {getStepCategoryLabel(step.type)}
                    </span>
                  </div>

                  {/* Node Quick Actions (Duplicate / Delete) */}
                  {step.type !== 'source' && (
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateStep(step.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 cursor-pointer"
                        title="Duplicar nó"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStep(step.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800/60 cursor-pointer"
                        title="Remover nó"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Node Main Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between min-h-0">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {step.description}
                    </p>
                  </div>

                  {/* Node Operation Expression Box */}
                  <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg px-2.5 py-2 my-1.5">
                    {renderNodeBodySummary(step)}
                  </div>

                  {/* Node Footer Telemetry (Unboxed clean metadata with middot separators) */}
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <span>{currStats.data.length} linhas</span>
                      <span aria-hidden="true">·</span>
                      <span>{currStats.columns.length} cols</span>
                    </div>

                    {idx > 0 && (rowDelta !== 0 || colDelta !== 0) && (
                      <span
                        className={
                          rowDelta < 0 || colDelta < 0
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {rowDelta !== 0
                          ? `${rowDelta > 0 ? '+' : ''}${rowDelta}L`
                          : `${colDelta > 0 ? '+' : ''}${colDelta}C`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Context Popover Menu when Dropping a Wire or Clicking "+" on a Port/Wire */}
          {nodePickerModal && (
            <div
              style={{
                left: `${nodePickerModal.canvasX}px`,
                top: `${nodePickerModal.canvasY}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute z-40 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">
                  Conectar Novo Nó ETL
                </span>
                <button
                  onClick={() => setNodePickerModal(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {NODE_CATALOG.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      const availCols =
                        stepResults[nodePickerModal.insertAfterId]?.columns.map(
                          (c) => c.name
                        ) || activeResult.columns.map((c) => c.name);
                      const { label, params } = buildDefaultStepPayload(
                        item.type,
                        availCols
                      );
                      onAddStep(
                        item.type,
                        label,
                        params,
                        {
                          x: nodePickerModal.canvasX,
                          y: nodePickerModal.canvasY,
                        },
                        nodePickerModal.insertAfterId
                      );
                      setNodePickerModal(null);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    {getStepIcon(item.type)}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.shortDesc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom-Left Canvas Hint */}
        <div className="absolute bottom-3 left-4 pointer-events-none bg-slate-900/85 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-2">
          <span>Arraste nós livremente</span>
          <span aria-hidden="true">·</span>
          <span>Puxe o conector (+) de qualquer nó para criar ramificações</span>
          <span aria-hidden="true">·</span>
          <span>Scroll para Zoom</span>
        </div>
      </div>

      {/* Integrated Bottom Dock: Live Data Preview at Selected Node */}
      <div
        className={`bg-slate-900 border-t border-slate-800 flex flex-col shrink-0 transition-all ${
          isPreviewOpen ? 'h-64' : 'h-10'
        }`}
      >
        {/* Dock Header Bar */}
        <div
          onClick={() => setIsPreviewOpen((o) => !o)}
          className="h-10 px-5 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 shrink-0"
        >
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-200">
              Saída de Dados do Nó: {activeStepObj?.label}
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="font-mono text-slate-400 tabular-nums">
              {activeResult.data.length} linhas
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="font-mono text-slate-400 tabular-nums">
              {activeResult.columns.length} colunas
            </span>
          </div>

          <div
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {isPreviewOpen && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  placeholder="Filtrar prévia..."
                  className="bg-slate-950 border border-slate-800 rounded-md pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
                />
              </div>
            )}
            <button
              onClick={() => setIsPreviewOpen((o) => !o)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <span>{isPreviewOpen ? 'Recolher Prévia' : 'Expandir Prévia'}</span>
              {isPreviewOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Live Data Table Body */}
        {isPreviewOpen && (
          <div className="flex-1 overflow-auto bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-[11px] font-mono text-slate-500 border-r border-slate-800/80 w-10 text-center tabular-nums">
                    #
                  </th>
                  {activeResult.columns.map((col) => (
                    <th
                      key={col.name}
                      className="py-2 px-3 text-xs font-semibold text-slate-200 border-r border-slate-800/80 whitespace-nowrap"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          {getColTypeIcon(col.type)}
                          <span>{col.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-normal">
                          {col.type}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono tabular-nums">
                {filteredPreviewRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeResult.columns.length + 1}
                      className="py-8 text-center text-slate-500 font-sans"
                    >
                      Nenhum registro encontrado na saída deste nó.
                    </td>
                  </tr>
                ) : (
                  filteredPreviewRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="py-1.5 px-3 text-slate-500 border-r border-slate-800/50 text-center">
                        {rIdx + 1}
                      </td>
                      {activeResult.columns.map((col) => {
                        const val = row[col.name];
                        const isNull =
                          val === null || val === undefined || val === '';
                        return (
                          <td
                            key={col.name}
                            className={`py-1.5 px-3 border-r border-slate-800/50 whitespace-nowrap ${
                              col.type === 'number' ? 'text-right' : 'text-left'
                            } ${
                              isNull
                                ? 'text-amber-400/80 italic'
                                : 'text-slate-300'
                            }`}
                          >
                            {isNull
                              ? 'NaN'
                              : typeof val === 'boolean'
                                ? val
                                  ? 'True'
                                  : 'False'
                                : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
