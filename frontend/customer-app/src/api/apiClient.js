import axios from 'axios';

/**
 * DIP: relative URLs — nginx (Docker) or Vite proxy (dev) route to correct service.
 */
function createClient() {
  const client = axios.create();

  client.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('tableToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res.data,
    (err) => Promise.reject(err.response?.data ?? err)
  );

  return client;
}

const api = createClient();

export const getAvailableMenu      = () => api.get('/api/menu-items/available');
export const getAvailableCombos    = () => api.get('/api/combos/available');
export const getSessionByTable     = (tableNumber) => api.get(`/api/sessions/table/${tableNumber}`);
export const getSessionOrders      = (sessionId) => api.get(`/api/sessions/${sessionId}/orders`);
export const createOrder           = (sessionId, data) => api.post(`/api/orders/session/${sessionId}`, data);
export const requestBill           = (sessionId) => api.post(`/api/sessions/${sessionId}/request-bill`);
