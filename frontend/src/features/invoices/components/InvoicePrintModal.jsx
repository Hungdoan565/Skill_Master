/**
 * InvoicePrintModal Component
 * 
 * Modal hiển thị hóa đơn với options:
 * - In trực tiếp (Print)
 * - Tải PDF
 * 
 * @param {boolean} isOpen
 * @param {Object} invoice
 * @param {Array} payments - Danh sách payments của hóa đơn
 * @param {function} onClose
 */

import { useState, useRef, useCallback } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { Button } from '@/components/ui/button';
import { InvoicePrintTemplate } from './InvoicePrintTemplate';

export function InvoicePrintModal({ isOpen, invoice, payments = [], onClose }) {
    const printRef = useRef(null);
    const [printing, setPrinting] = useState(false);
    const [downloading, setDownloading] = useState(false);

    /**
     * In hóa đơn
     */
    const handlePrint = useCallback(() => {
        if (!printRef.current) return;

        setPrinting(true);

        // Clone content for printing
        const printContent = printRef.current.innerHTML;
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            gooeyToast.error('Popup bị chặn. Vui lòng cho phép popup để in.', {
                description: 'Tắt chặn popup trong cài đặt trình duyệt',
                action: {
                    label: 'Thử lại',
                    onClick: () => handlePrint()
                }
            });
            setPrinting(false);
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hóa đơn - ${invoice?.invoice_code || 'Invoice'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              body { margin: 0; }
              @page { size: A4 portrait; margin: 15mm; }
            }
            /* Tailwind-like utility classes for print */
            .flex { display: flex; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .gap-1 { gap: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .font-mono { font-family: monospace; }
            .italic { font-style: italic; }
            .text-white { color: white; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .text-blue-600 { color: #2563eb; }
            .text-blue-700 { color: #1d4ed8; }
            .text-emerald-600 { color: #059669; }
            .text-red-500 { color: #ef4444; }
            .text-red-600 { color: #dc2626; }
            .bg-white { background-color: white; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-blue-600 { background-color: #2563eb; }
            .border { border: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-b-2 { border-bottom: 2px solid; }
            .border-blue-100 { border-color: #dbeafe; }
            .border-blue-200 { border-color: #bfdbfe; }
            .border-blue-600 { border-color: #2563eb; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-dashed { border-style: dashed; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .p-4 { padding: 1rem; }
            .p-5 { padding: 1.25rem; }
            .p-8 { padding: 2rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
            .pt-4 { padding-top: 1rem; }
            .pb-4 { padding-bottom: 1rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .w-3 { width: 0.75rem; }
            .w-8 { width: 2rem; }
            .w-14 { width: 3.5rem; }
            .w-24 { width: 6rem; }
            .h-3 { height: 0.75rem; }
            .h-8 { height: 2rem; }
            .h-14 { height: 3.5rem; }
            .h-24 { height: 6rem; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

        printWindow.document.close();

        // Wait for fonts to load
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            setPrinting(false);
        }, 500);
    }, [invoice?.invoice_code]);

    /**
     * Tải PDF (sử dụng print-to-PDF của browser)
     */
    const handleDownload = useCallback(() => {
        setDownloading(true);
        // For now, we use print dialog with save as PDF option
        handlePrint();
        setDownloading(false);
    }, [handlePrint]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <Printer className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">In hóa đơn</h3>
                                <p className="text-xs text-blue-100">
                                    {invoice?.invoice_code} - {invoice?.student?.full_name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
                    <div ref={printRef} className="shadow-lg rounded-lg overflow-hidden bg-white mx-auto" style={{ width: 'fit-content' }}>
                        <InvoicePrintTemplate
                            invoice={invoice}
                            payments={payments}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="gap-2"
                    >
                        {downloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Tải PDF
                    </Button>
                    <Button
                        size="sm"
                        onClick={handlePrint}
                        disabled={printing}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {printing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Printer className="w-4 h-4" />
                        )}
                        In hóa đơn
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default InvoicePrintModal;
