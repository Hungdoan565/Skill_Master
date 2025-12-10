/**
 * ClassNotificationModal Component
 * Send notifications to class students via email/SMS
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  X,
  Bell,
  Mail,
  MessageSquare,
  Users,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Clock,
  FileText,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Notification templates
const NOTIFICATION_TEMPLATES = [
  {
    id: 'schedule_change',
    name: 'Thông báo đổi lịch',
    subject: 'Thông báo đổi lịch học - {className}',
    content: `Kính gửi Quý Phụ huynh và học viên,

Trung tâm xin thông báo lịch học lớp {className} có sự thay đổi như sau:

📅 Lịch cũ: {oldSchedule}
📅 Lịch mới: {newSchedule}

Lý do: {reason}

Mọi thắc mắc xin vui lòng liên hệ hotline hoặc nhắn tin trực tiếp.

Trân trọng,
{centerName}`
  },
  {
    id: 'class_reminder',
    name: 'Nhắc nhở buổi học',
    subject: 'Nhắc nhở buổi học ngày mai - {className}',
    content: `Xin chào {studentName},

📚 Nhắc bạn về buổi học ngày mai:
- Lớp: {className}
- Thời gian: {sessionTime}
- Giáo viên: {teacherName}

Hãy chuẩn bị bài và đến đúng giờ nhé!

Trân trọng,
{centerName}`
  },
  {
    id: 'payment_reminder',
    name: 'Nhắc nhở học phí',
    subject: 'Nhắc nhở học phí - {className}',
    content: `Kính gửi Quý Phụ huynh/Học viên,

Trung tâm xin thông báo về tình hình học phí lớp {className}:

💰 Số tiền còn lại: {remainingAmount}
📅 Hạn thanh toán: {dueDate}

Xin vui lòng thanh toán trước hạn để đảm bảo quyền lợi học tập.

Thông tin chuyển khoản:
- Ngân hàng: {bankName}
- Số tài khoản: {bankAccount}
- Nội dung: {transferContent}

Trân trọng,
{centerName}`
  },
  {
    id: 'general_announcement',
    name: 'Thông báo chung',
    subject: 'Thông báo từ {centerName}',
    content: `Kính gửi các học viên lớp {className},

{content}

Trân trọng,
{centerName}`
  }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ClassNotificationModal({
  show,
  onClose,
  classId,
  students = [],
  onSuccess
}) {
  const { session } = useAuth();
  
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });
  
  const isOpen = show;
  const classData = null; // Will fetch if needed
  // State
  const [step, setStep] = useState('compose'); // compose, preview, result
  const [notificationType, setNotificationType] = useState('email'); // email, sms, both
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // Select all students by default
  useState(() => {
    if (students.length > 0) {
      setSelectedStudentIds(students.map(s => s.student_id || s.id));
    }
  }, [students]);

  // Template selection handler
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      // Replace placeholders with actual data
      let processedSubject = template.subject;
      let processedContent = template.content;

      const replacements = {
        '{className}': classData?.name || 'Lớp học',
        '{centerName}': classData?.center_name || 'Trung tâm',
        '{teacherName}': classData?.teacher_name || 'Giáo viên',
        '{studentName}': '[Tên học viên]',
        '{oldSchedule}': '[Lịch cũ]',
        '{newSchedule}': '[Lịch mới]',
        '{reason}': '[Lý do]',
        '{sessionTime}': '[Thời gian]',
        '{remainingAmount}': '[Số tiền]',
        '{dueDate}': '[Ngày hết hạn]',
        '{bankName}': '[Tên ngân hàng]',
        '{bankAccount}': '[Số tài khoản]',
        '{transferContent}': '[Nội dung CK]',
        '{content}': '[Nội dung thông báo]'
      };

      Object.entries(replacements).forEach(([key, value]) => {
        processedSubject = processedSubject.replace(new RegExp(key, 'g'), value);
        processedContent = processedContent.replace(new RegExp(key, 'g'), value);
      });

      setSubject(processedSubject);
      setContent(processedContent);
    }
  };

  // Selection handlers
  const toggleSelectStudent = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    const allIds = students.map(s => s.student_id || s.id);
    if (allIds.every(id => selectedStudentIds.includes(id))) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(allIds);
    }
  };

  // Get selected students
  const selectedStudents = useMemo(() => {
    return students.filter(s => selectedStudentIds.includes(s.student_id || s.id));
  }, [students, selectedStudentIds]);

  // Send notification
  const handleSend = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Vui lòng chọn ít nhất một học viên');
      return;
    }

    if (!subject.trim() || !content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/notifications/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: notificationType,
          recipients: selectedStudentIds,
          subject,
          content,
          classId: classData?.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          sent: data.sent || selectedStudentIds.length,
          failed: data.failed || 0,
          message: data.message || 'Đã gửi thông báo thành công'
        });
      } else {
        setResult({
          success: false,
          sent: 0,
          failed: selectedStudentIds.length,
          message: data.message || 'Có lỗi xảy ra khi gửi thông báo'
        });
      }

      setStep('result');
    } catch (error) {
      setResult({
        success: false,
        sent: 0,
        failed: selectedStudentIds.length,
        message: error.message || 'Không thể kết nối đến server'
      });
      setStep('result');
    } finally {
      setSending(false);
    }
  };

  // Reset & close
  const handleClose = () => {
    setStep('compose');
    setSelectedTemplate('');
    setSubject('');
    setContent('');
    setResult(null);
    onClose();
  };

  const allSelected = students.length > 0 && selectedStudentIds.length === students.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-orange-500 to-red-500 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Gửi thông báo
              </h2>
              <p className="text-sm text-white/80">
                Lớp: {classData?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Compose Step */}
          {step === 'compose' && (
            <div className="space-y-6">
              {/* Notification Type */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  Hình thức gửi
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNotificationType('email')}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all flex-1
                      ${notificationType === 'email'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <Mail className={`w-5 h-5 ${notificationType === 'email' ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span className={`font-medium ${notificationType === 'email' ? 'text-orange-900' : 'text-slate-700'}`}>
                      Email
                    </span>
                  </button>

                  <button
                    onClick={() => setNotificationType('sms')}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all flex-1
                      ${notificationType === 'sms'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <MessageSquare className={`w-5 h-5 ${notificationType === 'sms' ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span className={`font-medium ${notificationType === 'sms' ? 'text-orange-900' : 'text-slate-700'}`}>
                      SMS
                    </span>
                  </button>

                  <button
                    onClick={() => setNotificationType('both')}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all flex-1
                      ${notificationType === 'both'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <Bell className={`w-5 h-5 ${notificationType === 'both' ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span className={`font-medium ${notificationType === 'both' ? 'text-orange-900' : 'text-slate-700'}`}>
                      Cả hai
                    </span>
                  </button>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Mẫu thông báo
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                >
                  <option value="">-- Chọn mẫu hoặc tự soạn --</option>
                  {NOTIFICATION_TEMPLATES.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject (for email) */}
              {notificationType !== 'sms' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Nhập tiêu đề email..."
                    className="w-full"
                  />
                </div>
              )}

              {/* Content */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                  rows={8}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {content.length} ký tự {notificationType === 'sms' && '(SMS tối đa 160 ký tự/tin)'}
                </p>
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">
                    <Users className="w-4 h-4 inline mr-1" />
                    Người nhận ({selectedStudentIds.length}/{students.length})
                  </label>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-orange-600 hover:text-orange-800"
                  >
                    {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                  {students.map(student => (
                    <div
                      key={student.student_id || student.id}
                      onClick={() => toggleSelectStudent(student.student_id || student.id)}
                      className={`
                        flex items-center gap-3 p-2 border-b border-slate-100 last:border-b-0 cursor-pointer
                        ${selectedStudentIds.includes(student.student_id || student.id) 
                          ? 'bg-orange-50' 
                          : 'hover:bg-slate-50'
                        }
                      `}
                    >
                      {selectedStudentIds.includes(student.student_id || student.id) ? (
                        <CheckSquare className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-sm text-slate-700">{student.full_name}</span>
                      <span className="text-xs text-slate-400">{student.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">Xem trước thông báo</h4>
                
                {notificationType !== 'sms' && (
                  <div className="mb-3">
                    <span className="text-xs text-slate-500">Tiêu đề:</span>
                    <p className="font-medium text-slate-900">{subject}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-xs text-slate-500">Nội dung:</span>
                  <div className="mt-1 p-3 bg-white rounded-lg border border-slate-200 whitespace-pre-wrap text-sm text-slate-700">
                    {content}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Xác nhận gửi</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Bạn sẽ gửi {notificationType === 'both' ? 'email và SMS' : notificationType} 
                      đến {selectedStudentIds.length} học viên
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && result && (
            <div className="text-center py-8">
              {result.success ? (
                <>
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Gửi thông báo thành công!
                  </h3>
                  <p className="text-slate-600">
                    Đã gửi đến {result.sent} học viên
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Gửi thất bại
                  </h3>
                  <p className="text-red-600">{result.message}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          {step === 'compose' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!content.trim() || selectedStudentIds.length === 0}
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem trước
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('compose')}>
                Quay lại
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi thông báo
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button onClick={handleClose}>
              Đóng
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassNotificationModal;
