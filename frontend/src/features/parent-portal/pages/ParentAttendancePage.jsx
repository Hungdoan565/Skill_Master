import { useState, useEffect } from 'react';
import { useParentChildren, useParentChildAttendance } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, CheckCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatDate = (dateString) => {
  if (!dateString) return '--/--/----';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const formatTime = (time) => {
  if (!time) return '--:--';
  return time.slice(0, 5);
};

const ChildSelector = ({ children, selectedId, onSelect }) => (
  <div className="flex gap-2 flex-wrap mb-6">
    {children.map(child => (
      <button
        key={child.id}
        onClick={() => onSelect(child.id)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedId === child.id
            ? 'bg-orange-500 text-white'
            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
        }`}
      >
        {child.full_name}
      </button>
    ))}
  </div>
);

export default function ParentAttendancePage() {
  const { children, loading: childrenLoading, error: childrenError } = useParentChildren();
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const { attendance, loading: attendanceLoading, error: attendanceError } = useParentChildAttendance(selectedChildId);

  if (childrenLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (childrenError) {
    return <div className="p-6 text-center text-red-500">{childrenError}</div>;
  }

  const stats = {
    present: attendance?.filter(a => a.status === 'present').length || 0,
    absent: attendance?.filter(a => a.status === 'absent').length || 0,
    late: attendance?.filter(a => a.status === 'late').length || 0,
    excused: attendance?.filter(a => a.status === 'excused').length || 0,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Điểm danh</h1>
      </div>

      <ChildSelector 
        children={children} 
        selectedId={selectedChildId} 
        onSelect={setSelectedChildId} 
      />

      {attendanceLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : attendanceError ? (
        <div className="text-center text-red-500 py-8">{attendanceError}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground mb-1">Có mặt</span>
                <span className="text-2xl font-bold text-green-600">{stats.present}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground mb-1">Vắng</span>
                <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground mb-1">Đi muộn</span>
                <span className="text-2xl font-bold text-yellow-600">{stats.late}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground mb-1">Nghỉ phép</span>
                <span className="text-2xl font-bold text-blue-600">{stats.excused}</span>
              </CardContent>
            </Card>
          </div>

          {attendance?.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Chi tiết điểm danh</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {attendance.map((att, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-full flex-shrink-0 mt-1 sm:mt-0",
                          att.status === 'present' ? 'bg-green-100 text-green-600' :
                          att.status === 'absent' ? 'bg-red-100 text-red-600' :
                          att.status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        )}>
                          {att.status === 'present' ? <CheckCircle className="h-5 w-5" /> : 
                           att.status === 'absent' ? <AlertTriangle className="h-5 w-5" /> : 
                           att.status === 'late' ? <Clock className="h-5 w-5" /> :
                           <Info className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-base">{att.className}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              {formatDate(att.sessionDate)}
                            </span>
                            {att.startTime && att.endTime && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatTime(att.startTime)} - {formatTime(att.endTime)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="sm:text-right pl-14 sm:pl-0">
                        <Badge variant={
                          att.status === 'present' ? 'success' :
                          att.status === 'absent' ? 'destructive' :
                          att.status === 'late' ? 'warning' : 'secondary'
                        }>
                          {att.status === 'present' ? 'Có mặt' : 
                           att.status === 'absent' ? 'Vắng' : 
                           att.status === 'late' ? 'Đi muộn' : 'Nghỉ phép'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground">Chưa có dữ liệu điểm danh</h3>
            </div>
          )}
        </>
      )}
    </div>
  );
}
