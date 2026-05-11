/**
 * OCP: Button is open for extension via the `variant` prop.
 * Adding a new style (e.g. "warning") only requires adding to `styles` —
 * the component itself never changes.
 *
 * SRP: Button only renders a styled button — no business logic.
 */
const styles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger:  'bg-red-600  hover:bg-red-700  text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  ghost:   'bg-gray-100  hover:bg-gray-200  text-gray-800',
};

export default function Button({ variant = 'primary', children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded font-medium transition-colors disabled:opacity-50
                  ${styles[variant] ?? styles.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
