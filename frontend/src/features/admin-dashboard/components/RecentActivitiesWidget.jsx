import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export function RecentActivitiesWidget({ activities }) {
  if (!activities || !Array.isArray(activities) || activities.length === 0) return null;

  const entityMap = {
    grade: 'Điểm',
    student: 'Học viên',
    payment: 'Thanh toán',
    invoice: 'Hóa đơn',
    class: 'Lớp học',
    teacher: 'Giáo viên',
    user: 'Người dùng',
    center: 'Trung tâm',
    course: 'Khóa học'
  };

  const actionMap = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    LOGIN: 'Đăng nhập',
    LOGOUT: 'Đăng xuất'
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE': 
        return <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-900 dark:text-green-400 bg-green-50 dark:bg-green-900/10 font-normal">{actionMap[action] || action}</Badge>;
      case 'UPDATE': 
        return <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-900 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 font-normal">{actionMap[action] || action}</Badge>;
      case 'DELETE': 
        return <Badge variant="outline" className="text-red-600 border-red-200 dark:border-red-900 dark:text-red-400 bg-red-50 dark:bg-red-900/10 font-normal">{actionMap[action] || action}</Badge>;
      default: 
        return <Badge variant="outline" className="text-gray-600 border-gray-200 dark:border-gray-800 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 font-normal">{actionMap[action] || action}</Badge>;
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  return (
    <Card className="bg-white border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="w-[120px]">Thời gian</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Trung tâm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity, index) => (
                <TableRow key={activity.id || index} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {formatRelativeTime(activity.created_at)}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {activity.actor_name || activity.user_email || 'System'}
                  </TableCell>
                  <TableCell>
                    {getActionBadge(activity.action)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entityMap[activity.entity_type?.toLowerCase()] || activity.entity_type}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {activity.center_name || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <Link 
          to="/admin/audit-trail" 
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center w-full justify-center transition-colors"
        >
          Xem tất cả hoạt động →
        </Link>
      </CardFooter>
    </Card>
  );
}
