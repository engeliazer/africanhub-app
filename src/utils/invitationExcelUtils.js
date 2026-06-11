import * as XLSX from 'xlsx';

const SAMPLE_SHEET_NAME = 'Invitees';

const normalizeHeader = (h) => String(h || '').trim().toLowerCase();

const findColumnIndex = (headers, candidates) => {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h === candidate);
    if (idx >= 0) return idx;
  }
  return -1;
};

/**
 * Parse invitee Excel. Expected columns: Full Name, Email, Address (opt), Organization (opt).
 * @param {File} file
 * @returns {Promise<Array<{ full_name, email, address, organization }>>}
 */
export const parseExcelToInvitees = async (file) => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const nameIdx = findColumnIndex(headers, ['full name', 'fullname', 'name', 'full_name']);
  const emailIdx = findColumnIndex(headers, ['email', 'e-mail']);
  const addressIdx = findColumnIndex(headers, ['address']);
  const orgIdx = findColumnIndex(headers, ['organization', 'organisation', 'org', 'company']);

  if (nameIdx < 0 || emailIdx < 0) {
    throw new Error('Excel must include "Full Name" and "Email" columns.');
  }

  const invitees = [];
  for (let i = 1; i < rows.length; i++) {
    const full_name = rows[i][nameIdx] != null ? String(rows[i][nameIdx]).trim() : '';
    const email = rows[i][emailIdx] != null ? String(rows[i][emailIdx]).trim() : '';
    if (!full_name && !email) continue;

    const address =
      addressIdx >= 0 && rows[i][addressIdx] != null ? String(rows[i][addressIdx]).trim() : '';
    const organization =
      orgIdx >= 0 && rows[i][orgIdx] != null ? String(rows[i][orgIdx]).trim() : '';

    invitees.push({
      full_name,
      email,
      address: address || null,
      organization: organization || null
    });
  }

  return invitees;
};

export const downloadInviteeSampleExcel = () => {
  const aoa = [
    ['Full Name', 'Email', 'Address', 'Organization'],
    ['John Doe', 'john@example.com', 'Dar es Salaam', 'ACME Ltd'],
    ['Jane Smith', 'jane@example.com', '', 'Beta Corp']
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SAMPLE_SHEET_NAME);
  XLSX.writeFile(wb, 'invitation_invitees_sample.xlsx');
};
