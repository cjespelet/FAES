export interface Player {
  id: string;
  dni: string;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
  joinedDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
