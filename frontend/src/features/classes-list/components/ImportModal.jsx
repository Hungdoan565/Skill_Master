/**
 * ImportModal Component
 * Modal for importing classes from Excel/CSV file
 */

import { useState, useRef } from 'react';
import {
    X,
    Upload,
    Download,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    Loader2,
    FileText,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Template columns for import
const IMPORT_COLUMNS = [
    { key: 'code', label: 'Mã lớp', required: true, example: 'IELTS-001' },
    { key: 'name', label: 'Tên lớp', required: true, example: 'IELTS Foundation - Sáng T2-T4-T6' },
    { key: 'course_code', label: 'Mã khóa học', required: true, example: 'IELTS-FND' },
    { key: 'teacher_email', label: 'Email giáo viên', required: false, example: 'teacher@example.com' },
    { key: 'center_code', label: 'Mã trung tâm', required: false, example: 'HN-001' },
    { key: 'room_name', label: 'Tên phòng', required: false, example: 'Phòng 101' },
    { key: 'start_date', label: 'Ngày bắt đầu', required: true, example: '2025-01-15' },
    { key: 'end_date', label: 'Ngày kết thúc', required: false, example: '2025-04-15' },
    { key: 'max_students', label: 'Sức chứa tối đa', required: false, example: '20' },
    { key: 'status', label: 'Trạng thái', required: false, example: 'upcoming' }
];

export function ImportModal({
    isOpen,
    onClose,
    onImport,
    loading = false
}) {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [step, setStep] = useState('upload'); // upload, preview, result
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setValidationErrors([]);

        try {
            // Try to parse the file
            const data = await parseFile(selectedFile);

            // Validate data
            const errors = validateData(data);
            setValidationErrors(errors);
            setPreviewData(data);
            setStep('preview');
        } catch (error) {
            setValidationErrors([{ row: 0, field: 'file', message: 'Không thể đọc file: ' + error.message }]);
        }
    };

    const parseFile = async (file) => {
        const text = await file.text();

        if (file.name.endsWith('.csv')) {
            return parseCSV(text);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            return await parseExcel(file);
        } else if (file.name.endsWith('.json')) {
            return JSON.parse(text);
        }

        throw new Error('Định dạng file không được hỗ trợ');
    };

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        return lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row = { _rowNumber: index + 2 };

            headers.forEach((header, i) => {
                row[header] = values[i] || '';
            });

            return row;
        });
    };

    const parseExcel = async (file) => {
        try {
            const XLSX = await import('xlsx');
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

            return data.map((row, index) => ({
                ...row,
                _rowNumber: index + 2
            }));
        } catch (error) {
            throw new Error('Không thể đọc file Excel. Vui lòng cài đặt thư viện xlsx.');
        }
    };

    const validateData = (data) => {
        const errors = [];

        data.forEach((row, index) => {
            const rowNum = row._rowNumber || index + 2;

            // Check required fields
            IMPORT_COLUMNS.filter(c => c.required).forEach(col => {
                if (!row[col.key] && !row[col.label]) {
                    errors.push({
                        row: rowNum,
                        field: col.label,
                        message: `Thiếu trường bắt buộc: ${col.label}`
                    });
                }
            });

            // Validate date format
            const dateFields = ['start_date', 'end_date'];
            dateFields.forEach(field => {
                const value = row[field];
                if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    errors.push({
                        row: rowNum,
                        field,
                        message: `Định dạng ngày không hợp lệ (yêu cầu: YYYY-MM-DD)`
                    });
                }
            });

            // Validate max_students
            if (row.max_students && isNaN(parseInt(row.max_students))) {
                errors.push({
                    row: rowNum,
                    field: 'max_students',
                    message: 'Sức chứa phải là số'
                });
            }
        });

        return errors;
    };

    const downloadTemplate = () => {
        const headers = IMPORT_COLUMNS.map(c => c.key).join(',');
        const examples = IMPORT_COLUMNS.map(c => c.example).join(',');
        const csvContent = `${headers}\n${examples}`;

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'import_classes_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        if (validationErrors.filter(e => e.field !== 'warning').length > 0) {
            return;
        }

        try {
            const result = await onImport(previewData);
            setImportResult(result);
            setStep('result');
        } catch (error) {
            setImportResult({
                success: 0,
                failed: previewData.length,
                errors: [{ row: 0, field: 'import', message: error.message }]
            });
            setStep('result');
        }
    };

    const resetModal = () => {
        setFile(null);
        setPreviewData([]);
        setValidationErrors([]);
        setImportResult(null);
        setStep('upload');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Upload className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Import lớp học</h2>
                            <p className="text-sm text-slate-500">Tải lên file Excel/CSV để tạo nhiều lớp</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* Template Download */}
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-blue-900">Tải template mẫu</p>
                                        <p className="text-sm text-blue-700">
                                            Sử dụng template để đảm bảo đúng định dạng
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Tải template
                                </Button>
                            </div>

                            {/* File Upload */}
                            <div
                                className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-slate-50 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <p className="font-medium text-slate-700">
                                    Kéo thả file hoặc click để chọn
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Hỗ trợ: .xlsx, .xls, .csv, .json
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.json"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Column Requirements */}
                            <div>
                                <h3 className="font-medium mb-3">Các cột dữ liệu</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {IMPORT_COLUMNS.map(col => (
                                        <div key={col.key} className="flex items-center gap-2 text-sm">
                                            <span className={`w-2 h-2 rounded-full ${col.required ? 'bg-red-500' : 'bg-slate-300'}`} />
                                            <span className="text-slate-700">{col.label}</span>
                                            {col.required && <span className="text-xs text-red-500">*</span>}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">* Bắt buộc</p>
                            </div>
                        </div>
                    )}

                    {/* Step: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            {/* File Info */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <FileText className="w-5 h-5 text-slate-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{file?.name}</p>
                                    <p className="text-xs text-slate-500">{previewData.length} bản ghi</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={resetModal}>
                                    Chọn file khác
                                </Button>
                            </div>

                            {/* Validation Errors */}
                            {validationErrors.length > 0 && (
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{validationErrors.length} lỗi cần sửa</span>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {validationErrors.slice(0, 10).map((error, i) => (
                                            <p key={i} className="text-sm text-red-600">
                                                Dòng {error.row}: {error.message}
                                            </p>
                                        ))}
                                        {validationErrors.length > 10 && (
                                            <p className="text-sm text-red-600">
                                                ... và {validationErrors.length - 10} lỗi khác
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Preview Table */}
                            <div>
                                <h3 className="font-medium mb-2">Xem trước dữ liệu</h3>
                                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="p-2 text-left font-medium text-slate-600">#</th>
                                                {IMPORT_COLUMNS.slice(0, 6).map(col => (
                                                    <th key={col.key} className="p-2 text-left font-medium text-slate-600">
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewData.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="p-2 text-slate-500">{i + 1}</td>
                                                    {IMPORT_COLUMNS.slice(0, 6).map(col => (
                                                        <td key={col.key} className="p-2">
                                                            {row[col.key] || row[col.label] || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {previewData.length > 5 && (
                                        <p className="text-center text-sm text-slate-500 py-2 bg-slate-50">
                                            ... và {previewData.length - 5} bản ghi khác
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Result */}
                    {step === 'result' && importResult && (
                        <div className="text-center py-8">
                            {importResult.success > 0 ? (
                                <>
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-900">Import thành công!</h3>
                                    <p className="text-slate-600 mt-2">
                                        Đã tạo <strong>{importResult.success}</strong> lớp học
                                        {importResult.failed > 0 && (
                                            <>, <span className="text-red-600">{importResult.failed} thất bại</span></>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-900">Import thất bại</h3>
                                    <p className="text-slate-600 mt-2">
                                        Không thể tạo lớp học. Vui lòng kiểm tra lại dữ liệu.
                                    </p>
                                </>
                            )}

                            {importResult.errors?.length > 0 && (
                                <div className="mt-4 p-4 bg-red-50 rounded-lg text-left max-h-48 overflow-y-auto">
                                    {importResult.errors.map((error, i) => (
                                        <p key={i} className="text-sm text-red-600">
                                            {error.row ? `Dòng ${error.row}: ` : ''}{error.message}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
                    <Button variant="outline" onClick={handleClose}>
                        {step === 'result' ? 'Đóng' : 'Hủy'}
                    </Button>

                    {step === 'preview' && (
                        <Button
                            onClick={handleImport}
                            disabled={loading || validationErrors.filter(e => IMPORT_COLUMNS.find(c => c.key === e.field)?.required).length > 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang import...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import {previewData.length} lớp
                                </>
                            )}
                        </Button>
                    )}

                    {step === 'result' && importResult?.success > 0 && (
                        <Button onClick={handleClose}>
                            Hoàn tất
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ImportModal;
