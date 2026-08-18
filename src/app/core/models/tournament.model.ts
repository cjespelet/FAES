export interface Tournament {
  id: string;
  name: string;
  type: 'Apertura' | 'Clausura';
  year: number;
  totalAmount: number;
  installments: number;
  installmentAmount: number;
  startDate: Date;
  endDate: Date;
  installmentDueDates?: Date[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentPayment {
  id: string;
  tournamentId: string;
  playerId: string;
  installmentNumber: number;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Débito' | 'Crédito';
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
