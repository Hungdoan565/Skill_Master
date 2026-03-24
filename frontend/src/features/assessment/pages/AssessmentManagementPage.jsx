import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/features/core-gaps/utils/authFetch';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_LABELS = {
  true: 'Đang mở',
  false: 'Nháp',
};

function normalizeApiError(message, fallback) {
  if (!message || message === 'Internal server error') return fallback;
  return message;
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AssessmentManagementPage() {
  const { profile } = useAuth();
  const roleCode = profile?.roles?.code || '';
  const scopedCenterId = profile?.centerId || profile?.center_id || '';
  const defaultCenterId = roleCode === 'SUPER_ADMIN' ? scopedCenterId : (scopedCenterId || '');

  const [centerId, setCenterId] = useState(defaultCenterId);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    slug: '',
    duration_minutes: 30,
    attempts_allowed: 3,
    cooldown_hours: 24
  });
  const centerDisplayValue = roleCode === 'SUPER_ADMIN'
    ? centerId
    : (profile?.centers?.code || profile?.centers?.name || scopedCenterId || '');

  const canLoad = useMemo(() => Boolean(centerId), [centerId]);

  const loadTests = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError('');
    try {
      const scopeParam = roleCode === 'SUPER_ADMIN'
        ? `?centerId=${encodeURIComponent(centerId)}`
        : '';
      const payload = await authFetch(`/api/assessment/tests${scopeParam}`);
      setTests(payload.data || []);
    } catch (err) {
      setError(normalizeApiError(err.message, 'Không thể tải danh sách bài kiểm tra'));
    } finally {
      setLoading(false);
    }
  }, [canLoad, centerId, roleCode]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canLoad) {
      setError('Cần trung tâm hợp lệ để tạo bài kiểm tra');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await authFetch('/api/assessment/tests', {
        method: 'POST',
        body: JSON.stringify({
          ...(roleCode === 'SUPER_ADMIN' ? { centerId } : {}),
          title: form.title,
          slug: form.slug || toSlug(form.title),
          duration_minutes: Number(form.duration_minutes) || 30,
          attempts_allowed: Number(form.attempts_allowed) || 3,
          cooldown_hours: Number(form.cooldown_hours) || 24
        })
      });

      setForm({
        title: '',
        slug: '',
        duration_minutes: 30,
        attempts_allowed: 3,
        cooldown_hours: 24
      });

      await loadTests();
    } catch (err) {
      setError(normalizeApiError(err.message, 'Không thể tạo bài kiểm tra'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (test) => {
    try {
      await authFetch(`/api/assessment/tests/${test.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({
          ...(roleCode === 'SUPER_ADMIN' ? { centerId } : {}),
          publish: !test.is_active
        })
      });
      await loadTests();
    } catch (err) {
      setError(normalizeApiError(err.message, 'Không thể cập nhật trạng thái công khai'));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý bài kiểm tra</h1>
        <p className="text-sm text-muted-foreground">
          Tạo bài kiểm tra đánh giá năng lực, cấu hình thời lượng, số lần làm và quản lý trạng thái hiển thị theo trung tâm.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 md:p-5">
        <div className="mb-4 grid gap-2">
          <Label htmlFor="assessment-center-id">Trung tâm</Label>
          <Input
            id="assessment-center-id"
            value={centerDisplayValue}
            onChange={(event) => setCenterId(event.target.value)}
            placeholder="Nhập mã trung tâm"
            disabled={roleCode !== 'SUPER_ADMIN'}
          />
          <p className="text-xs text-muted-foreground">
            {roleCode === 'SUPER_ADMIN'
              ? 'Super Admin có thể nhập trung tâm cụ thể để kiểm tra dữ liệu, nhưng menu này được ưu tiên cho Center Manager.'
              : 'Dữ liệu bài kiểm tra được tự động lấy theo trung tâm hiện tại của bạn.'}
          </p>
        </div>

        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreate}>
          <div className="grid gap-2">
            <Label htmlFor="assessment-title">Tiêu đề</Label>
            <Input
              id="assessment-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Ví dụ: Kiểm tra IELTS đầu vào"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assessment-slug">Slug</Label>
            <Input
              id="assessment-slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="vi-du-kiem-tra-ielts-dau-vao"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assessment-duration">Thời lượng (phút)</Label>
            <Input
              id="assessment-duration"
              type="number"
              value={form.duration_minutes}
              onChange={(event) => setForm((prev) => ({ ...prev, duration_minutes: event.target.value }))}
              min={5}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assessment-attempts">Số lần làm</Label>
            <Input
              id="assessment-attempts"
              type="number"
              value={form.attempts_allowed}
              onChange={(event) => setForm((prev) => ({ ...prev, attempts_allowed: event.target.value }))}
              min={1}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assessment-cooldown">Cooldown (giờ)</Label>
            <Input
              id="assessment-cooldown"
              type="number"
              value={form.cooldown_hours}
              onChange={(event) => setForm((prev) => ({ ...prev, cooldown_hours: event.target.value }))}
              min={0}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving || !canLoad} className="w-full md:w-auto">
              {saving ? 'Đang tạo...' : 'Tạo bài kiểm tra'}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Danh sách bài kiểm tra</h2>
          <Button variant="outline" onClick={loadTests} disabled={loading || !canLoad}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        {!tests.length ? (
          <p className="text-sm text-muted-foreground">Chưa có bài kiểm tra nào trong trung tâm hiện tại.</p>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test.id} className="rounded-md border p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{test.title}</p>
                    <p className="text-xs text-muted-foreground">Định danh: {test.slug}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.duration_minutes} phút • tối đa {test.attempts_allowed} lượt làm • chờ {test.cooldown_hours} giờ giữa các lượt
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs ${test.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[String(Boolean(test.is_active))]}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handlePublishToggle(test)}>
                      {test.is_active ? 'Ẩn khỏi học viên' : 'Công khai cho học viên'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
