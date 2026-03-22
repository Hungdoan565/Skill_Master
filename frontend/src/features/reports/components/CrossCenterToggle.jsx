import { useAuth } from '@/contexts/auth-context';

/**
 * CrossCenterToggle - Toggle between single center and system-wide view
 * Only visible to SUPER_ADMIN
 * 
 * Usage in report pages:
 * const [isSystemWide, setIsSystemWide] = useState(false);
 * <CrossCenterToggle value={isSystemWide} onChange={setIsSystemWide} />
 */
export default function CrossCenterToggle({ value, onChange }) {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin?.()) return null;

  return (
    <div className="flex items-center gap-2 bg-muted dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onChange(false)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          !value
            ? 'bg-white dark:bg-gray-700 text-foreground dark:text-white shadow-sm'
            : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-300'
        }`}
      >
        Đơn trung tâm
      </button>
      <button
        onClick={() => onChange(true)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          value
            ? 'bg-white dark:bg-gray-700 text-foreground dark:text-white shadow-sm'
            : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-300'
        }`}
      >
        Toàn hệ thống
      </button>
    </div>
  );
}
