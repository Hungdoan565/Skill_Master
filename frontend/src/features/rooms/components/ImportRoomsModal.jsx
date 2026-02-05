/**
 * ImportRoomsModal Component
 * 
 * Modal to import rooms from Excel/CSV file.
 * Supports preview before import and validation feedback.
 */

import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { API_URL, ROOM_TYPE_OPTIONS, STATUS_OPTIONS } from '../utils/constants';
import { useCenters } from '../hooks/useCenters';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Expected Excel columns
const EXPECTED_COLUMNS = [
  { key: 'name', label: 'Tên phòng', required: true },
  { key: 'code', label: 'Mã phòng', required: true },
  { key: 'capacity', label: 'Sức chứa', required: false },
  { key: 'room_type', label: 'Loại phòng', required: false },
  { key: 'status', label: 'Trạng thái', required: false },
  { key: 'notes', label: 'Ghi chú', required: false },
];

const VALID_ROOM_TYPES = ['standard', 'lab', 'meeting', 'online'];
const VALID_STATUSES = ['active', 'maintenance', 'inactive'];

export function ImportRoomsModal({ isOpen, onClose, onSuccess }) {
  const { session } = useAuth();
  const { centers, loading: centersLoading } = useCenters(true); // autoFetch = true
  const fileInputRef = useRef(null);

  // State
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Preview data
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: result

  // Import result
  const [importResult, setImportResult] = useState(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setSelectedCenterId('');
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

  // File validation
  const isValidFile = (file) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    return validExtensions.includes(extension);
  };

  // Drag handlers
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

  // Parse and validate Excel file
  const parseAndValidate = useCallback(async () => {
    if (!selectedFile || !selectedCenterId) {
      setError('Vui lòng chọn file và trung tâm');
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

      // Map column names (Vietnamese → English key)
      const columnMap = {
        'tên phòng': 'name',
        'ten phong': 'name',
        'name': 'name',
        'mã phòng': 'code',
        'ma phong': 'code',
        'code': 'code',
        'sức chứa': 'capacity',
        'suc chua': 'capacity',
        'capacity': 'capacity',
        'loại phòng': 'room_type',
        'loai phong': 'room_type',
        'room_type': 'room_type',
        'type': 'room_type',
        'trạng thái': 'status',
        'trang thai': 'status',
        'status': 'status',
        'ghi chú': 'notes',
        'ghi chu': 'notes',
        'notes': 'notes',
      };

      // Normalize and validate data
      const errors = [];
      const normalized = jsonData.map((row, index) => {
        const normalizedRow = { rowIndex: index + 2 }; // +2 for header and 0-index

        // Map columns
        Object.keys(row).forEach(key => {
          const normalizedKey = columnMap[key.toLowerCase().trim()];
          if (normalizedKey) {
            normalizedRow[normalizedKey] = String(row[key]).trim();
          }
        });

        // Validate required fields
        if (!normalizedRow.name) {
          errors.push({ row: normalizedRow.rowIndex, field: 'name', message: 'Thiếu tên phòng' });
        }
        if (!normalizedRow.code) {
          errors.push({ row: normalizedRow.rowIndex, field: 'code', message: 'Thiếu mã phòng' });
        }

        // Validate and set defaults
        normalizedRow.capacity = parseInt(normalizedRow.capacity) || 20;
        
        // Validate room_type
        if (normalizedRow.room_type) {
          const typeMap = {
            'phòng học': 'standard', 'phong hoc': 'standard', 'standard': 'standard',
            'phòng lab': 'lab', 'phong lab': 'lab', 'lab': 'lab',
            'phòng họp': 'meeting', 'phong hop': 'meeting', 'meeting': 'meeting',
            'online': 'online',
          };
          normalizedRow.room_type = typeMap[normalizedRow.room_type.toLowerCase()] || 'standard';
        } else {
          normalizedRow.room_type = 'standard';
        }

        // Validate status
        if (normalizedRow.status) {
          const statusMap = {
            'hoạt động': 'active', 'hoat dong': 'active', 'active': 'active',
            'bảo trì': 'maintenance', 'bao tri': 'maintenance', 'maintenance': 'maintenance',
            'ngừng hoạt động': 'inactive', 'ngung hoat dong': 'inactive', 'inactive': 'inactive',
          };
          normalizedRow.status = statusMap[normalizedRow.status.toLowerCase()] || 'active';
        } else {
          normalizedRow.status = 'active';
        }

        normalizedRow.notes = normalizedRow.notes || '';
        normalizedRow.center_id = selectedCenterId;

        return normalizedRow;
      });

      // Check for duplicate codes
      const codes = normalized.map(r => r.code?.toUpperCase());
      const duplicates = codes.filter((code, i) => code && codes.indexOf(code) !== i);
      if (duplicates.length > 0) {
        const uniqueDuplicates = [...new Set(duplicates)];
        uniqueDuplicates.forEach(code => {
          errors.push({ row: 0, field: 'code', message: `Mã phòng "${code}" bị trùng lặp trong file` });
        });
      }

      setPreviewData(normalized);
      setValidationErrors(errors);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Không thể đọc file');
    } finally {
      setLoading(false);
    }
  }, [selectedFile, selectedCenterId]);

  // Import rooms to backend
  const handleImport = useCallback(async () => {
    if (previewData.length === 0) return;

    setLoading(true);
    setError('');

    try {
      // Remove rowIndex before sending
      const roomsToImport = previewData.map(({ rowIndex, ...room }) => room);

      const response = await fetch(`${API_URL}/api/admin/rooms/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rooms: roomsToImport })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể import');
      }

      setImportResult(data);
      setStep(3);

      if (data.created > 0) {
        onSuccess?.(`Đã import ${data.created} phòng thành công`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [previewData, session, onSuccess]);

  // Download template
  const downloadTemplate = useCallback(() => {
    const template = [
      {
        'Tên phòng': 'Phòng E2-01',
        'Mã phòng': 'E2-01',
        'Sức chứa': 30,
        'Loại phòng': 'standard',
        'Trạng thái': 'active',
        'Ghi chú': 'Tầng 2, dãy E'
      },
      {
        'Tên phòng': 'Phòng Lab 1',
        'Mã phòng': 'LAB1',
        'Sức chứa': 25,
        'Loại phòng': 'lab',
        'Trạng thái': 'active',
        'Ghi chú': 'Phòng máy tính'
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rooms');
    XLSX.writeFile(wb, 'mau_import_phong.xlsx');
  }, []);

  // Render Step 1: Upload
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Center selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Trung tâm <span className="text-red-500">*</span></label>
        <Select value={selectedCenterId} onValueChange={setSelectedCenterId}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn trung tâm" />
          </SelectTrigger>
          <SelectContent>
            {centers.map(center => (
              <SelectItem key={center.id} value={center.id}>
                {center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Tất cả phòng import sẽ thuộc trung tâm này
        </p>
      </div>

      {/* Dropzone */}
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
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
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

      {/* Template download */}
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

      {/* Column hints */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Các cột được hỗ trợ:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><span className="text-red-500">*</span> Tên phòng / name</li>
          <li><span className="text-red-500">*</span> Mã phòng / code</li>
          <li>Sức chứa / capacity (mặc định: 20)</li>
          <li>Loại phòng / room_type (standard, lab, meeting, online)</li>
          <li>Trạng thái / status (active, maintenance, inactive)</li>
          <li>Ghi chú / notes</li>
        </ul>
      </div>
    </div>
  );

  // Render Step 2: Preview
  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Validation errors */}
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

      {/* Summary */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{previewData.length}</p>
          <p className="text-xs text-muted-foreground">Phòng</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {previewData.filter(r => r.name && r.code).length}
          </p>
          <p className="text-xs text-muted-foreground">Hợp lệ</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{validationErrors.length}</p>
          <p className="text-xs text-muted-foreground">Cảnh báo</p>
        </div>
      </div>

      {/* Preview table */}
      <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Tên phòng</th>
              <th className="p-2 text-left">Mã</th>
              <th className="p-2 text-center">Sức chứa</th>
              <th className="p-2 text-left">Loại</th>
              <th className="p-2 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {previewData.slice(0, 50).map((room, i) => {
              const hasError = validationErrors.some(e => e.row === room.rowIndex);
              return (
                <tr key={i} className={cn(hasError && 'bg-amber-50')}>
                  <td className="p-2 text-muted-foreground">{room.rowIndex}</td>
                  <td className="p-2 font-medium">{room.name || <span className="text-red-500">—</span>}</td>
                  <td className="p-2">{room.code || <span className="text-red-500">—</span>}</td>
                  <td className="p-2 text-center">{room.capacity}</td>
                  <td className="p-2">
                    <span className={cn(
                      'px-2 py-0.5 text-xs rounded-full',
                      room.room_type === 'lab' && 'bg-purple-100 text-purple-700',
                      room.room_type === 'meeting' && 'bg-orange-100 text-orange-700',
                      room.room_type === 'online' && 'bg-cyan-100 text-cyan-700',
                      room.room_type === 'standard' && 'bg-blue-100 text-blue-700'
                    )}>
                      {ROOM_TYPE_OPTIONS.find(t => t.value === room.room_type)?.label || room.room_type}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={cn(
                      'px-2 py-0.5 text-xs rounded-full',
                      room.status === 'active' && 'bg-green-100 text-green-700',
                      room.status === 'maintenance' && 'bg-yellow-100 text-yellow-700',
                      room.status === 'inactive' && 'bg-gray-100 text-gray-600'
                    )}>
                      {STATUS_OPTIONS.find(s => s.value === room.status)?.label || room.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {previewData.length > 50 && (
          <p className="p-2 text-center text-xs text-muted-foreground bg-slate-50">
            ...và {previewData.length - 50} phòng khác
          </p>
        )}
      </div>
    </div>
  );

  // Render Step 3: Result
  const renderResultStep = () => (
    <div className="space-y-6 text-center py-6">
      {importResult?.created > 0 ? (
        <>
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500" />
          <div>
            <h3 className="text-xl font-bold text-slate-900">Import thành công!</h3>
            <p className="text-muted-foreground mt-1">
              Đã tạo {importResult.created} phòng mới
            </p>
          </div>

          {importResult.skipped > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {importResult.skipped} phòng bị bỏ qua (mã phòng đã tồn tại)
            </div>
          )}

          {importResult.errors?.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-left">
              <p className="text-red-700 font-medium mb-2">Lỗi:</p>
              <ul className="text-red-600 space-y-1">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>• {err}</li>
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
            <p className="text-muted-foreground mt-1">
              {importResult?.message || 'Không có phòng nào được tạo'}
            </p>
          </div>
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
            Import phòng từ Excel
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
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

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="min-h-[300px]">
          {step === 1 && renderUploadStep()}
          {step === 2 && renderPreviewStep()}
          {step === 3 && renderResultStep()}
        </div>

        {/* Footer */}
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
                disabled={!selectedFile || !selectedCenterId || loading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Tiếp tục
              </Button>
            )}

            {step === 2 && (
              <Button
                onClick={handleImport}
                disabled={loading || previewData.filter(r => r.name && r.code).length === 0}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Import {previewData.filter(r => r.name && r.code).length} phòng
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
