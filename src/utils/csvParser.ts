import { Participant, GroupResult, DrawRecord } from '../types';

/**
 * Smart parse text pasted by user.
 * Supports:
 * - Line by line: "王小明" or "王小明, 工程部, RD001" or "王小明 工程部"
 * - Comma separated: "王小明, 李大華, 張小花"
 */
export function parsePastedText(text: string): Participant[] {
  if (!text || !text.trim()) return [];

  const rawLines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const participants: Participant[] = [];

  // Check if first line contains header words
  let startIndex = 0;
  if (rawLines.length > 0) {
    const firstLine = rawLines[0].toLowerCase();
    if (
      firstLine.includes('姓名') ||
      firstLine.includes('name') ||
      firstLine.includes('名字') ||
      firstLine.includes('成員')
    ) {
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < rawLines.length; i++) {
    const line = rawLines[i];
    // Check delimiters: tab, comma, semicolon, or multi-space
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(s => s.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(s => s.trim());
    } else if (line.includes('，')) {
      parts = line.split('，').map(s => s.trim());
    } else if (line.includes(';')) {
      parts = line.split(';').map(s => s.trim());
    } else if (line.includes('、')) {
      // e.g. "王小明、李大華、張小花" on same line
      const subNames = line.split('、').map(s => s.trim()).filter(Boolean);
      subNames.forEach((n, idx) => {
        participants.push({
          id: `p-${Date.now()}-${i}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name: n,
        });
      });
      continue;
    } else if (/\s{2,}/.test(line)) {
      // separated by 2+ spaces
      parts = line.split(/\s{2,}/).map(s => s.trim());
    } else {
      // Single name or name space department
      const spaceParts = line.split(/\s+/).map(s => s.trim()).filter(Boolean);
      if (spaceParts.length === 1) {
        parts = [spaceParts[0]];
      } else {
        parts = spaceParts;
      }
    }

    if (parts.length > 0 && parts[0]) {
      const name = parts[0];
      const department = parts[1] || undefined;
      const employeeId = parts[2] || undefined;
      participants.push({
        id: `p-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        name,
        department,
        employeeId,
      });
    }
  }

  return participants;
}

/**
 * Parses raw CSV string
 */
export function parseCSVString(csvText: string): Participant[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Parse rows respecting quotes
  const rows = lines.map(line => {
    const row: string[] = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === '\t') && !inQuotes) {
        row.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim().replace(/^["']|["']$/g, ''));
    return row;
  });

  // Identify column indices from header
  const header = rows[0].map(h => h.toLowerCase().trim());
  let nameIndex = -1;
  let deptIndex = -1;
  let idIndex = -1;

  header.forEach((col, idx) => {
    if (col.includes('姓名') || col === 'name' || col.includes('名字') || col.includes('成員') || col.includes('員工')) {
      nameIndex = idx;
    } else if (col.includes('部門') || col.includes('組別') || col.includes('team') || col.includes('dept') || col.includes('department')) {
      deptIndex = idx;
    } else if (col.includes('工號') || col.includes('編號') || col.includes('id') || col.includes('employee_id')) {
      idIndex = idx;
    }
  });

  let startRow = 0;
  if (nameIndex !== -1) {
    startRow = 1;
  } else {
    // If no clear header recognized, assume col 0 is Name, col 1 is Dept, col 2 is ID
    nameIndex = 0;
    deptIndex = 1;
    idIndex = 2;
    startRow = 0;
  }

  const participants: Participant[] = [];

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    const name = row[nameIndex]?.trim();
    if (!name) continue;

    const department = deptIndex >= 0 && row[deptIndex] ? row[deptIndex].trim() : undefined;
    const employeeId = idIndex >= 0 && row[idIndex] ? row[idIndex].trim() : undefined;

    participants.push({
      id: `p-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      department,
      employeeId,
    });
  }

  return participants;
}

/**
 * Downloads standard template CSV
 */
export function downloadSampleCSV() {
  const content = '\uFEFF姓名,部門,工號\n陳冠宇,工程部,RD001\n張雅雯,產品設計部,PD001\n王品涵,人力資源部,HR001\n蔡育廷,行銷企劃部,MK001\n鄭宇晴,業務拓展部,BD001\n';
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'HR名單範本.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports current participants to CSV
 */
export function exportParticipantsToCSV(participants: Participant[]) {
  let content = '\uFEFF姓名,部門,工號\n';
  participants.forEach(p => {
    content += `"${p.name}","${p.department || ''}","${p.employeeId || ''}"\n`;
  });
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `名單名冊_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports lucky draw winners to CSV
 */
export function exportWinnersToCSV(records: DrawRecord[]) {
  let content = '\uFEFF抽獎時間,獎項名稱,獲獎者姓名,所屬部門,工號\n';
  records.forEach(r => {
    const time = new Date(r.timestamp).toLocaleString('zh-TW');
    content += `"${time}","${r.prizeName}","${r.winner.name}","${r.winner.department || '-'}","${r.winner.employeeId || '-'}"\n`;
  });
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `中獎名單_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports group results to CSV
 */
export function exportGroupsToCSV(groups: GroupResult[]) {
  let content = '\uFEFF組別,姓名,角色,部門,工號\n';
  groups.forEach(g => {
    g.members.forEach(m => {
      const isLeader = g.leaderId === m.id ? '組長' : '組員';
      content += `"${g.name}","${m.name}","${isLeader}","${m.department || '-'}","${m.employeeId || '-'}"\n`;
    });
  });
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `分組名單_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
