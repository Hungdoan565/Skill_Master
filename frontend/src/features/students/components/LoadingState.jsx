/**
 * LoadingState Component
 * Hiển thị khi đang tải dữ liệu
 */

export function LoadingState() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span>Đang tải dữ liệu...</span>
      </div>
    </div>
  );
}

export default LoadingState;
