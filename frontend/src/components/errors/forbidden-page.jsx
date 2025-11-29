import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 403 Forbidden Page - Hiển thị khi user không có quyền truy cập
 */
export function ForbiddenPage({ message, redirectPath = '/' }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        
        {/* Error Code */}
        <h1 className="text-6xl font-bold text-slate-900 mb-2">403</h1>
        
        {/* Error Message */}
        <h2 className="text-2xl font-semibold text-slate-800 mb-3">
          Truy cập bị từ chối
        </h2>
        
        <p className="text-slate-600 mb-8">
          {message || 'Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.'}
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
          
          <Button
            onClick={() => navigate(redirectPath)}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
