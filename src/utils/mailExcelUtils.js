import * as XLSX from 'xlsx';

const SAMPLE_SHEET_NAME = 'Recipients';
const EMAIL_HEADER = 'email';
const FULL_NAME_HEADER = 'full_name';

/**
 * Parse an Excel file and extract mail recipients.
 * Expects columns "email" and "full_name" (case-insensitive).
 * @param {File} file - Excel file (.xlsx, .xls)
 * @returns {Promise<Array<{ email: string, full_name: string }>>}
 */
export const parseExcelToMailRecipients = async (file) => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
  const emailIdx = headers.findIndex((h) => h === 'email' || h === 'e-mail');
  const nameIdx = headers.findIndex(
    (h) => h === 'full_name' || h === 'fullname' || h === 'name' || h === 'full name'
  );

  if (emailIdx < 0) {
    throw new Error('Excel must include an "email" column.');
  }

  const recipients = [];
  for (let i = 1; i < rows.length; i++) {
    const email = rows[i][emailIdx] != null ? String(rows[i][emailIdx]).trim() : '';
    if (!email) continue;

    const fullName =
      nameIdx >= 0 && rows[i][nameIdx] != null ? String(rows[i][nameIdx]).trim() : '';

    recipients.push({ email, full_name: fullName });
  }

  return recipients;
};

/**
 * Trigger download of sample Excel for mail recipients.
 */
export const downloadMailSampleExcel = () => {
  const aoa = [
    [EMAIL_HEADER, FULL_NAME_HEADER],
    ['don@example.com', 'Don Joe'],
    ['jane@example.com', 'Jane Smith']
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SAMPLE_SHEET_NAME);
  XLSX.writeFile(wb, 'mail_recipients_sample.xlsx');
};
