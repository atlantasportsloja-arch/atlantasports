'use client';
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  init: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) set({ token, user: JSON.parse(user) });
  },
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  setCart: (items, total) => set({ items, total }),
  count: () => get().items.reduce((n, i) => n + i.quantity, 0),
}));
