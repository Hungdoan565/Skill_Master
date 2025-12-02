/**
 * Toast Component
 * Displays notification messages
 */

import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export function Toast({ show, message, type = 'success', onClose }) {
  if (!show) return null;
  
  const isSuccess = type === 'success';
  
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
        isSuccess 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}
        <p className="text-sm font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="ml-2 p-0.5 hover:bg-white/50 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
