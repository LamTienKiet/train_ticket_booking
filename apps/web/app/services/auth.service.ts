import { api } from "../utils/axiosClient";
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "../types/auth.api";

export const authService = {
  async login(
    credentials: LoginRequest,
    remember: boolean = false,
  ): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", {
      username: credentials.username.trim(),
      password: credentials.password,
    });

    const data = response.data;
    // Xóa phiên cũ ở cả 2 nơi: getCurrentUser/getAccessToken đọc localStorage trước,
    // nên phiên "ghi nhớ" cũ sẽ đè lên phiên mới lưu ở sessionStorage
    authService.logout();
    const storage = remember ? localStorage : sessionStorage;

    // Lưu token
    storage.setItem("accessToken", data.accessToken);
    storage.setItem("refreshToken", data.refreshToken);

    const user: AuthUser = {
      id: data.id,
      accountId: data.accountId,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
      email: data.email,
      phone: data.phone,
    };

    storage.setItem("user", JSON.stringify(user));

    // Phát custom event để các component khác (như Header) tự động re-render
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-changed"));
    }

    return data;
  },

  /**
   * Đăng ký tài khoản khách hàng mới
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>("/auth/register", {
      fullName: data.fullName.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
    });

    return response.data;
  },

  /**
   * Đăng xuất: Xoá thông tin khỏi cả localStorage và sessionStorage
   */
  logout(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");

    window.dispatchEvent(new Event("auth-changed"));
  },

  /**
   * Lấy thông tin người dùng đang đăng nhập
   */
  getCurrentUser(): AuthUser | null {
    if (typeof window === "undefined") return null;

    const rawUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  },

  /**
   * Lấy accessToken hiện tại
   */
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken")
    );
  },

  /**
   * Kiểm tra người dùng đã đăng nhập chưa
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Lấy thông tin hồ sơ người dùng đầy đủ từ server
   */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>("/auth/me");
    return response.data;
  },

  /**
   * Cập nhật thông tin hồ sơ cá nhân
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.patch<UserProfile>("/auth/profile", data);
    const updated = response.data;

    // Cập nhật lại thông tin user trong local/sessionStorage để Navbar tự đồng bộ
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const refreshedUser: AuthUser = {
        ...currentUser,
        fullName: updated.fullName || currentUser.fullName,
        phone: updated.phone || currentUser.phone,
      };
      const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(refreshedUser));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
      }
    }

    return updated;
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/change-password", data);
    return response.data;
  },
};

export default authService;
