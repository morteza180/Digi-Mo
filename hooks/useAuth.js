'use client';

import { useStore } from './useStore';
import * as auth from '@/services/authService';

export function useAuth() {
  const [user, , ready] = useStore('session', null);

  return {
    user,                         // null یا { id, name, email, role }
    ready,                        // true بعد از خواندن localStorage
    isAdmin: user?.role === 'admin',
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    updateName: auth.updateName,
  };
}