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
      // Convention DD/MM/YYYY (locale marocaine/française de l'entreprise),
      // pas MM/DD/YYYY — vérifié cohérent avec le reste de l'app (fr-FR partout).
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  if (rawStr.includes('-')) {
    const candidate = rawStr.split('T')[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : '';
  }

  return '';
}
