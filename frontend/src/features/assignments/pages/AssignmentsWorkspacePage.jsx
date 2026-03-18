import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { authFetch } from '@/features/core-gaps/utils/authFetch';

export default function AssignmentsWorkspacePage() {
  const { profile } = useAuth();
  const role = profile?.role_code || profile?.roleCode || '';
  const defaultCenterId = profile?.center_id || profile?.centerId || '';

  const [centerId, setCenterId] = useState(defaultCenterId);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [createForm, setCreateForm] = useState({
    class_id: '',
    title: '',
    instructions: '',
    due_at: ''
  });
  const [submitForm, setSubmitForm] = useState({});
  const [gradeForm, setGradeForm] = useState({});

  const isStudent = role === 'STUDENT';
  const isCreator = ['SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER'].includes(role);

  const canLoad = useMemo(() => Boolean(centerId), [centerId]);

  const loadAssignments = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError('');
    try {
      const payload = await authFetch(`/api/assignments?centerId=${encodeURIComponent(centerId)}`);
      setAssignments(payload.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải assignments');
    } finally {
      setLoading(false);
    }
  }, [canLoad, centerId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!isCreator) return;

    try {
      await authFetch('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          centerId,
          class_id: createForm.class_id,
          title: createForm.title,
          instructions: createForm.instructions,
          due_at: createForm.due_at || null,
          status: 'published'
        })
      });

      setCreateForm({ class_id: '', title: '', instructions: '', due_at: '' });
      await loadAssignments();
    } catch (err) {
      setError(err.message || 'Không thể tạo assignment');
    }
  };

  const handleSubmit = async (assignmentId) => {
    try {
      const contentText = submitForm[assignmentId] || '';
      await authFetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          centerId,
          content: { text: contentText }
        })
      });

      await loadAssignments();
    } catch (err) {
      setError(err.message || 'Không thể nộp assignment');
    }
  };

  const handleGrade = async (assignmentId) => {
    const gradePayload = gradeForm[assignmentId] || {};
    if (!gradePayload.student_user_id || gradePayload.grade === undefined || gradePayload.grade === '') {
      setError('Cần nhập student_user_id và grade để chấm');
      return;
    }

    try {
      await authFetch(`/api/assignments/${assignmentId}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          centerId,
          student_user_id: gradePayload.student_user_id,
          grade: Number(gradePayload.grade),
          feedback_text: gradePayload.feedback_text || ''
        })
      });

      await loadAssignments();
    } catch (err) {
      setError(err.message || 'Không thể chấm assignment');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Structured Assignments</h1>
        <p className="text-sm text-muted-foreground">
          Tạo assignment, nộp bài, và theo dõi trạng thái chấm điểm trong cùng một workspace.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 md:p-5">
        <div className="grid gap-2 md:max-w-md">
          <Label htmlFor="assignment-center-id">Center ID</Label>
          <Input
            id="assignment-center-id"
            value={centerId}
            onChange={(event) => setCenterId(event.target.value)}
            placeholder="Nhập center id"
          />
        </div>
      </div>

      {isCreator ? (
        <form className="rounded-lg border bg-white p-4 md:p-5" onSubmit={handleCreate}>
          <h2 className="mb-4 text-lg font-semibold">Tạo assignment mới</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="assignment-class-id">Class ID</Label>
              <Input
                id="assignment-class-id"
                value={createForm.class_id}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, class_id: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignment-title">Tiêu đề</Label>
              <Input
                id="assignment-title"
                value={createForm.title}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="assignment-instructions">Nội dung</Label>
              <Textarea
                id="assignment-instructions"
                value={createForm.instructions}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, instructions: event.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignment-due-at">Hạn nộp</Label>
              <Input
                id="assignment-due-at"
                type="datetime-local"
                value={createForm.due_at}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, due_at: event.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={!canLoad}>Tạo và publish</Button>
            </div>
          </div>
        </form>
      ) : null}

      <div className="rounded-lg border bg-white p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Danh sách assignment</h2>
          <Button variant="outline" onClick={loadAssignments} disabled={loading || !canLoad}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        {!assignments.length ? (
          <p className="text-sm text-muted-foreground">Chưa có assignment nào.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">Class: {item.class_id}</p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{item.status}</span>
                </div>
                <p className="text-sm text-slate-700">{item.instructions || 'Không có mô tả'}</p>

                {isStudent ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={3}
                      value={submitForm[item.id] || ''}
                      onChange={(event) => setSubmitForm((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="Nhập nội dung bài nộp"
                    />
                    <Button size="sm" onClick={() => handleSubmit(item.id)}>
                      Nộp bài
                    </Button>
                    {item.my_submission ? (
                      <p className="text-xs text-muted-foreground">
                        Trạng thái: {item.my_submission.status} • Điểm: {item.my_submission.grade ?? 'Chưa chấm'}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {isCreator ? (
                  <div className="mt-3 rounded border bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-medium">Chấm điểm nhanh</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      <Input
                        value={gradeForm[item.id]?.student_user_id || ''}
                        onChange={(event) => setGradeForm((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...(prev[item.id] || {}),
                            student_user_id: event.target.value
                          }
                        }))}
                        placeholder="student_user_id"
                      />
                      <Input
                        type="number"
                        value={gradeForm[item.id]?.grade || ''}
                        onChange={(event) => setGradeForm((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...(prev[item.id] || {}),
                            grade: event.target.value
                          }
                        }))}
                        placeholder="grade"
                      />
                      <Button variant="outline" size="sm" onClick={() => handleGrade(item.id)}>
                        Chấm điểm
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      className="mt-2"
                      value={gradeForm[item.id]?.feedback_text || ''}
                      onChange={(event) => setGradeForm((prev) => ({
                        ...prev,
                        [item.id]: {
                          ...(prev[item.id] || {}),
                          feedback_text: event.target.value
                        }
                      }))}
                      placeholder="Nhận xét"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
