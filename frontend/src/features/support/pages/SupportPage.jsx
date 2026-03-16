/**
 * SupportPage — Helpdesk-grade 3-panel support ticket management
 *
 * Layout: TicketList (left) | Conversation (center) | ContextSidebar (right)
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import SmartReplySuggestions from '../components/SmartReplySuggestions';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import {
    MessageSquare, Search, Clock, User, AlertTriangle, CheckCircle, Send,
    RefreshCw, Loader2, ChevronRight, ChevronDown, Settings, CreditCard,
    BookOpen, Calendar, Award, HelpCircle, Building2, ArrowLeft, Phone,
    Mail, ClipboardList, StickyNote, UserPlus, MoreVertical, Hash, X,
    Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useSupport } from '../hooks';
import {
    STATUS_OPTIONS, PRIORITY_OPTIONS, CATEGORY_OPTIONS,
    getStatusConfig, getPriorityConfig, getCategoryConfig,
    formatDate, formatRelativeTime,
} from '../utils';

// ─── Constants ──────────────────────────────────────────────
const CategoryIcons = {
    technical: Settings, billing: CreditCard, course: BookOpen,
    schedule: Calendar, certificate: Award, general: HelpCircle,
    consultation: ClipboardList, other: HelpCircle,
};

const SOURCE_TABS = [
    { value: '', label: 'Tất cả', icon: null },
    { value: 'chatbot', label: '🤖 Tư vấn', count: 0 },
    { value: 'website', label: '🌐 Website', count: 0 },
    { value: 'manual', label: '📝 Học viên', count: 0 },
];

const PRIORITY_BAR_COLORS = {
    urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-blue-400',
    normal: 'bg-blue-400', low: 'bg-slate-300',
};

// ─── Helpers ────────────────────────────────────────────────
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const cleanSubject = (subject) => {
    if (!subject) return 'Không có tiêu đề';
    return subject
        .replace(/^Follow-up tư vấn:\s*/i, '')
        .replace(/^Molly:\s*/i, '')
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
};

// ─── Panel 1: Ticket List ───────────────────────────────────
const TicketListItem = ({ ticket, selected, onClick }) => {
    const priorityBar = PRIORITY_BAR_COLORS[ticket.priority] || 'bg-slate-300';
    const statusCfg = getStatusConfig(ticket.status);
    const isFollowUp = !!ticket.consultation_request_id;
    const isConsultation = ticket.source === 'chatbot' || ticket.source === 'website' || ticket.category === 'consultation';
    const name = ticket.created_by_user?.full_name || ticket.guest_name || ticket.students?.full_name || 'Khách hàng';
    const categoryCfg = getCategoryConfig(ticket.category);
    const CatIcon = CategoryIcons[ticket.category] || HelpCircle;

    return (
        <div
            onClick={() => onClick(ticket)}
            className={`
                flex gap-3 px-3 py-3 cursor-pointer transition-all border-b border-slate-100
                ${selected
                    ? 'bg-indigo-50 border-l-[3px] border-l-indigo-500'
                    : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'}
            `}
        >
            {/* Priority bar */}
            <div className={`w-1 min-h-full rounded-full ${priorityBar} shrink-0`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-slate-400">{ticket.ticket_number}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                    </span>
                </div>

                <p className="text-sm font-medium text-slate-800 truncate leading-tight">
                    {cleanSubject(ticket.subject)}
                </p>

                <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-[9px] font-semibold text-slate-600">{getInitials(name)}</span>
                    </div>
                    <span className="text-xs text-slate-500 truncate">{name}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">{formatRelativeTime(ticket.updated_at)}</span>
                </div>

                <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge variant="outline" className="text-[10px] py-0 h-5 gap-1 border-slate-200">
                        <CatIcon className="h-2.5 w-2.5" /> {categoryCfg.label}
                    </Badge>
                    {ticket.source === 'chatbot' && (
                        <Badge variant="outline" className="text-[10px] py-0 h-5 bg-violet-50 text-violet-600 border-violet-200">
                            🤖 Molly
                        </Badge>
                    )}
                    {ticket.source === 'website' && (
                        <Badge variant="outline" className="text-[10px] py-0 h-5 bg-sky-50 text-sky-600 border-sky-200">
                            🌐 Web
                        </Badge>
                    )}
                    {!isConsultation && isFollowUp && (
                        <Badge variant="outline" className="text-[10px] py-0 h-5 bg-violet-50 text-violet-600 border-violet-200">
                            <ClipboardList className="h-2.5 w-2.5 mr-0.5" /> Follow-up
                        </Badge>
                    )}
                    {ticket.message_count > 0 && (
                        <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" /> {ticket.message_count}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Panel 2: Conversation ──────────────────────────────────
const MessageBubble = ({ message, isStaff }) => {
    const isSystem = message.message?.startsWith('Khởi tạo follow-up') || message.message?.startsWith('[System]');
    const senderName = message.sender?.full_name || message.created_by_user?.full_name || 'Unknown';
    const content = message.message || message.content || '';

    if (isSystem) {
        return (
            <div className="flex justify-center my-3">
                <div className="bg-slate-100 rounded-lg px-4 py-2 max-w-[80%]">
                    <p className="text-xs text-slate-500 text-center">
                        <StickyNote className="h-3 w-3 inline mr-1" />
                        Handoff từ tư vấn — xem chi tiết ở sidebar phải →
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isStaff ? 'justify-end' : 'justify-start'} mb-4`}>
            {!isStaff && (
                <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-600">{getInitials(senderName)}</span>
                </div>
            )}
            <div className={`max-w-[70%] ${message.is_internal ? 'border-2 border-dashed border-amber-300' : ''}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${
                    message.is_internal
                        ? 'bg-amber-50 text-amber-900'
                        : isStaff
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                }`}>
                    {message.is_internal && (
                        <div className="flex items-center gap-1 mb-1">
                            <EyeOff className="h-3 w-3" />
                            <span className="text-[10px] font-semibold">Ghi chú nội bộ</span>
                        </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
                </div>
                <div className={`flex items-center gap-1.5 mt-1 px-1 ${isStaff ? 'justify-end' : ''}`}>
                    <span className={`text-[11px] ${isStaff ? 'text-slate-400' : 'text-slate-400'}`}>{senderName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">{formatRelativeTime(message.created_at)}</span>
                </div>
            </div>
            {isStaff && (
                <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center ml-2 mt-1 shrink-0">
                    <span className="text-[10px] font-semibold text-indigo-600">{getInitials(senderName)}</span>
                </div>
            )}
        </div>
    );
};

// ─── Panel 3: Context Sidebar ───────────────────────────────
const ConsultationContext = ({ ctx }) => {
    const [showChat, setShowChat] = useState(false);
    if (!ctx) return null;

    const intake = ctx.intake || {};
    const hasIntake = intake.goal || intake.level || intake.course;
    const STATUS_LABELS = {
        new: 'Mới', assigned: 'Đã nhận', contacted: 'Đã liên hệ',
        scheduled: 'Đã hẹn', closed: 'Đã đóng', lost: 'Không thành công'
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-semibold text-slate-700">Bối cảnh tư vấn</span>
                <Badge variant="outline" className="text-[9px] border-violet-200 text-violet-600">
                    {STATUS_LABELS[ctx.status] || ctx.status}
                </Badge>
            </div>

            {hasIntake && (
                <div className="space-y-1.5">
                    {intake.goal && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">🎯</span>
                            <span className="text-slate-700">{intake.goal}</span>
                        </div>
                    )}
                    {intake.course && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">📚</span>
                            <span className="text-slate-700">{intake.course}</span>
                        </div>
                    )}
                    {intake.level && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">📊</span>
                            <span className="text-slate-700">{intake.level}</span>
                        </div>
                    )}
                </div>
            )}

            {ctx.advisor_notes && (
                <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1">✏️ Ghi chú advisor</p>
                    <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-wrap">{ctx.advisor_notes}</p>
                </div>
            )}

            {ctx.chat_excerpt?.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                    >
                        💬 Chat Molly ({ctx.chat_excerpt.length} tin)
                        <ChevronRight className={`h-3 w-3 transition-transform ${showChat ? 'rotate-90' : ''}`} />
                    </button>
                    {showChat && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                            {ctx.chat_excerpt.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] rounded-lg px-2 py-1 text-[11px] ${
                                        msg.role === 'user'
                                            ? 'bg-blue-50 text-blue-800'
                                            : 'bg-violet-50 text-violet-800'
                                    }`}>
                                        <span className="line-clamp-2">{msg.content}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Page ──────────────────────────────────────────────
export function SupportPage() {
    const { profile, isSuperAdmin, getCenterId } = useAuth();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [centers, setCenters] = useState([]);

    // UI state
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [mobileShowDetail, setMobileShowDetail] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const replyTextareaRef = useRef(null);

    // Smart reply: paste suggestion text into reply input
    const handleSmartReplySelect = useCallback((pasteText) => {
        setReplyText(pasteText);
        setTimeout(() => replyTextareaRef.current?.focus(), 50);
    }, []);

    const {
        tickets, loading, currentTicket, messages, setMessages,
        fetchTickets, fetchTicketDetail, updateTicketStatus,
        sendReply, filterTickets, setCurrentTicket,
    } = useSupport();

    // Center filtering
    const effectiveCenterId = useMemo(() => {
        if (isSuperAdmin()) return selectedCenter || null;
        return getCenterId();
    }, [isSuperAdmin, selectedCenter, getCenterId]);

    // Fetch centers for SUPER_ADMIN
    useEffect(() => {
        if (isSuperAdmin()) {
            (async () => {
                try {
                    const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/centers`,
                        { headers: { Authorization: `Bearer ${session?.access_token}` } }
                    );
                    const result = await response.json();
                    if (result.success) setCenters(result.data || []);
                } catch (err) { console.error('Error fetching centers:', err); }
            })();
        }
    }, [isSuperAdmin]);

    // Fetch tickets
    useEffect(() => {
        fetchTickets({ status: statusFilter, priority: priorityFilter, source: sourceFilter, centerId: effectiveCenterId });
    }, [fetchTickets, statusFilter, priorityFilter, sourceFilter, effectiveCenterId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Supabase Realtime: subscribe to ticket_messages for active ticket
    const realtimeTicketId = currentTicket?.id || selectedTicket?.id;
    useEffect(() => {
        if (!realtimeTicketId) return;

        const channel = supabaseClient
            .channel(`admin-ticket-${realtimeTicketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${realtimeTicketId}`
                },
                (payload) => {
                    const newMsg = payload.new;
                    if (!newMsg) return;
                    // Skip own messages — sendReply already handles them with proper sender info
                    if (newMsg.sender_id === profile?.id) return;

                    // Determine if sender is ticket creator (student) based on active ticket
                    const activeT = currentTicket || selectedTicket;
                    const isTicketCreator = activeT && newMsg.sender_id === activeT.created_by;

                    // Enrich with sender info for proper display
                    const enrichedMsg = {
                        ...newMsg,
                        sender: {
                            full_name: isTicketCreator
                                ? (activeT.creator?.full_name || activeT.guest_name || 'Học viên')
                                : 'Nhân viên',
                            roles: { code: isTicketCreator ? 'STUDENT' : 'STAFF' }
                        }
                    };

                    setMessages(prev => {
                        if (prev.some(m => m.id === enrichedMsg.id)) return prev;
                        return [...prev, enrichedMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabaseClient.removeChannel(channel);
        };
    }, [realtimeTicketId, setMessages, profile?.id, currentTicket, selectedTicket]);

    const filteredTickets = filterTickets(searchTerm);

    const stats = useMemo(() => ({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        consultation: tickets.filter(t => t.source === 'chatbot' || t.source === 'website' || t.category === 'consultation').length,
    }), [tickets]);

    const activeTicket = currentTicket || selectedTicket;

    // Handlers
    const handleSelectTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setCurrentTicket(ticket);
        setMobileShowDetail(true);
        setReplyText('');
        setIsInternal(false);
        await fetchTicketDetail(ticket.id);
    };

    const handleStatusChange = async (status) => {
        if (!activeTicket) return;
        try {
            await updateTicketStatus(activeTicket.id, status);
            await fetchTicketDetail(activeTicket.id);
        } catch (err) { console.error('Error updating status:', err); }
    };

    const handleSend = async () => {
        if (!replyText.trim() || !activeTicket) return;
        setSending(true);
        try {
            await sendReply(activeTicket.id, replyText, isInternal);
            setReplyText('');
            // No need to fetchTicketDetail — sendReply already appends the message
            // and Realtime will handle any other incoming messages
        } catch (err) {
            console.error('Error sending:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─── RENDER ─────────────────────────────────────────────

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-slate-900">Hỗ trợ Học viên</h1>
                    <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> {stats.open} mới</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> {stats.inProgress} đang xử lý</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> {stats.resolved} đã xong</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isSuperAdmin() && centers.length > 0 && (
                        <select
                            value={selectedCenter}
                            onChange={(e) => setSelectedCenter(e.target.value)}
                            className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                        >
                            <option value="">Tất cả trung tâm</option>
                            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    )}
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => fetchTickets({ status: statusFilter, priority: priorityFilter, source: sourceFilter, centerId: effectiveCenterId })}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* 3-Panel Body */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── Panel 1: Ticket List ── */}
                <div className={`w-[320px] border-r bg-white flex flex-col shrink-0 ${mobileShowDetail ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Search + Filters */}
                    <div className="p-3 border-b space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Tìm ticket..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-8 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white">
                                <option value="">Trạng thái</option>
                                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                                className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white">
                                <option value="">Ưu tiên</option>
                                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        {/* Source filter tabs */}
                        <div className="flex gap-1 flex-wrap">
                            {SOURCE_TABS.map(tab => (
                                <button
                                    key={tab.value}
                                    onClick={() => setSourceFilter(tab.value)}
                                    className={`text-[11px] px-2.5 py-1 rounded-full transition-all font-medium ${
                                        sourceFilter === tab.value
                                            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket Items */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Không có ticket</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <TicketListItem
                                    key={ticket.id}
                                    ticket={ticket}
                                    selected={selectedTicket?.id === ticket.id}
                                    onClick={handleSelectTicket}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ── Panel 2: Conversation ── */}
                <div className={`flex-1 flex flex-col bg-slate-50 ${!mobileShowDetail && !selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
                    {activeTicket ? (
                        <>
                            {/* Ticket Toolbar */}
                            <div className="px-4 py-3 bg-white border-b flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => { setSelectedTicket(null); setMobileShowDetail(false); }}
                                    className="lg:hidden p-1 hover:bg-slate-100 rounded"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>

                                <Hash className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-mono text-slate-600">{activeTicket.ticket_number}</span>

                                {/* Status dropdown */}
                                <select
                                    value={activeTicket.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${getStatusConfig(activeTicket.status).color}`}
                                >
                                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>

                                {/* Priority */}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityConfig(activeTicket.priority).color}`}>
                                    {getPriorityConfig(activeTicket.priority).label}
                                </span>

                                {/* Category */}
                                <Badge variant="outline" className="text-[10px] ml-auto">
                                    {getCategoryConfig(activeTicket.category).label}
                                </Badge>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                {messages.length === 0 ? (
                                    <div className="text-center text-slate-400 py-16">
                                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Chưa có tin nhắn</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const senderRole = msg.sender?.roles?.code;
                                        const isStaff = senderRole !== 'STUDENT' && senderRole !== 'PARENT';
                                        return <MessageBubble key={msg.id} message={msg} isStaff={isStaff} />;
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Smart Reply Suggestions */}
                            <SmartReplySuggestions
                                ticketId={activeTicket?.id}
                                messages={messages}
                                onSelectSuggestion={handleSmartReplySelect}
                            />

                            {/* Reply Input */}
                            <div className="px-4 py-3 bg-white border-t shrink-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        onClick={() => setIsInternal(!isInternal)}
                                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                                            isInternal
                                                ? 'bg-amber-100 text-amber-700 font-medium'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        {isInternal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        {isInternal ? 'Ghi chú nội bộ' : 'Phản hồi'}
                                    </button>
                                    {isInternal && (
                                        <span className="text-[10px] text-amber-600">Học viên không thấy ghi chú này</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <textarea
                                        ref={replyTextareaRef}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isInternal ? 'Ghi chú nội bộ...' : 'Nhập phản hồi...'}
                                        rows={1}
                                        className={`flex-1 resize-none text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${
                                            isInternal
                                                ? 'border-amber-300 focus:ring-amber-300 bg-amber-50'
                                                : 'border-slate-200 focus:ring-indigo-300'
                                        }`}
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!replyText.trim() || sending}
                                        className={`shrink-0 rounded-xl ${
                                            isInternal ? 'bg-amber-500 hover:bg-amber-600' : ''
                                        }`}
                                    >
                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Chọn một ticket để xem</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Panel 3: Context Sidebar ── */}
                {activeTicket && (
                    <div className="w-[300px] border-l bg-white overflow-y-auto hidden xl:block shrink-0">
                        <div className="p-4 space-y-5">
                            {/* Requester Card */}
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Người yêu cầu</p>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-semibold text-indigo-600">
                                            {getInitials(activeTicket.created_by_user?.full_name || activeTicket.guest_name || activeTicket.students?.full_name || activeTicket.consultation_context?.full_name)}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {activeTicket.created_by_user?.full_name || activeTicket.guest_name || activeTicket.students?.full_name || activeTicket.consultation_context?.full_name || 'Khách hàng'}
                                        </p>
                                        {activeTicket.source && activeTicket.source !== 'manual' && (
                                            <Badge variant="outline" className="text-[9px] mt-0.5 border-violet-200 text-violet-600 bg-violet-50">
                                                {activeTicket.source === 'chatbot' ? '🤖 Từ Molly' : `🌐 ${activeTicket.source}`}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {(activeTicket.students?.phone || activeTicket.guest_phone || activeTicket.consultation_context?.phone) && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                            <a href={`tel:${activeTicket.students?.phone || activeTicket.guest_phone || activeTicket.consultation_context?.phone}`}
                                               className="text-indigo-600 hover:underline font-medium">
                                                {activeTicket.students?.phone || activeTicket.guest_phone || activeTicket.consultation_context?.phone}
                                            </a>
                                        </div>
                                    )}
                                    {(activeTicket.students?.email || activeTicket.guest_email || activeTicket.consultation_context?.email) && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-slate-600 truncate">
                                                {activeTicket.students?.email || activeTicket.guest_email || activeTicket.consultation_context?.email}
                                            </span>
                                        </div>
                                    )}
                                    {activeTicket.consultation_context?.preferred_time && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-slate-600">Liên hệ: {activeTicket.consultation_context.preferred_time}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Consultation Context */}
                            {activeTicket.consultation_context && (
                                <>
                                    <ConsultationContext ctx={activeTicket.consultation_context} />
                                    <hr className="border-slate-100" />
                                </>
                            )}

                            {/* Ticket Info */}
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Chi tiết ticket</p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Tạo lúc</span>
                                        <span className="text-slate-700">{formatDate(activeTicket.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Cập nhật</span>
                                        <span className="text-slate-700">{formatRelativeTime(activeTicket.updated_at)}</span>
                                    </div>
                                    {activeTicket.assigned_to?.full_name && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Phụ trách</span>
                                            <span className="text-slate-700">{activeTicket.assigned_to.full_name}</span>
                                        </div>
                                    )}
                                    {activeTicket.resolved_by?.full_name && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Giải quyết bởi</span>
                                            <span className="text-slate-700">{activeTicket.resolved_by.full_name}</span>
                                        </div>
                                    )}
                                    {activeTicket.resolution_notes && (
                                        <div className="mt-2 bg-green-50 rounded-lg p-2.5">
                                            <p className="text-[11px] font-semibold text-green-600 mb-1">Ghi chú giải quyết</p>
                                            <p className="text-xs text-green-800">{activeTicket.resolution_notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
