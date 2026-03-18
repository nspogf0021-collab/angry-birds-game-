import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('angry_birds_token'),
  user: localStorage.getItem('angry_birds_user') ? JSON.parse(localStorage.getItem('angry_birds_user')!) : null,
  setAuth: (token, user) => {
    localStorage.setItem('angry_birds_token', token);
    localStorage.setItem('angry_birds_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('angry_birds_token');
    localStorage.removeItem('angry_birds_user');
    set({ token: null, user: null });
  }
}));

