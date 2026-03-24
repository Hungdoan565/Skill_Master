import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { authFetch } from '@/features/core-gaps/utils/authFetch';

function normalizeApiError(message, fallback) {
    if (!message || message === 'Internal server error') return fallback;
    return message;
}

export default function StudentAssessmentPage() {
    const { profile } = useAuth();
    const defaultCenterId = profile?.centerId || profile?.center_id || '';
    const centerDisplayValue = profile?.centers?.code || profile?.centers?.name || defaultCenterId || 'Trung tâm hiện tại';

    const [tests, setTests] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [answersByTest, setAnswersByTest] = useState({});
    const [activeAttemptByTest, setActiveAttemptByTest] = useState({});
    const [resultsByAttempt, setResultsByAttempt] = useState({});

    const hasAvailableTests = useMemo(() => tests.length > 0, [tests]);

    const loadTests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const payload = await authFetch('/api/assessment/tests?activeOnly=true');
            setTests(payload.data || []);
        } catch (err) {
            setError(normalizeApiError(err.message, 'Không thể tải danh sách bài kiểm tra'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTests();
    }, [loadTests]);

    const startAttempt = async (testId) => {
        try {
            const payload = await authFetch(`/api/assessment/tests/${testId}/start`, {
                method: 'POST',
                body: JSON.stringify({})
            });

            const attemptId = payload?.data?.attempt_id;
            if (attemptId) {
                setActiveAttemptByTest((prev) => ({ ...prev, [testId]: attemptId }));
            }
        } catch (err) {
            setError(normalizeApiError(err.message, 'Không thể bắt đầu bài kiểm tra'));
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
            setError('Định dạng JSON câu trả lời không hợp lệ');
            return;
        }

        try {
            const payload = await authFetch(`/api/assessment/attempts/${attemptId}/submit`, {
                method: 'POST',
                body: JSON.stringify({
                    answers,
                    time_spent_seconds: 0,
                    tab_switches: 0
                })
            });

            setResultsByAttempt((prev) => ({ ...prev, [attemptId]: payload.data }));
        } catch (err) {
            setError(normalizeApiError(err.message, 'Không thể nộp bài kiểm tra'));
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Bài kiểm tra đánh giá</h1>
                <p className="text-sm text-muted-foreground">
                    Làm bài kiểm tra trực tuyến và xem kết quả đánh giá ngay trong cổng học viên.
                </p>
            </div>

            <div className="rounded-lg border bg-white p-4 md:max-w-md">
                <div className="grid gap-2">
                    <Label htmlFor="student-assessment-center">Trung tâm</Label>
                    <Input
                        id="student-assessment-center"
                        value={centerDisplayValue}
                        disabled
                    />
                </div>
                <Button className="mt-3" variant="outline" onClick={loadTests} disabled={loading}>
                    {loading ? 'Đang tải...' : 'Tải lại bài kiểm tra'}
                </Button>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {!hasAvailableTests ? (
                <p className="text-sm text-muted-foreground">Chưa có bài kiểm tra khả dụng.</p>
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
                                        Thời lượng {test.duration_minutes} phút • tối đa {test.attempts_allowed} lượt làm
                                    </p>
                                </div>

                                {!attemptId ? (
                                    <Button size="sm" onClick={() => startAttempt(test.id)}>Bắt đầu kiểm tra</Button>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Mã lượt làm bài: {attemptId}</p>
                                        <Textarea
                                            rows={4}
                                            value={answersByTest[test.id] || '{\n  "question-id": "answer"\n}'}
                                            onChange={(event) => setAnswersByTest((prev) => ({ ...prev, [test.id]: event.target.value }))}
                                            placeholder="Dán JSON câu trả lời theo cấu trúc hệ thống yêu cầu"
                                        />
                                        <Button size="sm" onClick={() => submitAttempt(test.id)}>Nộp bài kiểm tra</Button>
                                    </div>
                                )}

                                {result ? (
                                    <div className="mt-3 rounded border bg-slate-50 p-3 text-sm">
                                        <p>Điểm số: <strong>{result.score ?? 0}/{result.max_score ?? 0}</strong></p>
                                        <p>Tỷ lệ đúng: <strong>{result.percentage ?? 0}%</strong></p>
                                        <p>Mức đánh giá: <strong>{result.level_name || result.level_code || 'Chưa xác định'}</strong></p>
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
