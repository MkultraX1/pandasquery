import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import SidebarSteps from './components/SidebarSteps';
import SpreadsheetView from './components/SpreadsheetView';
import NodesFlowView from './components/NodesFlowView';
import SidebarEditor from './components/SidebarEditor';
import { AppliedStep, Column, Dataset, NodePosition, StepType } from './types';
import { SAMPLE_DATASETS } from './datasets';
import { runPipeline, generatePandasCode } from './utils/engine';
import { exportToCSV } from './utils/csvHelper';

function buildInitialSalesGraph(): AppliedStep[] {
  return [
    {
      id: 'step_source',
      type: 'source',
      label: 'Fonte: Vendas (Sales)',
      description: 'Carregamento do dataset principal',
      params: { datasetId: 'sales', datasetName: 'Desempenho de Vendas (Sales)' },
      position: { x: 32, y: 80 },
    },
    {
      id: 'step_fillna_init',
      type: 'fillna',
      label: 'Preencher Nulos (Quantidade)',
      description: 'Preencher nulos em Quantidade (value)',
      params: { column: 'Quantidade', method: 'value', customValue: '1' },
      position: { x: 384, y: 64 },
    },
    {
      id: 'step_calc_init',
      type: 'add_column',
      label: 'Coluna: Receita_Bruta',
      description: 'Cálculo: Quantidade * Preco_Unitario',
      params: {
        columnName: 'Receita_Bruta',
        expressionType: 'math',
        colA: 'Quantidade',
        operator: '*',
        colB: 'Preco_Unitario',
      },
      position: { x: 736, y: 80 },
    },
    {
      id: 'step_join_init',
      type: 'join_dataset',
      label: 'Join LEFT · Estoque',
      description: 'Cruza com Estoque em Produto = Nome_Produto',
      params: {
        otherDatasetId: 'inventory',
        joinType: 'left',
        leftOn: 'Produto',
        rightOn: 'Nome_Produto',
        prefix: 'est_',
      },
      position: { x: 1088, y: 64 },
      externalNodePosition: { x: 736, y: 336 },
    },
  ];
}

export default function App() {
  // 1. Core Datasets (Preset + Custom uploaded datasets)
  const [customDatasets, setCustomDatasets] = useState<Record<string, Dataset>>({});
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('sales');

  // Resolve current active raw dataset definition
  const rawDataset = useMemo(() => {
    if (selectedDatasetId.startsWith('custom_') && customDatasets[selectedDatasetId]) {
      return customDatasets[selectedDatasetId];
    }
    return SAMPLE_DATASETS.find((ds) => ds.id === selectedDatasetId) || SAMPLE_DATASETS[0];
  }, [selectedDatasetId, customDatasets]);

  // 2. Active Pipeline Steps list (Node Graph)
  const [steps, setSteps] = useState<AppliedStep[]>(() => buildInitialSalesGraph());

  // 3. Default to 'nodes' (Node Editor Flow)
  const [activeView, setActiveView] = useState<'table' | 'nodes'>('nodes');

  // 4. Current inspect/active Step ID in the graph
  const [activeStepId, setActiveStepId] = useState<string>('step_join_init');

  // Rebuild initial step on dataset change
  const handleSelectDataset = (id: string) => {
    setSelectedDatasetId(id);
    if (id === 'sales') {
      const initial = buildInitialSalesGraph();
      setSteps(initial);
      setActiveStepId(initial[initial.length - 1].id);
      return;
    }

    let name = '';
    if (id.startsWith('custom_')) {
      name = id.replace('custom_', '');
    } else {
      const found = SAMPLE_DATASETS.find((ds) => ds.id === id);
      name = found ? found.name : 'Dataset';
    }

    const sourceStep: AppliedStep = {
      id: 'step_source',
      type: 'source',
      label: 'Fonte de Dados',
      description: `Carregamento de ${name}`,
      params: { datasetId: id, datasetName: name },
      position: { x: 48, y: 112 },
    };

    setSteps([sourceStep]);
    setActiveStepId('step_source');
  };

  // Upload Custom CSV File
  const handleUploadCSV = (fileName: string, columns: Column[], data: any[]) => {
    const customId = `custom_${fileName}`;
    const newDataset: Dataset = {
      id: customId,
      name: `Importado: ${fileName}`,
      description: `Planilha importada de ${fileName}.`,
      columns,
      data,
    };

    setCustomDatasets((prev) => ({
      ...prev,
      [customId]: newDataset,
    }));

    setSelectedDatasetId(customId);
    const sourceStep: AppliedStep = {
      id: 'step_source',
      type: 'source',
      label: `Fonte: ${fileName}`,
      description: `Carregamento de ${fileName}`,
      params: { datasetId: customId, datasetName: fileName },
      position: { x: 48, y: 112 },
    };

    setSteps([sourceStep]);
    setActiveStepId('step_source');
  };

  // Reset Pipeline
  const handleReset = () => {
    const sourceStep = steps[0];
    setSteps([
      {
        ...sourceStep,
        position: { x: 48, y: 112 },
      },
    ]);
    setActiveStepId(sourceStep.id);
  };

  // Compute description helper
  const computeStepDescription = (type: StepType, params: any): string => {
    switch (type) {
      case 'rename_column':
        return `Renomear ${params.from} ➔ ${params.to}`;
      case 'change_type':
        return `Converter ${params.column} para ${params.toType}`;
      case 'filter_rows':
        return `Filtra por ${params.column} ${params.operator} ${params.value ? `"${params.value}"` : ''}`;
      case 'drop_column':
        return `Remove ${params.columns?.join(', ')}`;
      case 'add_column':
        return `Nova coluna "${params.columnName}"`;
      case 'group_by':
        return `Agrupar por ${params.groupByColumns?.join(', ')}`;
      case 'sort_rows':
        return `Ordenar por ${params.column} (${params.ascending ? 'Asc' : 'Desc'})`;
      case 'drop_duplicates':
        return `Remover duplicados de ${params.columns?.length > 0 ? params.columns.join(', ') : 'Tabela'}`;
      case 'fillna':
        return `Preencher nulos em ${params.column} (${params.method})`;
      case 'slice_rows':
        return `Limitar para as primeiras ${params.limit} linhas`;
      case 'join_dataset': {
        let otherName = params.otherDatasetId || 'Externa';
        if (otherName === 'sales') otherName = 'Vendas';
        else if (otherName === 'employees') otherName = 'Funcionários';
        else if (otherName === 'inventory') otherName = 'Estoque';
        else if (otherName === 'base_original') otherName = 'Tabela Original';
        else if (otherName.startsWith('step_')) otherName = `Nó Anterior`;
        else otherName = otherName.replace('custom_', '');
        return `Join ${(params.joinType || 'left').toUpperCase()} com ${otherName} em ${params.leftOn || '?'} = ${params.rightOn || '?'}`;
      }
      case 'pivot':
        return `Pivot (${params.aggFunction} de ${params.valueColumn}) agrupado por ${params.indexColumns?.join(', ')}`;
      case 'unpivot':
        return `Unpivot de ${params.valueVars?.length || 0} colunas em ${params.varName || 'atributo'}`;
      case 'custom_code': {
        const firstLine = (params.code || '').trim().split('\n')[0] || '';
        const summary = firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine;
        return `Script Python: ${summary || 'Código Customizado'}`;
      }
      default:
        return `Passo de transformação ${type}`;
    }
  };

  // Add Step to Node Graph
  const handleAddStep = (
    type: StepType,
    label: string,
    params: any,
    customPosition?: NodePosition,
    insertAfterId?: string
  ) => {
    const newId = `step_${type}_${Date.now()}`;
    const description = computeStepDescription(type, params);

    const targetAfterId = insertAfterId || activeStepId;
    const insertIdx = steps.findIndex((s) => s.id === targetAfterId);
    const anchorStep = insertIdx !== -1 ? steps[insertIdx] : steps[steps.length - 1];
    const anchorPos = anchorStep?.position || {
      x: (insertIdx !== -1 ? insertIdx : steps.length - 1) * 352 + 32,
      y: 80,
    };

    const computedPosition: NodePosition = customPosition || {
      x: anchorPos.x + 352,
      y: anchorPos.y + (steps.length % 2 === 0 ? 16 : -16),
    };

    const newStep: AppliedStep = {
      id: newId,
      type,
      label,
      description,
      params,
      position: computedPosition,
      externalNodePosition:
        type === 'join_dataset'
          ? { x: computedPosition.x - 320, y: computedPosition.y + 260 }
          : undefined,
    };

    if (insertIdx !== -1 && insertIdx < steps.length - 1) {
      // Insert in the middle of the pipeline and shift subsequent nodes right if no customPosition
      const before = steps.slice(0, insertIdx + 1);
      const after = steps.slice(insertIdx + 1).map((s) => ({
        ...s,
        position: s.position
          ? { x: s.position.x + 352, y: s.position.y }
          : undefined,
        externalNodePosition: s.externalNodePosition
          ? { x: s.externalNodePosition.x + 352, y: s.externalNodePosition.y }
          : undefined,
      }));
      setSteps([...before, newStep, ...after]);
    } else {
      setSteps((prev) => [...prev, newStep]);
    }

    setActiveStepId(newId);
  };

  // Update 2D Canvas Position of a Node (or its External Join Node)
  const handleUpdateStepPosition = (
    stepId: string,
    position: NodePosition,
    isExternalNode = false
  ) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step;
        if (isExternalNode) {
          return { ...step, externalNodePosition: position };
        }
        return { ...step, position };
      })
    );
  };

  // Auto-Layout all nodes cleanly on the 2D canvas
  const handleAutoLayout = () => {
    setSteps((prev) =>
      prev.map((step, idx) => {
        const mainPos = {
          x: idx * 352 + 32,
          y: idx % 2 === 0 ? 80 : 64,
        };
        return {
          ...step,
          position: mainPos,
          externalNodePosition:
            step.type === 'join_dataset'
              ? { x: Math.max(32, mainPos.x - 352), y: mainPos.y + 272 }
              : step.externalNodePosition,
        };
      })
    );
  };

  // Duplicate Step
  const handleDuplicateStep = (stepId: string) => {
    const target = steps.find((s) => s.id === stepId);
    if (!target || target.type === 'source') return;
    handleAddStep(
      target.type,
      `${target.label} (Cópia)`,
      JSON.parse(JSON.stringify(target.params)),
      target.position
        ? { x: target.position.x + 352, y: target.position.y + 32 }
        : undefined,
      target.id
    );
  };

  // Move Step Up/Down in Execution Order
  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx <= 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx <= 0 || swapIdx >= steps.length) return;

    const copy = [...steps];
    const posA = copy[idx].position;
    const posB = copy[swapIdx].position;

    const temp = { ...copy[idx], position: posB };
    copy[idx] = { ...copy[swapIdx], position: posA };
    copy[swapIdx] = temp;

    setSteps(copy);
  };

  // Delete Step
  const handleDeleteStep = (stepId: string) => {
    if (stepId === 'step_source') return;

    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return;

    const remainingSteps = steps.filter((s) => s.id !== stepId);
    setSteps(remainingSteps);

    if (activeStepId === stepId) {
      const prevStep = steps[stepIndex - 1];
      setActiveStepId(prevStep ? prevStep.id : 'step_source');
    }
  };

  // Update parameters of an existing step
  const handleUpdateStepParams = (
    stepId: string,
    label: string,
    description: string,
    params: any
  ) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, label, description, params } : step
      )
    );
  };

  // 5. Run simulation to get data at the ACTIVE inspected step
  const allDatasetsList = useMemo(() => {
    return [...SAMPLE_DATASETS, ...Object.values(customDatasets)];
  }, [customDatasets]);

  const activeDataFrame = useMemo(() => {
    return runPipeline(rawDataset, steps, activeStepId, allDatasetsList);
  }, [rawDataset, steps, activeStepId, allDatasetsList]);

  // Compute columns available at the INPUT of the active step (so SidebarEditor dropdowns show columns entering that node)
  const inputDataFrameForActiveStep = useMemo(() => {
    const idx = steps.findIndex((s) => s.id === activeStepId);
    if (idx <= 0) {
      return { columns: rawDataset.columns, data: rawDataset.data };
    }
    const prevStepId = steps[idx - 1].id;
    return runPipeline(rawDataset, steps, prevStepId, allDatasetsList);
  }, [rawDataset, steps, activeStepId, allDatasetsList]);

  // Run full simulation to get final results for exporting
  const finalDataFrame = useMemo(() => {
    return runPipeline(rawDataset, steps, undefined, allDatasetsList);
  }, [rawDataset, steps, allDatasetsList]);

  // 6. Generate Live Pandas Python Code
  const generatedCode = useMemo(() => {
    return generatePandasCode(steps, selectedDatasetId);
  }, [steps, selectedDatasetId]);

  const allColumnsList = useMemo(() => {
    return inputDataFrameForActiveStep.columns.map((col) => col.name);
  }, [inputDataFrameForActiveStep.columns]);

  const activeOutputColumnsList = useMemo(() => {
    return activeDataFrame.columns.map((col) => col.name);
  }, [activeDataFrame.columns]);

  // Export Code Trigger
  const handleExportCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline_etl_pandas.py`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export transformed CSV Trigger
  const handleExportCSV = () => {
    const csvContent = exportToCSV(finalDataFrame.columns, finalDataFrame.data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataset_final_transformado.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeStepRecord = useMemo(() => {
    return steps.find((s) => s.id === activeStepId) || steps[0];
  }, [steps, activeStepId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        selectedDatasetId={selectedDatasetId}
        onSelectDataset={handleSelectDataset}
        onUploadCSV={handleUploadCSV}
        onExportCode={handleExportCode}
        onExportCSV={handleExportCSV}
        onReset={handleReset}
        stepsCount={steps.length}
      />

      {/* Main workspace splits */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left sidebar: Draggable Node Palette & Graph Sequence */}
        <SidebarSteps
          steps={steps}
          activeStepId={activeStepId}
          onSelectStep={setActiveStepId}
          onDeleteStep={handleDeleteStep}
          onAddStep={handleAddStep}
          onMoveStep={handleMoveStep}
          onDuplicateStep={handleDuplicateStep}
          availableColumns={activeOutputColumnsList}
        />

        {/* Center Canvas View: Interactive 2D Node Editor Flow (Default) or Full Spreadsheet */}
        {activeView === 'nodes' ? (
          <NodesFlowView
            steps={steps}
            activeStepId={activeStepId}
            onSelectStep={setActiveStepId}
            onDeleteStep={handleDeleteStep}
            rawDataset={rawDataset}
            allDatasets={allDatasetsList}
            onAddStep={handleAddStep}
            onUpdateStepPosition={handleUpdateStepPosition}
            onUpdateStepParams={handleUpdateStepParams}
            onDuplicateStep={handleDuplicateStep}
            onAutoLayout={handleAutoLayout}
          />
        ) : (
          <SpreadsheetView
            data={activeDataFrame.data}
            columns={activeDataFrame.columns}
            onAddStep={handleAddStep}
          />
        )}

        {/* Right sidebar: Node Parameter Inspector & Live Pandas Code */}
        <SidebarEditor
          activeStep={activeStepRecord}
          columns={inputDataFrameForActiveStep.columns}
          allColumns={allColumnsList}
          onUpdateStepParams={handleUpdateStepParams}
          generatedCode={generatedCode}
          steps={steps}
          allDatasets={allDatasetsList}
        />
      </div>
    </div>
  );
}
