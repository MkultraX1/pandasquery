import { AppliedStep, Column, ColumnType, Dataset } from '../types';

/**
 * Simulates a list of ETL steps on a raw dataset in the browser.
 * Supports stepping back in time by passing a `stopAtStepId`.
 */
export function runPipeline(
  rawDataset: Dataset,
  steps: AppliedStep[],
  stopAtStepId?: string,
  allDatasets: Dataset[] = []
): { data: any[]; columns: Column[] } {
  let data = JSON.parse(JSON.stringify(rawDataset.data)) as any[];
  let columns = JSON.parse(JSON.stringify(rawDataset.columns)) as Column[];

  let activeSteps = steps;
  if (stopAtStepId) {
    const activeIndex = steps.findIndex((s) => s.id === stopAtStepId);
    if (activeIndex !== -1) {
      activeSteps = steps.slice(0, activeIndex + 1);
    }
  }

  for (const step of activeSteps) {
    if (step.type === 'source') continue;

    try {
      switch (step.type) {
        case 'rename_column': {
          const { from, to } = step.params;
          if (!from || !to) break;
          columns = columns.map((col) => (col.name === from ? { ...col, name: to } : col));
          data = data.map((row) => {
            const newRow = { ...row };
            if (from in newRow) {
              newRow[to] = newRow[from];
              delete newRow[from];
            }
            return newRow;
          });
          break;
        }

        case 'change_type':
        case 'cast_to_string':
        case 'cast_to_number':
        case 'cast_to_boolean': {
          const column = step.params.column || step.params.name;
          const toType = step.params.toType ||
            (step.type === 'cast_to_string' ? 'string' : step.type === 'cast_to_number' ? 'number' : 'boolean');
          if (!column || !toType) break;
          columns = columns.map((col) => (col.name === column ? { ...col, type: toType } : col));
          data = data.map((row) => {
            const val = row[column];
            let castedVal = val;
            if (val !== null && val !== undefined) {
              if (toType === 'number') {
                castedVal = Number(val);
                if (isNaN(castedVal)) castedVal = null;
              } else if (toType === 'string') {
                castedVal = String(val);
              } else if (toType === 'boolean') {
                castedVal = val === 'true' || val === true || val === 1 || val === '1';
              } else if (toType === 'date') {
                castedVal = new Date(val).toISOString().split('T')[0];
              }
            }
            return { ...row, [column]: castedVal };
          });
          break;
        }

        case 'trim_whitespace': {
          const { column } = step.params;
          if (!column) break;
          data = data.map((row) => ({ ...row, [column]: row[column] == null ? null : String(row[column]).trim() }));
          break;
        }

        case 'lower_case':
        case 'upper_case':
        case 'title_case': {
          const { column } = step.params;
          if (!column) break;
          data = data.map((row) => {
            const val = row[column];
            if (val == null || val === '') return { ...row, [column]: val };
            const str = String(val);
            const next = step.type === 'lower_case' ? str.toLowerCase() : step.type === 'upper_case' ? str.toUpperCase() : str.replace(/\b\w/g, (ch) => ch.toUpperCase());
            return { ...row, [column]: next };
          });
          break;
        }

        case 'replace_text': {
          const { column, find, replace } = step.params;
          if (!column || find === undefined || replace === undefined) break;
          data = data.map((row) => ({
            ...row,
            [column]: row[column] == null ? row[column] : String(row[column]).split(String(find)).join(String(replace)),
          }));
          break;
        }

        case 'substring': {
          const { column, start, length } = step.params;
          if (!column || start === undefined || length === undefined) break;
          data = data.map((row) => ({
            ...row,
            [column]: row[column] == null ? row[column] : String(row[column]).slice(Number(start), Number(start) + Number(length)),
          }));
          break;
        }

        case 'concat_columns': {
          const { columns: sourceCols, target, separator = '' } = step.params;
          if (!sourceCols || sourceCols.length === 0 || !target) break;
          columns = columns.some((c) => c.name === target) ? columns : [...columns, { name: target, type: 'string' }];
          data = data.map((row) => {
            const nextValue = sourceCols.map((col: string) => row[col] == null ? '' : String(row[col])).join(String(separator));
            return { ...row, [target]: nextValue };
          });
          break;
        }

        case 'drop_nulls': {
          const { column } = step.params;
          data = data.filter((row) => {
            if (!column) return row && Object.values(row).every((v) => v !== null && v !== undefined && v !== '');
            return row[column] !== null && row[column] !== undefined && row[column] !== '';
          });
          break;
        }

        case 'fill_missing': {
          const { column, value = 0 } = step.params;
          if (!column) break;
          data = data.map((row) => ({ ...row, [column]: row[column] === null || row[column] === undefined || row[column] === '' ? value : row[column] }));
          break;
        }

        case 'remove_duplicates':
        case 'drop_duplicates': {
          const cols = step.params.columns || [];
          const seen = new Set<string>();
          data = data.filter((row) => {
            const keyFields = cols && cols.length > 0 ? cols : columns.map((col) => col.name);
            const key = keyFields.map((c: string) => String(row[c])).join('|||');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          break;
        }

        case 'filter_rows':
        case 'filter_equals':
        case 'filter_not_equals':
        case 'filter_contains':
        case 'filter_not_contains':
        case 'filter_is_null':
        case 'filter_is_not_null': {
          const column = step.params.column;
          const operator = step.params.operator || (step.type === 'filter_equals' ? 'equals' : step.type === 'filter_not_equals' ? 'not_equals' : step.type === 'filter_contains' ? 'contains' : step.type === 'filter_not_contains' ? 'not_contains' : step.type === 'filter_is_null' ? 'is_null' : 'is_not_null');
          const value = step.params.value ?? '';
          if (!column || !operator) break;
          data = data.filter((row) => {
            const rowVal = row[column];
            if (operator === 'is_null') return rowVal === null || rowVal === undefined || rowVal === '';
            if (operator === 'is_not_null') return rowVal !== null && rowVal !== undefined && rowVal !== '';
            if (rowVal === null || rowVal === undefined) return false;
            const strRowVal = String(rowVal).toLowerCase();
            const strCompVal = String(value).toLowerCase();
            switch (operator) {
              case 'equals': return String(rowVal) === String(value);
              case 'not_equals': return String(rowVal) !== String(value);
              case 'contains': return strRowVal.includes(strCompVal);
              case 'not_contains': return !strRowVal.includes(strCompVal);
              default: return true;
            }
          });
          break;
        }

        case 'filter_between': {
          const { column, min, max } = step.params;
          if (!column || min === undefined || max === undefined) break;
          data = data.filter((row) => {
            const value = Number(row[column]);
            return !isNaN(value) && value >= Number(min) && value <= Number(max);
          });
          break;
        }

        case 'add_column': {
          const { columnName, expressionType, colA, operator, colB, constantValue, customExpression } = step.params;
          if (!columnName) break;
          columns = columns.some((col) => col.name === columnName) ? columns.map((c) => c.name === columnName ? { ...c, type: 'number' } : c) : [...columns, { name: columnName, type: 'number' }];
          data = data.map((row) => {
            let result: any = null;
            if (expressionType === 'constant') result = constantValue;
            else if (expressionType === 'concatenate' && colA && colB) result = `${row[colA] ?? ''}${row[colB] ?? ''}`;
            else if (expressionType === 'math' && colA && operator && colB) {
              const a = Number(row[colA]);
              const b = Number(row[colB]);
              if (!isNaN(a) && !isNaN(b)) {
                if (operator === '+') result = a + b;
                if (operator === '-') result = a - b;
                if (operator === '*') result = a * b;
                if (operator === '/') result = b !== 0 ? a / b : null;
              }
            }
            return { ...row, [columnName]: result };
          });
          break;
        }

        case 'aggregate_sum':
        case 'aggregate_mean':
        case 'aggregate_max':
        case 'aggregate_min':
        case 'aggregate_count': {
          const { column, groupByColumns = [], targetColumnName = 'agregado' } = step.params;
          if (!column) break;
          if (groupByColumns.length === 0) {
            const values = data.map((row) => Number(row[column])).filter((v) => !isNaN(v));
            let aggValue: number | null = null;
            if (step.type === 'aggregate_sum') aggValue = values.reduce((sum, v) => sum + v, 0);
            if (step.type === 'aggregate_mean') aggValue = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
            if (step.type === 'aggregate_max') aggValue = values.length ? Math.max(...values) : null;
            if (step.type === 'aggregate_min') aggValue = values.length ? Math.min(...values) : null;
            if (step.type === 'aggregate_count') aggValue = values.length;
            data = [{ ...Object.fromEntries(columns.map((c) => [c.name, null])), [targetColumnName]: aggValue }];
            columns = columns.some((c) => c.name === targetColumnName) ? columns : [...columns, { name: targetColumnName, type: 'number' }];
            break;
          }

          const groups: Record<string, any[]> = {};
          for (const row of data) {
            const groupKey = groupByColumns.map((c: string) => String(row[c])).join('|||');
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(row);
          }

          const resultRows: any[] = [];
          for (const key of Object.keys(groups)) {
            const rows = groups[key];
            const baseRow: any = {};
            for (const c of groupByColumns) baseRow[c] = rows[0][c];
            const values = rows.map((row) => Number(row[column])).filter((v) => !isNaN(v));
            let aggValue: number | null = null;
            if (step.type === 'aggregate_sum') aggValue = values.reduce((sum, v) => sum + v, 0);
            if (step.type === 'aggregate_mean') aggValue = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
            if (step.type === 'aggregate_max') aggValue = values.length ? Math.max(...values) : null;
            if (step.type === 'aggregate_min') aggValue = values.length ? Math.min(...values) : null;
            if (step.type === 'aggregate_count') aggValue = rows.length;
            resultRows.push({ ...baseRow, [targetColumnName]: aggValue });
          }
          data = resultRows;
          columns = [...groupByColumns.map((name) => ({ name, type: 'string' as ColumnType })), { name: targetColumnName, type: 'number' as ColumnType }];
          break;
        }

        case 'sort_rows': {
          const { column, ascending } = step.params;
          if (!column) break;
          data.sort((a, b) => {
            const va = a[column];
            const vb = b[column];
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === 'number' && typeof vb === 'number') return ascending ? va - vb : vb - va;
            const sa = String(va).toLowerCase();
            const sb = String(vb).toLowerCase();
            if (sa < sb) return ascending ? -1 : 1;
            if (sa > sb) return ascending ? 1 : -1;
            return 0;
          });
          break;
        }

        case 'group_by': {
          const { groupByColumns, aggColumn, aggFunction, targetColumnName } = step.params;
          if (!groupByColumns?.length || !aggColumn || !aggFunction || !targetColumnName) break;
          const groups: Record<string, any[]> = {};
          for (const row of data) {
            const key = groupByColumns.map((col: string) => String(row[col])).join('|||');
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
          }
          const resultRows: any[] = [];
          for (const key of Object.keys(groups)) {
            const rows = groups[key];
            const baseRow: any = {};
            for (const col of groupByColumns) baseRow[col] = rows[0][col];
            const values = rows.map((row) => Number(row[aggColumn])).filter((v) => !isNaN(v));
            let aggValue: number | null = null;
            if (aggFunction === 'count') aggValue = rows.length;
            if (aggFunction === 'sum' && values.length) aggValue = values.reduce((sum, v) => sum + v, 0);
            if (aggFunction === 'mean' && values.length) aggValue = values.reduce((sum, v) => sum + v, 0) / values.length;
            if (aggFunction === 'max' && values.length) aggValue = Math.max(...values);
            if (aggFunction === 'min' && values.length) aggValue = Math.min(...values);
            resultRows.push({ ...baseRow, [targetColumnName]: aggValue });
          }
          data = resultRows;
          columns = [...groupByColumns.map((name: string) => ({ name, type: 'string' as ColumnType })), { name: targetColumnName, type: 'number' as ColumnType }];
          break;
        }

        case 'custom_code': {
          const { code } = step.params;
          if (!code) break;
          const parsed = code.split('\n');
          for (const line of parsed) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const match = trimmed.match(/^df\[['"](.*?)['"]\]\s*=\s*(.*)$/);
            if (!match) continue;
            const colName = match[1];
            let expr = match[2];
            expr = expr.replace(/df\[['"](.*?)['"]\]/g, "row['$1']");
            expr = expr.replace(/df\.(\w+)/g, "row['$1']");
            data = data.map((row) => {
              try {
                const result = Function(`"use strict"; return (${expr.replace(/row\['(.*?)'\]/g, (_, key) => {
                  const v = row[key];
                  if (v === null || v === undefined) return '0';
                  return typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : String(v);
                })})`)();
                return { ...row, [colName]: result };
              } catch {
                return row;
              }
            });
            if (!columns.some((col) => col.name === colName)) columns.push({ name: colName, type: 'string' });
          }
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error(`Erro ao executar passo ETL: ${step.label}`, e);
    }
  }

  return { data, columns };
}

export function generatePandasCode(steps: AppliedStep[], datasetId: string): string {
  let py = `import pandas as pd
import numpy as np

# ==========================================
# PIPELINE DE ETL - GERADO COM PANDAS QUERY
# ==========================================

# Passo 1: Carregar dados de entrada
# `;

  if (datasetId === 'sales') {
    py += `Carregando o dataset de exemplo: Vendas\n# Você pode substituir pelo seu arquivo vendas.csv local\n`;
    py += `df = pd.read_csv('vendas.csv')\n`;
  } else if (datasetId === 'employees') {
    py += `Carregando o dataset de exemplo: Recursos Humanos\n# Você pode substituir pelo seu arquivo funcionarios.csv local\n`;
    py += `df = pd.read_csv('funcionarios.csv')\n`;
  } else if (datasetId === 'inventory') {
    py += `Carregando o dataset de exemplo: Estoque de Produtos\n# Você pode substituir pelo seu arquivo estoque.csv local\n`;
    py += `df = pd.read_csv('estoque.csv')\n`;
  } else {
    py += `Carregando arquivo carregado pelo usuário\n`;
    py += `df = pd.read_csv('dataset.csv')\n`;
  }

  py += `\n`;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.type === 'source') continue;
    py += `# Passo ${i + 1}: ${step.label}\n# Descrição: ${step.description}\n`;

    switch (step.type) {
      case 'rename_column': {
        const { from, to } = step.params;
        py += `df = df.rename(columns={'${from}': '${to}'})\n`;
        break;
      }
      case 'trim_whitespace': {
        const { column } = step.params;
        py += `df['${column}'] = df['${column}'].astype(str).str.strip()\n`;
        break;
      }
      case 'lower_case': {
        const { column } = step.params;
        py += `df['${column}'] = df['${column}'].astype(str).str.lower()\n`;
        break;
      }
      case 'upper_case': {
        const { column } = step.params;
        py += `df['${column}'] = df['${column}'].astype(str).str.upper()\n`;
        break;
      }
      case 'replace_text': {
        const { column, find, replace } = step.params;
        py += `df['${column}'] = df['${column}'].astype(str).str.replace('${find}', '${replace}', regex=False)\n`;
        break;
      }
      case 'substring': {
        const { column, start, length } = step.params;
        py += `df['${column}'] = df['${column}'].astype(str).str.slice(${start}, ${Number(start) + Number(length)})\n`;
        break;
      }
      case 'concat_columns': {
        const { columns: cols, target, separator = '' } = step.params;
        const expr = cols.map((c: string) => `df['${c}'].astype(str)`).join(` + '${separator}' + `);
        py += `df['${target}'] = ${expr}\n`;
        break;
      }
      case 'drop_nulls': {
        const { column } = step.params;
        if (column) py += `df = df[df['${column}'].notna()]\n`;
        else py += `df = df.dropna()\n`;
        break;
      }
      case 'fill_missing': {
        const { column, value = 0 } = step.params;
        py += `df['${column}'] = df['${column}'].fillna(${value})\n`;
        break;
      }
      case 'remove_duplicates':
      case 'drop_duplicates': {
        const cols = step.params.columns || [];
        if (cols.length > 0) py += `df = df.drop_duplicates(subset=[${cols.map((c: string) => `'${c}'`).join(', ')}])\n`;
        else py += `df = df.drop_duplicates()\n`;
        break;
      }
      case 'filter_equals':
      case 'filter_not_equals':
      case 'filter_contains':
      case 'filter_not_contains': {
        const { column, operator, value } = step.params;
        const op = operator || 'equals';
        if (op === 'equals') py += `df = df[df['${column}'] == '${value}']\n`;
        if (op === 'not_equals') py += `df = df[df['${column}'] != '${value}']\n`;
        if (op === 'contains') py += `df = df[df['${column}'].astype(str).str.contains('${value}', case=False, na=False)]\n`;
        if (op === 'not_contains') py += `df = df[~df['${column}'].astype(str).str.contains('${value}', case=False, na=False)]\n`;
        break;
      }
      case 'filter_between': {
        const { column, min, max } = step.params;
        py += `df = df[(df['${column}'] >= ${min}) & (df['${column}'] <= ${max})]\n`;
        break;
      }
      case 'add_column': {
        const { columnName, expressionType, colA, operator, colB, constantValue, customExpression } = step.params;
        if (expressionType === 'constant') {
          py += `df['${columnName}'] = ${constantValue}\n`;
        } else if (expressionType === 'concatenate' && colA && colB) {
          py += `df['${columnName}'] = df['${colA}'].astype(str) + df['${colB}'].astype(str)\n`;
        } else if (expressionType === 'math' && colA && operator && colB) {
          py += `df['${columnName}'] = df['${colA}'] ${operator} df['${colB}']\n`;
        } else if (expressionType === 'custom_python' && customExpression) {
          let parsedExp = customExpression;
          const matches = customExpression.match(/\[(.*?)\]/g) || [];
          for (const match of matches) {
            const rawCol = match.slice(1, -1);
            parsedExp = parsedExp.replace(match, `df['${rawCol}']`);
          }
          py += `df['${columnName}'] = ${parsedExp}\n`;
        }
        break;
      }
      case 'group_by': {
        const { groupByColumns, aggColumn, aggFunction, targetColumnName } = step.params;
        const groupbyList = groupByColumns.map((c: string) => `'${c}'`).join(', ');
        py += `df = df.groupby([${groupbyList}]).agg(\n    ${targetColumnName}=('${aggColumn}', '${aggFunction}')\n).reset_index()\n`;
        break;
      }
      case 'sort_rows': {
        const { column, ascending } = step.params;
        py += `df = df.sort_values(by='${column}', ascending=${ascending ? 'True' : 'False'})\n`;
        break;
      }
      case 'join_dataset': {
        const { otherDatasetId, joinType, leftOn, rightOn, prefix } = step.params;
        py += `df = df.merge(df_other, left_on='${leftOn}', right_on='${rightOn}', how='${joinType}'${prefix ? `, suffixes=('', '_${prefix}')` : ', suffixes=(\'\', \'_joined\')'})\n`;
        break;
      }
      case 'pivot': {
        const { indexColumns, pivotColumn, valueColumn, aggFunction } = step.params;
        const indexList = indexColumns.map((c: string) => `'${c}'`).join(', ');
        py += `df = df.pivot_table(\n    index=[${indexList}],\n    columns='${pivotColumn}',\n    values='${valueColumn}',\n    aggfunc='${aggFunction}'\n).reset_index()\n`;
        break;
      }
      case 'unpivot': {
        const { idVars, valueVars, varName, valueName } = step.params;
        const idsList = idVars.map((c: string) => `'${c}'`).join(', ');
        const valsList = valueVars.map((c: string) => `'${c}'`).join(', ');
        py += `df = df.melt(\n    id_vars=[${idsList}],\n    value_vars=[${valsList}],\n    var_name='${varName || 'atributo'}',\n    value_name='${valueName || 'valor'}'\n)\n`;
        break;
      }
      case 'custom_code': {
        py += `${step.params.code}\n`;
        break;
      }
      default:
        break;
    }
    py += `\n`;
  }

  py += `# Exibir o resultado final da pipeline\nprint(df.head())\n`;
  return py;
}

