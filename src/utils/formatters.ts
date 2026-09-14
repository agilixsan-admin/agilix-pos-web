/**
 * Pure Utility Formatters for Currency, Dates, Numbers
 */

export const formatRupiah = (amount: number | string | undefined | null): string => {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0);
  if (isNaN(numeric)) return 'Rp 0';
  return `Rp ${numeric.toLocaleString('id-ID')}`;
};

export const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
};

export const formatDateTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateInput);
  }
};

export const formatNumber = (num: number | string | undefined | null): string => {
  const numeric = typeof num === 'string' ? parseFloat(num) : Number(num || 0);
  if (isNaN(numeric)) return '0';
  return numeric.toLocaleString('id-ID');
};

