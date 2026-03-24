import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';
import { useTeacherClasses } from '@/features/teacher-classes/hooks/useTeacherClasses';

export default function TeacherGradebookHubPage() {
    const navigate = useNavigate();
    const { classes, loading, error, refetch } = useTeacherClasses();
    const [selectedClassId, setSelectedClassId] = useState('');

    const availableClasses = useMemo(() => classes || [], [classes]);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <TeacherPageHeader
                title="Bảng điểm"
                subtitle="Chọn lớp để mở sổ điểm và nhập điểm trực tiếp theo từng hình thức đánh giá"
                icon={FileSpreadsheet}
                iconColorClass="text-purple-600 bg-purple-500/10"
                actions={
                    <Button variant="outline" onClick={refetch} disabled={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                }
            />

            <div className="rounded-2xl border bg-card p-5 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Chọn lớp để mở sổ điểm</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Mỗi lớp sẽ mở vào màn sổ điểm riêng theo route lớp hiện có.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {availableClasses.map((cls) => (
                        <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                                setSelectedClassId(cls.id);
                                navigate(`/teacher/classes/${cls.id}/gradebook`);
                            }}
                            className="rounded-xl border bg-background p-4 text-left hover:border-purple-400 hover:bg-purple-500/5 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-foreground">{cls.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{cls.code || 'Chưa có mã lớp'}</p>
                                    <p className="text-sm text-muted-foreground mt-2">{cls.course_name || 'Chưa có khóa học'}</p>
                                </div>
                                <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {!loading && !error && availableClasses.length === 0 && (
                    <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                        Bạn chưa được phân công lớp nào để mở sổ điểm.
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {selectedClassId ? (
                    <p className="text-xs text-muted-foreground">
                        Đang mở nhanh sổ điểm cho lớp đã chọn.
                    </p>
                ) : null}
            </div>
        </div>
    );
}
