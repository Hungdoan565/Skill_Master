/**
 * useSupport Hook - Quản lý tickets hỗ trợ
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

export function useSupport() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentTicket, setCurrentTicket] = useState(null);
    const [messages, setMessages] = useState([]);

    // Fetch tickets
    const fetchTickets = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.category) params.append('category', filters.category);
            if (filters.centerId) params.append('center_id', filters.centerId);

            const response = await axios.get(
                `${API_URL}/api/admin/support-tickets?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setTickets(response.data.data || []);
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching tickets:', error);
            // Return mock data for development
            const mockData = [
                {
                    id: '1',
                    ticket_number: 'TK-2024-001',
                    subject: 'Không thể xem video bài giảng',
                    description: 'Em không xem được video bài giảng tuần 3, báo lỗi 404',
                    status: 'open',
                    priority: 'high',
                    category: 'technical',
                    student_id: '1',
                    students: { full_name: 'Nguyễn Văn A', email: 'nguyenvana@email.com' },
                    assigned_to: null,
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    updated_at: new Date(Date.now() - 3600000).toISOString(),
                    message_count: 2,
                },
                {
                    id: '2',
                    ticket_number: 'TK-2024-002',
                    subject: 'Yêu cầu hoàn tiền học phí',
                    description: 'Em muốn yêu cầu hoàn tiền do không thể tiếp tục học',
                    status: 'in_progress',
                    priority: 'medium',
                    category: 'billing',
                    student_id: '2',
                    students: { full_name: 'Trần Thị B', email: 'tranthib@email.com' },
                    assigned_to: { id: '1', full_name: 'Admin' },
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    updated_at: new Date(Date.now() - 7200000).toISOString(),
                    message_count: 5,
                },
                {
                    id: '3',
                    ticket_number: 'TK-2024-003',
                    subject: 'Hỏi về chương trình khóa học',
                    description: 'Em muốn hỏi về nội dung và lịch học khóa JavaScript',
                    status: 'resolved',
                    priority: 'low',
                    category: 'course',
                    student_id: '3',
                    students: { full_name: 'Lê Văn C', email: 'levanc@email.com' },
                    assigned_to: { id: '1', full_name: 'Admin' },
                    created_at: new Date(Date.now() - 172800000).toISOString(),
                    updated_at: new Date(Date.now() - 86400000).toISOString(),
                    message_count: 4,
                },
            ];
            setTickets(mockData);
            return mockData;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch single ticket with messages
    const fetchTicketDetail = useCallback(async (ticketId) => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(
                `${API_URL}/api/admin/support-tickets/${ticketId}`,
                { headers }
            );

            if (response.data?.success) {
                setCurrentTicket(response.data.data);
                setMessages(response.data.data.messages || []);
                return response.data.data;
            }
        } catch (error) {
            console.error('Error fetching ticket detail:', error);
            // Mock messages
            const mockMessages = [
                {
                    id: '1',
                    ticket_id: ticketId,
                    message: 'Em không xem được video bài giảng tuần 3, báo lỗi 404. Mong được hỗ trợ sớm ạ.',
                    sender_id: '1',
                    sender: { full_name: 'Nguyễn Văn A', roles: { code: 'STUDENT' } },
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: '2',
                    ticket_id: ticketId,
                    message: 'Chào em, cảm ơn em đã liên hệ. Anh/chị đang kiểm tra vấn đề này.',
                    sender_id: 'admin',
                    sender: { full_name: 'Admin', roles: { code: 'SUPER_ADMIN' } },
                    created_at: new Date(Date.now() - 1800000).toISOString(),
                },
            ];
            setMessages(mockMessages);
        }
    }, []);

    // Update ticket status
    const updateTicketStatus = useCallback(async (ticketId, status, resolution_notes = '') => {
        const headers = await getAuthHeaders();
        const response = await axios.put(
            `${API_URL}/api/admin/support-tickets/${ticketId}`,
            { status, resolution_notes },
            { headers }
        );

        if (response.data?.success) {
            setTickets(prev => prev.map(t =>
                t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t
            ));
            if (currentTicket?.id === ticketId) {
                setCurrentTicket(prev => ({ ...prev, status }));
            }
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, [currentTicket]);

    // Assign ticket to staff
    const assignTicket = useCallback(async (ticketId, staffId) => {
        const headers = await getAuthHeaders();
        const response = await axios.put(
            `${API_URL}/api/admin/support-tickets/${ticketId}`,
            { assigned_to: staffId },
            { headers }
        );

        if (response.data?.success) {
            setTickets(prev => prev.map(t =>
                t.id === ticketId ? { ...t, assigned_to: staffId } : t
            ));
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Send reply message
    const sendReply = useCallback(async (ticketId, message, is_internal = false) => {
        const headers = await getAuthHeaders();
        const response = await axios.post(
            `${API_URL}/api/support-tickets/${ticketId}/messages`,
            { message, is_internal },
            { headers }
        );

        if (response.data?.success) {
            const newMessage = response.data.data;
            setMessages(prev => [...prev, newMessage]);
            return newMessage;
        }
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
    }, []);

    // Filter tickets locally
    const filterTickets = useCallback((searchTerm) => {
        if (!searchTerm) return tickets;
        const term = searchTerm.toLowerCase();
        return tickets.filter(
            (t) =>
                t.ticket_number?.toLowerCase().includes(term) ||
                t.subject?.toLowerCase().includes(term) ||
                t.students?.full_name?.toLowerCase().includes(term) ||
                t.students?.email?.toLowerCase().includes(term)
        );
    }, [tickets]);

    return {
        tickets,
        loading,
        currentTicket,
        messages,
        fetchTickets,
        fetchTicketDetail,
        updateTicketStatus,
        assignTicket,
        sendReply,
        filterTickets,
        setCurrentTicket,
    };
}

export default useSupport;
