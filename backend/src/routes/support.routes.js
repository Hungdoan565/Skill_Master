/**
 * SUPPORT ROUTES - API hỗ trợ khách hàng
 */

import { Router } from 'express';
import { SupportController } from '../controllers/support.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

/**
 * GET /api/admin/support-tickets
 * Danh sách tickets
 * 🔒 SUPER_ADMIN, CENTER_MANAGER
 */
router.get('/', requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), SupportController.getAllTickets);

/**
 * GET /api/admin/support-tickets/:id
 * Chi tiết ticket
 * 🔒 SUPER_ADMIN, CENTER_MANAGER
 */
router.get('/:id', requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), SupportController.getTicketById);

/**
 * POST /api/admin/support-tickets
 * Tạo ticket mới
 * 🔒 SUPER_ADMIN, CENTER_MANAGER
 */
router.post('/', requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), SupportController.createTicket);

/**
 * PATCH /api/admin/support-tickets/:id
 * Cập nhật ticket
 * 🔒 SUPER_ADMIN, CENTER_MANAGER
 */
router.patch('/:id', requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), SupportController.updateTicket);

/**
 * POST /api/admin/support-tickets/:id/messages
 * Gửi tin nhắn trong ticket
 * 🔒 SUPER_ADMIN, CENTER_MANAGER
 */
router.post('/:id/messages', requireRole(['SUPER_ADMIN', 'CENTER_MANAGER']), SupportController.addMessage);

/**
 * DELETE /api/admin/support-tickets/:id
 * Xóa ticket (SUPER_ADMIN only)
 * 🔒 SUPER_ADMIN
 */
router.delete('/:id', requireRole(['SUPER_ADMIN']), SupportController.deleteTicket);

export default router;
