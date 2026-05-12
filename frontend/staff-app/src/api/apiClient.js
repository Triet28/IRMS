import axios from 'axios';

/**
 * DIP: All components call this module — never axios/fetch directly.
 * Relative base URLs work in both:
 *   - Dev:    Vite proxy routes /api/* to the correct backend
 *   - Docker: nginx proxy routes /api/* to the correct backend
 */
function createClient() {
  const client = axios.create();

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res.data,
    (err) => {
      if (err.response?.status === 401) {
        import('../store/authStore').then(({ default: useAuthStore }) => {
          useAuthStore.getState().logout();
          window.location.replace('/login');
        });
      }
      return Promise.reject(err.response?.data ?? err);
    }
  );

  return client;
}

const api = createClient();

// Auth endpoints  (proxied → auth-service:8081)
export const login      = (credentials) => api.post('/api/auth/login', credentials);
export const getUsers   = ()             => api.get('/api/users');
export const createUser = (data)         => api.post('/api/users', data);

// Menu endpoints  (proxied → menu-service:8082)
export const getAvailableItems = () => api.get('/api/menu-items/available');
export const getAllItems        = () => api.get('/api/menu-items');
export const createItem        = (data)       => api.post('/api/menu-items', data);
export const updateItem        = (id, data)   => api.put(`/api/menu-items/${id}`, data);
export const getCategories     = ()           => api.get('/api/categories');

// Combo endpoints  (proxied → menu-service:8082)
export const getAllCombos          = ()           => api.get('/api/combos');
export const getAvailableCombos   = ()           => api.get('/api/combos/available');
export const createCombo    = (data)       => api.post('/api/combos', data);
export const updateCombo    = (id, data)   => api.put(`/api/combos/${id}`, data);

// Session endpoints  (proxied → order-service:8083)
export const openSession       = (tableNumber) => api.post(`/api/sessions?tableNumber=${tableNumber}`);
export const getActiveSessions = ()             => api.get('/api/sessions');
export const getOpenSessions   = ()             => api.get('/api/sessions/open');
export const requestBill       = (sessionId)    => api.post(`/api/sessions/${sessionId}/request-bill`);
export const closeSession      = (sessionId)    => api.post(`/api/sessions/${sessionId}/close`);
export const getSessionOrders  = (sessionId)    => api.get(`/api/sessions/${sessionId}/orders`);

// Order endpoints  (proxied → order-service:8083)
export const createOrder       = (sessionId, data) => api.post(`/api/orders/session/${sessionId}`, data);
export const getPendingOrders  = ()                 => api.get('/api/orders/pending');
export const updateOrderStatus = (orderId, status)  => api.patch(`/api/orders/${orderId}/status`, { status });

// Billing endpoints  (proxied → billing-service:8084)
export const getAllPaidBills = ()                    => api.get('/api/bills');
export const createBill     = (sessionId, data)     => api.post(`/api/bills/session/${sessionId}`, data);
export const getBill        = (sessionId)            => api.get(`/api/bills/session/${sessionId}`);
export const payBill        = (billId, data)         => api.post(`/api/bills/${billId}/pay`, data);
