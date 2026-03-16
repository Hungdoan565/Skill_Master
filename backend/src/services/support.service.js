/**
 * SUPPORT SERVICE - Xử lý logic nghiệp vụ hỗ trợ
 */

import { supabase } from '../lib/db.js';

export class SupportService {
    /**
     * Lấy danh sách tickets
     */
    static async getAllTickets({ status, priority, centerId, assignedTo, search, source, category, page = 1, limit = 20 }) {
        try {
            let query = supabase
                .from('support_tickets')
                .select(`
          *,
          created_by_user:created_by(id, full_name, email),
          assigned_to_user:assigned_to(id, full_name, email),
          center:center_id(id, name),
          consultation_request:consultation_request_id(id, full_name, phone)
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
            if (source) {
                query = query.eq('source', source);
            }
            if (category) {
                query = query.eq('category', category);
            }
            if (search) {
                query = query.or(`subject.ilike.%${search}%,guest_name.ilike.%${search}%,guest_phone.ilike.%${search}%,ticket_number.ilike.%${search}%`);
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
          messages:ticket_messages(
            id, message, created_at, sender_id, is_internal,
            sender:sender_id(id, full_name, email, avatar_url)
          )
        `)
                .eq('id', ticketId)
                .single();

            if (error) throw error;

            // Enrich with consultation context if this is a follow-up ticket
            if (data?.consultation_request_id) {
                try {
                    const { data: consultation } = await supabase
                        .from('consultation_requests')
                        .select('id, full_name, phone, email, preferred_time, notes, status, metadata, transcript_summary, source, session_id, created_at')
                        .eq('id', data.consultation_request_id)
                        .single();

                    if (consultation) {
                        const meta = consultation.metadata || {};
                        let chatExcerpt = [];

                        // Load last 5 chat messages if session_id exists
                        if (consultation.session_id) {
                            const { data: chatMessages } = await supabase
                                .from('chat_messages')
                                .select('id, role, content, created_at')
                                .eq('session_id', consultation.session_id)
                                .neq('role', 'system')
                                .order('created_at', { ascending: false })
                                .limit(5);

                            chatExcerpt = (chatMessages || []).reverse();
                        }

                        data.consultation_context = {
                            id: consultation.id,
                            full_name: consultation.full_name,
                            phone: consultation.phone,
                            email: consultation.email,
                            preferred_time: consultation.preferred_time,
                            status: consultation.status,
                            source: consultation.source,
                            advisor_notes: consultation.notes,
                            transcript_summary: consultation.transcript_summary,
                            created_at: consultation.created_at,
                            intake: {
                                goal: meta.goal || null,
                                level: meta.level || null,
                                course: meta.course || null,
                                message: meta.message || null,
                            },
                            chat_excerpt: chatExcerpt,
                        };
                    }
                } catch (consultationErr) {
                    console.warn('⚠️ Could not load consultation context:', consultationErr.message);
                }
            }

            return data;
        } catch (error) {
            console.error('Error in SupportService.getTicketById:', error);
            throw error;
        }
    }

    /**
     * Tạo ticket mới
     */
    static async createTicket({ title, description, subject, priority, category, centerId, userId, source, guestName, guestPhone, guestEmail, consultationMetadata }) {
        try {
            const insertData = {
                subject: subject || title,
                description,
                priority: priority || 'normal',
                category: category || 'general',
                status: 'open',
                center_id: centerId,
                source: source || 'manual',
            };

            // Support both authenticated and guest tickets
            if (userId) {
                insertData.created_by = userId;
            }
            if (guestName) insertData.guest_name = guestName;
            if (guestPhone) insertData.guest_phone = guestPhone;
            if (guestEmail) insertData.guest_email = guestEmail;
            if (consultationMetadata) insertData.consultation_metadata = consultationMetadata;

            // Generate ticket number
            const { data: ticketNum } = await supabase.rpc('generate_ticket_number');
            if (ticketNum) insertData.ticket_number = ticketNum;

            const { data, error } = await supabase
                .from('support_tickets')
                .insert(insertData)
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
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    message,
                    sender_id: userId
                })
                .select(`
          *,
          sender:sender_id(id, full_name, email, avatar_url)
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
