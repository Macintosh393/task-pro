import type { RegisterData } from '../../../services/authService';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  theme: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}
