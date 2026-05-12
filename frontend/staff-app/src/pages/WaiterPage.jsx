import { useEffect, useState, useCallback } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import OrderCard from '../components/OrderCard';
import BaseModal from '../components/BaseModal';
import Button from '../components/Button';
import {
  openSession, closeSession, getOpenSessions,
  getAvailableItems, getAvailableCombos, createBill, payBill,
} from '../api/apiClient';

const STATUS_LABEL = {
  ACTIVE:          { text: 'Đang phục vụ',     cls: 'bg-green-100 text-green-700' },
  BILL_REQUESTED:  { text: 'Yêu cầu tính tiền', cls: 'bg-yellow-100 text-yellow-700' },
};

export default function WaiterPage() {
  const { user, logout } = useAuth();
  const { sessions, setSessions, orders, fetchSessionOrders, addOrder, changeStatus } = useOrders();

  const fetchOpenSessions = useCallback(async () => {
    try { setSessions(await getOpenSessions()); } catch {}
  }, [setSessions]);

  const [selectedSession, setSelectedSession] = useState(null);
  const [menuItems, setMenuItems]             = useState([]);
  const [showOrderModal, setShowOrderModal]   = useState(false);
  const [showBillModal, setShowBillModal]     = useState(false);
  const [bill, setBill]                       = useState(null);
  const [openError, setOpenError]             = useState('');
  const [orderTab, setOrderTab]               = useState('item'); // 'item' | 'combo'
  const [combos, setCombos]                   = useState([]);
  const [newOrder, setNewOrder]               = useState({ menuItemId: '', comboId: '', quantity: 1, notes: '' });

  useEffect(() => {
    fetchOpenSessions();
    getAvailableItems().then(setMenuItems);
    getAvailableCombos().then(setCombos);
  }, []);

  useEffect(() => {
    if (selectedSession) fetchSessionOrders(selectedSession.id);
  }, [selectedSession]);

  // Keep selectedSession in sync when sessions list is refreshed via WebSocket
  useEffect(() => {
    if (selectedSession) {
      const updated = sessions.find(s => s.id === selectedSession.id);
      if (updated && updated.status !== selectedSession.status) setSelectedSession(updated);
    }
  }, [sessions]);

  const handleWs = useCallback((topic, payload) => {
    if (payload.event === 'ORDER_STATUS_CHANGED') {
      if (selectedSession) fetchSessionOrders(selectedSession.id);
    }
    if (payload.event === 'BILL_REQUESTED' || payload.event === 'SESSION_OPENED') {
      fetchOpenSessions();
    }
  }, [selectedSession, fetchOpenSessions, fetchSessionOrders]);

  useWebSocket(
    ['/topic/billing', '/topic/sessions', selectedSession ? `/topic/session/${selectedSession.id}` : ''].filter(Boolean),
    handleWs,
  );

  async function handleOpenTable(num) {
    setOpenError('');
    try {
      await openSession(num);
      fetchOpenSessions();
    } catch (e) {
      setOpenError(e?.detail ?? e?.message ?? 'Không thể mở bàn');
    }
  }

  async function handleAddOrder() {
    if (!selectedSession) return;
    if (orderTab === 'item' && !newOrder.menuItemId) return;
    if (orderTab === 'combo' && !newOrder.comboId) return;

    const data = orderTab === 'item'
      ? { menuItemId: parseInt(newOrder.menuItemId), quantity: newOrder.quantity, notes: newOrder.notes }
      : { comboId: parseInt(newOrder.comboId), quantity: newOrder.quantity, notes: newOrder.notes };

    await addOrder(selectedSession.id, data);
    setShowOrderModal(false);
    setNewOrder({ menuItemId: '', comboId: '', quantity: 1, notes: '' });
    fetchSessionOrders(selectedSession.id);
  }

  async function handleCreateBill() {
    try {
      const b = await createBill(selectedSession.id, {});
      setBill(b);
      setShowBillModal(true);
    } catch (e) {
      alert(e?.detail ?? e?.message ?? 'Lỗi khi tạo bill');
    }
  }

  async function handlePay(method) {
    if (!bill) return;
    await payBill(bill.id, { paymentMethod: method });
    await closeSession(selectedSession.id);
    setShowBillModal(false);
    setBill(null);
    setSelectedSession(null);
    fetchOpenSessions();
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Phục vụ — {user?.username}</h1>
          <Button variant="ghost" onClick={logout}>Đăng xuất</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Left: table grid */}
          <div>
            <h2 className="font-semibold mb-3 text-gray-700">Sơ đồ bàn</h2>
            {openError && <p className="text-red-500 text-sm mb-2">{openError}</p>}

            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                const session = sessions.find(s => s.tableNumber === num);
                const isSelected = selectedSession?.tableNumber === num;
                const statusCls = !session
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : session.status === 'BILL_REQUESTED'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200';
                return (
                  <div key={num}
                    onClick={() => session ? setSelectedSession(session) : handleOpenTable(num)}
                    className={`rounded-xl p-3 text-center border-2 cursor-pointer transition select-none
                      ${isSelected ? 'border-blue-500 shadow-md' : 'border-transparent'}
                      ${statusCls}`}>
                    <p className="font-bold text-base">Bàn {num}</p>
                    <p className="text-xs mt-0.5">
                      {!session ? 'Trống' : STATUS_LABEL[session.status]?.text}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Actions for selected session */}
            {selectedSession && (
              <div className="p-3 border rounded-xl bg-white">
                <p className="font-semibold text-gray-700 mb-2">
                  Bàn {selectedSession.tableNumber}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium
                    ${STATUS_LABEL[selectedSession.status]?.cls}`}>
                    {STATUS_LABEL[selectedSession.status]?.text}
                  </span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedSession.status === 'ACTIVE' && (
                    <Button variant="success" onClick={() => setShowOrderModal(true)}>+ Gọi món</Button>
                  )}
                  {(selectedSession.status === 'ACTIVE' || selectedSession.status === 'BILL_REQUESTED') && (
                    <Button variant="danger" onClick={handleCreateBill}>
                      {selectedSession.status === 'BILL_REQUESTED' ? 'Xuất bill' : 'Tính tiền'}
                    </Button>
                  )}
                  <Button variant="ghost" onClick={async () => {
                    await closeSession(selectedSession.id);
                    setSelectedSession(null);
                    fetchOpenSessions();
                  }} className="text-xs py-1 px-3 text-red-500 border-red-200 hover:bg-red-50">
                    Đóng bàn
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Orders for selected session */}
          <div>
            {!selectedSession ? (
              <div className="bg-white rounded-xl p-8 text-center border h-full flex flex-col items-center justify-center">
                <p className="text-3xl mb-2">👈</p>
                <p className="text-gray-400 text-sm">Chọn một bàn để xem đơn</p>
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-gray-700 mb-3">
                  Orders — Bàn {selectedSession.tableNumber}
                </h2>

                {orders.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Chưa có order nào.</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map(o => (
                      <OrderCard key={o.id} order={o} role="WAITER"
                        onStatusChange={async (id, status) => {
                          await changeStatus(id, status);
                          fetchSessionOrders(selectedSession.id);
                        }}/>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Order Modal */}
      {showOrderModal && (
        <BaseModal title="Gọi món" onClose={() => {
          setShowOrderModal(false);
          setOrderTab('item');
          setNewOrder({ menuItemId: '', comboId: '', quantity: 1, notes: '' });
        }}>
          <div className="space-y-3">
            {/* Tab Món / Combo */}
            <div className="flex gap-2">
              <button onClick={() => setOrderTab('item')}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition
                  ${orderTab === 'item'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                Món đơn
              </button>
              <button onClick={() => setOrderTab('combo')}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition
                  ${orderTab === 'combo'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                Combo
              </button>
            </div>

            {orderTab === 'item' ? (
              <select className="w-full border rounded-lg px-3 py-2 bg-white"
                value={newOrder.menuItemId}
                onChange={e => setNewOrder({ ...newOrder, menuItemId: e.target.value })}>
                <option value="">Chọn món...</option>
                {menuItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {Number(item.price).toLocaleString('vi-VN')}đ
                  </option>
                ))}
              </select>
            ) : (
              <select className="w-full border rounded-lg px-3 py-2 bg-white"
                value={newOrder.comboId}
                onChange={e => setNewOrder({ ...newOrder, comboId: e.target.value })}>
                <option value="">Chọn combo...</option>
                {combos.map(combo => (
                  <option key={combo.id} value={combo.id}>
                    {combo.name} — {Number(combo.price).toLocaleString('vi-VN')}đ
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-20">Số lượng</label>
              <input type="number" min="1" value={newOrder.quantity}
                onChange={e => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })}
                className="border rounded-lg px-3 py-2 w-24"/>
            </div>
            <input type="text" value={newOrder.notes}
              onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" placeholder="Ghi chú..."/>
            <Button className="w-full" onClick={handleAddOrder}>Xác nhận gọi món</Button>
          </div>
        </BaseModal>
      )}

      {/* Bill Modal */}
      {showBillModal && bill && (
        <BaseModal title={`Thanh toán — Bàn ${selectedSession?.tableNumber}`}
          onClose={() => setShowBillModal(false)}>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tạm tính</span>
              <span>{Number(bill.subtotal).toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Thuế VAT (10%)</span>
              <span>{Number(bill.taxAmount).toLocaleString('vi-VN')}đ</span>
            </div>
            {bill.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá</span>
                <span>−{Number(bill.discountAmount).toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Tổng cộng</span>
              <span className="text-blue-700">{Number(bill.total).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">Chọn hình thức thanh toán:</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="success" onClick={() => handlePay('CASH')}>Tiền mặt</Button>
            <Button onClick={() => handlePay('CARD')}>Thẻ</Button>
            <Button variant="ghost" onClick={() => handlePay('DIGITAL_WALLET')}>Ví điện tử</Button>
          </div>
        </BaseModal>
      )}
    </div>
  );
}
