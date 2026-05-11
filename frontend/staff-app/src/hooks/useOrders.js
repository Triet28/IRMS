import { useState, useCallback } from 'react';
import {
  getSessionOrders, createOrder, updateOrderStatus,
  getPendingOrders, getActiveSessions,
} from '../api/apiClient';

/**
 * ISP: hook is focused solely on order/session operations.
 * A Chef component imports only this hook — not auth or websocket.
 */
export function useOrders() {
  const [orders,   setOrders]   = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try { setSessions(await getActiveSessions()); }
    catch (e) { setError(e.detail ?? 'Failed to load sessions'); }
    finally { setLoading(false); }
  }, []);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try { setOrders(await getPendingOrders()); }
    catch (e) { setError(e.detail ?? 'Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  const fetchSessionOrders = useCallback(async (sessionId) => {
    setLoading(true);
    try { setOrders(await getSessionOrders(sessionId)); }
    catch (e) { setError(e.detail ?? 'Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  const addOrder = useCallback(async (sessionId, menuItemId, quantity, notes) => {
    return createOrder(sessionId, { menuItemId, quantity, notes });
  }, []);

  const changeStatus = useCallback(async (orderId, status) => {
    return updateOrderStatus(orderId, status);
  }, []);

  return {
    orders, sessions, loading, error,
    fetchSessions, fetchPending, fetchSessionOrders, addOrder, changeStatus,
    setOrders, setSessions,
  };
}
