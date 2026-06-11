import * as XLSX from 'xlsx';

const SAMPLE_SHEET_NAME = 'Recipients';
const PHONE_HEADER = 'phone';

/**
 * Parse an Excel file and extract phone numbers from the "phone" column.
 * Expects first row as header; looks for "phone" (case-insensitive) or uses first column.
 * @param {File} file - Excel file (.xlsx, .xls)
 * @returns {Promise<string[]>} Array of non-empty phone values (trimmed)
 */
export const parseExcelToRecipients = async (file) => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
  const phoneIdx = headers.findIndex((h) => h === 'phone' || h === 'number' || h === 'recipient');
  const col = phoneIdx >= 0 ? phoneIdx : 0;

  const recipients = [];
  for (let i = 1; i < rows.length; i++) {
    const cell = rows[i][col];
    const val = cell != null ? String(cell).trim() : '';
    if (val) recipients.push(val);
  }
  return recipients;
};

/**
 * Trigger download of sample Excel for SMS custom recipients.
 * Format: single column "phone" with example rows.
 */
export const downloadSampleExcel = () => {
  const aoa = [
    [PHONE_HEADER],
    ['255712345678'],
    ['255787654321'],
    ['255755123456']
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SAMPLE_SHEET_NAME);
  XLSX.writeFile(wb, 'sms_recipients_sample.xlsx');
};
