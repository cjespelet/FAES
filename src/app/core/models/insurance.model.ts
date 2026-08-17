export interface Insurance {
  id: string;
  playerId: string;
  amount: number;
  period: string;
  startDate: Date;
  endDate: Date;
  paid: boolean;
  paymentDate?: Date;
  paymentMethod?: 'Efectivo' | 'Transferencia' | 'Débito' | 'Crédito';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
