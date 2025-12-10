/**
 * Security Middleware
 * Rate limiting, helmet, and other security measures
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút'
    },
    skipSuccessfulRequests: true
});

/**
 * Moderate rate limiter for admin operations
 * 50 requests per 15 minutes
 */
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: 'Quá nhiều thao tác admin, vui lòng thử lại sau'
    }
});

/**
 * Sanitize search input to prevent injection
 */
export const sanitizeSearch = (req, res, next) => {
    if (req.query.search) {
        // Remove special characters that could be used for injection
        req.query.search = req.query.search
            .replace(/[<>'"`;\\]/g, '')
            .trim()
            .substring(0, 100); // Limit length
    }
    next();
};

/**
 * Prevent sensitive data exposure in logs
 * Redacts token from logs
 */
export const sanitizeLogging = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        // Don't log the actual token
        req.headers.authorization = 'Bearer [REDACTED]';
    }
    next();
};

