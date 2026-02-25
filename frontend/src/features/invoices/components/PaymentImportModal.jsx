/**
 * PaymentImportModal Component
 * 
 * Modal wizard để import thanh toán từ sao kê ngân hàng.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {function} onClose - Handler đóng modal
 * @param {function} onSuccess - Callback khi import thành công (message, data)
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { API_URL } from '../utils/constants';
import { formatMoney, formatDate } from '../utils/formatters';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  Check
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const BANK_FORMATS = [
  { value: 'VCB', label: 'Vietcombank (VCB)' },
  { value: 'TCB', label: 'Techcombank (TCB)' },
  { value: 'BIDV', label: 'BIDV' },
  { value: 'Generic', label: 'Định dạng chung' }
];

const STEPS = [
  { id: 1, title: 'Tải file', description: 'Chọn file sao kê' },
  { id: 2, title: 'Xem & Khớp', description: 'Kiểm tra giao dịch' },
  { id: 3, title: 'Xác nhận', description: 'Áp dụng thanh toán' }
];

const CONFIDENCE_CONFIG = {
  high: { label: 'Cao', variant: 'success', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  medium: { label: 'TB', variant: 'warning', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Thấp', variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200' }
};

export function PaymentImportModal({ isOpen, onClose, onSuccess }) {
  const { session } = useAuth();
  const fileInputRef = useRef(null);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [bankFormat, setBankFormat] = useState('VCB');
  const [dragActive, setDragActive] = useState(false);
  
  // Step 2: Preview & Match
  const [transactions, setTransactions] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  
  // Step 3: Results
  const [applyProgress, setApplyProgress] = useState(0);
  const [applyResults, setApplyResults] = useState(null);

  const resetState = useCallback(() => {
    setCurrentStep(1);
    setLoading(false);
    setError('');
    setSelectedFile(null);
    setBankFormat('VCB');
    setDragActive(false);
    setTransactions([]);
    setSelectedTransactions(new Set());
    setInvoiceSearchQuery('');
    setSearchResults([]);
    setEditingTransactionId(null);
    setApplyProgress(0);
    setApplyResults(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // File handling
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

  const isValidFile = (file) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    return validTypes.includes(file.type) || validExtensions.includes(extension);
  };

  const fileToBase64 = useCallback((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsDataURL(file);
  }), []);

  // Step 1: Parse file
  const handleParseFile = useCallback(async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setError('');
    
    try {
      const fileData = await fileToBase64(selectedFile);
      const extension = selectedFile.name.split('.').pop()?.toLowerCase() || 'csv';
      const fileType = extension === 'xls' ? 'xlsx' : extension;
      
      const response = await fetch(`${API_URL}/api/admin/payments/import/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileData,
          fileType,
          bankFormat: bankFormat.toLowerCase()
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || 'Không thể đọc file');
      }

      const parsedTransactions = payload.data?.transactions || [];
      setTransactions(parsedTransactions);
      setSelectedTransactions(new Set(parsedTransactions.map(t => t.id)));
      setCurrentStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedFile, bankFormat, session, fileToBase64]);

  // Step 2: Match transactions with invoices
  const handleMatchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const selectedTxns = transactions.filter(t => selectedTransactions.has(t.id));

      const response = await fetch(`${API_URL}/api/admin/payments/import/match`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactions: selectedTxns })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || 'Không thể khớp giao dịch');
      }

      const matches = payload.data?.matches || [];
      const matchByTransactionId = new Map(
        matches.map((item) => [item.transactionId || item.transaction?.id, item])
      );

      setTransactions(prev => prev.map(t => {
        const matched = matchByTransactionId.get(t.id);
        if (matched) {
          return {
            ...t,
            matchedInvoice: matched.matchedInvoice || null,
            confidence: matched.confidence,
            matchReasons: matched.matchReasons || []
          };
        }
        return t;
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [transactions, selectedTransactions, session]);

  // Search invoices for manual matching
  const handleSearchInvoices = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/invoices?search=${encodeURIComponent(query)}&limit=5`,
        {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.invoices || data.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [session]);

  // Manual invoice selection
  const handleSelectInvoice = useCallback((transactionId, invoice) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return {
          ...t,
          matchedInvoice: invoice,
          confidence: 'manual',
          matchReasons: ['Khớp thủ công bởi người vận hành']
        };
      }
      return t;
    }));
    setEditingTransactionId(null);
    setInvoiceSearchQuery('');
    setSearchResults([]);
  }, []);

  // Toggle transaction selection
  const handleToggleTransaction = useCallback((transactionId) => {
    setSelectedTransactions(prev => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  }, []);

  // Toggle all transactions
  const handleToggleAll = useCallback(() => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  }, [transactions, selectedTransactions]);

  // Step 3: Apply payments
  const handleApplyPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    setApplyProgress(0);

    try {
      const matchesToApply = transactions
        .filter(t => selectedTransactions.has(t.id) && t.matchedInvoice)
        .map(t => ({
          transaction: {
            id: t.id,
            date: t.date,
            amount: t.amount,
            description: t.description,
            reference: t.reference || '',
            extractedInvoiceCodes: t.extractedInvoiceCodes || [],
            extractedPhoneNumbers: t.extractedPhoneNumbers || []
          },
          matchedInvoice: t.matchedInvoice,
          confidence: t.confidence === 'manual' ? 'manual' : (t.confidence || 'high'),
          matchReasons: t.matchReasons?.length ? t.matchReasons : ['Khớp thủ công bởi người vận hành']
        }));

      if (matchesToApply.length === 0) {
        throw new Error('Không có giao dịch nào được chọn để áp dụng');
      }

      const response = await fetch(`${API_URL}/api/admin/payments/import/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matches: matchesToApply })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || 'Không thể áp dụng thanh toán');
      }

      setApplyResults(payload.data);
      setApplyProgress(100);

      if ((payload.data?.applied || 0) > 0) {
        onSuccess?.(`Đã áp dụng ${payload.data.applied} thanh toán thành công`, payload.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [transactions, selectedTransactions, session, onSuccess]);

  // Calculate statistics
  const matchStats = {
    total: transactions.length,
    selected: selectedTransactions.size,
    matched: transactions.filter(t => selectedTransactions.has(t.id) && t.matchedInvoice).length,
    highConfidence: transactions.filter(t => t.confidence === 'high').length,
    mediumConfidence: transactions.filter(t => t.confidence === 'medium').length,
    lowConfidence: transactions.filter(t => t.confidence === 'low').length,
    totalAmount: transactions
      .filter(t => selectedTransactions.has(t.id) && t.matchedInvoice)
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  };

  // Render confidence badge
  const renderConfidenceBadge = (confidence) => {
    if (!confidence || confidence === 'manual') {
      return confidence === 'manual' ? (
        <Badge variant="secondary" className="text-xs">Thủ công</Badge>
      ) : null;
    }
    const config = CONFIDENCE_CONFIG[confidence];
    if (!config) return null;
    return (
      <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', config.className)}>
        {config.label}
      </span>
    );
  };

  // Render Step 1: Upload
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Bank format selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Định dạng ngân hàng</label>
        <Select value={bankFormat} onValueChange={setBankFormat}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn ngân hàng" />
          </SelectTrigger>
          <SelectContent>
            {BANK_FORMATS.map(bank => (
              <SelectItem key={bank.value} value={bank.value}>
                {bank.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dropzone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          selectedFile && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
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
            <p className="font-medium text-emerald-700 dark:text-emerald-400">{selectedFile.name}</p>
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
            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="font-medium">Kéo thả file vào đây</p>
            <p className="text-sm text-muted-foreground">hoặc click để chọn file</p>
            <p className="text-xs text-muted-foreground">Hỗ trợ: CSV, XLSX</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Step 2: Preview & Match
  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Match statistics */}
      <div className="grid grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{matchStats.total}</p>
          <p className="text-xs text-muted-foreground">Tổng GD</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{matchStats.matched}</p>
          <p className="text-xs text-muted-foreground">Đã khớp</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{matchStats.total - matchStats.matched}</p>
          <p className="text-xs text-muted-foreground">Chưa khớp</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{formatMoney(matchStats.totalAmount)}</p>
          <p className="text-xs text-muted-foreground">Tổng tiền</p>
        </div>
      </div>

      {/* Auto-match button */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMatchTransactions}
          disabled={loading || selectedTransactions.size === 0}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Tự động khớp hóa đơn
        </Button>
        <span className="text-sm text-muted-foreground">
          Đã chọn: {matchStats.selected}/{matchStats.total}
        </span>
      </div>

      {/* Transactions table */}
      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="p-2 text-left w-10">
                <Checkbox
                  checked={selectedTransactions.size === transactions.length}
                  indeterminate={selectedTransactions.size > 0 && selectedTransactions.size < transactions.length}
                  onCheckedChange={handleToggleAll}
                />
              </th>
              <th className="p-2 text-left">Ngày</th>
              <th className="p-2 text-right">Số tiền</th>
              <th className="p-2 text-left">Nội dung</th>
              <th className="p-2 text-left">Hóa đơn khớp</th>
              <th className="p-2 text-center">Độ tin cậy</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map(transaction => (
              <tr
                key={transaction.id}
                className={cn(
                  'hover:bg-muted/30 transition-colors',
                  !selectedTransactions.has(transaction.id) && 'opacity-50'
                )}
              >
                <td className="p-2">
                  <Checkbox
                    checked={selectedTransactions.has(transaction.id)}
                    onCheckedChange={() => handleToggleTransaction(transaction.id)}
                  />
                </td>
                <td className="p-2 whitespace-nowrap">{formatDate(transaction.date)}</td>
                <td className="p-2 text-right font-medium text-emerald-600">
                  {formatMoney(transaction.amount)}
                </td>
                <td className="p-2 max-w-[200px] truncate" title={transaction.description}>
                  {transaction.description}
                </td>
                <td className="p-2">
                  {editingTransactionId === transaction.id ? (
                    <div className="relative">
                      <Input
                        placeholder="Tìm hóa đơn..."
                        value={invoiceSearchQuery}
                        onChange={(e) => {
                          setInvoiceSearchQuery(e.target.value);
                          handleSearchInvoices(e.target.value);
                        }}
                        className="h-8 text-xs"
                        autoFocus
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {searchResults.map(invoice => (
                            <button
                              key={invoice.id}
                              className="w-full p-2 text-left hover:bg-muted text-xs"
                              onClick={() => handleSelectInvoice(transaction.id, invoice)}
                            >
                              <span className="font-medium">{invoice.invoice_code}</span>
                              <span className="text-muted-foreground ml-2">
                                {invoice.student?.full_name} - {formatMoney(invoice.total_amount)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : transaction.matchedInvoice ? (
                    <button
                      className="text-left hover:underline text-primary text-xs"
                      onClick={() => setEditingTransactionId(transaction.id)}
                    >
                      {transaction.matchedInvoice.invoice_code}
                      <span className="text-muted-foreground ml-1">
                        ({transaction.matchedInvoice.student?.full_name})
                      </span>
                    </button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setEditingTransactionId(transaction.id)}
                    >
                      <Search className="w-3 h-3 mr-1" />
                      Chọn
                    </Button>
                  )}
                </td>
                <td className="p-2 text-center">
                  {renderConfidenceBadge(transaction.confidence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Step 3: Confirm & Apply
  const renderConfirmStep = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-3">
        <h4 className="font-medium">Tóm tắt</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Số giao dịch áp dụng:</span>
            <span className="ml-2 font-medium">{matchStats.matched}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tổng số tiền:</span>
            <span className="ml-2 font-medium text-emerald-600">{formatMoney(matchStats.totalAmount)}</span>
          </div>
        </div>

        {/* Confidence breakdown */}
        <div className="flex gap-4 text-xs">
          <span className="text-emerald-600">
            Cao: {matchStats.highConfidence}
          </span>
          <span className="text-amber-600">
            TB: {matchStats.mediumConfidence}
          </span>
          <span className="text-red-600">
            Thấp: {matchStats.lowConfidence}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Đang xử lý...</span>
            <span>{applyProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${applyProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {applyResults && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Hoàn thành!</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-sm space-y-1">
            <p>✓ Thành công: {applyResults.applied || 0} giao dịch</p>
            {(applyResults.failed || 0) > 0 && (
              <p className="text-red-600">✗ Thất bại: {applyResults.failed} giao dịch</p>
            )}
            {(applyResults.errors?.length || 0) > 0 && (
              <div className="mt-2 text-xs text-red-600">
                {applyResults.errors.map((err, i) => (
                  <p key={i}>- {err}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning for low confidence */}
      {matchStats.lowConfidence > 0 && !applyResults && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">Cảnh báo</p>
            <p className="text-amber-600">
              Có {matchStats.lowConfidence} giao dịch có độ tin cậy thấp.
              Vui lòng kiểm tra lại trước khi áp dụng.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Render stepper
  const renderStepper = () => (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
            </div>
            <span className={cn(
              'text-xs mt-1',
              currentStep === step.id ? 'text-primary font-medium' : 'text-muted-foreground'
            )}>
              {step.title}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className={cn(
              'w-16 h-0.5 mx-2',
              currentStep > step.id ? 'bg-emerald-500' : 'bg-muted'
            )} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import thanh toán từ sao kê
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        {renderStepper()}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="min-h-[300px]">
          {currentStep === 1 && renderUploadStep()}
          {currentStep === 2 && renderPreviewStep()}
          {currentStep === 3 && renderConfirmStep()}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {currentStep > 1 && !applyResults && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={loading}>
              {applyResults ? 'Đóng' : 'Hủy'}
            </Button>

            {currentStep === 1 && (
              <Button
                onClick={handleParseFile}
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Tải lên & Phân tích
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={matchStats.matched === 0}
              >
                Tiếp tục
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {currentStep === 3 && !applyResults && (
              <Button
                onClick={handleApplyPayments}
                disabled={loading || matchStats.matched === 0}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Áp dụng {matchStats.matched} thanh toán
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
