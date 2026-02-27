/**
 * SupportPage - Trang quản lý phản hồi và hỗ trợ học viên
 * 
 * Features:
 * - Danh sách tickets hỗ trợ
 * - Chat/messaging với học viên
 * - Phân loại và ưu tiên
 * - Gán nhân viên xử lý
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    MessageSquare,
    Search,
    Filter,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Send,
    RefreshCw,
    Loader2,
    ChevronRight,
    Settings,
    CreditCard,
    BookOpen,
    Calendar,
    Award,
    HelpCircle,
    Building2,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useSupport } from '../hooks';
import {
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
    CATEGORY_OPTIONS,
    getStatusConfig,
    getPriorityConfig,
    getCategoryConfig,
    formatDate,
    formatRelativeTime,
} from '../utils';

// Category Icons mapping
const CategoryIcons = {
    technical: Settings,
    billing: CreditCard,
    course: BookOpen,
    schedule: Calendar,
    certificate: Award,
    other: HelpCircle,
};

// Stats Card
const StatsCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    </div>
);

// Ticket Item
const TicketItem = ({ ticket, selected, onClick }) => {
    const statusConfig = getStatusConfig(ticket.status);
    const priorityConfig = getPriorityConfig(ticket.priority);
    const categoryConfig = getCategoryConfig(ticket.category);
    const CategoryIcon = CategoryIcons[ticket.category] || HelpCircle;

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div
            onClick={() => onClick(ticket)}
            className={`
        p-4 border-b cursor-pointer transition-colors
        ${selected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}
      `}
        >
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                    {getInitials(ticket.students?.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{ticket.subject}</p>
                            <p className="text-sm text-slate-500 truncate">{ticket.students?.full_name}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <CategoryIcon className="h-3 w-3" />
                            {categoryConfig.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${priorityConfig.color}`}>
                            {priorityConfig.label}
                        </span>
                        <span>{formatRelativeTime(ticket.updated_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Message Bubble
const MessageBubble = ({ message, isAdmin }) => {
    const isFromAdmin = message.sender?.role !== 'STUDENT';

    return (
        <div className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`
        max-w-[70%] rounded-lg px-4 py-2
        ${isFromAdmin
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }
      `}>
                <p className="text-sm">{message.content}</p>
                <div className={`flex items-center gap-2 mt-1 text-xs ${isFromAdmin ? 'text-indigo-200' : 'text-slate-400'}`}>
                    <span>{message.sender?.full_name}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(message.created_at)}</span>
                </div>
            </div>
        </div>
    );
};

// Ticket Detail Panel
const TicketDetailPanel = ({ ticket, messages, onClose, onStatusChange, onSendReply, profile }) => {
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    const statusConfig = getStatusConfig(ticket.status);
    const priorityConfig = getPriorityConfig(ticket.priority);
    const categoryConfig = getCategoryConfig(ticket.category);

    const handleSend = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await onSendReply(ticket.id, replyText);
            setReplyText('');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-3">
                    <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Quay lại
                    </Button>
                    <span className="text-xs font-mono text-slate-400">{ticket.ticket_number}</span>
                </div>
                <h2 className="font-semibold text-lg text-slate-900">{ticket.subject}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.color}`}>
                        {priorityConfig.label}
                    </span>
                </div>
            </div>

            {/* Student Info */}
            <div className="p-4 border-b bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
                        {ticket.students?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{ticket.students?.full_name}</p>
                        <p className="text-sm text-slate-500">{ticket.students?.email}</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
                {messages.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Chưa có tin nhắn</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isAdmin={msg.sender_id === profile?.id}
                        />
                    ))
                )}
            </div>

            {/* Quick Actions */}
            {ticket.status !== 'closed' && (
                <div className="p-3 border-t bg-slate-50 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Cập nhật trạng thái:</span>
                    {STATUS_OPTIONS.filter(s => s.value !== ticket.status && s.value !== 'closed').map(status => (
                        <Button
                            key={status.value}
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusChange(ticket.id, status.value)}
                            className="text-xs"
                        >
                            {status.label}
                        </Button>
                    ))}
                    {ticket.status === 'resolved' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusChange(ticket.id, 'closed')}
                            className="text-xs"
                        >
                            Đóng ticket
                        </Button>
                    )}
                </div>
            )}

            {/* Reply Input */}
            {ticket.status !== 'closed' && (
                <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                        <Input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Nhập phản hồi..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <Button onClick={handleSend} disabled={sending || !replyText.trim()}>
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export function SupportPage() {
    const { isManager, getCenterId, isSuperAdmin, profile } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [centers, setCenters] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [mobileShowDetail, setMobileShowDetail] = useState(false);

    const {
        tickets,
        loading,
        currentTicket,
        messages,
        fetchTickets,
        fetchTicketDetail,
        updateTicketStatus,
        sendReply,
        filterTickets,
        setCurrentTicket,
    } = useSupport();

    // Effective center ID
    const effectiveCenterId = useMemo(() => {
        if (isSuperAdmin()) {
            return selectedCenter || null;
        }
        return getCenterId();
    }, [isSuperAdmin, selectedCenter, getCenterId]);

    // Fetch centers for SUPER_ADMIN
    useEffect(() => {
        if (isSuperAdmin()) {
            const fetchCentersData = async () => {
                try {
                    const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/centers`,
                        { headers: { Authorization: `Bearer ${session?.access_token}` } }
                    );
                    const result = await response.json();
                    if (result.success) {
                        setCenters(result.data || []);
                    }
                } catch (err) {
                    console.error('Error fetching centers:', err);
                }
            };
            fetchCentersData();
        }
    }, [isSuperAdmin]);

    // Fetch tickets
    useEffect(() => {
        fetchTickets({
            status: statusFilter,
            priority: priorityFilter,
            centerId: effectiveCenterId,
        });
    }, [fetchTickets, statusFilter, priorityFilter, effectiveCenterId]);

    // Filter tickets locally
    const filteredTickets = filterTickets(searchTerm);

    // Stats
    const stats = useMemo(() => ({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
    }), [tickets]);

    // Handle ticket selection
    const handleSelectTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setCurrentTicket(ticket);
        setMobileShowDetail(true);
        await fetchTicketDetail(ticket.id);
    };

    // Handle status change
    const handleStatusChange = async (ticketId, status) => {
        try {
            await updateTicketStatus(ticketId, status);
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    // Handle send reply
    const handleSendReply = async (ticketId, content) => {
        try {
            await sendReply(ticketId, content);
        } catch (err) {
            console.error('Error sending reply:', err);
            // Mock add message for development
            const mockMessage = {
                id: Date.now().toString(),
                ticket_id: ticketId,
                content,
                sender_id: profile?.id,
                sender: { full_name: profile?.full_name || 'Admin', role: profile?.roles?.code || 'SUPER_ADMIN' },
                created_at: new Date().toISOString(),
            };
            // This would be handled by the hook in production
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hỗ trợ Học viên</h1>
                    <p className="text-slate-500">Quản lý yêu cầu hỗ trợ và phản hồi</p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fetchTickets({ status: statusFilter, priority: priorityFilter, centerId: effectiveCenterId })}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard icon={MessageSquare} label="Tổng tickets" value={stats.total} color="bg-indigo-500" />
                <StatsCard icon={AlertTriangle} label="Mới" value={stats.open} color="bg-blue-500" />
                <StatsCard icon={Clock} label="Đang xử lý" value={stats.inProgress} color="bg-yellow-500" />
                <StatsCard icon={CheckCircle} label="Đã giải quyết" value={stats.resolved} color="bg-green-500" />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tickets List */}
                <Card className={`lg:col-span-1 ${mobileShowDetail ? 'hidden lg:block' : ''}`}>
                    <CardHeader className="pb-3">
                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm ticket..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Tất cả trạng thái</option>
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Tất cả độ ưu tiên</option>
                                {PRIORITY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Center Filter for SUPER_ADMIN */}
                        {isSuperAdmin() && centers.length > 0 && (
                            <select
                                value={selectedCenter}
                                onChange={(e) => setSelectedCenter(e.target.value)}
                                className="mt-2 text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                            >
                                <option value="">Tất cả trung tâm</option>
                                {centers.map(center => (
                                    <option key={center.id} value={center.id}>{center.name}</option>
                                ))}
                            </select>
                        )}
                    </CardHeader>
                    <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Không có ticket nào</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <TicketItem
                                    key={ticket.id}
                                    ticket={ticket}
                                    selected={selectedTicket?.id === ticket.id}
                                    onClick={handleSelectTicket}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Ticket Detail */}
                <Card className={`lg:col-span-2 ${!mobileShowDetail && !selectedTicket ? 'hidden lg:block' : ''}`}>
                    {selectedTicket ? (
                        <TicketDetailPanel
                            ticket={currentTicket || selectedTicket}
                            messages={messages}
                            onClose={() => { setSelectedTicket(null); setMobileShowDetail(false); }}
                            onStatusChange={handleStatusChange}
                            onSendReply={handleSendReply}
                            profile={profile}
                        />
                    ) : (
                        <CardContent className="h-[600px] flex items-center justify-center text-slate-500">
                            <div className="text-center">
                                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                <p>Chọn một ticket để xem chi tiết</p>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default SupportPage;
