/**
 * TeachingNotesSection Component
 * Allows teachers to add teaching notes & homework after marking attendance
 */

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, PenLine, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '';

export function TeachingNotesSection({ sessionId, initialNotes, initialHomework, readOnly = false }) {
    const [teacherNotes, setTeacherNotes] = useState(initialNotes || '');
    const [homework, setHomework] = useState(initialHomework || '');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setTeacherNotes(initialNotes || '');
        setHomework(initialHomework || '');
        setIsEditing(false);
    }, [initialNotes, initialHomework, sessionId]);

    const handleSave = useCallback(async () => {
        if (!sessionId) return;

        try {
            setSaving(true);
            setError(null);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${API_URL}/api/teacher/sessions/${sessionId}/notes`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teacher_notes: teacherNotes || null,
                    homework: homework || null,
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Lỗi khi lưu ghi chú');

            setSaved(true);
            setIsEditing(false);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }, [sessionId, teacherNotes, homework]);

    const handleCancel = () => {
        setTeacherNotes(initialNotes || '');
        setHomework(initialHomework || '');
        setIsEditing(false);
        setError(null);
    };

    const hasContent = teacherNotes?.trim() || homework?.trim();

    // Read-only mode (for class detail sessions list)
    if (readOnly) {
        if (!hasContent) return null;
        return (
            <div className="mt-2 space-y-1.5">
                {teacherNotes && (
                    <div className="flex items-start gap-2 text-sm">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-foreground">{teacherNotes}</span>
                    </div>
                )}
                {homework && (
                    <div className="flex items-start gap-2 text-sm">
                        <PenLine className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                        <span className="text-foreground">{homework}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Ghi chú giảng dạy
                </h3>
                {!isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs"
                    >
                        <PenLine className="h-3.5 w-3.5 mr-1" />
                        {hasContent ? 'Sửa' : 'Thêm ghi chú'}
                    </Button>
                )}
                {saved && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Đã lưu
                    </span>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Nội dung đã dạy
                        </label>
                        <textarea
                            value={teacherNotes}
                            onChange={(e) => setTeacherNotes(e.target.value)}
                            placeholder="Hôm nay đã dạy..."
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none bg-white"
                            rows={3}
                            maxLength={2000}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Bài tập về nhà
                        </label>
                        <textarea
                            value={homework}
                            onChange={(e) => setHomework(e.target.value)}
                            placeholder="Bài tập: ..."
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none bg-white"
                            rows={2}
                            maxLength={1000}
                        />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                            <X className="h-3.5 w-3.5 mr-1" /> Hủy
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                            Lưu ghi chú
                        </Button>
                    </div>
                </div>
            ) : hasContent ? (
                <div className="space-y-2">
                    {teacherNotes && (
                        <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                            <p className="text-xs font-medium text-blue-600 mb-1">Nội dung đã dạy</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{teacherNotes}</p>
                        </div>
                    )}
                    {homework && (
                        <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                            <p className="text-xs font-medium text-orange-600 mb-1">Bài tập về nhà</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{homework}</p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có ghi chú nào. Nhấn &quot;Thêm ghi chú&quot; để bắt đầu.
                </p>
            )}
        </div>
    );
}

export default TeachingNotesSection;
