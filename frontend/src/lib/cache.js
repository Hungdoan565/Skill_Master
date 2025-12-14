/**
 * Simple In-Memory Cache with TTL (Time To Live)
 * 
 * Features:
 * - Memory cache with configurable TTL
 * - Stale-while-revalidate pattern support
 * - Auto cleanup of expired entries
 * - Key-based invalidation
 * 
 * @example
 * // Basic usage
 * cache.set('users', userData, 5 * 60 * 1000); // 5 minutes
 * const cached = cache.get('users');
 * 
 * // With stale support
 * const { data, isStale } = cache.getWithStale('dashboard', 60000);
 * if (isStale) { refetchInBackground(); }
 */

// Default TTL: 2 minutes
const DEFAULT_TTL = 2 * 60 * 1000;

// Stale threshold: 30 seconds before expiry
const STALE_THRESHOLD = 30 * 1000;

class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.ttls = new Map();

        // Auto cleanup every 5 minutes
        if (typeof window !== 'undefined') {
            setInterval(() => this.cleanup(), 5 * 60 * 1000);
        }
    }

    /**
     * Set a value in cache with optional TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in ms (default: 2 min)
     */
    set(key, value, ttl = DEFAULT_TTL) {
        this.cache.set(key, value);
        this.timestamps.set(key, Date.now());
        this.ttls.set(key, ttl);
    }

    /**
     * Get a value from cache (returns null if expired)
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null
     */
    get(key) {
        if (!this.cache.has(key)) return null;

        const timestamp = this.timestamps.get(key);
        const ttl = this.ttls.get(key) || DEFAULT_TTL;

        if (Date.now() - timestamp > ttl) {
            this.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    /**
     * Get value with stale status (for stale-while-revalidate)
     * Returns data even if stale, with flag indicating staleness
     * @param {string} key - Cache key
     * @param {number} staleThreshold - Time before expiry to consider stale
     * @returns {{ data: any|null, isStale: boolean, isMiss: boolean }}
     */
    getWithStale(key, staleThreshold = STALE_THRESHOLD) {
        if (!this.cache.has(key)) {
            return { data: null, isStale: false, isMiss: true };
        }

        const timestamp = this.timestamps.get(key);
        const ttl = this.ttls.get(key) || DEFAULT_TTL;
        const age = Date.now() - timestamp;

        // Completely expired - return miss
        if (age > ttl) {
            this.delete(key);
            return { data: null, isStale: false, isMiss: true };
        }

        // Stale but not expired - return data with stale flag
        const isStale = age > (ttl - staleThreshold);

        return {
            data: this.cache.get(key),
            isStale,
            isMiss: false
        };
    }

    /**
     * Check if key exists and is not expired
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Delete a specific key
     * @param {string} key 
     */
    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        this.ttls.delete(key);
    }

    /**
     * Delete all keys matching a prefix
     * @param {string} prefix 
     */
    invalidatePrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.delete(key);
            }
        }
    }

    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
        this.timestamps.clear();
        this.ttls.clear();
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, timestamp] of this.timestamps.entries()) {
            const ttl = this.ttls.get(key) || DEFAULT_TTL;
            if (now - timestamp > ttl) {
                this.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     * @returns {{ size: number, keys: string[] }}
     */
    stats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
export const cache = new SimpleCache();

// Cache key builders for consistency
export const CACHE_KEYS = {
    dashboard: (centerId) => `dashboard:${centerId || 'all'}`,
    classes: (filters = {}) => `classes:${JSON.stringify(filters)}`,
    students: (page, filters = {}) => `students:${page}:${JSON.stringify(filters)}`,
    courses: () => 'courses:all',
    centers: () => 'centers:all',
    teachers: () => 'teachers:all',
    invoices: (filters = {}) => `invoices:${JSON.stringify(filters)}`,
    reports: (type, params = {}) => `reports:${type}:${JSON.stringify(params)}`,
};

// TTL constants (in milliseconds)
export const CACHE_TTL = {
    SHORT: 30 * 1000,      // 30 seconds - for frequently changing data
    MEDIUM: 2 * 60 * 1000, // 2 minutes - default
    LONG: 5 * 60 * 1000,   // 5 minutes - for stable data
    VERY_LONG: 15 * 60 * 1000, // 15 minutes - for rarely changing data
};

export default cache;
