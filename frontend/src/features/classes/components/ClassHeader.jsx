/**
 * ClassHeader Component
 * Displays class information header with details and progress
 */

import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BookOpen,
  User,
  Users,
  Calendar,
  MapPin,
  Building2,
  Edit
} from 'lucide-react';
import { CLASS_STATUS_CONFIG, formatScheduleDisplay } from '../utils';

export function ClassHeader({ classData }) {
  const navigate = useNavigate();
  
  if (!classData) return null;
  
  const statusConfig = CLASS_STATUS_CONFIG[classData.status] || CLASS_STATUS_CONFIG.upcoming;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-slate-200 dark:border-zinc-800 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <button 
          onClick={() => navigate('/admin/classes')} 
          className="hover:text-indigo-600 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Quản lý lớp học
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{classData.code}</span>
      </div>

      {/* Title & Status */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{classData.name}</h1>
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
          </div>
          <p className="text-muted-foreground">Mã lớp: {classData.code}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/classes?edit=${classData.id}`)}>
            <Edit className="w-4 h-4 mr-2" /> Sửa thông tin
          </Button>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
        {/* Khóa học */}
        <InfoCard
          icon={BookOpen}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          iconColor="text-indigo-600"
          label="Khóa học"
          value={classData.courses?.title || '-'}
        />

        {/* Giáo viên */}
        <InfoCard
          icon={User}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          label="Giáo viên"
          value={classData.users?.full_name || 'Chưa phân'}
        />

        {/* Sĩ số */}
        <InfoCard
          icon={Users}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600"
          label="Sĩ số"
          value={`${classData.current_students || 0}/${classData.max_students || 20}`}
        />

        {/* Lịch học */}
        <InfoCard
          icon={Calendar}
          iconBg="bg-cyan-100 dark:bg-cyan-900/30"
          iconColor="text-cyan-600"
          label="Lịch học"
          value={formatScheduleDisplay(classData.schedule)}
        />

        {/* Phòng học */}
        <InfoCard
          icon={MapPin}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600"
          label="Phòng"
          value={classData.rooms?.name || 'Chưa xếp'}
        />

        {/* Trung tâm */}
        <InfoCard
          icon={Building2}
          iconBg="bg-rose-100 dark:bg-rose-900/30"
          iconColor="text-rose-600"
          label="Trung tâm"
          value={classData.centers?.name || '-'}
        />
      </div>

      {/* Progress bar - Tiến độ khóa học */}
      {classData.courses?.total_sessions && (
        <ProgressBar 
          current={0} 
          total={classData.courses.total_sessions} 
        />
      )}
    </div>
  );
}

// Info Card sub-component
function InfoCard({ icon: Icon, iconBg, iconColor, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div className={`p-2 ${iconBg} rounded-lg`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// Progress Bar sub-component
function ProgressBar({ current, total }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="mt-6 pt-4 border-t border-border">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">Tiến độ khóa học</span>
        <span className="font-medium text-foreground">{current}/{total} buổi</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 rounded-full transition-all" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
