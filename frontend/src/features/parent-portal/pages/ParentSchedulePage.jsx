import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, BookOpen, Calendar, Clock, MapPin, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { useParentChildren } from '../hooks/useParentChildren';
import { useParentChildSchedule } from '../hooks/useParentChildSchedule';
import { buildParentScheduleGroups, formatTime } from './parent-portal-helpers';

// Child selector component (reusable pills)
const ChildSelector = ({ children, selectedId, onSelect }) => (
  <div className="flex gap-2 flex-wrap mb-6">
    {children.map(child => (
      <button
        key={child.id}
        onClick={() => onSelect(child.id)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedId === child.id
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20'
          }`}
      >
        {child.full_name}
      </button>
    ))}
  </div>
);

function ScheduleList({ studentId }) {
  const { schedule, loading, error } = useParentChildSchedule(studentId);
  const groupedSchedule = buildParentScheduleGroups(schedule);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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
      {groupedSchedule.map((group) => (
        <Card key={group.classId} className="hover:border-orange-500/30 transition-colors">
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-orange-500/10 p-3 rounded-lg shrink-0">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{group.className}</h4>
                    <p className="text-muted-foreground">{group.courseTitle}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                      {group.slotCountLabel}
                    </Badge>
                    <Badge className="w-fit shrink-0 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 border-green-200">
                      Đang học
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {(expandedGroups[group.classId] ? group.slots : group.slots.slice(0, 3)).map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span>{slot.dayLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{slot.roomName}</span>
                      </div>
                    </div>
                  ))}

                  {group.slots.length > 3 && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroup(group.classId)}
                        className="h-9 rounded-lg px-3 text-sm text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                      >
                        {expandedGroups[group.classId] ? (
                          <ChevronUp className="mr-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="mr-2 h-4 w-4" />
                        )}
                        {expandedGroups[group.classId]
                          ? 'Thu gọn lịch của lớp'
                          : `Xem thêm ${group.slots.length - 3} buổi còn lại`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ParentSchedulePage() {
  const { children, loading: childrenLoading, error: childrenError } = useParentChildren();
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

  if (childrenError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Không thể tải danh sách học viên liên kết</p>
          <p className="mt-1">{childrenError}</p>
        </div>
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
          <p className="text-muted-foreground">Theo dõi lịch học của học viên được liên kết</p>
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
