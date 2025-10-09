// types/index.ts
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture: string | null;
  cover_image: string | null;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
  created?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, tokens: AuthTokens) => void;
  logout: () => Promise<void>;
  updateProfile: (updatedUser: User) => void;
  checkAuth: () => Promise<void>;
}
