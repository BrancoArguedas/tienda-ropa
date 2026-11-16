const formatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: string | number, currency = 'PEN', locale = 'es-PE'): string {
  const key = `${locale}|${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 });
    } catch {
      formatter = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
    }
    formatters.set(key, formatter);
  }
  return formatter.format(Number(amount));
}

const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });
const shortDateFormatter = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' });

export function formatDateTime(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}
