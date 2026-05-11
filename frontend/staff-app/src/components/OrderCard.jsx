import Button from './Button';

const STATUS_COLOR = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  PREPARED:  'bg-blue-100   text-blue-800',
  SERVED:    'bg-green-100  text-green-800',
  CANCELLED: 'bg-gray-100   text-gray-500 line-through',
};

/**
 * SRP: OrderCard only renders order data — zero business logic.
 * All state transitions are handled by the parent via onStatusChange callback.
 */
export default function OrderCard({ order, role, onStatusChange }) {
  const isTerminal = ['SERVED', 'CANCELLED'].includes(order.status);

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{order.menuItemName}</p>
          <p className="text-sm text-gray-500">× {order.quantity}</p>
          {order.notes && <p className="text-xs text-gray-400 italic">{order.notes}</p>}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>
          {order.status}
        </span>
      </div>

      {!isTerminal && (
        <div className="flex gap-2 pt-1">
          {role === 'CHEF' && order.status === 'PENDING' && (
            <Button variant="success" onClick={() => onStatusChange(order.id, 'PREPARED')}>
              Đã chuẩn bị
            </Button>
          )}
          {role === 'WAITER' && order.status === 'PREPARED' && (
            <Button variant="primary" onClick={() => onStatusChange(order.id, 'SERVED')}>
              Đã phục vụ
            </Button>
          )}
          {(role === 'WAITER' || role === 'MANAGER') && order.status !== 'SERVED' && (
            <Button variant="danger" onClick={() => onStatusChange(order.id, 'CANCELLED')}>
              Huỷ
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
