import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  getAllItems, createItem, updateItem, getCategories,
  getAllCombos, createCombo, updateCombo,
  getUsers, createUser,
  openSession, closeSession, getOpenSessions, requestBill, createBill, payBill,
  getAllPaidBills,
} from '../api/apiClient';
import Button from '../components/Button';
import OrderCard from '../components/OrderCard';
import BaseModal from '../components/BaseModal';

const MAX_TABLES = 10;

const TABS = [
  { key: 'sessions', label: 'Quản lý bàn' },
  { key: 'menu',     label: 'Quản lý menu' },
  { key: 'combo',    label: 'Combo' },
  { key: 'staff',    label: 'Nhân viên' },
  { key: 'history',  label: 'Lịch sử bill' },
];

const STATUS_LABEL = {
  ACTIVE: { text: 'Đang phục vụ', cls: 'bg-green-100 text-green-700' },
  BILL_REQUESTED: { text: 'Yêu cầu tính tiền', cls: 'bg-yellow-100 text-yellow-700' },
  CLOSED: { text: 'Đã đóng', cls: 'bg-gray-100 text-gray-500' },
};

const ROLE_LABEL = { WAITER: 'Phục vụ', CHEF: 'Bếp', MANAGER: 'Quản lý' };

export default function ManagerPage() {
  const { user, logout } = useAuth();
  const { sessions, setSessions, fetchSessions, orders, fetchSessionOrders, changeStatus } = useOrders();

  const fetchOpenSessions = useCallback(async () => {
    try { setSessions(await getOpenSessions()); } catch {}
  }, [setSessions]);

  const [activeTab, setActiveTab]           = useState('sessions');
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionError, setSessionError]       = useState('');

  const handleWs = useCallback((_, payload) => {
    if (payload.event === 'BILL_REQUESTED' || payload.event === 'SESSION_OPENED') {
      fetchOpenSessions();
    }
    if (payload.event === 'ORDER_STATUS_CHANGED' && selectedSession) {
      fetchSessionOrders(selectedSession.id);
    }
  }, [fetchOpenSessions, fetchSessionOrders, selectedSession]);

  const wsTopics = [
    '/topic/billing',
    '/topic/sessions',
    selectedSession ? `/topic/session/${selectedSession.id}` : '',
  ].filter(Boolean);

  useWebSocket(wsTopics, handleWs);
  const [showBillModal, setShowBillModal]     = useState(false);
  const [bill, setBill]                       = useState(null);
  const [qrSession, setQrSession]             = useState(null); // session whose QR is shown

  // menu state
  const [menuItems, setMenuItems]     = useState([]);
  const [categories, setCategories]   = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [itemForm, setItemForm]       = useState({ name: '', description: '', price: '', categoryId: '', available: true });
  const [itemSaving, setItemSaving]   = useState(false);
  const [itemError, setItemError]     = useState('');

  // combo state
  const [comboList, setComboList]         = useState([]);
  const [menuItemsForCombo, setMenuItemsForCombo] = useState([]);
  const [showComboModal, setShowComboModal]       = useState(false);
  const [editCombo, setEditCombo]                 = useState(null);
  const [comboForm, setComboForm]   = useState({ name: '', description: '', price: '', available: true });
  const [comboItems, setComboItems] = useState([{ menuItemId: '', quantity: 1 }]);
  const [comboSaving, setComboSaving] = useState(false);
  const [comboError, setComboError]   = useState('');

  // history state
  const [paidBills, setPaidBills] = useState([]);

  // staff state
  const [staffList, setStaffList]     = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm]     = useState({ username: '', email: '', password: '', role: 'WAITER' });
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError]   = useState('');

  useEffect(() => { fetchOpenSessions(); }, []);

  useEffect(() => {
    if (activeTab === 'menu') {
      getAllItems().then(setMenuItems);
      getCategories().then(setCategories);
    }
    if (activeTab === 'combo') {
      getAllCombos().then(setComboList);
      getAllItems().then(setMenuItemsForCombo);
    }
    if (activeTab === 'staff')   getUsers().then(setStaffList);
    if (activeTab === 'history') getAllPaidBills().then(setPaidBills);
  }, [activeTab]);

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

  // ── Session handlers ───────────────────────────────────────────────────────
  async function handleOpenTable(num) {
    setSessionError('');
    try {
      await openSession(num);
      fetchOpenSessions();
    } catch (e) {
      setSessionError(e?.detail ?? e?.message ?? 'Không thể mở bàn');
    }
  }

  async function handleRequestBill(sessionId) {
    try { await requestBill(sessionId); fetchOpenSessions(); } catch {}
  }

  async function handleCreateBill(session) {
    try {
      const b = await createBill(session.id, {});
      setBill(b);
      setShowBillModal(true);
    } catch (e) {
      alert(e?.detail ?? e?.message ?? 'Không thể tạo bill');
    }
  }

  async function handlePay(method) {
    if (!bill) return;
    try {
      await payBill(bill.id, { paymentMethod: method });
      await closeSession(selectedSession.id);
      setShowBillModal(false);
      setBill(null);
      setSelectedSession(null);
      fetchOpenSessions();
    } catch (e) {
      alert(e?.detail ?? e?.message ?? 'Lỗi thanh toán');
    }
  }

  // ── Menu handlers ──────────────────────────────────────────────────────────
  function openNewItem() {
    setEditItem(null);
    setItemForm({ name: '', description: '', price: '', categoryId: categories[0]?.id ?? '', available: true });
    setItemError('');
    setShowItemModal(true);
  }

  function openEditItem(item) {
    setEditItem(item);
    setItemForm({ name: item.name, description: item.description ?? '', price: item.price, categoryId: item.categoryId ?? '', available: item.available });
    setItemError('');
    setShowItemModal(true);
  }

  async function handleSaveItem() {
    if (!editItem && !itemForm.categoryId) { setItemError('Vui lòng chọn danh mục'); return; }
    if (!itemForm.name.trim())             { setItemError('Vui lòng nhập tên món');   return; }
    if (!itemForm.price || isNaN(parseFloat(itemForm.price))) { setItemError('Giá không hợp lệ'); return; }

    setItemSaving(true);
    setItemError('');
    try {
      if (editItem) {
        await updateItem(editItem.id, {
          name: itemForm.name,
          description: itemForm.description,
          price: parseFloat(itemForm.price),
          available: itemForm.available,
        });
      } else {
        await createItem({
          name: itemForm.name,
          description: itemForm.description,
          price: parseFloat(itemForm.price),
          categoryId: parseInt(itemForm.categoryId),
          available: itemForm.available,
        });
      }
      setShowItemModal(false);
      getAllItems().then(setMenuItems);
    } catch (e) {
      setItemError(e?.message ?? 'Lỗi khi lưu món');
    } finally {
      setItemSaving(false);
    }
  }

  // ── Combo handlers ────────────────────────────────────────────────────────
  function openNewCombo() {
    setEditCombo(null);
    setComboForm({ name: '', description: '', price: '', available: true });
    setComboItems([{ menuItemId: '', quantity: 1 }]);
    setComboError('');
    setShowComboModal(true);
  }

  function openEditCombo(combo) {
    setEditCombo(combo);
    setComboForm({ name: combo.name, description: combo.description ?? '', price: combo.price, available: combo.available });
    setComboItems(combo.items?.map(ci => ({ menuItemId: String(ci.menuItemId), quantity: ci.quantity })) ?? []);
    setComboError('');
    setShowComboModal(true);
  }

  async function handleSaveCombo() {
    if (!comboForm.name.trim()) { setComboError('Vui lòng nhập tên combo'); return; }
    if (!comboForm.price || isNaN(parseFloat(comboForm.price))) { setComboError('Giá không hợp lệ'); return; }
    const validItems = comboItems.filter(ci => ci.menuItemId);
    if (!editCombo && validItems.length === 0) { setComboError('Thêm ít nhất 1 món vào combo'); return; }

    setComboSaving(true);
    setComboError('');
    try {
      if (editCombo) {
        const validItems = comboItems.filter(ci => ci.menuItemId);
        await updateCombo(editCombo.id, {
          name: comboForm.name,
          description: comboForm.description,
          price: parseFloat(comboForm.price),
          available: comboForm.available,
          items: validItems.map(ci => ({
            menuItemId: parseInt(ci.menuItemId),
            quantity: ci.quantity,
          })),
        });
      } else {
        await createCombo({
          name: comboForm.name,
          description: comboForm.description,
          price: parseFloat(comboForm.price),
          items: validItems.map(ci => ({ menuItemId: parseInt(ci.menuItemId), quantity: ci.quantity })),
        });
      }
      setShowComboModal(false);
      getAllCombos().then(setComboList);
    } catch (e) {
      setComboError(e?.message ?? 'Lỗi khi lưu combo');
    } finally {
      setComboSaving(false);
    }
  }

  // ── Staff handlers ─────────────────────────────────────────────────────────
  async function handleCreateStaff() {
    setStaffSaving(true);
    setStaffError('');
    try {
      await createUser(staffForm);
      setShowStaffModal(false);
      getUsers().then(setStaffList);
      setStaffForm({ username: '', email: '', password: '', role: 'WAITER' });
    } catch (e) {
      const errMsg = e?.errors
        ? Object.entries(e.errors).map(([f, m]) => `${f}: ${m}`).join(' | ')
        : (e?.detail ?? e?.message);
      setStaffError(errMsg ?? 'Không thể tạo tài khoản');
    } finally {
      setStaffSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-purple-50 p-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-purple-700">Manager — {user?.username}</h1>
          <Button variant="ghost" onClick={logout}>Đăng xuất</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <Button key={t.key}
              variant={activeTab === t.key ? 'primary' : 'ghost'}
              onClick={() => { setActiveTab(t.key); setSelectedSession(null); }}>
              {t.label}
            </Button>
          ))}
        </div>

        {/* ── Tab: Sessions ── */}
        {activeTab === 'sessions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: table grid */}
            <div>
              <h2 className="font-semibold mb-3 text-gray-700">Sơ đồ bàn</h2>
              {sessionError && <p className="text-red-500 text-sm mb-2">{sessionError}</p>}

              <div className="grid grid-cols-4 gap-2 mb-4">
                {Array.from({ length: MAX_TABLES }, (_, i) => i + 1).map(num => {
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
                        ${isSelected ? 'border-purple-500 shadow-md' : 'border-transparent'}
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
                    {(selectedSession.status === 'ACTIVE' || selectedSession.status === 'BILL_REQUESTED') && (
                      <Button variant="danger" onClick={() => handleCreateBill(selectedSession)}
                        className="text-xs py-1 px-3">
                        {selectedSession.status === 'BILL_REQUESTED' ? 'Xuất bill' : 'Tính tiền'}
                      </Button>
                    )}
                    <Button variant="ghost" onClick={async () => {
                        await closeSession(selectedSession.id);
                        setSelectedSession(null);
                        fetchOpenSessions();
                      }}
                      className="text-xs py-1 px-3 text-red-500 border-red-200 hover:bg-red-50">
                      Đóng bàn
                    </Button>
                    {selectedSession.tableToken && (
                      <Button variant="ghost" onClick={() => setQrSession(selectedSession)}
                        className="text-xs py-1 px-3 text-blue-600 border-blue-200 hover:bg-blue-50">
                        QR Code
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: orders of selected session */}
            <div>
              {selectedSession ? (
                <>
                  <h2 className="font-semibold mb-3 text-gray-700">
                    Orders — Bàn {selectedSession.tableNumber}
                  </h2>
                  {orders.length === 0
                    ? <p className="text-gray-400 text-sm">Chưa có order nào.</p>
                    : orders.map(o => (
                        <OrderCard key={o.id} order={o} role="MANAGER"
                          onStatusChange={async (id, status) => {
                            await changeStatus(id, status);
                            fetchSessionOrders(selectedSession.id);
                          }}/>
                      ))
                  }
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
                  Chọn một bàn để xem orders
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Menu ── */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Danh sách món ({menuItems.length})</h2>
              <Button variant="primary" onClick={openNewItem}>+ Thêm món</Button>
            </div>
            {menuItems.length === 0 && (
              <p className="text-gray-400 text-sm">Chưa có món nào.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuItems.map(item => (
                <div key={item.id}
                  className={`border rounded-xl p-4 bg-white flex justify-between items-center
                    ${!item.available ? 'opacity-50' : ''}`}>
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    )}
                    <p className="text-sm text-purple-600 font-semibold mt-1">
                      {item.price?.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {item.available ? 'Còn phục vụ' : 'Ngừng bán'}
                    </span>
                    <Button variant="ghost" onClick={() => openEditItem(item)}>Sửa</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Combo ── */}
        {activeTab === 'combo' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Danh sách combo ({comboList.length})</h2>
              <Button variant="primary" onClick={openNewCombo}>+ Tạo combo</Button>
            </div>
            {comboList.length === 0 && (
              <p className="text-gray-400 text-sm">Chưa có combo nào.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {comboList.map(combo => (
                <div key={combo.id}
                  className={`border-2 border-blue-100 rounded-xl p-4 bg-white
                    ${!combo.available ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{combo.name}</p>
                      {combo.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{combo.description}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0
                      ${combo.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {combo.available ? 'Còn' : 'Hết'}
                    </span>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-0.5 mb-3">
                    {combo.items?.map(ci => (
                      <li key={ci.menuItemId}>• {ci.menuItemName} × {ci.quantity}</li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center">
                    <p className="text-purple-600 font-semibold">
                      {Number(combo.price).toLocaleString('vi-VN')}đ
                    </p>
                    <Button variant="ghost" onClick={() => openEditCombo(combo)}>Sửa</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: History ── */}
        {activeTab === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">
                Lịch sử thanh toán ({paidBills.length})
              </h2>
              <Button variant="ghost" onClick={() => getAllPaidBills().then(setPaidBills)}>
                Làm mới
              </Button>
            </div>
            {paidBills.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa có bill nào được thanh toán.</p>
            ) : (
              <div className="space-y-3">
                {paidBills.map(b => (
                  <div key={b.id} className="border rounded-xl p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">
                          Bill #{b.id} — Session #{b.sessionId}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {b.paidAt ? new Date(b.paidAt).toLocaleString('vi-VN') : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-700">
                          {Number(b.total).toLocaleString('vi-VN')}đ
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {b.paymentMethod === 'CASH' ? 'Tiền mặt'
                            : b.paymentMethod === 'CARD' ? 'Thẻ'
                            : 'Ví điện tử'}
                        </span>
                      </div>
                    </div>
                    {/* Chi tiết items */}
                    <div className="mt-2 border-t pt-2 space-y-0.5">
                      {b.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-500">
                          <span>{item.itemName} × {item.quantity}</span>
                          <span>{Number(item.subtotal).toLocaleString('vi-VN')}đ</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs text-gray-400 pt-1">
                        <span>VAT ({Number(b.taxRate * 100).toFixed(0)}%)</span>
                        <span>+{Number(b.taxAmount).toLocaleString('vi-VN')}đ</span>
                      </div>
                      {b.discountAmount > 0 && (
                        <div className="flex justify-between text-xs text-green-600">
                          <span>Giảm giá</span>
                          <span>−{Number(b.discountAmount).toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Staff ── */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Tài khoản nhân viên ({staffList.length})</h2>
              <Button variant="primary" onClick={() => { setStaffError(''); setShowStaffModal(true); }}>
                + Thêm nhân viên
              </Button>
            </div>
            {staffList.length === 0 && (
              <p className="text-gray-400 text-sm">Chưa có tài khoản nào ngoài admin.</p>
            )}
            <div className="space-y-2">
              {staffList.map(s => (
                <div key={s.id} className="border rounded-xl p-4 bg-white flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{s.username}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium
                    ${s.role === 'MANAGER' ? 'bg-purple-100 text-purple-700'
                    : s.role === 'CHEF'    ? 'bg-orange-100 text-orange-700'
                    :                        'bg-blue-100 text-blue-700'}`}>
                    {ROLE_LABEL[s.role] ?? s.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Modal: Món ── */}
      {showItemModal && (
        <BaseModal title={editItem ? 'Cập nhật món' : 'Thêm món mới'} onClose={() => setShowItemModal(false)}>
          <div className="space-y-3">
            {itemError && <p className="text-red-500 text-sm">{itemError}</p>}

            {!editItem && (
              <select value={itemForm.categoryId}
                onChange={e => setItemForm({ ...itemForm, categoryId: e.target.value })}
                className="w-full border rounded px-3 py-2 bg-white">
                <option value="">-- Chọn danh mục *</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <input placeholder="Tên món *" value={itemForm.name}
              onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
              className="w-full border rounded px-3 py-2"/>

            <input placeholder="Mô tả" value={itemForm.description}
              onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full border rounded px-3 py-2"/>

            <input type="number" placeholder="Giá (VNĐ) *" value={itemForm.price}
              onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
              className="w-full border rounded px-3 py-2"/>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={itemForm.available}
                onChange={e => setItemForm({ ...itemForm, available: e.target.checked })}/>
              Còn phục vụ
            </label>

            <Button className="w-full" disabled={itemSaving} onClick={handleSaveItem}>
              {itemSaving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </BaseModal>
      )}

      {/* ── Modal: Combo ── */}
      {showComboModal && (
        <BaseModal title={editCombo ? 'Cập nhật combo' : 'Tạo combo mới'} onClose={() => setShowComboModal(false)}>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {comboError && <p className="text-red-500 text-sm">{comboError}</p>}
            <input placeholder="Tên combo *" value={comboForm.name}
              onChange={e => setComboForm({ ...comboForm, name: e.target.value })}
              className="w-full border rounded px-3 py-2"/>
            <input placeholder="Mô tả" value={comboForm.description}
              onChange={e => setComboForm({ ...comboForm, description: e.target.value })}
              className="w-full border rounded px-3 py-2"/>
            <input type="number" placeholder="Giá combo (VNĐ) *" value={comboForm.price}
              onChange={e => setComboForm({ ...comboForm, price: e.target.value })}
              className="w-full border rounded px-3 py-2"/>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={comboForm.available}
                onChange={e => setComboForm({ ...comboForm, available: e.target.checked })}/>
              Còn phục vụ
            </label>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Các món trong combo {!editCombo && '*'}
              </p>
                {comboItems.map((ci, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select value={ci.menuItemId}
                      onChange={e => {
                        const updated = [...comboItems];
                        updated[idx] = { ...ci, menuItemId: e.target.value };
                        setComboItems(updated);
                      }}
                      className="flex-1 border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">-- Chọn món</option>
                      {menuItemsForCombo.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <input type="number" min="1" value={ci.quantity}
                      onChange={e => {
                        const updated = [...comboItems];
                        updated[idx] = { ...ci, quantity: parseInt(e.target.value) || 1 };
                        setComboItems(updated);
                      }}
                      className="w-16 border rounded px-2 py-1.5 text-sm text-center"/>
                    {comboItems.length > 1 && (
                      <button onClick={() => setComboItems(comboItems.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 px-1">✕</button>
                    )}
                  </div>
                ))}
              <button onClick={() => setComboItems([...comboItems, { menuItemId: '', quantity: 1 }])}
                className="text-sm text-blue-600 hover:underline mt-1">
                + Thêm món
              </button>
            </div>

            <Button className="w-full" disabled={comboSaving} onClick={handleSaveCombo}>
              {comboSaving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </BaseModal>
      )}

      {/* ── Modal: Nhân viên ── */}
      {showStaffModal && (
        <BaseModal title="Thêm tài khoản nhân viên" onClose={() => setShowStaffModal(false)}>
          <div className="space-y-3">
            {staffError && <p className="text-red-500 text-sm">{staffError}</p>}
            <input placeholder="Tên đăng nhập *" value={staffForm.username}
              onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
              className="w-full border rounded px-3 py-2"/>
            <input placeholder="Email *" value={staffForm.email}
              onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
              className="w-full border rounded px-3 py-2"/>
            <input type="password" placeholder="Mật khẩu *" value={staffForm.password}
              onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
              className="w-full border rounded px-3 py-2"/>
            <select value={staffForm.role}
              onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
              className="w-full border rounded px-3 py-2 bg-white">
              <option value="WAITER">Phục vụ (Waiter)</option>
              <option value="CHEF">Bếp (Chef)</option>
              <option value="MANAGER">Quản lý (Manager)</option>
            </select>
            <Button className="w-full" disabled={staffSaving} onClick={handleCreateStaff}>
              {staffSaving ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </div>
        </BaseModal>
      )}

      {/* ── Modal: QR Code bàn ── */}
      {qrSession && (() => {
        const tableUrl = `http://localhost:3001/table/${qrSession.tableNumber}`;
        return (
          <BaseModal title={`QR Code — Bàn ${qrSession.tableNumber}`}
            onClose={() => setQrSession(null)}>
            <div className="flex flex-col items-center gap-4 py-2">
              <QRCodeSVG
                value={tableUrl}
                size={220}
                bgColor="#ffffff"
                fgColor="#4f1d96"
                level="M"
                includeMargin
              />
              <p className="text-sm text-gray-500 text-center">
                Mã QR cố định — in một lần, dùng mãi cho bàn {qrSession.tableNumber}
              </p>
              <a href={tableUrl} target="_blank" rel="noreferrer"
                className="text-xs text-blue-500 underline break-all text-center">
                {tableUrl}
              </a>
            </div>
          </BaseModal>
        );
      })()}

      {/* ── Modal: Bill / Thanh toán ── */}
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
              <span className="text-purple-700">{Number(bill.total).toLocaleString('vi-VN')}đ</span>
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
