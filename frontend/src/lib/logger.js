/**
 * Logger utility - centralized logging with environment-based filtering
 * 
 * Usage:
 * import { logger } from '@/lib/logger';
 * logger.debug('Debug message');
 * logger.info('Info message');
 * logger.warn('Warning message');
 * logger.error('Error message', error);
 * 
 * In production, only error and warn will be shown.
 * In development, all logs will be shown.
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Log levels
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Current log level based on environment
const currentLevel = isDev ? LOG_LEVELS.debug : LOG_LEVELS.warn;

// Styled console prefix
const prefix = {
    debug: '🔍 [DEBUG]',
    info: 'ℹ️ [INFO]',
    warn: '⚠️ [WARN]',
    error: '❌ [ERROR]',
};

export const logger = {
    debug: (...args) => {
        if (LOG_LEVELS.debug >= currentLevel) {
            console.log(prefix.debug, ...args);
        }
    },

    info: (...args) => {
        if (LOG_LEVELS.info >= currentLevel) {
            console.log(prefix.info, ...args);
        }
    },

    warn: (...args) => {
        if (LOG_LEVELS.warn >= currentLevel) {
            console.warn(prefix.warn, ...args);
        }
    },

    error: (...args) => {
        if (LOG_LEVELS.error >= currentLevel) {
            console.error(prefix.error, ...args);
        }
    },

    // Group logs for complex outputs
    group: (label, callback) => {
        if (isDev) {
            console.group(label);
            callback();
            console.groupEnd();
        }
    },

    // Table output for arrays/objects
    table: (data, columns) => {
        if (isDev) {
            console.table(data, columns);
        }
    },

    // Time tracking
    time: (label) => {
        if (isDev) {
            console.time(label);
        }
    },

    timeEnd: (label) => {
        if (isDev) {
            console.timeEnd(label);
        }
    },
};

export default logger;
