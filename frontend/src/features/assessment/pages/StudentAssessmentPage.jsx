import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { authFetch } from '@/features/core-gaps/utils/authFetch';

export default function StudentAssessmentPage() {
  const { profile } = useAuth();
  const defaultCenterId = profile?.center_id || profile?.centerId || '';

  const [centerId, setCenterId] = useState(defaultCenterId);
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [answersByTest, setAnswersByTest] = useState({});
  const [activeAttemptByTest, setActiveAttemptByTest] = useState({});
  const [resultsByAttempt, setResultsByAttempt] = useState({});

  const canLoad = useMemo(() => Boolean(centerId), [centerId]);

  const loadTests = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError('');
    try {
      const payload = await authFetch(`/api/assessment/tests?centerId=${encodeURIComponent(centerId)}&activeOnly=true`);
      setTests(payload.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách test');
    } finally {
      setLoading(false);
    }
  }, [canLoad, centerId]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const startAttempt = async (testId) => {
    try {
      const payload = await authFetch(`/api/assessment/tests/${testId}/start`, {
        method: 'POST',
        body: JSON.stringify({ centerId })
      });

      const attemptId = payload?.data?.attempt_id;
      if (attemptId) {
        setActiveAttemptByTest((prev) => ({ ...prev, [testId]: attemptId }));
      }
    } catch (err) {
      setError(err.message || 'Không thể bắt đầu lượt làm bài');
    }
  };

  const submitAttempt = async (testId) => {
    const attemptId = activeAttemptByTest[testId];
    if (!attemptId) return;

    const answersRaw = answersByTest[testId] || '{}';
    let answers = {};
    try {
      answers = JSON.parse(answersRaw);
    } catch {
      setError('Định dạng JSON answers không hợp lệ');
      return;
    }

    try {
      const payload = await authFetch(`/api/assessment/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          centerId,
          answers,
          time_spent_seconds: 0,
          tab_switches: 0
        })
      });

      setResultsByAttempt((prev) => ({ ...prev, [attemptId]: payload.data }));
    } catch (err) {
      setError(err.message || 'Không thể submit bài assessment');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assessment cho học viên</h1>
        <p className="text-sm text-muted-foreground">
          Bắt đầu lượt làm bài và submit kết quả qua API assessment mới.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 md:max-w-md">
        <div className="grid gap-2">
          <Label htmlFor="student-assessment-center">Center ID</Label>
          <Input
            id="student-assessment-center"
            value={centerId}
            onChange={(event) => setCenterId(event.target.value)}
            placeholder="Nhập center id"
          />
        </div>
        <Button className="mt-3" variant="outline" onClick={loadTests} disabled={loading || !canLoad}>
          {loading ? 'Đang tải...' : 'Tải lại test'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!tests.length ? (
        <p className="text-sm text-muted-foreground">Chưa có test khả dụng.</p>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const attemptId = activeAttemptByTest[test.id];
            const result = attemptId ? resultsByAttempt[attemptId] : null;

            return (
              <div key={test.id} className="rounded-md border bg-white p-4">
                <div className="mb-2">
                  <p className="font-semibold">{test.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {test.duration_minutes} phút • tối đa {test.attempts_allowed} lần
                  </p>
                </div>

                {!attemptId ? (
                  <Button size="sm" onClick={() => startAttempt(test.id)}>Bắt đầu làm bài</Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Attempt ID: {attemptId}</p>
                    <Textarea
                      rows={4}
                      value={answersByTest[test.id] || '{\n  "question-id": "answer"\n}'}
                      onChange={(event) => setAnswersByTest((prev) => ({ ...prev, [test.id]: event.target.value }))}
                    />
                    <Button size="sm" onClick={() => submitAttempt(test.id)}>Nộp bài</Button>
                  </div>
                )}

                {result ? (
                  <div className="mt-3 rounded border bg-slate-50 p-3 text-sm">
                    <p>Điểm: <strong>{result.score ?? 0}/{result.max_score ?? 0}</strong></p>
                    <p>Tỷ lệ đúng: <strong>{result.percentage ?? 0}%</strong></p>
                    <p>Level: <strong>{result.level_name || result.level_code || 'N/A'}</strong></p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
