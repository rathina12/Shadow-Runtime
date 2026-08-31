import { create } from 'zustand';
import { coreApi, setAuthToken } from '../lib/api';

export interface UserProfile {
  id?: number;
  username: string;
  email: string;
  role: 'ROLE_ADMIN' | 'ROLE_ENGINEER' | 'ROLE_VIEWER';
  team: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile;
  isAuthenticated: boolean;
  login: (username: string, role?: 'ROLE_ADMIN' | 'ROLE_ENGINEER' | 'ROLE_VIEWER') => Promise<void>;
  switchRole: (role: 'ROLE_ADMIN' | 'ROLE_ENGINEER' | 'ROLE_VIEWER') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: 'mock-jwt-token-shadow-runtime',
  user: {
    username: 'alex_dev',
    email: 'alex@shadowruntime.io',
    role: 'ROLE_ENGINEER',
    team: 'Core Platform Engineering',
  },
  isAuthenticated: true,

  login: async (username, role = 'ROLE_ENGINEER') => {
    try {
      const res = await coreApi.post('/api/v1/auth/login', { username, password: 'developer123' });
      if (res.data?.token) {
        setAuthToken(res.data.token);
        set({
          token: res.data.token,
          user: res.data.user,
          isAuthenticated: true,
        });
        return;
      }
    } catch {}

    // Fallback local auth simulation
    set({
      user: {
        username,
        email: `${username}@shadowruntime.io`,
        role,
        team: role === 'ROLE_ADMIN' ? 'Infrastructure & Security' : 'Core Platform',
      },
      isAuthenticated: true,
    });
  },

  switchRole: (role) => {
    set(state => ({
      user: {
        ...state.user,
        role,
        username: role === 'ROLE_ADMIN' ? 'admin' : (role === 'ROLE_VIEWER' ? 'viewer' : 'alex_dev'),
      }
    }));
  },

  logout: () => {
    setAuthToken(null);
    set({ token: null, isAuthenticated: false });
  },
}));
