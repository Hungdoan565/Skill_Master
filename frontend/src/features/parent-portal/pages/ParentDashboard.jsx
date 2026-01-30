import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useParentDashboard, useParentChildren } from '../hooks';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl', colorStyles[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ParentDashboard() {
  const { profile } = useAuth();
  const { data: dashboardData, loading: dashboardLoading, refresh: refreshDashboard } = useParentDashboard();
  const { children, loading: childrenLoading, refresh: refreshChildren } = useParentChildren();

  const loading = dashboardLoading || childrenLoading;

  const refresh = () => {
    refreshDashboard();
    refreshChildren();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const parentName = profile?.full_name || 'Phụ huynh';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xin chào, {parentName}!</h1>
          <p className="text-muted-foreground">Theo dõi quá trình học tập của các con</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Số lượng con"
          value={children.length}
          color="orange"
        />
        <StatCard
          icon={CreditCard}
          label="Tổng công nợ"
          value={formatCurrency(stats.totalUnpaid || 0)}
          color={(stats.totalUnpaid || 0) > 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={AlertTriangle}
          label="Hóa đơn cần thanh toán"
          value={stats.unpaidInvoicesCount || 0}
          color={(stats.unpaidInvoicesCount || 0) > 0 ? 'red' : 'default'}
        />
      </div>

      {/* Children List */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-600" />
          Danh sách học viên
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.length > 0 ? (
            children.map((child) => (
              <Card key={child.id} className="overflow-hidden hover:border-orange-200 hover:shadow-lg transition-all">
                <CardHeader className="bg-orange-50/50 dark:bg-orange-950/20 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 font-bold text-lg">
                        {child.full_name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{child.full_name}</CardTitle>
                        <CardDescription>{child.student_code || 'Chưa có mã'}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lớp đang học:</span>
                    <span className="font-medium">{child.active_classes_count || 0} lớp</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trung tâm:</span>
                    <span className="font-medium">{child.center_name || 'N/A'}</span>
                  </div>
                  {child.unpaid_amount > 0 && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 rounded text-xs font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Còn nợ: {formatCurrency(child.unpaid_amount)}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/20 pt-4">
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    <Link to={`/parent/child/${child.id}`}>
                      Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground">Chưa có thông tin học viên</h3>
              <p className="text-sm text-muted-foreground">Vui lòng liên hệ trung tâm để được hỗ trợ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;
