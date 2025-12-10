/**
 * ClassTemplateModal Component
 * Create and manage class templates for quick class creation
 */

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  FileText,
  Save,
  Plus,
  Trash2,
  Copy,
  Clock,
  Users,
  Calendar,
  GraduationCap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Local storage key for templates
const TEMPLATES_STORAGE_KEY = 'skill_master_class_templates';

// Days of week
const DAYS_OF_WEEK = [
  { value: 1, label: 'T2', full: 'Thứ 2' },
  { value: 2, label: 'T3', full: 'Thứ 3' },
  { value: 3, label: 'T4', full: 'Thứ 4' },
  { value: 4, label: 'T5', full: 'Thứ 5' },
  { value: 5, label: 'T6', full: 'Thứ 6' },
  { value: 6, label: 'T7', full: 'Thứ 7' },
  { value: 0, label: 'CN', full: 'Chủ nhật' }
];

export function ClassTemplateModal({
  isOpen,
  onClose,
  onApplyTemplate,
  courses = [],
  centers = []
}) {
  // State
  const [templates, setTemplates] = useState([]);
  const [view, setView] = useState('list'); // list, create, edit
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    centerId: '',
    maxStudents: 20,
    schedule: [],
    startTime: '08:00',
    endTime: '10:00',
    sessionCount: 24
  });
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);

  // Load templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates) => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      courseId: '',
      centerId: '',
      maxStudents: 20,
      schedule: [],
      startTime: '08:00',
      endTime: '10:00',
      sessionCount: 24
    });
    setSelectedDays([]);
    setEditingTemplate(null);
  }, []);

  // Handle create new template
  const handleCreateNew = () => {
    resetForm();
    setView('create');
  };

  // Handle edit template
  const handleEdit = (template) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      courseId: template.courseId || '',
      centerId: template.centerId || '',
      maxStudents: template.maxStudents || 20,
      schedule: template.schedule || [],
      startTime: template.startTime || '08:00',
      endTime: template.endTime || '10:00',
      sessionCount: template.sessionCount || 24
    });
    setSelectedDays(template.schedule?.map(s => s.day) || []);
    setEditingTemplate(template);
    setView('edit');
  };

  // Handle delete template
  const handleDelete = (templateId) => {
    const newTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(newTemplates);
  };

  // Toggle day selection
  const toggleDay = (dayValue) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      }
      return [...prev, dayValue].sort((a, b) => a - b);
    });
  };

  // Handle save template
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên template');
      return;
    }

    setSaving(true);

    // Build schedule from selected days
    const schedule = selectedDays.map(day => ({
      day,
      start_time: formData.startTime,
      end_time: formData.endTime
    }));

    const templateData = {
      id: editingTemplate?.id || `template_${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      courseId: formData.courseId,
      centerId: formData.centerId,
      maxStudents: parseInt(formData.maxStudents) || 20,
      schedule,
      startTime: formData.startTime,
      endTime: formData.endTime,
      sessionCount: parseInt(formData.sessionCount) || 24,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newTemplates;
    if (editingTemplate) {
      newTemplates = templates.map(t => t.id === editingTemplate.id ? templateData : t);
    } else {
      newTemplates = [...templates, templateData];
    }

    saveTemplates(newTemplates);
    setSaving(false);
    setView('list');
    resetForm();
  };

  // Handle apply template
  const handleApply = (template) => {
    onApplyTemplate?.(template);
    onClose();
  };

  // Handle close
  const handleClose = () => {
    setView('list');
    resetForm();
    onClose();
  };

  // Get course/center names
  const getCourseName = (courseId) => {
    return courses.find(c => c.id === courseId)?.name || 'Không xác định';
  };

  const getCenterName = (centerId) => {
    return centers.find(c => c.id === centerId)?.name || 'Không xác định';
  };

  const formatSchedule = (schedule) => {
    if (!schedule?.length) return 'Chưa thiết lập';
    const days = schedule.map(s => DAYS_OF_WEEK.find(d => d.value === s.day)?.label).filter(Boolean);
    const time = schedule[0]?.start_time && schedule[0]?.end_time 
      ? ` (${schedule[0].start_time} - ${schedule[0].end_time})`
      : '';
    return days.join(', ') + time;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-violet-500 to-purple-500 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {view === 'list' ? 'Templates Lớp học' : view === 'create' ? 'Tạo Template mới' : 'Chỉnh sửa Template'}
              </h2>
              <p className="text-sm text-white/80">
                {view === 'list' ? 'Quản lý các mẫu cấu hình lớp học' : 'Thiết lập cấu hình mẫu'}
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
          {/* List View */}
          {view === 'list' && (
            <div className="space-y-4">
              {/* Create New Button */}
              <Button
                onClick={handleCreateNew}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo Template mới
              </Button>

              {/* Templates List */}
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Chưa có template nào</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Tạo template để nhanh chóng mở lớp với cấu hình sẵn
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      courseName={getCourseName(template.courseId)}
                      centerName={getCenterName(template.centerId)}
                      scheduleText={formatSchedule(template.schedule)}
                      onApply={() => handleApply(template)}
                      onEdit={() => handleEdit(template)}
                      onDelete={() => handleDelete(template.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create/Edit View */}
          {(view === 'create' || view === 'edit') && (
            <div className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Tên Template <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: IELTS Sáng T2-T4-T6"
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về template..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                />
              </div>

              {/* Course & Center */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Khóa học mặc định
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  >
                    <option value="">-- Chọn khóa học --</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Trung tâm mặc định
                  </label>
                  <select
                    value={formData.centerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, centerId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  >
                    <option value="">-- Chọn trung tâm --</option>
                    {centers.map(center => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Max Students & Session Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    <Users className="w-4 h-4 inline mr-1" />
                    Sức chứa tối đa
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.maxStudents}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Số buổi học
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.sessionCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, sessionCount: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Lịch học mặc định
                </label>
                
                {/* Days Selection */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-all
                        ${selectedDays.includes(day.value)
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }
                      `}
                      title={day.full}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Giờ bắt đầu</label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Giờ kết thúc</label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          {view === 'list' ? (
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingTemplate ? 'Cập nhật' : 'Lưu Template'}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({ 
  template, 
  courseName, 
  centerName, 
  scheduleText, 
  onApply, 
  onEdit, 
  onDelete 
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{template.name}</h4>
          {template.description && (
            <p className="text-sm text-slate-500 mt-0.5">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-600">
        {template.courseId && (
          <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
            <GraduationCap className="w-3.5 h-3.5" />
            {courseName}
          </span>
        )}
        <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
          <Users className="w-3.5 h-3.5" />
          {template.maxStudents} học viên
        </span>
        <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
          <Calendar className="w-3.5 h-3.5" />
          {template.sessionCount} buổi
        </span>
      </div>

      <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
        <Clock className="w-3.5 h-3.5" />
        {scheduleText}
      </div>

      <Button
        onClick={onApply}
        className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
        size="sm"
      >
        <Copy className="w-4 h-4 mr-2" />
        Áp dụng Template này
      </Button>
    </div>
  );
}

export default ClassTemplateModal;
