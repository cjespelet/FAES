import { Player, PaymentExemption } from '../models/player.model';
import { Tournament, TournamentPayment } from '../models/tournament.model';
import { Insurance } from '../models/insurance.model';
import { getInstallmentDueDates, toDate } from './date.utils';
import {
  installmentForPayers,
  installmentForPlayer,
  isPaymentExempt,
  payingPlayers,
  payingUnits,
  paymentExemption,
  paymentWeight
} from './payment.utils';

export function countPendingPayments(
  players: Player[],
  tournaments: Tournament[],
  payments: TournamentPayment[]
): number {
  const payers = payingPlayers(players);
  const paidSet = new Set(
    payments.map(p => `${p.playerId}-${p.tournamentId}-${p.installmentNumber}`)
  );
  let count = 0;
  for (const tournament of tournaments) {
    for (const player of payers) {
      for (let i = 1; i <= tournament.installments; i++) {
        if (!paidSet.has(`${player.id}-${tournament.id}-${i}`)) {
          count++;
        }
      }
    }
  }
  return count;
}

export function sumPaymentsThisMonth(payments: TournamentPayment[]): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return payments
    .filter(p => {
      const d = toDate(p.paymentDate);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);
}

export function countPendingInsurances(insurances: Insurance[]): number {
  return insurances.filter(i => !i.paid).length;
}

export interface PendingPaymentRow {
  player: string;
  tournament: string;
  installment: number;
  amount: number;
}

export function buildPendingPaymentRows(
  players: Player[],
  tournaments: Tournament[],
  payments: TournamentPayment[]
): PendingPaymentRow[] {
  const payers = payingPlayers(players);
  const paidSet = new Set(
    payments.map(p => `${p.playerId}-${p.tournamentId}-${p.installmentNumber}`)
  );
  const rows: PendingPaymentRow[] = [];

  for (const tournament of tournaments) {
    for (const player of payers) {
      const amount = installmentForPlayer(tournament, players, player);
      for (let i = 1; i <= tournament.installments; i++) {
        if (!paidSet.has(`${player.id}-${tournament.id}-${i}`)) {
          rows.push({
            player: player.name,
            tournament: tournament.name,
            installment: i,
            amount
          });
        }
      }
    }
  }
  return rows.sort((a, b) => a.player.localeCompare(b.player));
}

export interface InitialScheduleRow {
  player: string;
  installments: number[];
  insurance: number;
  total: number;
  exempt: boolean;
  exemption: PaymentExemption;
}

export function insuranceAmountForPlayer(playerId: string, insurances: Insurance[]): number {
  const items = insurances.filter(i => i.playerId === playerId);
  if (items.length === 0) return 0;
  const unpaid = items.find(i => !i.paid);
  if (unpaid) return unpaid.amount ?? 0;
  return [...items].sort(
    (a, b) => toDate(b.startDate).getTime() - toDate(a.startDate).getTime()
  )[0].amount ?? 0;
}

export function buildInitialSchedule(
  players: Player[],
  tournament: Tournament,
  insurances: Insurance[]
): InitialScheduleRow[] {
  const units = payingUnits(players);
  const fullCuota = installmentForPayers(tournament, units);
  return [...players]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(player => {
      const exemption = paymentExemption(player);
      const cuota = fullCuota * paymentWeight(player);
      const installments = Array.from({ length: tournament.installments }, () => cuota);
      const insurance = insuranceAmountForPlayer(player.id, insurances);
      return {
        player: player.name,
        installments,
        insurance,
        total: cuota * tournament.installments + insurance,
        exempt: isPaymentExempt(player),
        exemption
      };
    });
}

export function initialScheduleHeaders(tournament: Tournament): string[] {
  const dates = getInstallmentDueDates(
    tournament.startDate,
    tournament.installments,
    tournament.installmentDueDates
  );
  return dates.map((date, i) => `Cuota ${i + 1}\n${date.toLocaleDateString('es-AR')}`);
}

export type PayStatus = 'Pagó' | 'No pagó' | 'Liberado' | '—';

export interface PaymentStatusRow {
  player: string;
  installments: PayStatus[];
  insurance: PayStatus;
  paidCount: number;
  pendingCount: number;
  exempt: boolean;
  exemption: PaymentExemption;
}

export function insuranceStatusForPlayer(playerId: string, insurances: Insurance[]): PayStatus {
  const items = insurances.filter(i => i.playerId === playerId);
  if (items.length === 0) return '—';
  return items.some(i => !i.paid) ? 'No pagó' : 'Pagó';
}

export function buildPaymentStatus(
  players: Player[],
  tournament: Tournament,
  payments: TournamentPayment[],
  insurances: Insurance[]
): PaymentStatusRow[] {
  const paidSet = new Set(
    payments
      .filter(p => p.tournamentId === tournament.id)
      .map(p => `${p.playerId}-${p.installmentNumber}`)
  );

  return [...players]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(player => {
      const exemption = paymentExemption(player);
      const exempt = exemption === 'full';
      const installments: PayStatus[] = Array.from(
        { length: tournament.installments },
        (_, i) => {
          if (exempt) return 'Liberado';
          return paidSet.has(`${player.id}-${i + 1}`) ? 'Pagó' : 'No pagó';
        }
      );
      const insurance = insuranceStatusForPlayer(player.id, insurances);
      const statuses = [...installments, insurance].filter(s => s !== '—' && s !== 'Liberado');
      return {
        player: player.name,
        installments,
        insurance,
        paidCount: statuses.filter(s => s === 'Pagó').length,
        pendingCount: statuses.filter(s => s === 'No pagó').length,
        exempt,
        exemption
      };
    });
}
