import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * SmartReplySuggestions — keyword-based suggestion chips for admin
 * Analyzes the last student message, queries courses/classes, shows clickable chips
 * that paste formatted text into the reply input
 */
export default function SmartReplySuggestions({ ticketId, messages, onSelectSuggestion }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const lastAnalyzedMsg = useRef(null);
    const abortRef = useRef(null);

    // Find last student message (not staff)
    const lastStudentMsg = messages
        ?.slice()
        .reverse()
        .find(m => {
            const role = m.sender?.roles?.code;
            return role === 'STUDENT' || role === 'PARENT' || (!role && !m.is_internal);
        });

    const fetchSuggestions = useCallback(async (messageText) => {
        if (!ticketId || !messageText || messageText.length < 3) {
            setSuggestions([]);
            return;
        }

        // Don't re-fetch for same message
        if (lastAnalyzedMsg.current === messageText) return;
        lastAnalyzedMsg.current = messageText;

        // Cancel previous request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setDismissed(false);

        try {
            const { data } = await axios.get(
                `${API_URL}/api/support-tickets/${ticketId}/smart-replies`,
                {
                    params: { message: messageText },
                    signal: controller.signal
                }
            );

            if (data.success && data.data?.suggestions?.length > 0) {
                setSuggestions(data.data.suggestions);
            } else {
                setSuggestions([]);
            }
        } catch (err) {
            if (err.name !== 'CanceledError') {
                console.error('Smart reply error:', err);
                setSuggestions([]);
            }
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    // Trigger fetch when messages change
    useEffect(() => {
        const msgText = lastStudentMsg?.message || lastStudentMsg?.content;
        if (msgText) {
            fetchSuggestions(msgText);
        } else {
            setSuggestions([]);
        }
    }, [lastStudentMsg?.id, fetchSuggestions]);

    const handleSelect = useCallback((suggestion) => {
        onSelectSuggestion(suggestion.pasteText);
        setDismissed(true);
    }, [onSelectSuggestion]);

    const handleDismiss = useCallback(() => {
        setDismissed(true);
    }, []);

    // Nothing to show
    if (dismissed || (!loading && suggestions.length === 0)) return null;

    const typeIcons = {
        course_info: '📚',
        schedule_info: '📅',
        curriculum_info: '📋'
    };

    return (
        <div className="px-4 py-2 border-b border-blue-100 dark:border-blue-500/20 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-500/10 dark:to-indigo-500/10 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[11px] font-semibold text-blue-600">Gợi ý trả lời</span>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    title="Ẩn gợi ý"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 py-1">
                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[11px] text-blue-500">Đang phân tích...</span>
                </div>
            ) : (
                <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s, idx) => (
                        <button
                            key={`${s.type}-${idx}`}
                            onClick={() => handleSelect(s)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-card px-2.5 py-1.5 text-xs text-blue-700 dark:text-blue-300 font-medium shadow-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-md transition-all duration-150 active:scale-95"
                            title="Nhấn để paste vào ô trả lời"
                        >
                            <span>{typeIcons[s.type] || '💡'}</span>
                            <span className="max-w-[200px] truncate">{s.label.replace(/^[📚📅📋]\s*/, '')}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
