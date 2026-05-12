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
  const [tableNumber, setTableNumber]         = useState('');
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

  const handleWs = useCallback((topic, payload) => {
    if (payload.event === 'ORDER_STATUS_CHANGED') {
      if (selectedSession) fetchSessionOrders(selectedSession.id);
    }
    if (payload.event === 'BILL_REQUESTED') fetchOpenSessions();
  }, [selectedSession, fetchOpenSessions]);

  useWebSocket(
    ['/topic/billing', selectedSession ? `/topic/session/${selectedSession.id}` : ''].filter(Boolean),
    handleWs,
  );

  async function handleOpenSession() {
    const num = parseInt(tableNumber);
    if (!num || num < 1) return;
    setOpenError('');
    try {
      await openSession(num);
      setTableNumber('');
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

        {/* Open session bar */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
          <p className="text-sm font-medium text-gray-600 mb-2">Mở bàn mới</p>
          <div className="flex gap-2">
            <input type="number" placeholder="Số bàn" value={tableNumber}
              onChange={e => { setTableNumber(e.target.value); setOpenError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleOpenSession()}
              className="border rounded-lg px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            <Button onClick={handleOpenSession}>Mở bàn</Button>
          </div>
          {openError && <p className="text-red-500 text-sm mt-1">{openError}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Session list */}
          <div>
            <h2 className="font-semibold mb-3 text-gray-700">
              Bàn đang hoạt động
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {sessions.length}
              </span>
            </h2>

            {sessions.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center border">
                <p className="text-3xl mb-2">🪑</p>
                <p className="text-gray-400 text-sm">Chưa có bàn nào đang mở</p>
              </div>
            )}

            <div className="space-y-2">
              {sessions.map(s => {
                const badge = STATUS_LABEL[s.status] ?? {};
                return (
                  <div key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`border rounded-xl p-4 cursor-pointer transition
                      ${selectedSession?.id === s.id
                        ? 'border-blue-500 bg-blue-50 shadow'
                        : 'bg-white hover:bg-blue-50'}`}>
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-800">Bàn {s.tableNumber}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Session #{s.id}</p>
                  </div>
                );
              })}
            </div>
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
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold text-gray-700">Bàn {selectedSession.tableNumber}</h2>
                  <div className="flex gap-2">
                    {selectedSession.status === 'ACTIVE' && (
                      <Button variant="success" onClick={() => setShowOrderModal(true)}>+ Gọi món</Button>
                    )}
                    {(selectedSession.status === 'ACTIVE' || selectedSession.status === 'BILL_REQUESTED') && (
                      <Button variant="danger" onClick={handleCreateBill}>
                        {selectedSession.status === 'BILL_REQUESTED' ? 'Xuất bill' : 'Tính tiền'}
                      </Button>
                    )}
                  </div>
                </div>

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
