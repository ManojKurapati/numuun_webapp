/** Format an ISO date string as e.g. "5 Apr 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Human, parent-friendly age label from a count of months. */
export function ageLabel(months: number): string {
  if (months < 1) return 'Newborn';
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (remainder > 0) parts.push(`${remainder} ${remainder === 1 ? 'month' : 'months'}`);
  return parts.join(', ') || `${months} months`;
}
