/**
 * SessionActionMenu - Dropdown menu các thao tác xử lý sự cố
 * Actions: Điểm danh, Đổi GV, Đổi phòng, Hủy buổi
 */

import { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical,
  ClipboardCheck,
  UserCog,
  DoorOpen,
  XCircle,
  CheckCircle2,
  Eye
} from 'lucide-react';

const MENU_ITEMS = [
  { 
    id: 'attendance', 
    label: 'Điểm danh', 
    icon: ClipboardCheck, 
    color: 'text-indigo-600 hover:bg-indigo-50',
    showWhen: (session) => session.status !== 'cancelled'
  },
  { 
    id: 'complete', 
    label: 'Đánh dấu hoàn thành', 
    icon: CheckCircle2, 
    color: 'text-green-600 hover:bg-green-50',
    showWhen: (session) => session.status === 'scheduled'
  },
  { 
    id: 'changeTeacher', 
    label: 'Đổi giáo viên', 
    icon: UserCog, 
    color: 'text-blue-600 hover:bg-blue-50',
    showWhen: (session) => session.status !== 'cancelled' && session.status !== 'completed'
  },
  { 
    id: 'changeRoom', 
    label: 'Đổi phòng học', 
    icon: DoorOpen, 
    color: 'text-purple-600 hover:bg-purple-50',
    showWhen: (session) => session.status !== 'cancelled' && session.status !== 'completed'
  },
  { 
    id: 'cancel', 
    label: 'Hủy buổi học', 
    icon: XCircle, 
    color: 'text-red-600 hover:bg-red-50',
    showWhen: (session) => session.status === 'scheduled',
    dividerBefore: true
  },
  { 
    id: 'view', 
    label: 'Xem chi tiết', 
    icon: Eye, 
    color: 'text-slate-600 hover:bg-slate-50',
    showWhen: () => true
  },
];

export function SessionActionMenu({ 
  session, 
  onAction 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleAction = (actionId) => {
    setIsOpen(false);
    onAction?.(actionId, session);
  };

  const visibleItems = MENU_ITEMS.filter(item => item.showWhen(session));

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-lg transition-all
          ${isOpen 
            ? 'bg-slate-200 text-slate-700' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }
        `}
        title="Thao tác"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="
            absolute right-0 top-full mt-1 z-50
            w-52 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50
            py-1 overflow-hidden
          "
        >
          {visibleItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {item.dividerBefore && idx > 0 && (
                  <div className="my-1 border-t border-slate-100" />
                )}
                <button
                  onClick={() => handleAction(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                    transition-colors ${item.color}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SessionActionMenu;
