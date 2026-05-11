import { useState } from 'react';
import { login } from '../api/apiClient';
import useAuthStore from '../store/authStore';

/**
 * ISP: hook is focused solely on authentication concerns.
 * Components that only need auth status import this hook —
 * they don't get order/websocket functionality mixed in.
 */
export function useAuth() {
  const { user, token, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function signIn(username, password) {
    setLoading(true);
    setError(null);
    try {
      const data = await login({ username, password });
      setAuth(data.token, { userId: data.userId, username: data.username, role: data.role });
      return data;
    } catch (err) {
      setError(err.detail ?? 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { user, token, signIn, logout, loading, error };
}
