import { useState, useEffect } from 'react';
import { useParentChildren, useParentChildInvoices } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, AlertCircle, Clock, CheckCircle2, FileText, Calendar, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0đ';
  return amount.toLocaleString('vi-VN') + 'đ';
};

const formatDate = (dateString) => {
  if (!dateString) return '--/--/----';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const ChildSelector = ({ children, selectedId, onSelect }) => (
  <div className="flex gap-2 flex-wrap mb-6">
    {children.map(child => (
      <button
        key={child.id}
        onClick={() => onSelect(child.id)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedId === child.id
            ? 'bg-orange-500 text-white'
            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
        }`}
      >
        {child.full_name}
      </button>
    ))}
  </div>
);

export default function ParentInvoicesPage() {
  const { children, loading: childrenLoading, error: childrenError } = useParentChildren();
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const { invoices, loading: invoicesLoading, error: invoicesError } = useParentChildInvoices(selectedChildId);

  if (childrenLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (childrenError) {
    return <div className="p-6 text-center text-red-500">{childrenError}</div>;
  }

  const totalAmount = invoices?.reduce((sum, inv) => sum + (inv.final_amount || inv.total_amount || 0), 0) || 0;
  const paidAmount = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.final_amount || inv.total_amount || 0), 0) || 0;
  const unpaidAmount = invoices?.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.final_amount || inv.total_amount || 0), 0) || 0;
  const overdueAmount = invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.final_amount || inv.total_amount || 0), 0) || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600">
          <Receipt className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Học phí</h1>
      </div>

      <ChildSelector 
        children={children} 
        selectedId={selectedChildId} 
        onSelect={setSelectedChildId} 
      />

      {invoicesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : invoicesError ? (
        <div className="text-center text-red-500 py-8">{invoicesError}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Tổng học phí</p>
                    <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Đã thanh toán</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Chưa thanh toán</p>
                    <p className="text-xl font-bold text-amber-600">{formatCurrency(unpaidAmount)}</p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Quá hạn</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(overdueAmount)}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {invoices?.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg px-1">Danh sách hóa đơn</h3>
              {invoices.map((inv) => {
                const amount = inv.final_amount || inv.total_amount || 0;
                const paid = inv.paid_amount || 0;
                const remaining = amount - paid;
                
                return (
                  <Card key={inv.id} className={cn(
                    "border-l-4 overflow-hidden transition-all hover:shadow-md",
                    inv.status === 'paid' ? 'border-l-green-500' : 
                    inv.status === 'pending' ? 'border-l-yellow-500' :
                    inv.status === 'overdue' ? 'border-l-red-500' :
                    'border-l-gray-400'
                  )}>
                    <CardContent className="p-0">
                      <div className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between md:justify-start gap-3">
                              <h4 className="font-bold text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                {inv.invoice_number || inv.invoice_code || 'Hóa đơn'}
                              </h4>
                              <Badge variant={
                                inv.status === 'paid' ? 'success' : 
                                inv.status === 'overdue' ? 'destructive' : 
                                inv.status === 'pending' ? 'warning' : 'secondary'
                              }>
                                {inv.status === 'paid' ? 'Đã thanh toán' : 
                                 inv.status === 'pending' ? 'Chờ thanh toán' : 
                                 inv.status === 'overdue' ? 'Quá hạn' : 'Đã hủy'}
                              </Badge>
                            </div>
                            
                            {inv.className && (
                              <p className="text-sm text-gray-600 font-medium">Lớp/Khóa: {inv.className}</p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Hạn: {formatDate(inv.due_date)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl md:min-w-[200px] border">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tổng tiền:</span>
                                <span className="font-medium">{formatCurrency(amount)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Đã trả:</span>
                                <span className="font-medium text-green-600">{formatCurrency(paid)}</span>
                              </div>
                              <div className="pt-2 border-t flex justify-between">
                                <span className="text-sm font-medium">Còn lại:</span>
                                <span className={cn(
                                  "font-bold",
                                  remaining > 0 ? "text-orange-600" : "text-gray-900 dark:text-gray-100"
                                )}>
                                  {formatCurrency(remaining > 0 ? remaining : 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground">Chưa có hóa đơn</h3>
            </div>
          )}
        </>
      )}
    </div>
  );
}
