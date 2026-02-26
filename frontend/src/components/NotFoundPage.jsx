import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="relative mb-8">
          <h1 className="text-8xl font-bold text-gray-200 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileQuestion size={80} className="text-gray-400 opacity-80" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Trang không tồn tại
        </h2>
        <p className="text-gray-500 mb-8">
          Xin lỗi, trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-3 transition-colors duration-200 shadow-sm"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
