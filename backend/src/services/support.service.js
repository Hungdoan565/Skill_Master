/**
 * SUPPORT SERVICE - Xử lý logic nghiệp vụ hỗ trợ
 */

import { supabase } from '../lib/db.js';

export class SupportService {
    /**
     * Lấy danh sách tickets
     */
    static async getAllTickets({ status, priority, centerId, assignedTo, search, page = 1, limit = 20 }) {
        try {
            let query = supabase
                .from('support_tickets')
                .select(`
          *,
          created_by_user:created_by(id, full_name, email),
          assigned_to_user:assigned_to(id, full_name, email),
          center:center_id(id, name)
        `, { count: 'exact' })
                .order('created_at', { ascending: false });

            // Filters
            if (status) {
                query = query.eq('status', status);
            }
            if (priority) {
                query = query.eq('priority', priority);
            }
            if (centerId) {
                query = query.eq('center_id', centerId);
            }
            if (assignedTo) {
                query = query.eq('assigned_to', assignedTo);
            }
            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            // Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            return {
                tickets: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            };
        } catch (error) {
            console.error('Error in SupportService.getAllTickets:', error);
            throw error;
        }
    }

    /**
     * Lấy chi tiết ticket
     */
    static async getTicketById(ticketId) {
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select(`
          *,
          created_by_user:created_by(id, full_name, email, avatar_url),
          assigned_to_user:assigned_to(id, full_name, email, avatar_url),
          center:center_id(id, name),
          messages:support_messages(
            id, message, created_at, created_by,
            created_by_user:created_by(id, full_name, email, avatar_url)
          )
        `)
                .eq('id', ticketId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in SupportService.getTicketById:', error);
            throw error;
        }
    }

    /**
     * Tạo ticket mới
     */
    static async createTicket({ title, description, priority, category, centerId, userId }) {
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .insert({
                    title,
                    description,
                    priority: priority || 'medium',
                    category: category || 'general',
                    status: 'open',
                    center_id: centerId,
                    created_by: userId
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in SupportService.createTicket:', error);
            throw error;
        }
    }

    /**
     * Cập nhật ticket
     */
    static async updateTicket(ticketId, updates) {
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', ticketId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in SupportService.updateTicket:', error);
            throw error;
        }
    }

    /**
     * Gửi tin nhắn trong ticket
     */
    static async addMessage(ticketId, message, userId) {
        try {
            // Thêm message
            const { data: messageData, error: messageError } = await supabase
                .from('support_messages')
                .insert({
                    ticket_id: ticketId,
                    message,
                    created_by: userId
                })
                .select(`
          *,
          created_by_user:created_by(id, full_name, email, avatar_url)
        `)
                .single();

            if (messageError) throw messageError;

            // Cập nhật updated_at của ticket
            await supabase
                .from('support_tickets')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', ticketId);

            return messageData;
        } catch (error) {
            console.error('Error in SupportService.addMessage:', error);
            throw error;
        }
    }

    /**
     * Xóa ticket
     */
    static async deleteTicket(ticketId) {
        try {
            const { error } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', ticketId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error in SupportService.deleteTicket:', error);
            throw error;
        }
    }
}
