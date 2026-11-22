export interface SignInData {
  id: string;
  accountId: string;
  username: string | null;
  role: string;
  email: string;
  fullName: string;
  phone: string | null;
}

export interface AuthResult extends SignInData {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponseDto {
  id: string;
  fullName: string;
  username: string | null;
  email: string;
  phone: string;
}
