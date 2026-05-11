import { useEffect, useCallback } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import OrderCard from '../components/OrderCard';
import Button from '../components/Button';

// ISP: ChefPage imports only useOrders + useWebSocket — not billing hooks
export default function ChefPage() {
  const { orders, loading, fetchPending, changeStatus, setOrders } = useOrders();
  const { logout } = useAuth();

  useEffect(() => { fetchPending(); }, []);

  // SRP: WebSocket event handling is isolated here — ChefPage reacts to events
  const handleWsMessage = useCallback((topic, payload) => {
    if (payload.event === 'ORDER_CREATED') fetchPending();
    if (payload.event === 'ORDER_STATUS_CHANGED') fetchPending();
  }, []);

  // ISP: Chef only needs kitchen topic, not billing or session topics
  useWebSocket(['/topic/kitchen'], handleWsMessage);

  async function handleStatus(orderId, status) {
    await changeStatus(orderId, status);
    fetchPending();
  }

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-orange-700">Màn hình bếp</h1>
          <Button variant="ghost" onClick={logout}>Đăng xuất</Button>
        </div>

        {loading && <p className="text-center text-gray-500">Đang tải...</p>}

        {orders.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-12">Không có order đang chờ</p>
        )}

        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              role="CHEF"
              onStatusChange={handleStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
