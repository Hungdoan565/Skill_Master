/**
 * StudentPayment Page - Trang thanh toan va QR cho hoc vien/phu huynh
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
  ArrowRight
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

const getTransferContent = (invoice) => {
  if (!invoice) return '';
  return invoice.invoice_code ? `HP ${invoice.invoice_code}` : `HP ${invoice.id?.slice(0, 6) || ''}`;
};

export function StudentPayment() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { invoices, loading, error, refresh } = useStudentInvoices('unpaid');
  const { config, loading: loadingConfig, error: configError } = useStudentPaymentConfig();
  const [searchParams] = useSearchParams();

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [amountInput, setAmountInput] = useState('');
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

  const activeInvoice = useMemo(() => {
    if (!selectedInvoices.length) return null;
    return selectedInvoices.find(inv => inv.id === activeId) || selectedInvoices[0];
  }, [selectedInvoices, activeId]);

  const totalSelectedAmount = useMemo(
    () => selectedInvoices.reduce((sum, inv) => sum + getRemaining(inv), 0),
    [selectedInvoices]
  );

  useEffect(() => {
    if (activeInvoice) {
      setAmountInput(getRemaining(activeInvoice).toString());
      setBankProofUrl(null);
      setNotes('');
    }
  }, [activeInvoice?.id]);

  useEffect(() => {
    const preselectId = searchParams.get('invoice_id');
    if (!preselectId || selectedIds.length > 0) return;
    const exists = unpaidInvoices.find(inv => inv.id === preselectId);
    if (exists) {
      setSelectedIds([preselectId]);
      setActiveId(preselectId);
    }
  }, [searchParams, unpaidInvoices, selectedIds.length]);

  const toggleSelect = (invoice) => {
    setSelectedIds(prev => {
      const exists = prev.includes(invoice.id);
      const next = exists ? prev.filter(id => id !== invoice.id) : [...prev, invoice.id];
      if (!exists) {
        setActiveId(invoice.id);
      } else if (activeId === invoice.id) {
        setActiveId(next[0] || null);
      }
      return next;
    });
  };

  const handleCopy = (field, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
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
    if (!activeInvoice) return;
    const amount = parseCurrency(amountInput);
    const remaining = getRemaining(activeInvoice);
    if (!amount || amount <= 0) {
      toast.error('Vui long nhap so tien thanh toan');
      return;
    }
    if (amount > remaining) {
      toast.error(`So tien vuot qua so no (${formatMoney(remaining)})`);
      return;
    }
    if (!bankProofUrl) {
      toast.error('Vui long tai len anh minh chung chuyen khoan');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/invoices/${activeInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          amount,
          payment_method: 'bank_transfer',
          notes: notes ? `${getTransferContent(activeInvoice)}\n${notes}` : getTransferContent(activeInvoice),
          bank_proof_url: bankProofUrl
        })
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Da gui xac nhan chuyen khoan. Trung tam se xac minh som.');
        refresh();
        setSelectedIds([]);
        setActiveId(null);
        setAmountInput('');
        setNotes('');
        setBankProofUrl(null);
      } else {
        toast.error(result.message || 'Co loi xay ra khi gui thanh toan');
      }
    } catch (err) {
      toast.error('Khong the gui thanh toan luc nay');
    } finally {
      setSubmitting(false);
    }
  };

  const parsedAmount = parseCurrency(amountInput);
  const transferContent = activeInvoice ? getTransferContent(activeInvoice) : '';
  const qrUrl = activeInvoice && config?.bankId && config?.accountNo
    ? `https://img.vietqr.io/image/${config.bankId}-${config.accountNo}-${config.template || 'compact2'}.png?amount=${parsedAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(config.accountName || '')}`
    : '';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Dang tai hoa don...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-6 bg-destructive/10 rounded-xl max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-destructive mb-2">Da co loi xay ra</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <Button onClick={refresh}>Thu lai</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Thanh toan hoc phi</h1>
        <p className="text-muted-foreground">
          Chon hoa don, quet QR va gui minh chung chuyen khoan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Invoice List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Hoa don chua thanh toan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unpaidInvoices.length > 0 ? (
              <div className="space-y-3">
                {unpaidInvoices.map((invoice) => {
                  const remaining = getRemaining(invoice);
                  const isOverdue = invoice.due_date && invoice.due_date < new Date().toISOString().split('T')[0];
                  return (
                    <div
                      key={invoice.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer',
                        selectedIds.includes(invoice.id) ? 'border-emerald-500 bg-emerald-50/40' : 'hover:bg-muted/50'
                      )}
                      onClick={() => toggleSelect(invoice)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(invoice.id)}
                        onChange={() => toggleSelect(invoice)}
                        className="h-4 w-4 rounded border-muted-foreground"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{invoice.invoice_code || `HD-${invoice.id.slice(0, 6)}`}</p>
                          <Badge variant="secondary" className={cn(
                            isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {isOverdue ? 'Qua han' : 'Cho thanh toan'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {invoice.description || invoice.class?.name || 'Hoc phi'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Han thanh toan: {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-700">{formatMoney(remaining)}</p>
                        {invoice.paid_amount > 0 && (
                          <p className="text-xs text-muted-foreground">Da dong: {formatMoney(invoice.paid_amount)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Hien tai khong co hoa don can thanh toan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checkout */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Gio thanh toan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">So hoa don da chon</span>
                <span className="font-semibold">{selectedInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tong so tien</span>
                <span className="font-semibold text-emerald-700">{formatMoney(totalSelectedAmount)}</span>
              </div>
              {selectedInvoices.length > 0 && (
                <div className="space-y-2 pt-3 border-t">
                  {selectedInvoices.map(inv => (
                    <button
                      key={inv.id}
                      onClick={() => setActiveId(inv.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors',
                        activeInvoice?.id === inv.id ? 'bg-emerald-100 text-emerald-800' : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <span className="truncate">{inv.invoice_code || inv.id.slice(0, 6)}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                Moi hoa don can chuyen khoan rieng. Noi dung chuyen khoan phai chua ma hoa don.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5" />
                Thanh toan bang QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!activeInvoice && (
                <div className="text-sm text-muted-foreground">
                  Vui long chon mot hoa don de tao QR thanh toan.
                </div>
              )}

              {activeInvoice && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hoa don</p>
                    <p className="font-semibold">{activeInvoice.invoice_code || activeInvoice.id.slice(0, 6)}</p>
                    <p className="text-sm text-muted-foreground">{activeInvoice.description || activeInvoice.class?.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">So tien can thanh toan</label>
                    <div className="mt-1">
                      <Input
                        value={formatCurrency(amountInput)}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder="Nhap so tien..."
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAmountInput(getRemaining(activeInvoice).toString())}
                        >
                          Dong du
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAmountInput(Math.round(getRemaining(activeInvoice) / 2).toString())}
                        >
                          50%
                        </Button>
                      </div>
                    </div>
                  </div>

                  {loadingConfig && (
                    <div className="text-sm text-muted-foreground">Dang tai thong tin ngan hang...</div>
                  )}
                  {configError && (
                    <div className="text-sm text-destructive">{configError}</div>
                  )}

                  {config && (
                    <div className="space-y-3">
                      <div className="rounded-lg border bg-muted/50 p-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Ngan hang</span>
                          <span className="font-medium">{config.bankId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">So tai khoan</span>
                          <button
                            className="font-medium flex items-center gap-1"
                            onClick={() => handleCopy('accountNo', config.accountNo)}
                          >
                            {config.accountNo}
                            {copiedField === 'accountNo' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Chu tai khoan</span>
                          <button
                            className="font-medium flex items-center gap-1"
                            onClick={() => handleCopy('accountName', config.accountName)}
                          >
                            {config.accountName}
                            {copiedField === 'accountName' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Noi dung</span>
                          <button
                            className="font-mono text-xs flex items-center gap-1"
                            onClick={() => handleCopy('transferContent', transferContent)}
                          >
                            {transferContent}
                            {copiedField === 'transferContent' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {qrUrl && parsedAmount > 0 && (
                        <div className="flex justify-center">
                          <div className="bg-white p-3 rounded-xl border shadow-sm">
                            <img src={qrUrl} alt="VietQR" className="w-56 h-56 object-contain" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Anh minh chung chuyen khoan</label>
                    <div className="mt-2">
                      {bankProofUrl ? (
                        <div className="relative">
                          <img src={bankProofUrl} alt="Proof" className="w-full max-h-48 object-cover rounded-lg border" />
                          <button
                            onClick={() => setBankProofUrl(null)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 border"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                          <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Keo tha hoac click de tai anh</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Ghi chu (tuy chon)</label>
                    <Textarea
                      className="mt-1"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="VD: Thanh toan dot 1, hen dong dot 2..."
                    />
                  </div>

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleSubmit}
                    disabled={submitting || !activeInvoice}
                  >
                    {submitting ? 'Dang gui...' : 'Gui xac nhan chuyen khoan'}
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
