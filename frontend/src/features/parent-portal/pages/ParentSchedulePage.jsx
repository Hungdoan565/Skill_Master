import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, BookOpen, Calendar, Clock, MapPin, GraduationCap } from 'lucide-react';
import { useParentChildren } from '../hooks/useParentChildren';
import { useParentChildSchedule } from '../hooks/useParentChildSchedule';

// Child selector component (reusable pills)
const ChildSelector = ({ children, selectedId, onSelect }) => (
  <div className="flex gap-2 flex-wrap mb-6">
    {children.map(child => (
      <button
        key={child.id}
        onClick={() => onSelect(child.id)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedId === child.id
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20'
        }`}
      >
        {child.full_name}
      </button>
    ))}
  </div>
);

const formatTime = (time) => {
  if (!time) return '--:--';
  return time.slice(0, 5);
};

function ScheduleList({ studentId }) {
  const { schedule, loading, error } = useParentChildSchedule(studentId);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">
        <p>{error}</p>
      </div>
    );
  }

  if (!schedule || schedule.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
        <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">Chưa có lịch học</h3>
        <p className="text-sm">Học viên hiện chưa có lịch học nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedule.map((cls, idx) => (
        <Card key={idx} className="hover:border-orange-500/30 transition-colors">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-orange-500/10 p-3 rounded-lg shrink-0">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">{cls.className}</h4>
                <p className="text-muted-foreground">{cls.courseTitle}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                    <Calendar className="h-4 w-4" />
                    <span>{cls.dayOfWeek === 8 ? 'Chủ nhật' : `Thứ ${cls.dayOfWeek}`}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                    <MapPin className="h-4 w-4" />
                    <span>{cls.roomName || 'Chưa xếp phòng'}</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge className="w-fit shrink-0 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 border-green-200">
              Đang học
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ParentSchedulePage() {
  const { children, loading: childrenLoading } = useParentChildren();
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  if (childrenLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg">
          <CalendarDays className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Lịch học</h1>
          <p className="text-muted-foreground">Xem lịch học của các con</p>
        </div>
      </div>

      {children && children.length > 0 ? (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <ChildSelector 
            children={children} 
            selectedId={selectedChildId} 
            onSelect={setSelectedChildId} 
          />
          
          <div className="mt-6">
            {selectedChildId ? (
              <ScheduleList studentId={selectedChildId} />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Vui lòng chọn học viên để xem lịch học
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border shadow-sm">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">Chưa có dữ liệu học viên</h3>
          <p className="text-sm text-muted-foreground mt-1">Không tìm thấy thông tin học viên nào liên kết với tài khoản này.</p>
        </div>
      )}
    </div>
  );
}
