export interface Team {
  id: string;
  name: string;
  logo?: string;
  colors: {
    primary: string;
    secondary: string;
  };
  category?: string;
  founded?: Date;
  admin: {
    name: string;
    phone: string;
    email: string;
  };
  currentSeason: string;
  createdAt: Date;
  updatedAt: Date;
}
