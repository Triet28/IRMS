import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import LoginPage   from './pages/LoginPage';
import WaiterPage  from './pages/WaiterPage';
import ChefPage    from './pages/ChefPage';
import ManagerPage from './pages/ManagerPage';

function ProtectedRoute({ allowedRoles, children }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/waiter" element={
          <ProtectedRoute allowedRoles={['WAITER', 'MANAGER']}>
            <WaiterPage />
          </ProtectedRoute>
        }/>
        <Route path="/chef" element={
          <ProtectedRoute allowedRoles={['CHEF', 'MANAGER']}>
            <ChefPage />
          </ProtectedRoute>
        }/>
        <Route path="/manager" element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerPage />
          </ProtectedRoute>
        }/>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
