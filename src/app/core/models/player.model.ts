export interface Player {
  id: string;
  dni: string;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
  joinedDate: Date;
  notes?: string;
  paymentExempt?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
