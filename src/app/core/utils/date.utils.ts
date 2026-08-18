import { Timestamp } from '@angular/fire/firestore';

export function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string | number);
}

export function toTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) return value;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  return Timestamp.fromDate(date);
}

export function omitUndefined<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = Array.isArray(value) ? value.filter(item => item !== undefined) : value;
    }
  }
  return result;
}

export function formatDateAr(value: unknown): string {
  return toDate(value).toLocaleDateString('es-AR');
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function getInstallmentDueDates(
  startDate: unknown,
  installments: number,
  stored?: unknown[]
): Date[] {
  if (stored?.length === installments) {
    return stored.map(toDate);
  }
  const start = toDate(startDate);
  return Array.from({ length: installments }, (_, i) => addMonths(start, i));
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount || 0);
}
