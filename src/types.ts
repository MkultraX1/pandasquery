export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'object';

export interface Column {
  name: string;
  type: ColumnType;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  data: Record<string, any>[];
}

export type StepType =
  | 'source'
  | 'rename_column'
  | 'change_type'
  | 'filter_rows'
  | 'drop_column'
  | 'add_column'
  | 'group_by'
  | 'sort_rows'
  | 'drop_duplicates'
  | 'fillna'
  | 'slice_rows'
  | 'join_dataset'
  | 'pivot'
  | 'unpivot'
  | 'custom_code';

export interface SourceParams {
  datasetId: string;
  datasetName: string;
}

export interface RenameColumnParams {
  from: string;
  to: string;
}

export interface ChangeTypeParams {
  column: string;
  toType: ColumnType;
}

export interface FilterRowsParams {
  column: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'is_null' | 'is_not_null';
  value: string;
}

export interface DropColumnParams {
  columns: string[];
}

export interface AddColumnParams {
  columnName: string;
  expressionType: 'math' | 'concatenate' | 'custom_python' | 'constant';
  colA?: string;
  operator?: '+' | '-' | '*' | '/' | 'concat';
  colB?: string;
  constantValue?: string;
  customExpression?: string; // Python formula like ColA * 10
}

export interface GroupByParams {
  groupByColumns: string[];
  aggColumn: string;
  aggFunction: 'sum' | 'mean' | 'count' | 'max' | 'min';
  targetColumnName: string;
}

export interface SortRowsParams {
  column: string;
  ascending: boolean;
}

export interface DropDuplicatesParams {
  columns: string[]; // empty means all columns
}

export interface FillNaParams {
  column: string;
  method: 'value' | 'mean' | 'median' | 'ffill' | 'bfill';
  customValue?: string;
}

export interface SliceRowsParams {
  limit: number;
  offset?: number;
}

export interface JoinDatasetParams {
  otherDatasetId: string;
  joinType: 'left' | 'inner' | 'right' | 'outer';
  leftOn: string;
  rightOn: string;
  prefix?: string;
}

export interface PivotParams {
  indexColumns: string[];
  pivotColumn: string;
  valueColumn: string;
  aggFunction: 'sum' | 'mean' | 'count' | 'max' | 'min';
}

export interface UnpivotParams {
  idVars: string[];
  valueVars: string[];
  varName: string;
  valueName: string;
}

export interface CustomCodeParams {
  code: string;
  jsSimulation?: string;
}

export type StepParams =
  | { type: 'source'; params: SourceParams }
  | { type: 'rename_column'; params: RenameColumnParams }
  | { type: 'change_type'; params: ChangeTypeParams }
  | { type: 'filter_rows'; params: FilterRowsParams }
  | { type: 'drop_column'; params: DropColumnParams }
  | { type: 'add_column'; params: AddColumnParams }
  | { type: 'group_by'; params: GroupByParams }
  | { type: 'sort_rows'; params: SortRowsParams }
  | { type: 'drop_duplicates'; params: DropDuplicatesParams }
  | { type: 'fillna'; params: FillNaParams }
  | { type: 'slice_rows'; params: SliceRowsParams }
  | { type: 'join_dataset'; params: JoinDatasetParams }
  | { type: 'pivot'; params: PivotParams }
  | { type: 'unpivot'; params: UnpivotParams }
  | { type: 'custom_code'; params: CustomCodeParams };

export interface NodePosition {
  x: number;
  y: number;
}

export interface AppliedStep {
  id: string;
  type: StepType;
  label: string;
  description: string;
  params: any; // specific params for the type
  position?: NodePosition;
  externalNodePosition?: NodePosition;
}

export interface ETLState {
  steps: AppliedStep[];
  activeStepId: string; // The step currently selected/inspected
}
