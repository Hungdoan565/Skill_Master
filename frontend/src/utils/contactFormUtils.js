// ============================================
// CONTACT FORM UTILITIES
// Shared validation and submission functions
// ============================================

import { supabase } from '../lib/supabaseClient';

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates Vietnam phone number format
 * Accepts: 0901234567, 84901234567, +84901234567
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const validatePhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-\+]/g, '');
    // Vietnam phone: 10 digits starting with 0, or with 84 prefix
    return /^(0[3-9][0-9]{8}|84[3-9][0-9]{8})$/.test(cleaned);
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const validateEmail = (email) => {
    if (!email) return false;
    // Standard email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Validates name (minimum 2 characters)
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid
 */
export const validateName = (name) => {
    if (!name) return false;
    return name.trim().length >= 2;
};

// ============================================
// FORM VALIDATION
// ============================================

/**
 * Validates entire contact form
 * @param {Object} formData - Form data object
 * @returns {Object} - { isValid: boolean, errors: { field: message } }
 */
export const validateContactForm = (formData) => {
    const errors = {};

    if (!validateName(formData.name)) {
        errors.name = formData.name?.trim().length === 0
            ? 'Vui lòng nhập họ tên'
            : 'Họ tên quá ngắn (tối thiểu 2 ký tự)';
    }

    if (!validateEmail(formData.email)) {
        errors.email = formData.email?.trim().length === 0
            ? 'Vui lòng nhập email'
            : 'Email không hợp lệ';
    }

    if (!validatePhone(formData.phone)) {
        errors.phone = formData.phone?.trim().length === 0
            ? 'Vui lòng nhập số điện thoại'
            : 'Số điện thoại không hợp lệ';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// ============================================
// SPAM PROTECTION
// ============================================

/**
 * Checks if honeypot field was filled (indicates bot)
 * @param {string} honeypot - Honeypot field value
 * @returns {boolean} - True if spam detected
 */
export const isSpam = (honeypot) => {
    return honeypot && honeypot.length > 0;
};

// ============================================
// API SUBMISSION
// ============================================

/**
 * Submits contact form to Supabase Edge Function
 * @param {Object} formData - Form data
 * @param {string} source - Source identifier (e.g., 'contact-page', 'hero')
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const submitContactForm = async (formData, source = 'contact-page') => {
    try {
        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.replace(/[\s\-]/g, ''),
            message: formData.message?.trim() || '',
            interest: formData.interest || '',
            source,
            source_page: typeof window !== 'undefined' ? window.location.pathname : '',
            utm_params: typeof window !== 'undefined'
                ? Object.fromEntries(new URLSearchParams(window.location.search))
                : {},
            submitted_at: new Date().toISOString(),
        };

        // Call the consultation-api Edge Function (same as ConsultationModal)
        const { data, error } = await supabase.functions.invoke('consultation-api', {
            body: payload
        });

        if (error) {
            console.error('Contact form submission error:', error);
            return { success: false, error: error.message };
        }

        // Track analytics if available
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'contact_form_submitted', {
                source,
                interest: formData.interest || 'not_specified',
            });
        }

        return { success: true, data };
    } catch (err) {
        console.error('Contact form submission error:', err);
        return { success: false, error: 'Không thể gửi form. Vui lòng thử lại.' };
    }
};

export default {
    validatePhone,
    validateEmail,
    validateName,
    validateContactForm,
    isSpam,
    submitContactForm,
};
