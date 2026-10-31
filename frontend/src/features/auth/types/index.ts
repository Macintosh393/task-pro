export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  theme: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  pass?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}
