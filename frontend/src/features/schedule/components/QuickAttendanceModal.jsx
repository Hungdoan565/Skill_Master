/**
 * QuickAttendanceModal Component - Modal điểm danh nhanh từ trang Schedule
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Users,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Attendance status config
const ATTENDANCE_STATUS = [
  { value: 'present', label: 'Có mặt', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'absent', label: 'Vắng', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'late', label: 'Đi trễ', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'excused', label: 'Có phép', icon: AlertCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' }
];

export function QuickAttendanceModal({ 
  isOpen, 
  onClose, 
  session,
  onSuccess 
}) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch students and existing attendance
  useEffect(() => {
    if (!isOpen || !session?.class_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) throw new Error('Chưa đăng nhập');
        
        const headers = { Authorization: `Bearer ${authSession.access_token}` };

        // Fetch enrolled students
        const studentsRes = await fetch(
          `${API_URL}/api/admin/classes/${session.class_id}/students`, 
          { headers }
        );
        if (!studentsRes.ok) throw new Error('Không thể tải danh sách học viên');
        const studentsData = await studentsRes.json();
        setStudents(studentsData.data || []);

        // Fetch existing attendance for this session
        const attendanceRes = await fetch(
          `${API_URL}/api/admin/sessions/${session.id}/attendance`,
          { headers }
        );
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          setExistingAttendance(attendanceData.data || []);
          
          // Pre-fill attendance state
          const attendanceMap = {};
          (attendanceData.data || []).forEach(a => {
            attendanceMap[a.student_id] = a.status;
          });
          setAttendance(attendanceMap);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, session]);

  // Toggle attendance status
  const toggleStatus = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? 'present' : status
    }));
  };

  // Mark all as present
  const markAllPresent = () => {
    const allPresent = {};
    students.forEach(s => {
      allPresent[s.student_id || s.id] = 'present';
    });
    setAttendance(allPresent);
  };

  // Save attendance
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('Chưa đăng nhập');

      const headers = { 
        Authorization: `Bearer ${authSession.access_token}`,
        'Content-Type': 'application/json'
      };

      // Build attendance array
      const attendances = students.map(s => ({
        student_id: s.student_id || s.id,
        status: attendance[s.student_id || s.id] || 'absent'
      }));

      const res = await fetch(`${API_URL}/api/admin/sessions/${session.id}/attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ attendances })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Không thể lưu điểm danh');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Stats
  const stats = {
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
    late: Object.values(attendance).filter(v => v === 'late').length,
    excused: Object.values(attendance).filter(v => v === 'excused').length,
    unmarked: students.length - Object.keys(attendance).length
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-red-500 to-orange-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Điểm danh buổi #{session?.session_number}</h2>
              <p className="text-indigo-200 text-sm mt-1">
                {session?.classes?.name} • {session?.session_date}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-3 bg-slate-50 border-b flex items-center gap-4 text-sm">
          <span className="text-slate-500">
            <Users className="w-4 h-4 inline mr-1" />
            {students.length} học viên
          </span>
          <span className="text-green-600">✓ {stats.present}</span>
          <span className="text-red-600">✗ {stats.absent}</span>
          <span className="text-amber-600">⏰ {stats.late}</span>
          
          <div className="ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={markAllPresent}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Có mặt tất cả
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700 mb-1">Không thể tải danh sách</p>
              <p className="text-sm text-slate-500">{error}</p>
              <p className="text-xs text-slate-400 mt-2">Vui lòng thử lại sau hoặc kiểm tra kết nối mạng</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-500" />
              </div>
              <p className="font-medium text-slate-700 mb-2">Lớp chưa có học viên nào</p>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Vui lòng ghi danh học viên vào lớp trước khi điểm danh.
              </p>
              <a 
                href={`/admin/classes/${session?.class_id}`}
                className="inline-flex items-center gap-2 mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Đi tới trang lớp học →
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const studentId = student.student_id || student.id;
                const studentData = student.users || student;
                const currentStatus = attendance[studentId];

                return (
                  <div 
                    key={studentId}
                    className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {(studentData.full_name || studentData.email || '?')[0].toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">
                        {studentData.full_name || studentData.email}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {studentData.email}
                      </p>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center gap-1">
                      {ATTENDANCE_STATUS.map(status => {
                        const Icon = status.icon;
                        const isActive = currentStatus === status.value;
                        
                        return (
                          <button
                            key={status.value}
                            onClick={() => toggleStatus(studentId, status.value)}
                            className={`
                              p-2 rounded-lg border transition-all
                              ${isActive 
                                ? status.color + ' border-current' 
                                : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }
                            `}
                            title={status.label}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {Object.keys(attendance).length}/{students.length} đã điểm danh
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || students.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu điểm danh
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickAttendanceModal;
