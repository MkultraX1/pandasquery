import { Column, ColumnType } from '../types';

/**
 * A robust, lightweight CSV parser that handles quotes, commas, and escapes.
 */
export function parseCSV(text: string): { columns: Column[]; data: Record<string, any>[] } {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // End of quotes
          inQuotes = false;
        }
      } else {
        currentValue += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentValue.trim());
        currentValue = '';
      } else if (char === '\r' || char === '\n') {
        row.push(currentValue.trim());
        currentValue = '';
        if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
          lines.push(row);
        }
        row = [];
        // Skip next character if it is a CRLF combo
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentValue += char;
      }
    }
  }

  // Push final row if any remaining
  if (currentValue !== '' || row.length > 0) {
    row.push(currentValue.trim());
    if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
      lines.push(row);
    }
  }

  if (lines.length === 0) {
    return { columns: [], data: [] };
  }

  // Header row
  const rawHeaders = lines[0];
  const columns: Column[] = rawHeaders.map((header) => {
    // Sanitize column name to resemble pandas columns
    const cleanName = header
      .replace(/["'\r\n]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
    return { name: cleanName || 'coluna', type: 'string' };
  });

  const data: Record<string, any>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const values = lines[r];
    const rowObj: Record<string, any> = {};

    columns.forEach((col, idx) => {
      let val: any = values[idx];
      if (val === undefined || val === '') {
        rowObj[col.name] = null;
      } else {
        // Simple type inference per cell (or keep as string for column type inference later)
        if (!isNaN(Number(val)) && val.trim() !== '') {
          rowObj[col.name] = Number(val);
        } else if (val.toLowerCase() === 'true' || val.toLowerCase() === 'false') {
          rowObj[col.name] = val.toLowerCase() === 'true';
        } else {
          rowObj[col.name] = val;
        }
      }
    });

    data.push(rowObj);
  }

  // Infer the column types from data
  columns.forEach((col) => {
    let hasNumbers = false;
    let hasBooleans = false;
    let hasStrings = false;

    data.forEach((rowObj) => {
      const val = rowObj[col.name];
      if (val !== null && val !== undefined) {
        if (typeof val === 'number') hasNumbers = true;
        else if (typeof val === 'boolean') hasBooleans = true;
        else if (typeof val === 'string') hasStrings = true;
      }
    });

    if (hasNumbers && !hasStrings) col.type = 'number';
    else if (hasBooleans && !hasStrings && !hasNumbers) col.type = 'boolean';
    else col.type = 'string';
  });

  return { columns, data };
}

/**
 * Exports columns and data rows to a clean CSV string.
 */
export function exportToCSV(columns: Column[], data: Record<string, any>[]): string {
  const headerRow = columns.map((col) => `"${col.name}"`).join(',');
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const val = row[col.name];
        if (val === null || val === undefined) {
          return '';
        }
        if (typeof val === 'string') {
          // Escape quotes
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val);
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}
