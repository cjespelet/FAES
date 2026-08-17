export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'viewer';
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}
