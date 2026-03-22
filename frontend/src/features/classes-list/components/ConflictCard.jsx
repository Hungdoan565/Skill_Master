/**
 * ConflictCard Component - Smart Validation Card cho kiểm tra xung đột
 */

import { 
  Info, Loader2, CheckCircle2, XCircle, AlertCircle 
} from 'lucide-react';

export function ConflictCard({ status, messages }) {
  // CASE 1: IDLE - Chưa đủ thông tin
  if (status === 'idle') {
    return (
      <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-6 text-center shadow-sm">
        <div className="bg-blue-50 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
          <Info className="text-blue-600 dark:text-blue-400 w-6 h-6" />
        </div>
        <h4 className="text-slate-900 dark:text-slate-100 font-medium mb-1">Chưa đủ thông tin</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Vui lòng chọn đầy đủ <b>Giáo viên</b>, <b>Phòng học</b>, <b>Ngày khai giảng/kết thúc</b> và <b>Lịch học</b> để hệ thống kiểm tra xung đột.
        </p>
      </div>
    );
  }

  // CASE 2: CHECKING - Đang tải
  if (status === 'checking') {
    return (
      <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-8 text-center shadow-sm">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-300 font-medium">Đang kiểm tra lịch trùng...</p>
      </div>
    );
  }

  // CASE 3: OK - Hợp lệ
  if (status === 'ok') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-green-800 dark:text-green-300 font-bold text-lg">Lịch học Hợp lệ!</h4>
            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
              Không phát hiện xung đột. Bạn có thể tạo lớp học này ngay.
            </p>
            <div className="mt-3 text-sm text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-2 rounded">
              <ul className="list-disc pl-4 space-y-1">
                <li>Giáo viên: <b>Sẵn sàng</b></li>
                <li>Phòng học: <b>Sẵn sàng</b></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CASE 4: CONFLICT - Có xung đột
  if (status === 'conflict') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="w-full">
            <h4 className="text-red-800 dark:text-red-300 font-bold text-lg">Phát hiện xung đột!</h4>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1 mb-3">
              Lịch học này bị trùng với các lớp đã có. Vui lòng điều chỉnh lại.
            </p>
            
            {/* Danh sách lỗi chi tiết */}
            <div className="bg-white dark:bg-slate-800/60 border border-red-100 dark:border-red-800/40 rounded p-3 max-h-60 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mb-2 last:mb-0">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full shrink-0"></span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CASE 5: ERROR - Lỗi Server
  if (status === 'error') {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="text-orange-600 dark:text-orange-400 w-5 h-5" />
        <span className="text-orange-800 dark:text-orange-300 text-sm">
          Không thể kiểm tra xung đột. Vui lòng thử lại.
        </span>
      </div>
    );
  }

  return null;
}

export default ConflictCard;
