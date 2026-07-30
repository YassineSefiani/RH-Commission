export function matchesBrand(dbCarte: string | undefined | null, targetBrand: string): boolean {
  const carte = (dbCarte || '').toUpperCase();
  const target = (targetBrand || '').toUpperCase();
  if (target.includes('COCA') && carte.includes('COCA')) return true;
  if (target.includes('FERRERO') && carte.includes('FERRERO')) return true;
  if (target.includes('WALL') && carte.includes('WALL')) return true;
  return carte.replace(/[_ \-']/g, '') === target.replace(/[_ \-']/g, '');
}
