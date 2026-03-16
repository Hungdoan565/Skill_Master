/**
 * SUPPORT CONTROLLER - Xử lý HTTP requests cho hỗ trợ
 */

import { SupportService } from '../services/support.service.js';

export class SupportController {
    /**
     * GET /api/admin/support-tickets
     */
    static async getAllTickets(req, res, next) {
        try {
            const { status, priority, centerId, assignedTo, search, page, limit, source, category } = req.query;

            // 🔒 CENTER_MANAGER chỉ thấy tickets của center mình
            const userRole = req.user.roleCode;
            const userCenterId = req.user.centerId;

            const filters = {
                status,
                priority,
                assignedTo,
                search,
                source,
                category,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20
            };

            // Nếu là CENTER_MANAGER, force filter theo center_id
            if (userRole === 'CENTER_MANAGER') {
                filters.centerId = userCenterId;
            } else if (centerId) {
                filters.centerId = centerId;
            }

            const result = await SupportService.getAllTickets(filters);

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error in SupportController.getAllTickets:', error);
            next(error);
        }
    }

    /**
     * GET /api/admin/support-tickets/:id
     */
    static async getTicketById(req, res, next) {
        try {
            const { id } = req.params;

            const ticket = await SupportService.getTicketById(id);

            // 🔒 CENTER_MANAGER chỉ xem tickets của center mình
            if (req.user.roleCode === 'CENTER_MANAGER') {
                if (ticket.center_id !== req.user.centerId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem ticket này'
                    });
                }
            }

            res.json({
                success: true,
                data: ticket
            });
        } catch (error) {
            console.error('Error in SupportController.getTicketById:', error);
            next(error);
        }
    }

    /**
     * POST /api/admin/support-tickets
     */
    static async createTicket(req, res, next) {
        try {
            const { title, description, priority, category, centerId } = req.body;

            if (!title || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu đề và mô tả là bắt buộc'
                });
            }

            // 🔒 CENTER_MANAGER chỉ tạo ticket cho center mình
            let effectiveCenterId = centerId;
            if (req.user.roleCode === 'CENTER_MANAGER') {
                effectiveCenterId = req.user.centerId;
            }

            const ticket = await SupportService.createTicket({
                title,
                description,
                priority,
                category,
                centerId: effectiveCenterId,
                userId: req.user.id
            });

            res.status(201).json({
                success: true,
                message: 'Tạo ticket thành công',
                data: ticket
            });
        } catch (error) {
            console.error('Error in SupportController.createTicket:', error);
            next(error);
        }
    }

    /**
     * PATCH /api/admin/support-tickets/:id
     */
    static async updateTicket(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // 🔒 Kiểm tra quyền
            const ticket = await SupportService.getTicketById(id);
            if (req.user.roleCode === 'CENTER_MANAGER') {
                if (ticket.center_id !== req.user.centerId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền cập nhật ticket này'
                    });
                }
            }

            const updatedTicket = await SupportService.updateTicket(id, updates);

            res.json({
                success: true,
                message: 'Cập nhật ticket thành công',
                data: updatedTicket
            });
        } catch (error) {
            console.error('Error in SupportController.updateTicket:', error);
            next(error);
        }
    }

    /**
     * POST /api/admin/support-tickets/:id/messages
     */
    static async addMessage(req, res, next) {
        try {
            const { id } = req.params;
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Nội dung tin nhắn là bắt buộc'
                });
            }

            // 🔒 Kiểm tra quyền
            const ticket = await SupportService.getTicketById(id);
            if (req.user.roleCode === 'CENTER_MANAGER') {
                if (ticket.center_id !== req.user.centerId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền gửi tin nhắn trong ticket này'
                    });
                }
            }

            const newMessage = await SupportService.addMessage(id, message, req.user.id);

            res.status(201).json({
                success: true,
                message: 'Đã gửi tin nhắn',
                data: newMessage
            });
        } catch (error) {
            console.error('Error in SupportController.addMessage:', error);
            next(error);
        }
    }

    /**
     * DELETE /api/admin/support-tickets/:id
     */
    static async deleteTicket(req, res, next) {
        try {
            const { id } = req.params;

            // 🔒 Chỉ SUPER_ADMIN được xóa ticket
            if (req.user.roleCode !== 'SUPER_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ SUPER_ADMIN được xóa ticket'
                });
            }

            await SupportService.deleteTicket(id);

            res.json({
                success: true,
                message: 'Đã xóa ticket'
            });
        } catch (error) {
            console.error('Error in SupportController.deleteTicket:', error);
            next(error);
        }
    }
}
