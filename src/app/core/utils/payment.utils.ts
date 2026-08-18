import { PaymentExemption, Player } from '../models/player.model';
import { Tournament } from '../models/tournament.model';

export function paymentExemption(player: Pick<Player, 'paymentExemption' | 'paymentExempt'>): PaymentExemption {
  if (player.paymentExemption === 'half' || player.paymentExemption === 'full' || player.paymentExemption === 'none') {
    return player.paymentExemption;
  }
  return player.paymentExempt ? 'full' : 'none';
}

export function paymentWeight(player: Player): number {
  const exemption = paymentExemption(player);
  if (exemption === 'full') return 0;
  if (exemption === 'half') return 0.5;
  return 1;
}

export function isPaymentExempt(player: Player): boolean {
  return paymentExemption(player) === 'full';
}

export function payingPlayers(players: Player[]): Player[] {
  return players.filter(player => player.active !== false && paymentWeight(player) > 0);
}

export function payingUnits(players: Player[]): number {
  return players
    .filter(player => player.active !== false)
    .reduce((sum, player) => sum + paymentWeight(player), 0);
}

export function tournamentShare(totalAmount: number, units: number): number {
  if (!units || units <= 0) return 0;
  return totalAmount / units;
}

export function installmentForPayers(tournament: Tournament, units: number): number {
  const installments = tournament.installments || 1;
  return tournamentShare(tournament.totalAmount, units) / installments;
}

export function installmentForPlayer(tournament: Tournament, players: Player[], player: Player): number {
  return installmentForPayers(tournament, payingUnits(players)) * paymentWeight(player);
}

export function formatUnits(units: number): string {
  if (!units) return '0';
  return Number.isInteger(units) ? String(units) : units.toFixed(1).replace('.', ',');
}

export function exemptionLabel(exemption: PaymentExemption): string {
  if (exemption === 'full') return 'Liberado';
  if (exemption === 'half') return 'Liberado 50%';
  return '';
}
