/**
 * ActionMenu Component
 * Dropdown menu cho các action trên học viên
 */

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Edit, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ActionMenu({ student, onViewDetails, onEdit, onPromote }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg z-10">
          <button
            onClick={() => { onViewDetails(student); setIsOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </button>
          <button
            onClick={() => { onEdit(student); setIsOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </button>
          <hr className="my-1 border-slate-100" />
          <button
            onClick={() => { onPromote(student); setIsOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
          >
            <UserCog className="h-4 w-4" />
            Chuyển thành Nhân viên
          </button>
        </div>
      )}
    </div>
  );
}

export default ActionMenu;
