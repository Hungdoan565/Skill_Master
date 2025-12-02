/**
 * RecentStudentsList Component
 * Danh sách sinh viên mới đăng ký
 */

import { Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StudentItem } from './StudentItem';

export function RecentStudentsList({ students = [], loading = false }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Sinh viên mới</h3>
            <p className="text-xs text-gray-500">Đăng ký gần đây</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/admin/students')}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Xem tất cả
          <ChevronRight size={16} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-1">
        {students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users size={40} className="mx-auto mb-2 opacity-50" />
            <p>Chưa có sinh viên mới</p>
          </div>
        ) : (
          students.map((student, index) => (
            <StudentItem key={student.id || index} student={student} />
          ))
        )}
      </div>
    </div>
  );
}

export default RecentStudentsList;
