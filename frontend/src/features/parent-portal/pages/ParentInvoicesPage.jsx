import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParentChildren, useParentChildInvoices, useParentPaymentConfig } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Receipt, AlertCircle, Clock, CheckCircle2, FileText, Calendar,
  Wallet, ChevronDown, ChevronUp, CreditCard, Building2, Copy,
  AlertTriangle, BadgeCheck, Hourglass, Ban, Info, QrCode,
  Check, Upload, X, SendHorizontal, PartyPopper, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getInvoiceUrgency } from '../utils/normalizers';
import { buildInvoiceGroups, buildHouseholdFinanceSummary, getPriorityInvoice } from '../utils/insights';

// ─── Helpers ────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '--/--/----';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const parseCurrencyInput = (value) => {
  const num = String(value).replace(/[^0-9]/g, '');
  return num ? parseInt(num) : 0;
};

const formatCurrencyInput = (value) => {
  const num = String(value).replace(/[^0-9]/g, '');
  return num ? parseInt(num).toLocaleString('vi-VN') : '';
};

const getVerificationLabel = (status) => {
  if (status === 'verified') return 'Đã xác nhận';
  if (status === 'pending') return 'Chờ xác nhận';
  if (status === 'rejected') return 'Từ chối';
  return 'Chưa xác nhận';
};

const getVerificationVariant = (status) => {
  if (status === 'verified') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rejected') return 'destructive';
  return 'secondary';
};

const getStatusConfig = (status) => {
  const map = {
    paid: { label: 'Đã thanh toán', variant: 'success', icon: CheckCircle2 },
    overdue: { label: 'Quá hạn', variant: 'destructive', icon: AlertCircle },
    partial: { label: 'Thanh toán một phần', variant: 'warning', icon: Hourglass },
    pending: { label: 'Chờ xác nhận', variant: 'warning', icon: Clock },
    unpaid: { label: 'Chờ thanh toán', variant: 'warning', icon: Clock },
    cancelled: { label: 'Đã hủy', variant: 'secondary', icon: Ban },
  };
  return map[status] || map.unpaid;
};

const getDueDateLabel = (invoice) => {
  const urgency = getInvoiceUrgency(invoice);
  if (urgency === 'overdue') return 'Đã quá hạn';
  if (urgency === 'due-soon') {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const due = new Date(invoice.due_date); due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hạn thanh toán hôm nay';
    if (diff === 1) return 'Hạn thanh toán ngày mai';
    return `Còn ${diff} ngày`;
  }
  return `Hạn: ${formatDate(invoice.due_date)}`;
};

const getPendingAmount = (invoice) => {
  if (!invoice.payments || !Array.isArray(invoice.payments)) return 0;
  return invoice.payments
    .filter(p => p.verification_status === 'pending')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
};

const getRemaining = (invoice) => {
  const total = invoice.final_amount ?? invoice.total_amount ?? 0;
  const paid = invoice.paid_amount ?? 0;
  const pending = getPendingAmount(invoice);
  return Math.max(total - paid - pending, 0);
};

const getTransferContent = (invoices) => {
  if (!invoices || invoices.length === 0) return '';
  if (invoices.length === 1) {
    const inv = invoices[0];
    return inv.invoice_number || inv.invoice_code
      ? `HP ${inv.invoice_number || inv.invoice_code}`
      : `HP ${(inv.id || '').slice(0, 6)}`;
  }
  const codes = invoices.map(inv => inv.invoice_number || inv.invoice_code || (inv.id || '').slice(0, 6)).join(' ');
  return `HP ${codes}`;
};

const generateVietQRUrl = (config, amount, content) => {
  if (!config?.bankId || !config?.accountNo || !amount || amount <= 0) return '';
  const template = config.template || 'compact2';
  return `https://img.vietqr.io/image/${config.bankId}-${config.accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(config.accountName || '')}`;
};

// ─── Sub-components ─────────────────────────────────────────────

function ChildSelector({ children, selectedId, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {children.map(child => (
        <button
          key={child.id}
          onClick={() => onSelect(child.id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all',
            selectedId === child.id
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-400'
          )}
        >
          {child.full_name}
        </button>
      ))}
    </div>
  );
}

function HouseholdSummary({ children }) {
  const summary = useMemo(() => buildHouseholdFinanceSummary(children), [children]);
  if (summary.childrenCount <= 1) return null;

  return (
    <Card className="border-orange-200/60 bg-gradient-to-br from-orange-50/80 to-amber-50/60 dark:from-orange-950/30 dark:to-amber-950/20">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Tổng quan học phí gia đình</h3>
            <p className="text-sm text-muted-foreground">Tổng hợp tất cả học viên được liên kết</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 border border-orange-100/50">
            <p className="text-xs text-muted-foreground">Học viên liên kết</p>
            <p className="text-lg font-bold mt-0.5">{summary.childrenCount}</p>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 border border-orange-100/50">
            <p className="text-xs text-muted-foreground">Có khoản cần trả</p>
            <p className="text-lg font-bold mt-0.5 text-amber-600">{summary.childrenWithDebtCount}</p>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 border border-orange-100/50">
            <p className="text-xs text-muted-foreground">Hóa đơn cần xử lý</p>
            <p className="text-lg font-bold mt-0.5 text-orange-600">{summary.totalOutstandingInvoices}</p>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 border border-orange-100/50">
            <p className="text-xs text-muted-foreground">Tổng dư nợ</p>
            <p className="text-lg font-bold mt-0.5 text-red-600">{formatCurrency(summary.totalOutstanding)}</p>
          </div>
        </div>
        {summary.childrenWithDebt.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {summary.childrenWithDebt.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm px-1">
                <span className="text-muted-foreground">{c.name}</span>
                <span className="font-medium text-orange-600">{c.invoiceCount} khoản • {formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriorityAlert({ invoice }) {
  if (!invoice) return null;
  const urgency = getInvoiceUrgency(invoice);
  if (urgency === 'paid' || urgency === 'cancelled') return null;
  const remaining = getRemaining(invoice);
  const isOverdue = urgency === 'overdue';
  const isDueSoon = urgency === 'due-soon';
  if (!isOverdue && !isDueSoon) return null;

  return (
    <div className={cn(
      'rounded-xl border-l-4 p-4',
      isOverdue
        ? 'bg-red-50 border-l-red-500 dark:bg-red-950/30'
        : 'bg-amber-50 border-l-amber-500 dark:bg-amber-950/30'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg mt-0.5', isOverdue ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600')}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn('font-semibold text-base', isOverdue ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300')}>
            {isOverdue ? 'Có khoản học phí quá hạn' : 'Sắp đến hạn thanh toán'}
          </h4>
          <p className={cn('text-sm mt-1', isOverdue ? 'text-red-700/80 dark:text-red-400/80' : 'text-amber-700/80 dark:text-amber-400/80')}>
            {invoice.invoice_number || invoice.invoice_code || 'Hóa đơn'} — <span className="font-semibold">{formatCurrency(remaining)}</span> còn cần thanh toán. {getDueDateLabel(invoice)}.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCards({ summary, invoices }) {
  const totalAmount = summary?.totalAmount ?? (invoices?.reduce((s, i) => s + (i.final_amount || i.total_amount || 0), 0) || 0);
  const paidAmount = summary?.totalPaid ?? (invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + (i.final_amount || i.total_amount || 0), 0) || 0);
  const unpaidAmount = summary?.totalRemaining ?? (totalAmount - paidAmount);
  const overdueCount = invoices?.filter(i => getInvoiceUrgency(i) === 'overdue').length || 0;

  const cards = [
    { label: 'Tổng học phí', value: formatCurrency(totalAmount), icon: Wallet, color: 'bg-muted text-muted-foreground' },
    { label: 'Đã thanh toán', value: formatCurrency(paidAmount), icon: CheckCircle2, color: 'bg-green-500/10 text-green-600' },
    { label: 'Cần thanh toán', value: formatCurrency(unpaidAmount > 0 ? unpaidAmount : 0), icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Quá hạn', value: overdueCount, icon: AlertCircle, color: 'bg-red-500/10 text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{c.label}</p>
                <p className={cn('text-lg font-bold', c.color.includes('green') && 'text-green-600', c.color.includes('amber') && 'text-amber-600', c.color.includes('red') && 'text-red-600')}>
                  {c.value}
                </p>
              </div>
              <div className={cn('p-2 rounded-lg', c.color)}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InvoiceCard({ invoice, isExpanded, onToggle, isSelectable, isSelected, onSelect }) {
  const amount = invoice.final_amount || invoice.total_amount || 0;
  const paid = invoice.paid_amount || 0;
  const remaining = getRemaining(invoice);
  const statusCfg = getStatusConfig(invoice.status);
  const urgency = getInvoiceUrgency(invoice);
  const StatusIcon = statusCfg.icon;

  return (
    <Card className={cn(
      'border-l-4 overflow-hidden transition-all',
      isSelected && 'ring-2 ring-emerald-500 shadow-sm',
      urgency === 'overdue' ? 'border-l-red-500' :
        urgency === 'due-soon' ? 'border-l-amber-500' :
          urgency === 'pending' ? 'border-l-blue-400' :
            urgency === 'unpaid' ? 'border-l-yellow-500' :
              invoice.status === 'paid' ? 'border-l-green-500' : 'border-l-muted-foreground'
    )}>
      <div className="flex items-stretch">
        {/* Checkbox — completely outside the expand button */}
        {isSelectable && (
          <div
            onClick={() => onSelect(invoice)}
            className={cn(
              'flex items-center justify-center w-12 shrink-0 cursor-pointer border-r transition-colors',
              isSelected
                ? 'bg-emerald-50 dark:bg-emerald-950/30'
                : 'hover:bg-muted/40'
            )}
          >
            <div className={cn(
              'flex items-center justify-center w-5 h-5 rounded border-2 transition-colors',
              isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30'
            )}>
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>
          </div>
        )}

        {/* Expand/collapse button — separate from checkbox */}
        <button onClick={onToggle} className="flex-1 text-left p-4 sm:p-5 hover:bg-muted/30 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-base flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  {invoice.invoice_number || invoice.invoice_code || 'Hóa đơn'}
                </h4>
                <Badge variant={statusCfg.variant} className="shrink-0">
                  <StatusIcon className="h-3 w-3 mr-1" />{statusCfg.label}
                </Badge>
                {(urgency === 'overdue' || urgency === 'due-soon') && (
                  <Badge variant={urgency === 'overdue' ? 'destructive' : 'warning'} className="shrink-0 text-xs">{getDueDateLabel(invoice)}</Badge>
                )}
              </div>
              {invoice.className && (
                <p className="text-sm text-muted-foreground">{invoice.courseTitle ? `${invoice.courseTitle} — ` : ''}Lớp: {invoice.className}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{getDueDateLabel(invoice)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Còn lại</p>
                <p className={cn('text-lg font-bold', remaining > 0 ? 'text-orange-600' : 'text-green-600')}>
                  {formatCurrency(remaining > 0 ? remaining : 0)}
                </p>
              </div>
              <div className="text-muted-foreground">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="border-t bg-muted/20 p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Tổng tiền</p>
              <p className="font-semibold">{formatCurrency(amount)}</p>
            </div>
            {invoice.discount_amount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Giảm giá</p>
                <p className="font-semibold text-green-600">-{formatCurrency(invoice.discount_amount)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Đã thanh toán</p>
              <p className="font-semibold text-green-600">{formatCurrency(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Còn lại</p>
              <p className={cn('font-semibold', remaining > 0 ? 'text-orange-600' : 'text-foreground')}>{formatCurrency(remaining > 0 ? remaining : 0)}</p>
            </div>
          </div>
          {invoice.description && (
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Mô tả</p>
              <p className="text-sm">{invoice.description}</p>
            </div>
          )}
          {invoice.payments && invoice.payments.length > 0 ? (
            <div>
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-muted-foreground" />Lịch sử thanh toán ({invoice.payments.length})
              </h5>
              <div className="space-y-2">
                {invoice.payments.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center justify-between rounded-lg border bg-white/60 dark:bg-white/5 p-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        <Badge variant={getVerificationVariant(p.verification_status)} className="text-xs">{getVerificationLabel(p.verification_status)}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{formatDate(p.payment_date)}</span>
                        {p.payment_method && <span>• {p.payment_method}</span>}
                        {p.reference_code && <span>• Ref: {p.reference_code}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : remaining > 0 && (
            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-center text-sm text-muted-foreground">
              Chưa có bản ghi thanh toán nào.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function InvoiceGroup({ title, icon: Icon, invoices, defaultOpen, color, selectable, selectedIds, onSelectInvoice }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [expandedId, setExpandedId] = useState(null);

  if (invoices.length === 0) return null;

  const totalRemaining = invoices.reduce((sum, inv) => {
    const r = getRemaining(inv);
    return sum + (r > 0 ? r : 0);
  }, 0);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-2 px-1 group">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', color)} />
          <h3 className="font-semibold text-base">{title}</h3>
          <Badge variant="secondary" className="text-xs">{invoices.length}</Badge>
          {totalRemaining > 0 && (
            <span className="text-sm text-muted-foreground hidden sm:inline">• {formatCurrency(totalRemaining)}</span>
          )}
        </div>
        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>
      {isOpen && (
        <div className="space-y-3 mt-2">
          {invoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              isExpanded={expandedId === inv.id}
              onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
              isSelectable={selectable}
              isSelected={selectedIds?.includes(inv.id)}
              onSelect={onSelectInvoice}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentPanel({ config, configLoading, selectedInvoices, onClearSelection, onPaymentSuccess }) {
  const { session } = useAuth();
  const [customAmount, setCustomAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [bankProofUrl, setBankProofUrl] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = useMemo(
    () => selectedInvoices.reduce((sum, inv) => sum + getRemaining(inv), 0),
    [selectedInvoices]
  );

  const paymentAmount = useMemo(() => {
    const custom = parseCurrencyInput(customAmount);
    return custom > 0 ? custom : totalAmount;
  }, [customAmount, totalAmount]);

  const transferContent = useMemo(() => getTransferContent(selectedInvoices), [selectedInvoices]);

  const qrUrl = useMemo(
    () => generateVietQRUrl(config, paymentAmount, transferContent),
    [config, paymentAmount, transferContent]
  );

  useEffect(() => {
    setCustomAmount('');
    setBankProofUrl(null);
  }, [selectedInvoices.length]);

  const handleCopy = (field, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {});
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBankProofUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedInvoices.length || paymentAmount <= 0) return;
    if (!bankProofUrl) return;

    setSubmitting(true);
    try {
      let remainingPayment = paymentAmount;
      let successCount = 0;

      for (const invoice of selectedInvoices) {
        if (remainingPayment <= 0) break;
        const invoiceRemaining = getRemaining(invoice);
        const amountForThis = Math.min(remainingPayment, invoiceRemaining);
        if (amountForThis <= 0) continue;

        const res = await fetch(`${API_URL}/api/invoices/${invoice.id}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            amount: amountForThis,
            payment_method: 'bank_transfer',
            notes: notes ? `${transferContent}\n${notes}` : transferContent,
            bank_proof_url: bankProofUrl,
          }),
        });
        const result = await res.json();
        if (result.success) {
          remainingPayment -= amountForThis;
          successCount++;
        }
      }

      if (successCount > 0) {
        onPaymentSuccess({ count: successCount, amount: paymentAmount });
      }
    } catch {
      // Error handled silently — user sees no success state
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedInvoices.length === 0) {
    return (
      <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-50/40 to-slate-50/30 dark:from-emerald-950/20 dark:to-slate-950/10">
        <CardContent className="p-6 text-center">
          <QrCode className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">Chọn hóa đơn ở cột "Cần thanh toán" để tạo mã QR</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection summary */}
      <Card className="border-emerald-200/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-5 w-5" />Giỏ thanh toán
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>Bỏ chọn</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hóa đơn đã chọn</span>
            <span className="font-semibold">{selectedInvoices.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tổng số tiền</span>
            <span className="font-bold text-lg text-emerald-600">{formatCurrency(totalAmount)}</span>
          </div>
          {selectedInvoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 text-sm">
              <span className="truncate font-medium">{inv.invoice_number || inv.invoice_code || (inv.id || '').slice(0, 8)}</span>
              <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(getRemaining(inv))}</span>
            </div>
          ))}
          {selectedInvoices.length > 1 && (
            <div className="text-xs text-muted-foreground bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <strong>Thanh toán gộp:</strong> Quét 1 mã QR để thanh toán tất cả hóa đơn đã chọn.
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR + Bank info */}
      <Card className="border-emerald-200/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-5 w-5" />Thanh toán bằng QR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount */}
          <div>
            <label className="text-sm font-medium">Số tiền thanh toán</label>
            <div className="mt-1">
              <Input
                value={customAmount ? formatCurrencyInput(customAmount) : formatCurrency(totalAmount)}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Nhập số tiền..."
                className="text-right font-semibold"
              />
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCustomAmount('')}
                  className={!customAmount ? 'ring-2 ring-emerald-500' : ''}>Đóng đủ</Button>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setCustomAmount(Math.round(totalAmount / 2).toString())}>50%</Button>
              </div>
            </div>
          </div>

          {configLoading && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              Đang tải thông tin ngân hàng...
            </div>
          )}

          {!configLoading && !config && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              Trung tâm chưa cấu hình thông tin ngân hàng.
            </div>
          )}

          {config && (
            <div className="space-y-4">
              {/* Bank details */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                {(config.bankName || config.bankId) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ngân hàng</span>
                    <span className="font-medium">{config.bankName || config.bankId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Số tài khoản</span>
                  <button className="font-mono font-semibold flex items-center gap-1 hover:text-primary transition-colors"
                    onClick={() => handleCopy('accountNo', config.accountNo)}>
                    {config.accountNo}
                    {copiedField === 'accountNo' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {config.accountName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Chủ tài khoản</span>
                    <button className="font-medium flex items-center gap-1 hover:text-primary transition-colors"
                      onClick={() => handleCopy('accountName', config.accountName)}>
                      {config.accountName}
                      {copiedField === 'accountName' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Nội dung CK</span>
                  <button className="font-mono text-xs bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1 hover:bg-amber-500/20 transition-colors"
                    onClick={() => handleCopy('transferContent', transferContent)}>
                    {transferContent}
                    {copiedField === 'transferContent' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {qrUrl && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl border-2 border-dashed border-emerald-500/20 shadow-sm">
                    <img src={qrUrl} alt="Mã QR thanh toán" className="w-64 h-64 object-contain" />
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Quét mã để thanh toán {formatCurrency(paymentAmount)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Proof upload */}
          <div>
            <label className="text-sm font-medium">Ảnh minh chứng chuyển khoản</label>
            <div className="mt-2">
              {bankProofUrl ? (
                <div className="relative">
                  <img src={bankProofUrl} alt="Minh chứng" className="w-full max-h-48 object-cover rounded-lg border" />
                  <button onClick={() => setBankProofUrl(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 border hover:bg-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-slate-50 transition-colors">
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
            <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Thanh toán đợt 1, hẹn đóng đợt 2..." />
          </div>

          {/* Submit */}
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
            onClick={handleSubmit}
            disabled={submitting || !selectedInvoices.length || !bankProofUrl}
          >
            {submitting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Đang gửi...</>
            ) : (
              <><SendHorizontal className="h-5 w-5 mr-2" />Gửi xác nhận thanh toán</>
            )}
          </Button>
          {!bankProofUrl && selectedInvoices.length > 0 && (
            <p className="text-xs text-center text-muted-foreground">Tải ảnh minh chứng chuyển khoản để tiếp tục</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SuccessState({ count, amount, onBack }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-5">
        <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <PartyPopper className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Gửi thành công!</h2>
          <p className="text-muted-foreground">
            Đã gửi xác nhận thanh toán {formatCurrency(amount)} cho {count} hóa đơn.
            Trung tâm sẽ xác minh trong thời gian sớm nhất.
          </p>
        </div>
        <Button onClick={onBack} variant="outline" className="mx-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />Quay lại
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function ParentInvoicesPage() {
  const { children, loading: childrenLoading, error: childrenError } = useParentChildren();
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  // Clear selection when switching child
  useEffect(() => {
    setSelectedInvoiceIds([]);
    setSuccessInfo(null);
  }, [selectedChildId]);

  const { invoices, summary, loading: invoicesLoading, error: invoicesError, refresh } = useParentChildInvoices(selectedChildId);
  const { config: paymentConfig, loading: configLoading } = useParentPaymentConfig();

  const invoiceGroups = useMemo(() => buildInvoiceGroups(invoices), [invoices]);
  const priorityInvoice = useMemo(() => getPriorityInvoice(invoices), [invoices]);

  // Selected invoices for payment
  const payableInvoices = useMemo(
    () => [...invoiceGroups.actionRequired].filter(inv => getRemaining(inv) > 0),
    [invoiceGroups.actionRequired]
  );
  const selectedInvoices = useMemo(
    () => payableInvoices.filter(inv => selectedInvoiceIds.includes(inv.id)),
    [payableInvoices, selectedInvoiceIds]
  );

  const toggleSelectInvoice = useCallback((invoice) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(invoice.id) ? prev.filter(id => id !== invoice.id) : [...prev, invoice.id]
    );
  }, []);

  const handlePaymentSuccess = useCallback((info) => {
    setSuccessInfo(info);
    setSelectedInvoiceIds([]);
    refresh();
  }, [refresh]);

  const handleBackFromSuccess = useCallback(() => {
    setSuccessInfo(null);
    refresh();
  }, [refresh]);

  if (childrenLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Đang tải thông tin học phí...</p>
        </div>
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Không thể tải danh sách học viên liên kết</p>
          <p className="mt-1">{childrenError}</p>
        </div>
      </div>
    );
  }

  if (successInfo) {
    return (
      <div className="p-6">
        <SuccessState count={successInfo.count} amount={successInfo.amount} onBack={handleBackFromSuccess} />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
          <Receipt className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Học phí & thanh toán</h1>
          <p className="text-sm text-muted-foreground">Theo dõi, chuyển khoản và xác nhận thanh toán cho học viên</p>
        </div>
      </div>

      {children.length > 1 && <HouseholdSummary children={children} />}

      {children.length > 0 ? (
        <ChildSelector children={children} selectedId={selectedChildId} onSelect={setSelectedChildId} />
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
          <Receipt className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <h3 className="text-base font-semibold text-foreground">Chưa có học viên được liên kết</h3>
          <p className="mt-1 text-sm">Vui lòng liên hệ trung tâm để cập nhật liên kết phụ huynh.</p>
        </div>
      )}

      {children.length === 0 ? null : invoicesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">Đang tải hóa đơn...</p>
          </div>
        </div>
      ) : invoicesError ? (
        <div className="text-center text-red-500 py-8">{invoicesError}</div>
      ) : (
        <div className="space-y-5">
          <PriorityAlert invoice={priorityInvoice} />
          <StatCards summary={summary} invoices={invoices} />

          {invoices?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Invoice groups — left side */}
              <div className="lg:col-span-3 space-y-6">
                {payableInvoices.length > 0 && (
                  <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-muted-foreground">
                      {selectedInvoiceIds.length > 0
                        ? `${selectedInvoiceIds.length} hóa đơn đã chọn`
                        : 'Tick chọn hóa đơn để thanh toán →'}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedInvoiceIds(payableInvoices.map(i => i.id))}>
                        Chọn tất cả
                      </Button>
                      {selectedInvoiceIds.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedInvoiceIds([])}>Bỏ chọn</Button>
                      )}
                    </div>
                  </div>
                )}

                <InvoiceGroup
                  title="Cần thanh toán"
                  icon={AlertCircle}
                  invoices={invoiceGroups.actionRequired}
                  defaultOpen={true}
                  color="text-red-500"
                  selectable={true}
                  selectedIds={selectedInvoiceIds}
                  onSelectInvoice={toggleSelectInvoice}
                />
                <InvoiceGroup
                  title="Đang chờ xác nhận"
                  icon={Clock}
                  invoices={invoiceGroups.pendingVerification}
                  defaultOpen={invoiceGroups.pendingVerification.length > 0}
                  color="text-blue-500"
                  selectable={false}
                  selectedIds={[]}
                  onSelectInvoice={() => {}}
                />
                <InvoiceGroup
                  title="Đã hoàn tất"
                  icon={CheckCircle2}
                  invoices={invoiceGroups.completed}
                  defaultOpen={false}
                  color="text-green-500"
                  selectable={false}
                  selectedIds={[]}
                  onSelectInvoice={() => {}}
                />
              </div>

              {/* Payment panel — right side, sticky */}
              <div className="lg:col-span-2 lg:sticky lg:top-6 self-start">
                <PaymentPanel
                  config={paymentConfig}
                  configLoading={configLoading}
                  selectedInvoices={selectedInvoices}
                  onClearSelection={() => setSelectedInvoiceIds([])}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground">Chưa có hóa đơn</h3>
              <p className="text-sm text-muted-foreground mt-1">Trung tâm chưa phát hành hóa đơn cho học viên này.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
