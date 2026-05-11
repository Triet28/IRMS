import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useMenu } from '../hooks/useMenu';
import { useWebSocket } from '../hooks/useWebSocket';
import { getSessionByTable, getSessionOrders, createOrder, requestBill } from '../api/apiClient';
import MenuItemCard from '../components/MenuItemCard';
import OrderSummary from '../components/OrderSummary';

export default function TablePage() {
  const { tableNumber } = useParams();

  // Phase 1: resolve session from table number (QR is static, session changes)
  const [session, setSession]           = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  useEffect(() => {
    setSessionLoading(true);
    setSessionError(null);
    getSessionByTable(tableNumber)
      .then(s => {
        sessionStorage.setItem('tableToken', s.tableToken);
        setSession(s);
      })
      .catch(() => setSessionError('Bàn chưa được mở. Vui lòng gọi nhân viên.'))
      .finally(() => setSessionLoading(false));
  }, [tableNumber]);

  const sessionId = session?.id;

  const { byCategory, combos, loading: menuLoading } = useMenu();
  const [orders, setOrders]               = useState([]);
  const [tab, setTab]                     = useState('menu');
  const [menuTab, setMenuTab]             = useState('items');
  const [closed, setClosed]               = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [cart, setCart]                   = useState({});
  const [showCart, setShowCart]           = useState(false);

  const fetchOrders = useCallback(() => {
    if (sessionId) getSessionOrders(sessionId).then(setOrders).catch(() => {});
  }, [sessionId]);

  useEffect(() => { fetchOrders(); }, [sessionId]);

  const handleWs = useCallback((topic, payload) => {
    if (payload.event === 'ORDER_STATUS_CHANGED') fetchOrders();
    if (payload.event === 'SESSION_CLOSED') setClosed(true);
  }, [fetchOrders]);

  useWebSocket(
    sessionId ? [`/topic/session/${sessionId}`, `/topic/table/${sessionId}`] : [],
    handleWs,
  );

  function addToCart(item, isCombo = false) {
    const key = isCombo ? `combo_${item.id}` : `item_${item.id}`;
    setCart(prev => ({
      ...prev,
      [key]: { item, quantity: (prev[key]?.quantity ?? 0) + 1, isCombo },
    }));
  }

  function removeFromCart(key) {
    setCart(prev => {
      const next = { ...prev };
      if (next[key].quantity > 1) next[key] = { ...next[key], quantity: next[key].quantity - 1 };
      else delete next[key];
      return next;
    });
  }

  async function submitCart() {
    const entries = Object.values(cart);
    if (!entries.length) return;
    for (const { item, quantity, isCombo } of entries) {
      const payload = isCombo
        ? { comboId: item.id, quantity }
        : { menuItemId: item.id, quantity };
      await createOrder(sessionId, payload);
    }
    setCart({});
    setShowCart(false);
    fetchOrders();
    setTab('orders');
  }

  async function handleRequestBill() {
    await requestBill(sessionId);
    setBillRequested(true);
  }

  const cartCount   = Object.values(cart).reduce((s, e) => s + e.quantity, 0);
  const cartEntries = Object.entries(cart);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-gray-500">Đang tìm bàn {tableNumber}...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 gap-3 px-6 text-center">
        <p className="text-5xl">🪑</p>
        <h1 className="text-xl font-bold text-orange-700">Bàn {tableNumber}</h1>
        <p className="text-gray-600">{sessionError}</p>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
        <p className="text-4xl mb-4">🙏</p>
        <h1 className="text-2xl font-bold text-green-700">Cảm ơn quý khách!</h1>
        <p className="text-gray-500 mt-2">Hẹn gặp lại lần sau</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="font-bold text-lg">IRMS — Bàn {tableNumber}</h1>
        {!billRequested ? (
          <button onClick={handleRequestBill}
            className="bg-white text-blue-600 font-semibold px-3 py-1 rounded text-sm">
            Thanh toán
          </button>
        ) : (
          <span className="text-sm opacity-80">Đang chờ thanh toán...</span>
        )}
      </div>

      {/* Main tabs */}
      <div className="flex border-b bg-white">
        {['menu', 'orders'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition
              ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            {t === 'menu' ? 'Thực đơn' : `Đơn của tôi (${orders.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {tab === 'menu' && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-4">
              {['items', 'combos'].map(t => (
                <button key={t} onClick={() => setMenuTab(t)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition
                    ${menuTab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {t === 'items' ? 'Món lẻ' : `Combo (${combos.length})`}
                </button>
              ))}
            </div>

            {menuLoading && <p className="text-center text-gray-400 py-8">Đang tải menu...</p>}

            {/* Món lẻ */}
            {!menuLoading && menuTab === 'items' &&
              Object.entries(byCategory).map(([cat, items]) => (
                <div key={cat} className="mb-6">
                  <h2 className="font-bold text-gray-700 mb-2 uppercase text-sm tracking-wide">{cat}</h2>
                  <div className="space-y-2">
                    {items.map(item => (
                      <MenuItemCard key={item.id} item={item} onOrder={(i) => addToCart(i, false)} />
                    ))}
                  </div>
                </div>
              ))
            }

            {/* Combo */}
            {!menuLoading && menuTab === 'combos' && (
              combos.length === 0
                ? <p className="text-center text-gray-400 py-8">Chưa có combo nào.</p>
                : <div className="space-y-3">
                    {combos.map(combo => (
                      <div key={combo.id} className="bg-white border-2 border-blue-100 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                COMBO
                              </span>
                              <p className="font-semibold">{combo.name}</p>
                            </div>
                            {combo.description && (
                              <p className="text-sm text-gray-500 mb-2">{combo.description}</p>
                            )}
                            <ul className="text-xs text-gray-400 space-y-0.5 mb-2">
                              {combo.items?.map(ci => (
                                <li key={ci.menuItemId}>• {ci.menuItemName} × {ci.quantity}</li>
                              ))}
                            </ul>
                            <p className="text-blue-600 font-semibold">
                              {Number(combo.price).toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                          <button
                            onClick={() => addToCart(combo, true)}
                            className="ml-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-9 h-9
                                       flex items-center justify-center text-xl font-bold transition-colors">
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
            )}
          </>
        )}

        {tab === 'orders' && <OrderSummary orders={orders} />}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14
                     flex items-center justify-center shadow-xl z-10 active:scale-95 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9"/>
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold
                           rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        </button>
      )}

      {/* Cart bottom sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)}/>
          <div className="relative bg-white rounded-t-2xl w-full max-h-[75vh] flex flex-col
                          shadow-2xl max-w-lg mx-auto">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full"/>
            </div>
            <div className="flex justify-between items-center px-4 pb-3 border-b">
              <h2 className="font-bold text-lg">Giỏ hàng</h2>
              <button onClick={() => setShowCart(false)}
                className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
              {cartEntries.map(([key, { item, quantity, isCombo }]) => (
                <div key={key} className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isCombo && (
                      <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded shrink-0">combo</span>
                    )}
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button onClick={() => removeFromCart(key)}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
                      −
                    </button>
                    <span className="w-5 text-center font-semibold text-sm">{quantity}</span>
                    <button onClick={() => addToCart(item, isCombo)}
                      className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm button */}
            <div className="px-4 pb-6 pt-3 border-t">
              <button onClick={submitCart}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white
                           py-3.5 rounded-xl font-semibold text-base transition">
                Xác nhận gọi món ({cartCount} món)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
