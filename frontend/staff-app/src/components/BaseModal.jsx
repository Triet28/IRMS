/**
 * LSP: BaseModal defines the "modal contract" (title, onClose, children).
 * Any specialised modal (ConfirmModal, OrderModal) that extends this interface
 * can be used wherever a modal is expected — no breakage.
 *
 * SRP: only handles overlay + close behaviour.
 */
export default function BaseModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
