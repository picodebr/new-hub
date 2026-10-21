export const formatDateInput = (value?: string | number | Date) =>
  value ? new Date(new Date(value || 0).getTime() + 600000)?.toISOString().split('T')[0] : '';
