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

  // Find the sublist of steps up to stopAtStepId
  let activeSteps = steps;
  if (stopAtStepId) {
    const activeIndex = steps.findIndex((s) => s.id === stopAtStepId);
    if (activeIndex !== -1) {
      activeSteps = steps.slice(0, activeIndex + 1);
    }
  }

  for (const step of activeSteps) {
    if (step.type === 'source') {
      // Source step already initialized the data and columns
      continue;
    }

    try {
      switch (step.type) {
        case 'rename_column': {
          const { from, to } = step.params;
          if (!from || !to) break;
          // Update columns
          columns = columns.map((col) => (col.name === from ? { ...col, name: to } : col));
          // Update data rows
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

        case 'change_type': {
          const { column, toType } = step.params;
          if (!column || !toType) break;
          // Update column type
          columns = columns.map((col) => (col.name === column ? { ...col, type: toType } : col));
          // Cast data values
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

        case 'filter_rows': {
          const { column, operator, value } = step.params;
          if (!column || !operator) break;
          data = data.filter((row) => {
            const rowVal = row[column];
            const compareVal = value;

            if (operator === 'is_null') {
              return rowVal === null || rowVal === undefined || rowVal === '';
            }
            if (operator === 'is_not_null') {
              return rowVal !== null && rowVal !== undefined && rowVal !== '';
            }

            if (rowVal === null || rowVal === undefined) return false;

            const strRowVal = String(rowVal).toLowerCase();
            const strCompVal = String(compareVal).toLowerCase();

            switch (operator) {
              case 'equals':
                return String(rowVal) === String(compareVal);
              case 'not_equals':
                return String(rowVal) !== String(compareVal);
              case 'greater_than':
                return Number(rowVal) > Number(compareVal);
              case 'less_than':
                return Number(rowVal) < Number(compareVal);
              case 'contains':
                return strRowVal.includes(strCompVal);
              case 'not_contains':
                return !strRowVal.includes(strCompVal);
              default:
                return true;
            }
          });
          break;
        }

        case 'drop_column': {
          const { columns: colsToDrop } = step.params;
          if (!colsToDrop || colsToDrop.length === 0) break;
          // Remove from columns
          columns = columns.filter((col) => !colsToDrop.includes(col.name));
          // Remove keys from data rows
          data = data.map((row) => {
            const newRow = { ...row };
            for (const col of colsToDrop) {
              delete newRow[col];
            }
            return newRow;
          });
          break;
        }

        case 'add_column': {
          const { columnName, expressionType, colA, operator, colB, constantValue, customExpression } = step.params;
          if (!columnName) break;

          // Add to columns list
          const exists = columns.some((col) => col.name === columnName);
          let newType: ColumnType = 'string';

          if (expressionType === 'math') {
            newType = 'number';
          } else if (expressionType === 'concatenate') {
            newType = 'string';
          } else if (expressionType === 'constant') {
            newType = isNaN(Number(constantValue)) ? 'string' : 'number';
          } else {
            newType = 'number'; // Fallback for custom python
          }

          if (!exists) {
            columns.push({ name: columnName, type: newType });
          } else {
            columns = columns.map(c => c.name === columnName ? { ...c, type: newType } : c);
          }

          // Compute row values
          data = data.map((row) => {
            let result: any = null;

            if (expressionType === 'constant') {
              result = isNaN(Number(constantValue)) ? constantValue : Number(constantValue);
            } else if (expressionType === 'concatenate' && colA && colB) {
              const valA = row[colA] !== null && row[colA] !== undefined ? String(row[colA]) : '';
              const valB = row[colB] !== null && row[colB] !== undefined ? String(row[colB]) : '';
              result = valA + valB;
            } else if (expressionType === 'math' && colA && operator && colB) {
              const valA = Number(row[colA]);
              const valB = Number(row[colB]);

              if (!isNaN(valA) && !isNaN(valB)) {
                switch (operator) {
                  case '+': result = valA + valB; break;
                  case '-': result = valA - valB; break;
                  case '*': result = valA * valB; break;
                  case '/': result = valB !== 0 ? valA / valB : null; break;
                }
              }
            } else if (expressionType === 'custom_python' && customExpression) {
              // Client-side quick-eval simulation for formulas like "[Quantidade] * 1.2"
              try {
                // Replace bracketed column names with actual values
                let jsFormula = customExpression;
                const colMatches = customExpression.match(/\[(.*?)\]/g) || [];
                for (const match of colMatches) {
                  const rawCol = match.slice(1, -1);
                  const rowVal = row[rawCol];
                  jsFormula = jsFormula.replace(match, rowVal !== null && rowVal !== undefined ? rowVal : '0');
                }
                // Evaluate formula safely (simple math)
                // Remove letters or unsafe JS characters except simple math tokens
                const sanitizedFormula = jsFormula.replace(/[^0-9.+\-*/() ]/g, '');
                result = Function(`"use strict"; return (${sanitizedFormula})`)();
              } catch (e) {
                result = null;
              }
            }

            return { ...row, [columnName]: result };
          });
          break;
        }

        case 'group_by': {
          const { groupByColumns, aggColumn, aggFunction, targetColumnName } = step.params;
          if (!groupByColumns || groupByColumns.length === 0 || !aggColumn || !aggFunction || !targetColumnName) break;

          // Create grouping map
          const groups: Record<string, any[]> = {};
          for (const row of data) {
            const groupKey = groupByColumns.map((col) => String(row[col])).join('|||');
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(row);
          }

          // Set columns list
          const groupColDefs = columns.filter((col) => groupByColumns.includes(col.name));
          columns = [...groupColDefs, { name: targetColumnName, type: aggFunction === 'count' ? 'number' : 'number' }];

          // Build group results
          const resultRows: any[] = [];
          for (const key of Object.keys(groups)) {
            const groupRows = groups[key];
            const sampleRow = groupRows[0];

            // Build base group values
            const newRow: any = {};
            for (const colName of groupByColumns) {
              newRow[colName] = sampleRow[colName];
            }

            // Extract values to aggregate
            const values = groupRows
              .map((row) => Number(row[aggColumn]))
              .filter((val) => !isNaN(val) && val !== null && val !== undefined);

            let aggVal: number | null = null;
            if (aggFunction === 'count') {
              aggVal = groupRows.length;
            } else if (values.length > 0) {
              switch (aggFunction) {
                case 'sum':
                  aggVal = values.reduce((sum, val) => sum + val, 0);
                  break;
                case 'mean':
                  aggVal = values.reduce((sum, val) => sum + val, 0) / values.length;
                  break;
                case 'max':
                  aggVal = Math.max(...values);
                  break;
                case 'min':
                  aggVal = Math.min(...values);
                  break;
              }
            }

            newRow[targetColumnName] = aggVal !== null ? parseFloat(aggVal.toFixed(2)) : null;
            resultRows.push(newRow);
          }

          data = resultRows;
          break;
        }

        case 'sort_rows': {
          const { column, ascending } = step.params;
          if (!column) break;
          data.sort((a, b) => {
            const valA = a[column];
            const valB = b[column];

            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            if (typeof valA === 'number' && typeof valB === 'number') {
              return ascending ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (strA < strB) return ascending ? -1 : 1;
            if (strA > strB) return ascending ? 1 : -1;
            return 0;
          });
          break;
        }

        case 'drop_duplicates': {
          const { columns: cols } = step.params;
          const seen = new Set<string>();
          data = data.filter((row) => {
            // If cols is specified, match unique values on those columns.
            // If empty, match unique values across all columns.
            const checkCols = cols && cols.length > 0 ? cols : columns.map((col) => col.name);
            const key = checkCols.map((c) => String(row[c])).join('|||');
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });
          break;
        }

        case 'fillna': {
          const { column, method, customValue } = step.params;
          if (!column) break;

          // Find column values to compute mean/median if needed
          const numericValues = data
            .map((row) => Number(row[column]))
            .filter((v) => !isNaN(v) && v !== null && v !== undefined);

          let replacement: any = customValue;

          if (method === 'mean' && numericValues.length > 0) {
            replacement = numericValues.reduce((s, v) => s + v, 0) / numericValues.length;
            replacement = parseFloat(replacement.toFixed(2));
          } else if (method === 'median' && numericValues.length > 0) {
            const sorted = [...numericValues].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            replacement = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
            replacement = parseFloat(replacement.toFixed(2));
          }

          let lastValidValue: any = null;

          if (method === 'ffill') {
            data = data.map((row) => {
              const val = row[column];
              if (val !== null && val !== undefined && val !== '') {
                lastValidValue = val;
                return row;
              }
              return { ...row, [column]: lastValidValue };
            });
          } else if (method === 'bfill') {
            // Fill backwards (iterate backwards)
            for (let i = data.length - 1; i >= 0; i--) {
              const val = data[i][column];
              if (val !== null && val !== undefined && val !== '') {
                lastValidValue = val;
              } else {
                data[i] = { ...data[i], [column]: lastValidValue };
              }
            }
          } else {
            // Regular replacement value, mean, or median
            data = data.map((row) => {
              const val = row[column];
              if (val === null || val === undefined || val === '') {
                return { ...row, [column]: isNaN(Number(replacement)) ? replacement : Number(replacement) };
              }
              return row;
            });
          }
          break;
        }

        case 'slice_rows': {
          const { limit, offset } = step.params;
          const off = offset || 0;
          data = data.slice(off, off + (limit || data.length));
          break;
        }

        case 'join_dataset': {
          const { otherDatasetId, joinType, leftOn, rightOn, prefix } = step.params;
          if (!otherDatasetId || !leftOn || !rightOn) break;

          // Resolve other dataset columns and data
          let otherColumns: Column[] = [];
          let otherData: any[] = [];

          if (otherDatasetId === 'base_original') {
            otherColumns = JSON.parse(JSON.stringify(rawDataset.columns));
            otherData = JSON.parse(JSON.stringify(rawDataset.data));
          } else if (otherDatasetId.startsWith('step_')) {
            // Self/Previous step reference! Run the pipeline up to that step
            const subResult = runPipeline(rawDataset, steps, otherDatasetId, allDatasets);
            otherColumns = subResult.columns;
            otherData = subResult.data;
          } else {
            // Normal dataset ID
            const foundDataset = allDatasets.find((d) => d.id === otherDatasetId);
            if (foundDataset) {
              otherColumns = JSON.parse(JSON.stringify(foundDataset.columns));
              otherData = JSON.parse(JSON.stringify(foundDataset.data));
            }
          }

          if (otherColumns.length === 0) break;

          // Index other data on join key (rightOn)
          const otherIndex: Record<string, any[]> = {};
          for (const row of otherData) {
            const val = row[rightOn];
            const key = val !== null && val !== undefined ? String(val) : '';
            if (!otherIndex[key]) otherIndex[key] = [];
            otherIndex[key].push(row);
          }

          // Compute merged columns list
          const mergedColumns = [...columns];
          const collisionCols = new Set<string>();
          for (const col of otherColumns) {
            const targetName = columns.some((c) => c.name === col.name)
              ? `${prefix || 'joined_'}${col.name}`
              : col.name;
            
            if (columns.some((c) => c.name === col.name)) {
              collisionCols.add(col.name);
            }

            if (!mergedColumns.some((c) => c.name === targetName)) {
              mergedColumns.push({ name: targetName, type: col.type });
            }
          }

          // Combine row helper
          const combineRows = (rA: any, rB: any) => {
            const newRow = { ...rA };
            for (const col of otherColumns) {
              const val = rB ? rB[col.name] : null;
              const colName = collisionCols.has(col.name)
                ? `${prefix || 'joined_'}${col.name}`
                : col.name;
              newRow[colName] = val;
            }
            return newRow;
          };

          // Perform Join matching
          const resultRows: any[] = [];
          const matchedOtherKeys = new Set<string>();

          if (joinType === 'left' || joinType === 'outer') {
            for (const rowA of data) {
              const valA = rowA[leftOn];
              const keyA = valA !== null && valA !== undefined ? String(valA) : '';
              const rBList = otherIndex[keyA] || [];

              if (rBList.length > 0) {
                matchedOtherKeys.add(keyA);
                for (const rowB of rBList) {
                  resultRows.push(combineRows(rowA, rowB));
                }
              } else {
                resultRows.push(combineRows(rowA, null));
              }
            }
          }

          if (joinType === 'inner') {
            for (const rowA of data) {
              const valA = rowA[leftOn];
              const keyA = valA !== null && valA !== undefined ? String(valA) : '';
              const rBList = otherIndex[keyA] || [];

              if (rBList.length > 0) {
                for (const rowB of rBList) {
                  resultRows.push(combineRows(rowA, rowB));
                }
              }
            }
          }

          if (joinType === 'right' || joinType === 'outer') {
            if (joinType === 'right') {
              for (const rowB of otherData) {
                const valB = rowB[rightOn];
                const keyB = valB !== null && valB !== undefined ? String(valB) : '';
                
                const rAList = data.filter((r) => String(r[leftOn]) === keyB);
                if (rAList.length > 0) {
                  for (const rowA of rAList) {
                    resultRows.push(combineRows(rowA, rowB));
                  }
                } else {
                  const emptyRowA: any = {};
                  for (const col of columns) {
                    emptyRowA[col.name] = null;
                  }
                  resultRows.push(combineRows(emptyRowA, rowB));
                }
              }
            } else {
              // Outer join - add rows from otherData that were NEVER matched in the left loop
              for (const rowB of otherData) {
                const valB = rowB[rightOn];
                const keyB = valB !== null && valB !== undefined ? String(valB) : '';
                
                if (!matchedOtherKeys.has(keyB)) {
                  const emptyRowA: any = {};
                  for (const col of columns) {
                    emptyRowA[col.name] = null;
                  }
                  resultRows.push(combineRows(emptyRowA, rowB));
                }
              }
            }
          }

          data = resultRows;
          columns = mergedColumns;
          break;
        }

        case 'pivot': {
          const { indexColumns, pivotColumn, valueColumn, aggFunction } = step.params;
          if (!indexColumns || indexColumns.length === 0 || !pivotColumn || !valueColumn || !aggFunction) break;

          const pivotValues = Array.from(
            new Set(data.map((row) => String(row[pivotColumn])).filter((v) => v !== 'null' && v !== 'undefined' && v !== ''))
          );
          pivotValues.sort();

          const groups: Record<string, Record<string, number[]>> = {};
          const groupRowPrototype: Record<string, any> = {};

          for (const row of data) {
            const groupKey = indexColumns.map((col) => String(row[col])).join('|||');
            if (!groups[groupKey]) {
              groups[groupKey] = {};
              groupRowPrototype[groupKey] = {};
              for (const col of indexColumns) {
                groupRowPrototype[groupKey][col] = row[col];
              }
            }

            const pVal = String(row[pivotColumn]);
            if (pVal !== 'null' && pVal !== 'undefined' && pVal !== '') {
              if (!groups[groupKey][pVal]) {
                groups[groupKey][pVal] = [];
              }
              const val = Number(row[valueColumn]);
              if (!isNaN(val) && val !== null && val !== undefined) {
                groups[groupKey][pVal].push(val);
              }
            }
          }

          const indexColDefs = columns.filter((col) => indexColumns.includes(col.name));
          const pivotColDefs = pivotValues.map((val) => ({ name: val, type: 'number' as ColumnType }));
          columns = [...indexColDefs, ...pivotColDefs];

          const resultRows: any[] = [];
          for (const groupKey of Object.keys(groups)) {
            const newRow = { ...groupRowPrototype[groupKey] };
            const pGroup = groups[groupKey];

            for (const pVal of pivotValues) {
              const vals = pGroup[pVal] || [];
              let aggVal: number | null = null;
              if (aggFunction === 'count') {
                aggVal = vals.length;
              } else if (vals.length > 0) {
                switch (aggFunction) {
                  case 'sum':
                    aggVal = vals.reduce((sum, val) => sum + val, 0);
                    break;
                  case 'mean':
                    aggVal = vals.reduce((sum, val) => sum + val, 0) / vals.length;
                    break;
                  case 'max':
                    aggVal = Math.max(...vals);
                    break;
                  case 'min':
                    aggVal = Math.min(...vals);
                    break;
                }
              }
              newRow[pVal] = aggVal !== null ? parseFloat(aggVal.toFixed(2)) : null;
            }
            resultRows.push(newRow);
          }

          data = resultRows;
          break;
        }

        case 'unpivot': {
          const { idVars, valueVars, varName, valueName } = step.params;
          if (!idVars || idVars.length === 0 || !valueVars || valueVars.length === 0) break;

          const targetVarName = varName || 'atributo';
          const targetValueName = valueName || 'valor';

          const idColDefs = columns.filter((col) => idVars.includes(col.name));
          columns = [
            ...idColDefs,
            { name: targetVarName, type: 'string' },
            { name: targetValueName, type: 'string' },
          ];

          const resultRows: any[] = [];
          for (const row of data) {
            for (const vCol of valueVars) {
              if (vCol in row) {
                const newRow: any = {};
                for (const idCol of idVars) {
                  newRow[idCol] = row[idCol];
                }
                newRow[targetVarName] = vCol;
                newRow[targetValueName] = row[vCol];
                resultRows.push(newRow);
              }
            }
          }

          data = resultRows;
          break;
        }

        case 'custom_code': {
          const { code } = step.params;
          if (!code) break;

          const lines = code.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const colAssignmentMatch = trimmed.match(/^df\[['"](.*?)['"]\]\s*=\s*(.*)$/);
            if (colAssignmentMatch) {
              const colName = colAssignmentMatch[1];
              let rightSide = colAssignmentMatch[2].trim();

              const npWhereMatch = rightSide.match(/np\.where\((.*?), \s*(.*?),\s*(.*)\)/);
              if (npWhereMatch) {
                const cond = npWhereMatch[1];
                const val1 = npWhereMatch[2];
                const val2 = npWhereMatch[3];
                rightSide = `(${cond}) ? (${val1}) : (${val2})`;
              }

              rightSide = rightSide.replace(/df\[['"](.*?)['"]\]/g, "row['$1']");
              rightSide = rightSide.replace(/df\.(.*?)\b/g, "row['$1']");

              data = data.map((row) => {
                let result = null;
                try {
                  const expr = rightSide.replace(/row\['(.*?)'\]/g, (match, key) => {
                    const rowVal = row[key];
                    if (typeof rowVal === 'string') return `'${rowVal}'`;
                    if (rowVal === null || rowVal === undefined) return '0';
                    return String(rowVal);
                  });
                  result = Function(`"use strict"; return (${expr})`)();
                } catch (e) {
                  result = null;
                }
                return { ...row, [colName]: result };
              });

              if (!columns.some((col) => col.name === colName)) {
                columns.push({ name: colName, type: 'string' });
              }
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error(`Erro ao executar passo ETL: ${step.label}`, e);
    }
  }

  return { data, columns };
}

/**
 * Translates the applied ETL steps list into formatted, beautiful Python/Pandas code.
 */
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

      case 'change_type': {
        const { column, toType } = step.params;
        let pyType = 'str';
        if (toType === 'number') pyType = 'float';
        else if (toType === 'boolean') pyType = 'bool';
        else if (toType === 'date') pyType = 'datetime64[ns]';

        if (toType === 'date') {
          py += `df['${column}'] = pd.to_datetime(df['${column}'])\n`;
        } else {
          py += `df['${column}'] = df['${column}'].astype('${pyType}')\n`;
        }
        break;
      }

      case 'filter_rows': {
        const { column, operator, value } = step.params;
        if (operator === 'is_null') {
          py += `df = df[df['${column}'].isna()]\n`;
        } else if (operator === 'is_not_null') {
          py += `df = df[df['${column}'].notna()]\n`;
        } else {
          const isNum = !isNaN(Number(value)) && value.trim() !== '';
          const quote = isNum ? '' : "'";
          const compareVal = isNum ? value : value;

          if (operator === 'equals') {
            py += `df = df[df['${column}'] == ${quote}${compareVal}${quote}]\n`;
          } else if (operator === 'not_equals') {
            py += `df = df[df['${column}'] != ${quote}${compareVal}${quote}]\n`;
          } else if (operator === 'greater_than') {
            py += `df = df[df['${column}'] > ${compareVal}]\n`;
          } else if (operator === 'less_than') {
            py += `df = df[df['${column}'] < ${compareVal}]\n`;
          } else if (operator === 'contains') {
            py += `df = df[df['${column}'].astype(str).str.contains('${value}', case=False, na=False)]\n`;
          } else if (operator === 'not_contains') {
            py += `df = df[~df['${column}'].astype(str).str.contains('${value}', case=False, na=False)]\n`;
          }
        }
        break;
      }

      case 'drop_column': {
        const { columns: cols } = step.params;
        const colListStr = cols.map((c: string) => `'${c}'`).join(', ');
        py += `df = df.drop(columns=[${colListStr}])\n`;
        break;
      }

      case 'add_column': {
        const { columnName, expressionType, colA, operator, colB, constantValue, customExpression } = step.params;
        if (expressionType === 'constant') {
          const isNum = !isNaN(Number(constantValue)) && constantValue.trim() !== '';
          const quote = isNum ? '' : "'";
          py += `df['${columnName}'] = ${quote}${constantValue}${quote}\n`;
        } else if (expressionType === 'concatenate' && colA && colB) {
          py += `df['${columnName}'] = df['${colA}'].astype(str) + df['${colB}'].astype(str)\n`;
        } else if (expressionType === 'math' && colA && operator && colB) {
          py += `df['${columnName}'] = df['${colA}'] ${operator} df['${colB}']\n`;
        } else if (expressionType === 'custom_python' && customExpression) {
          // Replace brackets [ColName] with df['ColName'] for real python code
          let parsedExp = customExpression;
          const colMatches = customExpression.match(/\[(.*?)\]/g) || [];
          for (const match of colMatches) {
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

      case 'drop_duplicates': {
        const { columns: cols } = step.params;
        if (cols && cols.length > 0) {
          const colListStr = cols.map((c: string) => `'${c}'`).join(', ');
          py += `df = df.drop_duplicates(subset=[${colListStr}])\n`;
        } else {
          py += `df = df.drop_duplicates()\n`;
        }
        break;
      }

      case 'fillna': {
        const { column, method, customValue } = step.params;
        if (method === 'value') {
          const isNum = !isNaN(Number(customValue)) && customValue.trim() !== '';
          const quote = isNum ? '' : "'";
          py += `df['${column}'] = df['${column}'].fillna(${quote}${customValue}${quote})\n`;
        } else if (method === 'mean') {
          py += `df['${column}'] = df['${column}'].fillna(df['${column}'].mean())\n`;
        } else if (method === 'median') {
          py += `df['${column}'] = df['${column}'].fillna(df['${column}'].median())\n`;
        } else if (method === 'ffill') {
          py += `df['${column}'] = df['${column}'].ffill()\n`;
        } else if (method === 'bfill') {
          py += `df['${column}'] = df['${column}'].bfill()\n`;
        }
        break;
      }

      case 'slice_rows': {
        const { limit } = step.params;
        py += `df = df.head(${limit})\n`;
        break;
      }

      case 'join_dataset': {
        const { otherDatasetId, joinType, leftOn, rightOn, prefix } = step.params;
        
        if (otherDatasetId === 'sales') {
          py += `# Carregar outra tabela: Vendas\n`;
          py += `df_other = pd.read_csv('vendas.csv')\n`;
        } else if (otherDatasetId === 'employees') {
          py += `# Carregar outra tabela: Funcionários\n`;
          py += `df_other = pd.read_csv('funcionarios.csv')\n`;
        } else if (otherDatasetId === 'inventory') {
          py += `# Carregar outra tabela: Estoque\n`;
          py += `df_other = pd.read_csv('estoque.csv')\n`;
        } else if (otherDatasetId === 'base_original') {
          py += `# Cruzando com a tabela de dados de origem original\n`;
          py += `df_other = df_original # Tabela original antes de modificações\n`;
        } else if (otherDatasetId.startsWith('step_')) {
          py += `# Cruzando com resultado de um passo anterior (${otherDatasetId})\n`;
          py += `df_other = df_${otherDatasetId} # Filtro ou pivot intermediário\n`;
        } else {
          py += `# Carregar outra tabela personalizada\n`;
          py += `df_other = pd.read_csv('${otherDatasetId.replace('custom_', '')}')\n`;
        }

        const prefStr = prefix ? `, suffixes=('', '_${prefix}')` : `, suffixes=('', '_joined')`;
        py += `df = df.merge(df_other, left_on='${leftOn}', right_on='${rightOn}', how='${joinType}'${prefStr})\n`;
        break;
      }

      case 'pivot': {
        const { indexColumns, pivotColumn, valueColumn, aggFunction } = step.params;
        const indexList = indexColumns.map((c: string) => `'${c}'`).join(', ');
        py += `df = df.pivot_table(\n    index=[${indexList}],\n    columns='${pivotColumn}',\n    values='${valueColumn}',\n    aggfunc='${aggFunction}'\n).reset_index()\n`;
        py += `# Achatar multi-index de colunas se houver\ndf.columns.name = None\n`;
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
        const { code } = step.params;
        py += `# Código Python Customizado:\n`;
        py += `${code}\n`;
        break;
      }
    }
    py += `\n`;
  }

  py += `# Exibir o resultado final da pipeline\nprint(df.head())\n`;
  return py;
}
