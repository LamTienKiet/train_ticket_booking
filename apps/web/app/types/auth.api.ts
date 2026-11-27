export type RegisterFormErrors = {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  agree?: string;
};

export type LoginFormErrors = {
  username?: string;
  password?: string;
  remember?: string;
};

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  id: string | number;
  accountId?: string;
  fullName: string;
  username: string | null;
  role: string;
  phone: string | null;
  email: string;
}

export interface RegisterResponse {
  id: string | number;
  fullName: string;
  username: string | null;
  email: string;
  phone: string;
}

export interface AuthUser {
  id: string | number;
  accountId?: string;
  fullName: string;
  username: string | null;
  role: string;
  phone: string | null;
  email: string;
}

export interface UserProfile {
  id: string;
  accountId: string;
  username: string | null;
  email: string;
  role: string;
  status: string;
  fullName: string | null;
  phone: string | null;
  avatar: string | null;
  birthday: string | null;
  gender: string | null;
  address: string | null;
  createdAt: string;
  bookingsCount: number;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  address?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
