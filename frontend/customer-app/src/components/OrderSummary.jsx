const STATUS_LABEL = {
  PENDING:   '⏳ Đang chờ',
  PREPARED:  '✅ Đã chuẩn bị',
  SERVED:    '🍽️ Đã phục vụ',
  CANCELLED: '❌ Đã huỷ',
};

// SRP: only renders order list — no API calls
export default function OrderSummary({ orders }) {
  if (!orders.length) return <p className="text-gray-400 text-center py-4">Chưa có order nào</p>;

  return (
    <div className="space-y-2">
      {orders.map(o => (
        <div key={o.id} className="flex justify-between items-center border-b pb-2">
          <div>
            <p className="font-medium">{o.menuItemName} × {o.quantity}</p>
            <p className="text-sm text-gray-500">{STATUS_LABEL[o.status] ?? o.status}</p>
          </div>
          <p className="text-gray-700">{(Number(o.menuItemPrice) * o.quantity).toLocaleString()}đ</p>
        </div>
      ))}
    </div>
  );
}
