export function formatRelativeDate(dateStr) {
  if (!dateStr) return 'Recently';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function buildDisplayPrice(crores, lakhs) {
  const c = parseFloat(crores) || 0;
  const l = parseFloat(lakhs) || 0;

  if (c > 0) {
    return `${c} Crore${l > 0 ? ` ${l} Lakh` : ''}`;
  }
  return `${l} Lakh`;
}

export function buildPricePKR(crores, lakhs) {
  const c = parseFloat(crores) || 0;
  const l = parseFloat(lakhs) || 0;
  return (c * 10000000) + (l * 100000);
}
