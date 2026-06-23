import { create } from 'zustand';
import type { AuthUser, UserRole } from '@itsa/shared';
import { ROLE_BASE_PERMISSIONS } from '@itsa/shared';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  login: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    
    const basePermissions = ROLE_BASE_PERMISSIONS[user.role as UserRole] || [];
    const userPermissions = user.permissions || [];
    
    return basePermissions.includes(permission) || userPermissions.includes(permission);
  },
}));
