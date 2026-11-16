const KEY = 'clinic.utm';

/**
 * Remembers which ad brought the visitor in (UTM tags added by the Ads Studio),
 * so every form on the site can attach it to the enquiry.
 */
export function captureTrafficSource(search: string = location.search): void {
  const q = new URLSearchParams(search);
  const utm = [q.get('utm_source'), q.get('utm_campaign')].filter(Boolean).join(' / ');
  if (!utm) return;
  try {
    sessionStorage.setItem(KEY, utm);
  } catch {
    /* storage blocked */
  }
}

export function trafficSource(): string {
  try {
    return sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}
