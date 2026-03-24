import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';
import { useTeacherClasses } from '../hooks/useTeacherClasses';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function TeacherStudentProgressHubPage() {
    const navigate = useNavigate();
    const { classes, loading, error, refetch } = useTeacherClasses();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsError, setStudentsError] = useState('');

    const availableClasses = useMemo(() => classes || [], [classes]);

    const loadStudents = useCallback(async () => {
        if (!selectedClassId) {
            setStudents([]);
            setStudentsError('');
            return;
        }

        try {
            setStudentsLoading(true);
            setStudentsError('');
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Chưa đăng nhập');
            }

            const response = await fetch(`${API_URL}/api/teacher/classes/${selectedClassId}`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            const payload = await response.json();
            if (!response.ok || payload?.success === false) {
                throw new Error(payload?.message || 'Không thể tải danh sách học viên');
            }

            setStudents(payload?.data?.students || []);
        } catch (err) {
            setStudents([]);
            setStudentsError(err.message || 'Không thể tải danh sách học viên');
        } finally {
            setStudentsLoading(false);
        }
    }, [selectedClassId]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <TeacherPageHeader
                title="Tiến trình học viên"
                subtitle="Chọn lớp và học viên để xem điểm danh, bảng điểm, nhận xét và xu hướng học tập"
                icon={TrendingUp}
                iconColorClass="text-blue-600 bg-blue-500/10"
                actions={
                    <Button variant="outline" onClick={refetch} disabled={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                }
            />

            <div className="rounded-2xl border bg-card p-5 space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Chọn lớp và học viên để xem tiến trình</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Chọn một lớp trước, sau đó chọn học viên để mở trang tiến trình chi tiết.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {availableClasses.map((cls) => (
                        <button
                            key={cls.id}
                            type="button"
                            onClick={() => setSelectedClassId(cls.id)}
                            className={`rounded-xl border p-4 text-left transition-colors ${selectedClassId === cls.id
                                ? 'border-blue-400 bg-blue-500/5'
                                : 'bg-background hover:border-blue-300 hover:bg-blue-500/5'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-foreground">{cls.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{cls.code || 'Chưa có mã lớp'}</p>
                                    <p className="text-sm text-muted-foreground mt-2">{cls.course_name || 'Chưa có khóa học'}</p>
                                </div>
                                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="rounded-xl border bg-background p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Danh sách học viên trong lớp đã chọn
                    </div>

                    {studentsLoading ? (
                        <p className="text-sm text-muted-foreground">Đang tải học viên...</p>
                    ) : studentsError ? (
                        <p className="text-sm text-red-600">{studentsError}</p>
                    ) : !selectedClassId ? (
                        <p className="text-sm text-muted-foreground">Hãy chọn một lớp để tải danh sách học viên.</p>
                    ) : students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Lớp này hiện chưa có học viên.</p>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {students.map((student) => (
                                <button
                                    key={student.student_id || student.id}
                                    type="button"
                                    onClick={() => navigate(`/teacher/classes/${selectedClassId}/students/${student.student_id || student.id}`)}
                                    className="rounded-xl border bg-card px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-500/5 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-foreground">{student.full_name || student.student?.full_name || 'Học viên'}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{student.email || student.student?.email || 'Không có email'}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-blue-600" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
