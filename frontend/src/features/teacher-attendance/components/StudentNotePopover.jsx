/**
 * StudentNotePopover Component
 * Inline note-taking for teachers during attendance
 */

import { useState, useCallback } from 'react';
import { MessageSquarePlus, X, Loader2, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '';

const NOTE_TYPES = [
    { value: 'academic', label: 'Học tập', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    { value: 'behavior', label: 'Thái độ', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    { value: 'general', label: 'Chung', color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

export function StudentNotePopover({ studentId, classId, sessionId, studentName, onClose }) {
    const [content, setContent] = useState('');
    const [noteType, setNoteType] = useState('general');
    const [isShared, setIsShared] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch existing notes
    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                `${API_URL}/api/teacher/classes/${classId}/students/${studentId}/notes?limit=5`,
                { headers: { 'Authorization': `Bearer ${session.access_token}` } }
            );
            const data = await response.json();
            if (data.success) {
                setNotes(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    }, [classId, studentId]);

    // Load on mount
    useState(() => { fetchNotes(); });

    const handleSubmit = async () => {
        if (!content.trim()) return;

        try {
            setSaving(true);
            setError(null);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${API_URL}/api/teacher/students/notes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: studentId,
                    class_id: classId,
                    session_id: sessionId || null,
                    content: content.trim(),
                    note_type: noteType,
                    is_shared_with_parent: isShared,
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Lỗi khi lưu nhận xét');

            // Prepend new note
            setNotes(prev => [data.data, ...prev]);
            setContent('');
            setNoteType('general');
            setIsShared(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm('Xóa nhận xét này?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${API_URL}/api/teacher/students/notes/${noteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                setNotes(prev => prev.filter(n => n.id !== noteId));
            }
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="font-semibold text-foreground">Nhận xét học viên</h3>
                        <p className="text-sm text-muted-foreground">{studentName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Note Form */}
                <div className="p-4 border-b border-border space-y-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Viết nhận xét..."
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none bg-white"
                        rows={3}
                        maxLength={1000}
                    />

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                            {NOTE_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setNoteType(type.value)}
                                    className={cn(
                                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                                        noteType === type.value ? type.color : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                    )}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isShared}
                                onChange={(e) => setIsShared(e.target.checked)}
                                className="rounded border-slate-300"
                            />
                            Chia sẻ với phụ huynh
                        </label>

                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!content.trim() || saving}
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                            Gửi
                        </Button>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500">{error}</p>
                    )}
                </div>

                {/* Previous Notes */}
                <div className="flex-1 overflow-auto p-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Nhận xét gần đây
                    </h4>

                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                    ) : notes.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Chưa có nhận xét nào</p>
                    ) : (
                        <div className="space-y-2.5">
                            {notes.map(note => {
                                const typeConfig = NOTE_TYPES.find(t => t.value === note.note_type) || NOTE_TYPES[2];
                                return (
                                    <div key={note.id} className="p-3 rounded-lg bg-slate-50 border border-border group">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm text-foreground whitespace-pre-wrap flex-1">{note.content}</p>
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', typeConfig.color)}>
                                                {typeConfig.label}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatDate(note.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentNotePopover;
