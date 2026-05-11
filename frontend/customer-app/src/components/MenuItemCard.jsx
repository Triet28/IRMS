/**
 * SRP: renders one menu item — no ordering logic, no state.
 * Ordering is triggered via the onOrder callback from the parent.
 */
export default function MenuItemCard({ item, onOrder }) {
  return (
    <div className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
      <div>
        <p className="font-semibold">{item.name}</p>
        {item.description && <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>}
        <p className="text-blue-600 font-medium mt-1">{Number(item.price).toLocaleString()}đ</p>
      </div>
      <button
        onClick={() => onOrder(item)}
        className="ml-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-9 h-9 flex items-center
                   justify-center text-xl font-bold transition-colors"
      >
        +
      </button>
    </div>
  );
}
