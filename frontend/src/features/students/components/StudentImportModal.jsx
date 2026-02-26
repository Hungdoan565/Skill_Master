import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { API_URL } from '../utils/constants';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Loader2,
  Check,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{8,15}$/;

export function StudentImportModal({ isOpen, onClose, onImportSuccess }) {
  const { session } = useAuth();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [step, setStep] = useState(1);
  const [importResult, setImportResult] = useState(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setDragActive(false);
    setLoading(false);
    setError('');
    setPreviewData([]);
    setValidationErrors([]);
    setStep(1);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const isValidFile = (file) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    return validExtensions.includes(extension);
  };

  const normalizeDate = (value) => {
    if (!value && value !== 0) return '';

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return '';
      const month = String(parsed.m).padStart(2, '0');
      const day = String(parsed.d).padStart(2, '0');
      return `${parsed.y}-${month}-${day}`;
    }

    const str = String(value).trim();
    if (!str) return '';

    const normalized = str.replace(/\./g, '/').replace(/-/g, '/');
    const parts = normalized.split('/').map((p) => p.trim());

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const month = String(parts[1]).padStart(2, '0');
        const day = String(parts[2]).padStart(2, '0');
        return `${parts[0]}-${month}-${day}`;
      }
      if (parts[2].length === 4) {
        const day = String(parts[0]).padStart(2, '0');
        const month = String(parts[1]).padStart(2, '0');
        return `${parts[2]}-${month}-${day}`;
      }
    }

    const date = new Date(str);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  };

  const normalizeGender = (value) => {
    if (!value) return '';
    const genderMap = {
      nam: 'male',
      male: 'male',
      nu: 'female',
      'nữ': 'female',
      female: 'female',
      khac: 'other',
      khác: 'other',
      other: 'other',
    };
    return genderMap[String(value).trim().toLowerCase()] || '';
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file && isValidFile(file)) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Vui lòng chọn file CSV hoặc XLSX');
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      setSelectedFile(file);
      setError('');
    } else if (file) {
      setError('Vui lòng chọn file CSV hoặc XLSX');
    }
  }, []);

  const parseAndValidate = useCallback(async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file import');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        throw new Error('File không có dữ liệu');
      }

      const columnMap = {
        'họ tên': 'full_name',
        'ho ten': 'full_name',
        full_name: 'full_name',
        name: 'full_name',
        email: 'email',
        'số điện thoại': 'phone',
        'so dien thoai': 'phone',
        phone: 'phone',
        'ngày sinh': 'date_of_birth',
        'ngay sinh': 'date_of_birth',
        date_of_birth: 'date_of_birth',
        birthday: 'date_of_birth',
        'giới tính': 'gender',
        'gioi tinh': 'gender',
        gender: 'gender',
        'địa chỉ': 'address',
        'dia chi': 'address',
        address: 'address',
        'ghi chú': 'notes',
        'ghi chu': 'notes',
        notes: 'notes',
      };

      const errors = [];
      const normalized = jsonData.map((row, index) => {
        const rowIndex = index + 2;
        const normalizedRow = {
          rowIndex,
          full_name: '',
          email: '',
          phone: '',
          date_of_birth: '',
          gender: '',
          address: '',
          notes: '',
        };

        Object.keys(row).forEach((key) => {
          const normalizedKey = columnMap[key.toLowerCase().trim()];
          if (!normalizedKey) return;

          if (normalizedKey === 'date_of_birth') {
            normalizedRow.date_of_birth = normalizeDate(row[key]);
            return;
          }

          if (normalizedKey === 'gender') {
            normalizedRow.gender = normalizeGender(row[key]);
            return;
          }

          normalizedRow[normalizedKey] = String(row[key]).trim();
        });

        if (!normalizedRow.full_name) {
          errors.push({ row: rowIndex, field: 'full_name', message: 'Thiếu họ tên' });
        }

        if (normalizedRow.email && !EMAIL_REGEX.test(normalizedRow.email)) {
          errors.push({ row: rowIndex, field: 'email', message: 'Email không hợp lệ' });
        }

        if (normalizedRow.phone && !PHONE_REGEX.test(normalizedRow.phone)) {
          errors.push({ row: rowIndex, field: 'phone', message: 'Số điện thoại không hợp lệ' });
        }

        const originalDob = row['Ngày sinh'] || row['ngày sinh'] || row.date_of_birth || row.birthday;
        if (originalDob && !normalizedRow.date_of_birth) {
          errors.push({ row: rowIndex, field: 'date_of_birth', message: 'Ngày sinh không hợp lệ' });
        }

        const originalGender = row['Giới tính'] || row['giới tính'] || row.gender;
        if (originalGender && !normalizedRow.gender) {
          errors.push({ row: rowIndex, field: 'gender', message: 'Giới tính không hợp lệ (Nam/Nữ/Khác)' });
        }

        return normalizedRow;
      });

      setPreviewData(normalized);
      setValidationErrors(errors);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Không thể đọc file');
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const removeRow = useCallback((rowIndex) => {
    setPreviewData((prev) => prev.filter((row) => row.rowIndex !== rowIndex));
    setValidationErrors((prev) => prev.filter((err) => err.row !== rowIndex));
  }, []);

  const handleImport = useCallback(async () => {
    if (previewData.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const invalidRows = new Set(validationErrors.map((err) => err.row));
      const studentsToImport = previewData
        .filter((student) => !invalidRows.has(student.rowIndex) && student.full_name)
        .map(({ rowIndex, ...student }) => ({ ...student, _row: rowIndex }));

      const response = await fetch(`${API_URL}/api/students/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students: studentsToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể import học viên');
      }

      setImportResult(data);
      setStep(3);

      if (data.success > 0) {
        onImportSuccess?.(data.success);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [previewData, validationErrors, session, onImportSuccess]);

  const downloadTemplate = useCallback(() => {
    const template = [
      {
        'Họ tên': 'Nguyen Van An',
        Email: 'an.nguyen@example.com',
        'Số điện thoại': '0912345678',
        'Ngày sinh': '15/08/2010',
        'Giới tính': 'Nam',
        'Địa chỉ': '12 Nguyen Trai, Quan 1, TP HCM',
        'Ghi chú': 'Hoc sinh moi',
      },
      {
        'Họ tên': 'Tran Thi Binh',
        Email: 'binh.tran@example.com',
        'Số điện thoại': '0987654321',
        'Ngày sinh': '22/03/2011',
        'Giới tính': 'Nữ',
        'Địa chỉ': '45 Le Loi, Hai Chau, Da Nang',
        'Ghi chú': 'Da hoc co ban',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'mau_import_hoc_vien.xlsx');
  }, []);

  const validImportCount = previewData.filter((student) => {
    if (!student.full_name) return false;
    return !validationErrors.some((err) => err.row === student.rowIndex);
  }).length;

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          dragActive
            ? 'border-orange-500 bg-orange-50'
            : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/50',
          selectedFile && 'border-emerald-500 bg-emerald-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-2">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-600" />
            <p className="font-medium text-emerald-700">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Xóa file
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-12 h-12 mx-auto text-slate-400" />
            <p className="font-medium">Kéo thả file vào đây</p>
            <p className="text-sm text-muted-foreground">hoặc click để chọn file</p>
            <p className="text-xs text-muted-foreground">Hỗ trợ: CSV, XLSX</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div>
          <p className="text-sm font-medium">Chưa có file mẫu?</p>
          <p className="text-xs text-muted-foreground">Tải file mẫu để xem định dạng đúng</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Tải mẫu
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Các cột được hỗ trợ:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><span className="text-red-500">*</span> Họ tên / full_name</li>
          <li>Email / email</li>
          <li>Số điện thoại / phone</li>
          <li>Ngày sinh / date_of_birth</li>
          <li>Giới tính / gender (Nam, Nữ, Khác)</li>
          <li>Địa chỉ / address</li>
          <li>Ghi chú / notes</li>
        </ul>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {validationErrors.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
            <AlertTriangle className="w-4 h-4" />
            Cảnh báo ({validationErrors.length})
          </div>
          <ul className="text-sm text-amber-600 space-y-1 max-h-24 overflow-y-auto">
            {validationErrors.slice(0, 5).map((err, i) => (
              <li key={i}>Dòng {err.row}: {err.message}</li>
            ))}
            {validationErrors.length > 5 && (
              <li>...và {validationErrors.length - 5} lỗi khác</li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{previewData.length}</p>
          <p className="text-xs text-muted-foreground">Học viên</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{validImportCount}</p>
          <p className="text-xs text-muted-foreground">Hợp lệ</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{validationErrors.length}</p>
          <p className="text-xs text-muted-foreground">Cảnh báo</p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Họ tên</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">SĐT</th>
              <th className="p-2 text-left">Ngày sinh</th>
              <th className="p-2 text-left">Giới tính</th>
              <th className="p-2 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {previewData.slice(0, 50).map((student, i) => {
              const rowErrors = validationErrors.filter((e) => e.row === student.rowIndex);
              const hasRowError = rowErrors.length > 0;
              return (
                <tr key={i} className={cn(hasRowError && 'bg-amber-50')}>
                  <td className="p-2 text-muted-foreground">{student.rowIndex}</td>
                  <td className={cn('p-2 font-medium', !student.full_name && 'text-amber-700')}>{student.full_name || '—'}</td>
                  <td className="p-2">{student.email || '—'}</td>
                  <td className="p-2">{student.phone || '—'}</td>
                  <td className="p-2">{student.date_of_birth || '—'}</td>
                  <td className="p-2">
                    {student.gender === 'male' && 'Nam'}
                    {student.gender === 'female' && 'Nữ'}
                    {student.gender === 'other' && 'Khác'}
                    {!student.gender && '—'}
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(student.rowIndex)}
                      className="h-7 w-7 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {previewData.length > 50 && (
          <p className="p-2 text-center text-xs text-muted-foreground bg-slate-50">
            ...và {previewData.length - 50} học viên khác
          </p>
        )}
      </div>
    </div>
  );

  const renderResultStep = () => (
    <div className="space-y-6 text-center py-6">
      {importResult?.success > 0 ? (
        <>
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500" />
          <div>
            <h3 className="text-xl font-bold text-slate-900">Import thành công!</h3>
            <p className="text-muted-foreground mt-1">Đã tạo {importResult.success} học viên mới</p>
          </div>

          {importResult.errors?.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-left">
              <p className="text-red-700 font-medium mb-2">Chi tiết lỗi:</p>
              <ul className="text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {importResult.errors.map((err, i) => (
                  <li key={i}>• Dòng {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <div>
            <h3 className="text-xl font-bold text-slate-900">Import thất bại</h3>
            <p className="text-muted-foreground mt-1">Không có học viên nào được tạo</p>
          </div>

          {importResult?.errors?.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-left">
              <p className="text-red-700 font-medium mb-2">Chi tiết lỗi:</p>
              <ul className="text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {importResult.errors.map((err, i) => (
                  <li key={i}>• Dòng {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-500" />
            Import học viên từ Excel
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-4 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step === s && 'bg-orange-500 text-white',
                step > s && 'bg-emerald-500 text-white',
                step < s && 'bg-slate-200 text-slate-500'
              )}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={cn('w-8 h-0.5', step > s ? 'bg-emerald-500' : 'bg-slate-200')} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="min-h-[300px]">
          {step === 1 && renderUploadStep()}
          {step === 2 && renderPreviewStep()}
          {step === 3 && renderResultStep()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div>
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Quay lại
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={loading}>
              {step === 3 ? 'Đóng' : 'Hủy'}
            </Button>

            {step === 1 && (
              <Button
                onClick={parseAndValidate}
                disabled={!selectedFile || loading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Tiếp tục
              </Button>
            )}

            {step === 2 && (
              <Button
                onClick={handleImport}
                disabled={loading || validImportCount === 0}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Import {validImportCount} học viên
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
