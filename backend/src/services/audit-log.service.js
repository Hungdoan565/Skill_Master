/**
 * Audit Log Service
 * Tracks all sensitive operations in the system
 */

import { supabase } from '../lib/db.js';

export class AuditLogService {
    /**
     * Log an audit event
     * @param {Object} params
     * @param {String} params.userId - User performing the action
     * @param {String} params.userEmail - User email
     * @param {String} params.userRole - User role
     * @param {String} params.action - Action performed (INSERT, UPDATE, DELETE, etc.)
     * @param {String} params.tableName - Table affected
     * @param {String} params.recordId - Record ID affected
     * @param {Object} params.oldValues - Old values (for UPDATE/DELETE)
     * @param {Object} params.newValues - New values (for INSERT/UPDATE)
     * @param {String} params.ipAddress - Request IP
     * @param {String} params.userAgent - User agent
     * @param {String} params.requestPath - Request path
     */
    static async log({
        userId,
        userEmail,
        userRole,
        action,
        tableName,
        recordId,
        oldValues = null,
        newValues = null,
        ipAddress = null,
        userAgent = null,
        requestPath = null
    }) {
        try {
            // Calculate changes
            let changes = null;
            if (oldValues && newValues) {
                changes = {};
                for (const key in newValues) {
                    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
                        changes[key] = {
                            old: oldValues[key],
                            new: newValues[key]
                        };
                    }
                }
            }

            const { data, error } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: userId,
                    user_email: userEmail,
                    user_role: userRole,
                    action,
                    table_name: tableName,
                    record_id: recordId,
                    old_values: oldValues,
                    new_values: newValues,
                    changes,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    request_path: requestPath
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Audit log error:', error);
                // Don't throw - audit logging should not break the main flow
                return null;
            }

            return data;
        } catch (err) {
            console.error('❌ Audit log exception:', err);
            return null;
        }
    }

    /**
     * Get audit trail for a specific record
     */
    static async getAuditTrail(tableName, recordId, limit = 50) {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('table_name', tableName)
                .eq('record_id', recordId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching audit trail:', err);
            return [];
        }
    }

    /**
     * Get recent audit logs (for admin monitoring)
     */
    static async getRecentLogs(filters = {}) {
        try {
            const { userId, action, tableName, limit = 100 } = filters;

            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (userId) query = query.eq('user_id', userId);
            if (action) query = query.eq('action', action);
            if (tableName) query = query.eq('table_name', tableName);

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching recent logs:', err);
            return [];
        }
    }
}

