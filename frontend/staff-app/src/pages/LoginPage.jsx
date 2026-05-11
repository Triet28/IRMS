import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

export default function LoginPage() {
  const { signIn, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await signIn(form.username, form.password);
      const role = data.role;
      if (role === 'CHEF')    navigate('/chef');
      else if (role === 'WAITER')   navigate('/waiter');
      else if (role === 'MANAGER')  navigate('/manager');
    } catch {
      // error displayed via hook
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit}
            className="bg-white p-8 rounded-xl shadow-md w-80 space-y-4">
        <h1 className="text-2xl font-bold text-center text-blue-700">IRMS Staff</h1>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <input
          type="text" placeholder="Tên đăng nhập" required
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password" placeholder="Mật khẩu" required
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  );
}
