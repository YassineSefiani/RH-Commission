export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function toPeriodeKey(month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function toPeriodeLabel(month: number, year: number): string {
  return `${MONTHS_FR[month]} ${year}`;
}

export function currentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}
