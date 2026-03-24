import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { authFetch } from '@/features/core-gaps/utils/authFetch';

const STATUS_OPTIONS = ['draft', 'active', 'amended', 'expired', 'terminated'];

const CONTRACT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'probation', label: 'Thử việc' },
  { value: 'seasonal', label: 'Thời vụ' },
];

const STATUS_LABELS = {
  draft: 'Nháp',
  active: 'Đang hiệu lực',
  amended: 'Đã sửa đổi',
  expired: 'Hết hạn',
  terminated: 'Chấm dứt',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN');
const CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function formatDate(value) {
  if (!value) return 'Không giới hạn';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : DATE_FORMATTER.format(parsed);
}

function formatCurrency(value) {
  return CURRENCY_FORMATTER.format(Number(value || 0));
}

export default function LaborContractsPage() {
  const { profile } = useAuth();
  const roleCode = profile?.roles?.code || '';
  const scopedCenterId = profile?.center_id || profile?.centerId || '';
  const defaultCenterId = roleCode === 'SUPER_ADMIN' ? scopedCenterId : (scopedCenterId || '');
  const centerDisplayValue = roleCode === 'SUPER_ADMIN'
    ? centerId
    : (profile?.centers?.code || profile?.centers?.name || scopedCenterId || '');

  const [centerId, setCenterId] = useState(defaultCenterId);
  const [contracts, setContracts] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    staff_user_id: '',
    contract_code: '',
    contract_type: 'full_time',
    effective_from: '',
    effective_to: '',
    base_salary: ''
  });

  const canLoad = useMemo(() => Boolean(centerId), [centerId]);
  const activeCount = useMemo(
    () => contracts.filter((contract) => contract.status === 'active').length,
    [contracts],
  );

  const loadStaffOptions = useCallback(async () => {
    if (!canLoad) {
      setStaffOptions([]);
      return;
    }

    try {
      const scopeParam = roleCode === 'SUPER_ADMIN'
        ? `?centerId=${encodeURIComponent(centerId)}`
        : '';
      const payload = await authFetch(`/api/admin/staff${scopeParam}`);
      const normalized = (payload.data || []).map((staff) => ({
        id: staff.id,
        full_name: staff.full_name,
        email: staff.email,
        role_code: staff.roles?.code || '',
      }));
      setStaffOptions(normalized);
      if ((payload.data || []).length === 0) {
        setError('Không có nhân sự nào thuộc trung tâm hiện tại để tạo hợp đồng');
      }
    } catch (err) {
      setStaffOptions([]);
      setError('Không thể tải danh sách nhân sự của trung tâm hiện tại' + (err?.message ? `: ${err.message}` : ''));
    }
  }, [canLoad, centerId, roleCode]);

  const loadContracts = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError('');
    try {
      const scopeParam = roleCode === 'SUPER_ADMIN'
        ? `?centerId=${encodeURIComponent(centerId)}`
        : '';
      const payload = await authFetch(`/api/admin/hr/contracts${scopeParam}`);
      setContracts(payload.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải hợp đồng');
    } finally {
      setLoading(false);
    }
  }, [canLoad, centerId, roleCode]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  useEffect(() => {
    loadStaffOptions();
  }, [loadStaffOptions]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.staff_user_id) {
      setError('Vui lòng chọn nhân sự hợp lệ từ danh sách');
      return;
    }

    try {
      await authFetch('/api/admin/hr/contracts', {
        method: 'POST',
        body: JSON.stringify({
          staff_user_id: form.staff_user_id,
          contract_code: form.contract_code,
          contract_type: form.contract_type,
          effective_from: form.effective_from,
          effective_to: form.effective_to || null,
          base_salary: Number(form.base_salary || 0)
        })
      });

      setForm({
        staff_user_id: '',
        contract_code: '',
        contract_type: 'full_time',
        effective_from: '',
        effective_to: '',
        base_salary: ''
      });
      await loadContracts();
    } catch (err) {
      setError(err.message || 'Không thể tạo hợp đồng');
    }
  };

  const transitionContract = async (contractId, toStatus) => {
    try {
      await authFetch(`/api/admin/hr/contracts/${contractId}/transition`, {
        method: 'POST',
        body: JSON.stringify({
          to_status: toStatus,
          event_type: toStatus === 'amended' ? 'amend' : toStatus === 'active' ? 'activate' : toStatus,
          reason: 'Transition from contracts workspace'
        })
      });

      await loadContracts();
    } catch (err) {
      setError(err.message || 'Không thể chuyển trạng thái hợp đồng');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hợp đồng lao động</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý vòng đời hợp đồng lao động theo trung tâm: tạo mới, kích hoạt, sửa đổi, hết hạn và chấm dứt.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="rounded-lg border border-border bg-card p-4 md:max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="contracts-center-id">Mã trung tâm</Label>
            <Input
              id="contracts-center-id"
              value={centerDisplayValue}
              onChange={(event) => setCenterId(event.target.value)}
              placeholder="Nhập mã trung tâm"
              disabled={roleCode !== 'SUPER_ADMIN'}
            />
            <p className="text-xs text-muted-foreground">
              {roleCode === 'SUPER_ADMIN'
                ? 'SUPER_ADMIN có thể nhập center id để xem dữ liệu theo từng trung tâm.'
                : 'Dữ liệu hợp đồng sẽ tự động tải theo trung tâm hiện tại của bạn.'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Tổng hợp đồng</p>
          <p className="mt-2 text-2xl font-bold">{contracts.length}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Đang hiệu lực</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
      </div>

      <form className="rounded-lg border border-border bg-card p-4 md:p-5" onSubmit={handleCreate}>
        <h2 className="mb-4 text-lg font-semibold">Tạo hợp đồng</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="contract-staff-user-id">Mã nhân sự</Label>
            <Select
              value={form.staff_user_id}
              onValueChange={(value) => setForm((prev) => ({ ...prev, staff_user_id: value }))}
            >
              <SelectTrigger id="contract-staff-user-id">
                <SelectValue placeholder="Chọn nhân sự" />
              </SelectTrigger>
              <SelectContent>
                {staffOptions.length === 0 ? null : staffOptions.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name || staff.email || staff.id} {staff.role_code ? `• ${staff.role_code}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Chỉ hiển thị nhân sự thuộc trung tâm hiện tại để tránh nhập sai `user id`.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-code">Mã hợp đồng</Label>
            <Input
              id="contract-code"
              value={form.contract_code}
              onChange={(event) => setForm((prev) => ({ ...prev, contract_code: event.target.value }))}
              placeholder="Ví dụ: HDLD-2026-001"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-type">Loại hợp đồng</Label>
            <Select
              value={form.contract_type}
              onValueChange={(value) => setForm((prev) => ({ ...prev, contract_type: value }))}
            >
              <SelectTrigger id="contract-type">
                <SelectValue placeholder="Chọn loại hợp đồng" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-effective-from">Hiệu lực từ ngày</Label>
            <Input
              id="contract-effective-from"
              type="date"
              value={form.effective_from}
              onChange={(event) => setForm((prev) => ({ ...prev, effective_from: event.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-effective-to">Hiệu lực đến ngày</Label>
            <Input
              id="contract-effective-to"
              type="date"
              value={form.effective_to}
              onChange={(event) => setForm((prev) => ({ ...prev, effective_to: event.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-base-salary">Lương cơ bản</Label>
            <Input
              id="contract-base-salary"
              type="number"
              value={form.base_salary}
              onChange={(event) => setForm((prev) => ({ ...prev, base_salary: event.target.value }))}
              placeholder="Ví dụ: 12000000"
            />
            <p className="text-xs text-muted-foreground">{formatCurrency(form.base_salary || 0)}</p>
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={!canLoad}>Tạo hợp đồng</Button>
      </form>

      <div className="rounded-lg border border-border bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Danh sách hợp đồng</h2>
          <Button variant="outline" onClick={loadContracts} disabled={loading || !canLoad}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        {!contracts.length ? (
          <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Chưa có hợp đồng nào trong trung tâm hiện tại.
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div key={contract.id} className="rounded-md border p-3">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{contract.contract_code}</p>
                    <p className="text-xs text-muted-foreground">
                      Nhân sự: {contract.users?.full_name || contract.staff_user_id} • Lương cơ bản: {formatCurrency(contract.base_salary)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(contract.effective_from)} - {formatDate(contract.effective_to)}
                    </p>
                  </div>
                  <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{STATUS_LABELS[contract.status] || contract.status}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter((status) => status !== contract.status).map((status) => (
                    <Button key={status} variant="outline" size="sm" onClick={() => transitionContract(contract.id, status)}>
                      {STATUS_LABELS[status] || status}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
