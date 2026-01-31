/**
 * StudentPayment Page - Trang thanh toán và QR cho học viên/phụ huynh
 */

import { useMemo, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  CreditCard,
  Copy,
  Check,
  AlertTriangle,
  Upload,
  X,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { useStudentInvoices } from '../hooks';
import { useStudentPaymentConfig } from '../hooks/useStudentPaymentConfig';
import { formatCurrency, parseCurrency } from '@/features/invoices/utils/formatters';
import { cn } from '@/lib/utils';

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const getRemaining = (invoice) => {
  const total = invoice.final_amount ?? invoice.amount ?? 0;
  const paid = invoice.paid_amount ?? 0;
  return Math.max(total - paid, 0);
};

// Generate transfer content for multiple invoices
const getTransferContent = (invoices) => {
  if (!invoices || invoices.length === 0) return '';
  if (invoices.length === 1) {
    const inv = invoices[0];
    return inv.invoice_code ? `HP ${inv.invoice_code}` : `HP ${inv.id?.slice(0, 6) || ''}`;
  }
  // Multiple invoices: HP INV1 INV2 INV3
  const codes = invoices.map(inv => inv.invoice_code || inv.id?.slice(0, 6)).join(' ');
  return `HP ${codes}`;
};

export function StudentPayment() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { invoices, loading, error, refresh } = useStudentInvoices('unpaid');
  const { config, loading: loadingConfig, error: configError } = useStudentPaymentConfig();
  const [searchParams] = useSearchParams();

  const [selectedIds, setSelectedIds] = useState([]);
  const [paymentMode, setPaymentMode] = useState('combined'); // 'combined' or 'individual'
  const [customAmount, setCustomAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [bankProofUrl, setBankProofUrl] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const unpaidInvoices = useMemo(() => {
    const list = invoices || [];
    return list.filter(inv => getRemaining(inv) > 0 && !['paid', 'cancelled', 'refunded'].includes(inv.status));
  }, [invoices]);

  const selectedInvoices = useMemo(
    () => unpaidInvoices.filter(inv => selectedIds.includes(inv.id)),
    [unpaidInvoices, selectedIds]
  );

  const totalSelectedAmount = useMemo(
    () => selectedInvoices.reduce((sum, inv) => sum + getRemaining(inv), 0),
    [selectedInvoices]
  );

  // Payment amount (custom or total)
  const paymentAmount = useMemo(() => {
    const custom = parseCurrency(customAmount);
    return custom > 0 ? custom : totalSelectedAmount;
  }, [customAmount, totalSelectedAmount]);

  // Transfer content for QR
  const transferContent = useMemo(
    () => getTransferContent(selectedInvoices),
    [selectedInvoices]
  );

  // QR URL generation
  const qrUrl = useMemo(() => {
    if (!selectedInvoices.length || !config?.bankId || !config?.accountNo || paymentAmount <= 0) {
      return '';
    }
    return `https://img.vietqr.io/image/${config.bankId}-${config.accountNo}-${config.template || 'compact2'}.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(config.accountName || '')}`;
  }, [selectedInvoices.length, config, paymentAmount, transferContent]);

  // Preselect from URL
  useEffect(() => {
    const preselectId = searchParams.get('invoice_id');
    if (!preselectId || selectedIds.length > 0) return;
    const exists = unpaidInvoices.find(inv => inv.id === preselectId);
    if (exists) {
      setSelectedIds([preselectId]);
    }
  }, [searchParams, unpaidInvoices, selectedIds.length]);

  // Reset custom amount when selection changes
  useEffect(() => {
    setCustomAmount('');
    setBankProofUrl(null);
  }, [selectedIds.length]);

  const toggleSelect = (invoice) => {
    setSelectedIds(prev => {
      const exists = prev.includes(invoice.id);
      return exists ? prev.filter(id => id !== invoice.id) : [...prev, invoice.id];
    });
  };

  const selectAll = () => {
    setSelectedIds(unpaidInvoices.map(inv => inv.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleCopy = (field, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success('Đã sao chép vào clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBankProofUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedInvoices.length) return;
    
    if (paymentAmount <= 0) {
      toast.error('Vui lòng nhập số tiền thanh toán hợp lệ');
      return;
    }
    if (paymentAmount > totalSelectedAmount) {
      toast.error(`Số tiền vượt quá tổng nợ (${formatMoney(totalSelectedAmount)})`);
      return;
    }
    if (!bankProofUrl) {
      toast.error('Vui lòng tải lên ảnh minh chứng chuyển khoản');
      return;
    }

    setSubmitting(true);
    try {
      // For combined payment, we distribute proportionally or pay first invoice first
      const firstInvoice = selectedInvoices[0];
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/invoices/${firstInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          amount: paymentAmount,
          payment_method: 'bank_transfer',
          notes: notes ? `${transferContent}\n${notes}` : transferContent,
          bank_proof_url: bankProofUrl,
          // Include all invoice IDs for batch processing
          invoice_ids: selectedInvoices.map(inv => inv.id)
        })
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Đã gửi xác nhận chuyển khoản. Trung tâm sẽ xác minh sớm.');
        refresh();
        setSelectedIds([]);
        setCustomAmount('');
        setNotes('');
        setBankProofUrl(null);
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi gửi thanh toán');
      }
    } catch (err) {
      toast.error('Không thể gửi thanh toán lúc này');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-6 bg-destructive/10 rounded-xl max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-destructive mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <Button onClick={refresh}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Thanh toán học phí</h1>
        <p className="text-muted-foreground">
          Chọn hóa đơn, quét mã QR và gửi minh chứng chuyển khoản.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Invoice List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Hóa đơn chưa thanh toán
              </CardTitle>
              {unpaidInvoices.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Chọn tất cả
                  </Button>
                  {selectedIds.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Bỏ chọn
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {unpaidInvoices.length > 0 ? (
              <div className="space-y-3">
                {unpaidInvoices.map((invoice) => {
                  const remaining = getRemaining(invoice);
                  const isOverdue = invoice.due_date && invoice.due_date < new Date().toISOString().split('T')[0];
                  const isSelected = selectedIds.includes(invoice.id);
                  return (
                    <div
                      key={invoice.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer',
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm' 
                          : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                      )}
                      onClick={() => toggleSelect(invoice)}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-5 h-5 rounded border-2 transition-colors',
                        isSelected 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{invoice.invoice_code || `HD-${invoice.id.slice(0, 6)}`}</p>
                          <Badge variant="secondary" className={cn(
                            isOverdue 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          )}>
                            {isOverdue ? 'Quá hạn' : 'Chờ thanh toán'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {invoice.description || invoice.class?.name || 'Học phí'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Hạn thanh toán: {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">{formatMoney(remaining)}</p>
                        {invoice.paid_amount > 0 && (
                          <p className="text-xs text-muted-foreground">Đã đóng: {formatMoney(invoice.paid_amount)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <p className="font-medium">Không có hóa đơn cần thanh toán</p>
                <p className="text-sm mt-1">Bạn đã thanh toán đầy đủ học phí</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5" />
                Giỏ thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số hóa đơn đã chọn</span>
                <span className="font-semibold">{selectedInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tổng số tiền</span>
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {formatMoney(totalSelectedAmount)}
                </span>
              </div>
              
              {selectedInvoices.length > 0 && (
                <div className="space-y-2 pt-3 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Hóa đơn đã chọn:</p>
                  {selectedInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-sm"
                    >
                      <span className="truncate font-medium">{inv.invoice_code || inv.id.slice(0, 6)}</span>
                      <span className="text-emerald-700 dark:text-emerald-400">{formatMoney(getRemaining(inv))}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedInvoices.length > 1 && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <strong>Thanh toán gộp:</strong> Quét 1 mã QR để thanh toán tất cả hóa đơn đã chọn.
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Payment Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5" />
                Thanh toán bằng QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedInvoices.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Vui lòng chọn hóa đơn để tạo mã QR thanh toán</p>
                </div>
              )}

              {selectedInvoices.length > 0 && (
                <>
                  {/* Amount Input */}
                  <div>
                    <label className="text-sm font-medium">Số tiền thanh toán</label>
                    <div className="mt-1">
                      <Input
                        value={customAmount ? formatCurrency(customAmount) : formatMoney(totalSelectedAmount)}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Nhập số tiền..."
                        className="text-right font-semibold"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomAmount('')}
                          className={!customAmount ? 'ring-2 ring-emerald-500' : ''}
                        >
                          Đóng đủ
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomAmount(Math.round(totalSelectedAmount / 2).toString())}
                        >
                          50%
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bank Config Loading/Error */}
                  {loadingConfig && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      Đang tải thông tin ngân hàng...
                    </div>
                  )}
                  
                  {configError && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      Chưa cấu hình thông tin ngân hàng. Vui lòng liên hệ trung tâm.
                    </div>
                  )}

                  {/* Bank Info + QR */}
                  {config && (
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ngân hàng</span>
                          <span className="font-medium">{config.bankName || config.bankId}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Số tài khoản</span>
                          <button
                            className="font-medium flex items-center gap-1 hover:text-primary transition-colors"
                            onClick={() => handleCopy('accountNo', config.accountNo)}
                          >
                            {config.accountNo}
                            {copiedField === 'accountNo' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Chủ tài khoản</span>
                          <button
                            className="font-medium flex items-center gap-1 hover:text-primary transition-colors"
                            onClick={() => handleCopy('accountName', config.accountName)}
                          >
                            {config.accountName}
                            {copiedField === 'accountName' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Nội dung CK</span>
                          <button
                            className="font-mono text-xs bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded flex items-center gap-1 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                            onClick={() => handleCopy('transferContent', transferContent)}
                          >
                            {transferContent}
                            {copiedField === 'transferContent' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* QR Code */}
                      {qrUrl && (
                        <div className="flex justify-center">
                          <div className="bg-white p-4 rounded-xl border-2 border-dashed border-emerald-200 shadow-sm">
                            <img src={qrUrl} alt="Mã QR thanh toán" className="w-64 h-64 object-contain" />
                            <p className="text-center text-xs text-muted-foreground mt-2">
                              Quét mã để thanh toán {formatMoney(paymentAmount)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Proof */}
                  <div>
                    <label className="text-sm font-medium">Ảnh minh chứng chuyển khoản</label>
                    <div className="mt-2">
                      {bankProofUrl ? (
                        <div className="relative">
                          <img src={bankProofUrl} alt="Minh chứng" className="w-full max-h-48 object-cover rounded-lg border" />
                          <button
                            onClick={() => setBankProofUrl(null)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 border hover:bg-white transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Kéo thả hoặc click để tải ảnh</span>
                          <span className="text-xs text-muted-foreground mt-1">PNG, JPG (tối đa 5MB)</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium">Ghi chú (tùy chọn)</label>
                    <Textarea
                      className="mt-1"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="VD: Thanh toán đợt 1, hẹn đóng đợt 2..."
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                    onClick={handleSubmit}
                    disabled={submitting || !selectedInvoices.length}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Gửi xác nhận thanh toán
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default StudentPayment;
