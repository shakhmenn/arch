import { create } from 'zustand';
import { UserState } from './types';

const initialState: UserState = {
  data: null,
  isLoading: false,
  error: null,
  token: null,
};

interface UserStore extends UserState {
  setUser: (user: UserState['data']) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  ...initialState,
  setUser: (user) => { set({ data: user }); },
  setToken: (token) => { set({ token }); },
  logout: () => { set({ data: null, token: null }); },
}));

// Для обратной совместимости
export const userActions = {
  setUser: useUserStore.getState().setUser,
  setToken: useUserStore.getState().setToken,
  logout: useUserStore.getState().logout,
};
