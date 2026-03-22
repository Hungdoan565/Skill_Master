/**
 * TabButton Component
 * Tab navigation button with icon support
 */

export function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
