/**
 * Audit Logging Middleware
 * Automatically logs sensitive operations
 */

import { AuditLogService } from '../services/audit-log.service.js';

/**
 * Middleware to log audit events
 * @param {String} tableName - Table being modified
 * @param {String} action - Action type (INSERT, UPDATE, DELETE, VIEW, EXPORT)
 */
export const auditLog = (tableName, action) => {
    return async (req, res, next) => {
        // Store original methods
        const originalJson = res.json;
        const originalSend = res.send;

        // Capture the response
        res.json = function (data) {
            // Log the audit event asynchronously (don't wait)
            if (data.success && req.user) {
                const recordId = req.params.id || data.data?.id || null;
                
                AuditLogService.log({
                    userId: req.user.id,
                    userEmail: req.user.email,
                    userRole: req.user.roleCode,
                    action,
                    tableName,
                    recordId,
                    oldValues: req._oldValues || null,
                    newValues: action === 'DELETE' ? null : req.body,
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    requestPath: req.originalUrl
                }).catch(err => {
                    console.error('Audit log failed:', err);
                });
            }

            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Middleware to capture old values before update/delete
 */
export const captureOldValues = (getOldValuesFn) => {
    return async (req, res, next) => {
        try {
            if (req.params.id) {
                req._oldValues = await getOldValuesFn(req.params.id);
            }
        } catch (err) {
            console.error('Error capturing old values:', err);
        }
        next();
    };
};

