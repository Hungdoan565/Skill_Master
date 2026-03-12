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

  const normalizeHeaderLabel = (value) => String(value || '')
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

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
      const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

      if (sheetRows.length === 0) {
        throw new Error('File không có dữ liệu');
      }

      const headerRowIndex = sheetRows.findIndex((row) => {
        const normalizedCells = row.map((cell) => normalizeHeaderLabel(cell));
        return normalizedCells.some((cell) => ['họ tên', 'ho ten', 'full_name', 'name', 'họ và tên', 'ho va ten'].includes(cell));
      });

      if (headerRowIndex === -1) {
        throw new Error('Không tìm thấy dòng tiêu đề hợp lệ trong file import');
      }

      const headerRow = sheetRows[headerRowIndex].map((cell) => normalizeHeaderLabel(cell));
      const dataRows = sheetRows
        .slice(headerRowIndex + 1)
        .map((row, index) => ({
          values: row,
          excelRowIndex: headerRowIndex + index + 2,
        }))
        .filter(({ values }) => {
          const normalizedCells = values.map((cell) => normalizeHeaderLabel(cell)).filter(Boolean);
          const hasAnyValue = normalizedCells.length > 0;

          if (!hasAnyValue) return false;

          const helperRowText = normalizedCells.join(' | ');
          const helperRowMarkers = [
            'hướng dẫn',
            'huong dan',
            'cột có dấu',
            'cot co dau',
            'ngày sinh hỗ trợ',
            'ngay sinh ho tro',
            'giới tính nên dùng',
            'gioi tinh nen dung',
            'email và số điện thoại',
            'email va so dien thoai',
            'người lập biểu',
            'nguoi lap bieu',
            'ký ghi rõ họ tên',
            'ky ghi ro ho ten',
            'ký xác nhận',
            'ky xac nhan',
            'bộ phận tuyển sinh',
            'bo phan tuyen sinh',
          ];

          if (normalizedCells.some((cell) => cell.startsWith('•'))) {
            return false;
          }

          if (helperRowMarkers.some((marker) => helperRowText.includes(marker))) {
            return false;
          }

          return true;
        });

      if (dataRows.length === 0) {
        throw new Error('File không có dòng dữ liệu hợp lệ để import');
      }

      const columnMap = {
        'họ tên': 'full_name',
        'họ và tên': 'full_name',
        'ho ten': 'full_name',
        'ho va ten': 'full_name',
        full_name: 'full_name',
        name: 'full_name',
        stt: null,
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
      const normalized = dataRows.map(({ values, excelRowIndex }) => {
        const rowIndex = excelRowIndex;
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

        const row = Object.fromEntries(
          headerRow.map((header, index) => [header, values[index] ?? ''])
        );

        Object.keys(row).forEach((key) => {
          const normalizedKey = columnMap[normalizeHeaderLabel(key)];
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

        const originalDob = row['ngày sinh'] || row.date_of_birth || row.birthday;
        if (originalDob && !normalizedRow.date_of_birth) {
          errors.push({ row: rowIndex, field: 'date_of_birth', message: 'Ngày sinh không hợp lệ' });
        }

        const originalGender = row['giới tính'] || row.gender;
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

  const downloadTemplate = useCallback(async () => {
    const XLSXStyled = await import('xlsx-js-style');
    const today = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const styles = {
      title: {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E40AF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      },
      subtitle: {
        font: { bold: true, sz: 13, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E40AF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      },
      info: {
        font: { sz: 11, color: { rgb: '374151' } },
        alignment: { horizontal: 'center' },
      },
      date: {
        font: { sz: 10, color: { rgb: '6B7280' } },
        alignment: { horizontal: 'center' },
      },
      header: {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E40AF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } },
        },
      },
      dataEven: {
        font: { sz: 10 },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } },
        },
      },
      dataOdd: {
        font: { sz: 10 },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } },
        },
      },
      instruction: { font: { bold: true, sz: 11, color: { rgb: '1E40AF' } } },
      note: { font: { sz: 10, color: { rgb: '374151' } } },
      signTitle: { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center' } },
      signNote: {
        font: { italic: true, sz: 9, color: { rgb: '9CA3AF' } },
        alignment: { horizontal: 'center' },
      },
    };

    const headers = ['STT', 'Họ tên *', 'Email', 'Số điện thoại', 'Ngày sinh', 'Giới tính', 'Địa chỉ', 'Ghi chú'];
    const samples = [
      [1, 'Nguyễn Văn An', 'an.nguyen@example.com', '0912345678', '15/08/2010', 'Nam', '12 Nguyễn Trãi, Quận 1, TP.HCM', 'Học sinh mới'],
      [2, 'Trần Thị Bình', 'binh.tran@example.com', '0987654321', '22/03/2011', 'Nữ', '45 Lê Lợi, Hải Châu, Đà Nẵng', 'Đã học cơ bản'],
      [3, 'Lê Hoàng Minh', 'minh.le@example.com', '0909123456', '05/11/2012', 'Nam', '88 Phan Đình Phùng, Phú Nhuận, TP.HCM', 'Cần tư vấn xếp lớp'],
    ];

    const wsData = [
      [{ v: 'SKILL MASTER', s: styles.title }],
      [{ v: 'MẪU IMPORT DANH SÁCH HỌC VIÊN', s: styles.subtitle }],
      [{ v: 'Phạm vi: Hệ thống quản lý học viên', s: styles.info }],
      [{ v: `Ngày tải: ${today}`, s: styles.date }],
      [],
      headers.map((header) => ({ v: header, s: styles.header })),
      samples[0].map((value) => ({ v: value, s: styles.dataOdd })),
      samples[1].map((value) => ({ v: value, s: styles.dataEven })),
      samples[2].map((value) => ({ v: value, s: styles.dataOdd })),
      [],
      [],
      [{ v: 'HƯỚNG DẪN:', s: styles.instruction }],
      [{ v: '• Cột có dấu (*) là bắt buộc', s: styles.note }],
      [{ v: '• Ngày sinh hỗ trợ định dạng dd/mm/yyyy hoặc yyyy-mm-dd', s: styles.note }],
      [{ v: '• Giới tính nên dùng: Nam, Nữ hoặc Khác', s: styles.note }],
      [{ v: '• Email và số điện thoại nếu có phải hợp lệ để import thành công', s: styles.note }],
      [],
      [],
      [],
      [
        { v: '' },
        { v: '' },
        { v: 'Người lập biểu', s: styles.signTitle },
        { v: '' },
        { v: '' },
        { v: 'Bộ phận tuyển sinh', s: styles.signTitle },
        { v: '' },
        { v: '' },
      ],
      [
        { v: '' },
        { v: '' },
        { v: '(Ký ghi rõ họ tên)', s: styles.signNote },
        { v: '' },
        { v: '' },
        { v: '(Ký xác nhận)', s: styles.signNote },
        { v: '' },
        { v: '' },
      ],
    ];

    const ws = XLSXStyled.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
      { s: { r: 11, c: 0 }, e: { r: 11, c: 7 } },
      { s: { r: 12, c: 0 }, e: { r: 12, c: 7 } },
      { s: { r: 13, c: 0 }, e: { r: 13, c: 7 } },
      { s: { r: 14, c: 0 }, e: { r: 14, c: 7 } },
      { s: { r: 15, c: 0 }, e: { r: 15, c: 7 } },
    ];
    ws['!cols'] = [
      { wch: 5 },
      { wch: 24 },
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 34 },
      { wch: 24 },
    ];
    ws['!rows'] = [
      { hpt: 35 },
      { hpt: 28 },
      { hpt: 22 },
      { hpt: 20 },
      { hpt: 10 },
      { hpt: 28 },
    ];

    const wb = XLSXStyled.utils.book_new();
    XLSXStyled.utils.book_append_sheet(wb, ws, 'Mẫu học viên');
    XLSXStyled.writeFile(wb, 'mau_import_hoc_vien.xlsx');
  }, []);

  const downloadRawSample = useCallback((type) => {
    const headers = ['Họ tên *', 'Email', 'Số điện thoại', 'Ngày sinh', 'Giới tính', 'Địa chỉ', 'Ghi chú'];

    const datasets = {
      valid: [
        { 'Họ tên *': 'Nguyễn Minh Anh', Email: 'minhanh.nguyen@example.com', 'Số điện thoại': '0912345678', 'Ngày sinh': '15/08/2010', 'Giới tính': 'Nam', 'Địa chỉ': '12 Nguyễn Trãi, Quận 1, TP.HCM', 'Ghi chú': 'Học sinh mới' },
        { 'Họ tên *': 'Trần Thu Hà', Email: 'thuhatran@example.com', 'Số điện thoại': '0987654321', 'Ngày sinh': '22/03/2011', 'Giới tính': 'Nữ', 'Địa chỉ': '45 Lê Lợi, Hải Châu, Đà Nẵng', 'Ghi chú': 'Đăng ký lớp giao tiếp' },
        { 'Họ tên *': 'Phạm Đức Long', Email: 'long.pham@example.com', 'Số điện thoại': '0909123456', 'Ngày sinh': '05/11/2012', 'Giới tính': 'Nam', 'Địa chỉ': '88 Phan Đình Phùng, Phú Nhuận, TP.HCM', 'Ghi chú': '' },
      ],
      mixed: [
        { 'Họ tên *': 'Lê Hoàng Nam', Email: 'hoangnam@example.com', 'Số điện thoại': '0933555777', 'Ngày sinh': '14/02/2010', 'Giới tính': 'Nam', 'Địa chỉ': 'TP.HCM', 'Ghi chú': '' },
        { 'Họ tên *': '', Email: 'missing-name@example.com', 'Số điện thoại': '0900000000', 'Ngày sinh': '10/10/2010', 'Giới tính': 'Nam', 'Địa chỉ': 'Đà Nẵng', 'Ghi chú': 'Thiếu họ tên' },
        { 'Họ tên *': 'Ngô Bảo Vy', Email: 'invalid-email', 'Số điện thoại': '0988777666', 'Ngày sinh': '12/05/2011', 'Giới tính': 'Nữ', 'Địa chỉ': 'Nha Trang', 'Ghi chú': 'Email sai định dạng' },
        { 'Họ tên *': 'Trịnh Minh Quân', Email: 'quan.trinh@example.com', 'Số điện thoại': 'abc123', 'Ngày sinh': '01/01/2011', 'Giới tính': 'Nam', 'Địa chỉ': 'Huế', 'Ghi chú': 'SĐT sai' },
        { 'Họ tên *': 'Đặng Khánh Linh', Email: 'linh.dang@example.com', 'Số điện thoại': '0911222333', 'Ngày sinh': '31-02-2011', 'Giới tính': 'Nữ', 'Địa chỉ': 'Cần Thơ', 'Ghi chú': 'Ngày sinh sai' },
      ],
      edge: [
        { 'Họ tên *': '  Nguyễn  Văn    Khoảng  Trắng  ', Email: 'space.name@example.com', 'Số điện thoại': '0912345678', 'Ngày sinh': '2010-08-15', 'Giới tính': 'nam', 'Địa chỉ': '  123 Trần Hưng Đạo  ', 'Ghi chú': 'Tên và địa chỉ có khoảng trắng dư' },
        { 'Họ tên *': 'Lý Ánh🌟', Email: 'unicode.student@example.com', 'Số điện thoại': '0981234567', 'Ngày sinh': '20/12/2011', 'Giới tính': 'Nu', 'Địa chỉ': 'Biên Hòa', 'Ghi chú': 'Có ký tự unicode' },
        { 'Họ tên *': 'Đỗ Hoài Nam', Email: '', 'Số điện thoại': '', 'Ngày sinh': '', 'Giới tính': '', 'Địa chỉ': '', 'Ghi chú': 'Thiếu dữ liệu không bắt buộc' },
        { 'Họ tên *': 'Tên Rất Dài '.repeat(6).trim(), Email: 'long.name.student@example.com', 'Số điện thoại': '0909123000', 'Ngày sinh': '01/09/2012', 'Giới tính': 'Khác', 'Địa chỉ': 'Hà Nội', 'Ghi chú': 'Kiểm tra độ dài chuỗi' },
      ],
    };

    const rows = datasets[type] || datasets.valid;
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RawStudents');

    const filename = {
      valid: 'students-import-valid.xlsx',
      mixed: 'students-import-mixed-errors.xlsx',
      edge: 'students-import-edge-cases.xlsx',
    }[type] || 'students-import-valid.xlsx';

    XLSX.writeFile(wb, filename);
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

      <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
        <div>
          <p className="text-sm font-medium">Bộ dữ liệu test import (raw)</p>
          <p className="text-xs text-muted-foreground">Dùng để QA luồng import với dữ liệu sạch, dữ liệu lỗi và edge-cases.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadRawSample('valid')}>
            <Download className="w-4 h-4 mr-2" /> Raw hợp lệ
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadRawSample('mixed')}>
            <Download className="w-4 h-4 mr-2" /> Raw mixed lỗi
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadRawSample('edge')}>
            <Download className="w-4 h-4 mr-2" /> Raw edge-cases
          </Button>
        </div>
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
