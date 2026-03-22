import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { authFetch } from '@/features/core-gaps/utils/authFetch';

const STATUS_OPTIONS = ['draft', 'active', 'amended', 'expired', 'terminated'];

export default function LaborContractsPage() {
  const { profile } = useAuth();
  const defaultCenterId = profile?.center_id || profile?.centerId || '';

  const [centerId, setCenterId] = useState(defaultCenterId);
  const [contracts, setContracts] = useState([]);
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

  const loadContracts = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError('');
    try {
      const payload = await authFetch(`/api/admin/hr/contracts?centerId=${encodeURIComponent(centerId)}`);
      setContracts(payload.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải hợp đồng');
    } finally {
      setLoading(false);
    }
  }, [canLoad, centerId]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await authFetch('/api/admin/hr/contracts', {
        method: 'POST',
        body: JSON.stringify({
          centerId,
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
          centerId,
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
        <h1 className="text-2xl font-bold tracking-tight">Labor Contracts</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý vòng đời hợp đồng lao động: tạo mới, kích hoạt, sửa đổi, hết hạn, chấm dứt.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 md:max-w-md">
        <div className="grid gap-2">
          <Label htmlFor="contracts-center-id">Center ID</Label>
          <Input
            id="contracts-center-id"
            value={centerId}
            onChange={(event) => setCenterId(event.target.value)}
            placeholder="Nhập center id"
          />
        </div>
      </div>

      <form className="rounded-lg border border-border bg-card p-4 md:p-5" onSubmit={handleCreate}>
        <h2 className="mb-4 text-lg font-semibold">Tạo hợp đồng</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="contract-staff-user-id">Staff User ID</Label>
            <Input
              id="contract-staff-user-id"
              value={form.staff_user_id}
              onChange={(event) => setForm((prev) => ({ ...prev, staff_user_id: event.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-code">Contract Code</Label>
            <Input
              id="contract-code"
              value={form.contract_code}
              onChange={(event) => setForm((prev) => ({ ...prev, contract_code: event.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-type">Contract Type</Label>
            <Input
              id="contract-type"
              value={form.contract_type}
              onChange={(event) => setForm((prev) => ({ ...prev, contract_type: event.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-effective-from">Effective From</Label>
            <Input
              id="contract-effective-from"
              type="date"
              value={form.effective_from}
              onChange={(event) => setForm((prev) => ({ ...prev, effective_from: event.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-effective-to">Effective To</Label>
            <Input
              id="contract-effective-to"
              type="date"
              value={form.effective_to}
              onChange={(event) => setForm((prev) => ({ ...prev, effective_to: event.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract-base-salary">Base Salary</Label>
            <Input
              id="contract-base-salary"
              type="number"
              value={form.base_salary}
              onChange={(event) => setForm((prev) => ({ ...prev, base_salary: event.target.value }))}
            />
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
          <p className="text-sm text-muted-foreground">Chưa có hợp đồng nào.</p>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div key={contract.id} className="rounded-md border p-3">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{contract.contract_code}</p>
                    <p className="text-xs text-muted-foreground">
                      Staff: {contract.staff_user_id} • Salary: {contract.base_salary}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contract.effective_from} - {contract.effective_to || 'Open'}
                    </p>
                  </div>
                  <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{contract.status}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter((status) => status !== contract.status).map((status) => (
                    <Button key={status} variant="outline" size="sm" onClick={() => transitionContract(contract.id, status)}>
                      {status}
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
