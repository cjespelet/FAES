import { Player } from '../models/player.model';
import { Tournament } from '../models/tournament.model';

export function isPaymentExempt(player: Player): boolean {
  return player.paymentExempt === true;
}

export function payingPlayers(players: Player[]): Player[] {
  return players.filter(player => player.active !== false && !isPaymentExempt(player));
}

export function tournamentShare(totalAmount: number, payingCount: number): number {
  if (!payingCount || payingCount <= 0) return 0;
  return totalAmount / payingCount;
}

export function installmentForPayers(tournament: Tournament, payingCount: number): number {
  const installments = tournament.installments || 1;
  return tournamentShare(tournament.totalAmount, payingCount) / installments;
}
