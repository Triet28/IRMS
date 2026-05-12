import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/apiClient';
import useAuthStore from '../store/authStore';

export function useAuth() {
  const { user, token, setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();
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

  function logout() {
    storeLogout();
    navigate('/login', { replace: true });
  }

  return { user, token, signIn, logout, loading, error };
}
