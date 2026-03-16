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
            if (filters.source) params.append('source', filters.source);
            if (filters.centerId) params.append('center_id', filters.centerId);
            if (filters.search) params.append('search', filters.search);

            const response = await axios.get(
                `${API_URL}/api/admin/support-tickets?${params}`,
                { headers }
            );

            if (response.data?.success) {
                const ticketList = response.data.tickets || response.data.data || [];
                setTickets(ticketList);
                return ticketList;
            }
            return [];
        } catch (error) {
            console.error('Error fetching tickets:', error);
            setTickets([]);
            return [];
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
            setMessages([]);
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
                t.students?.email?.toLowerCase().includes(term) ||
                t.guest_name?.toLowerCase().includes(term) ||
                t.guest_phone?.toLowerCase().includes(term) ||
                t.guest_email?.toLowerCase().includes(term)
        );
    }, [tickets]);

    return {
        tickets,
        loading,
        currentTicket,
        messages,
        setMessages,
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
