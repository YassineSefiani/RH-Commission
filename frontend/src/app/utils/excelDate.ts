export function parseExcelDate(raw: unknown): string {
  const rawStr = String(raw ?? '').trim();

  if (/^\d+$/.test(rawStr)) {
    const serial = parseInt(rawStr, 10);
    const dateObj = new Date(Date.UTC(1899, 11, 30 + serial));
    return dateObj.toISOString().split('T')[0];
  }

  if (rawStr.includes('/')) {
    const parts = rawStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  }

  if (rawStr.includes('-')) {
    return rawStr.split('T')[0];
  }

  return '';
}
