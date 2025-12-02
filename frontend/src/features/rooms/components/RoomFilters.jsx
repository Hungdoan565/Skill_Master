/**
 * RoomFilters Component
 * Thanh tìm kiếm và filter phòng
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function RoomFilters({ 
  searchTerm, 
  onSearchChange, 
  filterCenter, 
  onCenterChange, 
  centers = [] 
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm theo tên hoặc mã phòng..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <select
        value={filterCenter}
        onChange={(e) => onCenterChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
      >
        <option value="">Tất cả trung tâm</option>
        {centers.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}

export default RoomFilters;
