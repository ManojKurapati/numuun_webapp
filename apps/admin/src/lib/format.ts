/** Format an ISO date string as e.g. "5 Apr 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Title-case an enum-style token, e.g. "GREY_ZONE" -> "Grey zone". */
export function humanize(token: string): string {
  const lower = token.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
