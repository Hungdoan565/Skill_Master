/**
 * Admin Validators
 * Input validation schemas using Joi
 */

import Joi from 'joi';

/**
 * User Creation Validation
 */
export const createUserSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
    
    full_name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
            'string.max': 'Họ tên không được vượt quá 100 ký tự',
            'any.required': 'Họ tên là bắt buộc'
        }),
    
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .allow('', null)
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ'
        }),
    
    role: Joi.string()
        .valid('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER', 'STUDENT')
        .required()
        .messages({
            'any.only': 'Role không hợp lệ',
            'any.required': 'Role là bắt buộc'
        }),
    
    center_id: Joi.string()
        .uuid()
        .allow(null)
        .messages({
            'string.guid': 'Center ID không hợp lệ'
        }),
    
    hourly_rate: Joi.number()
        .min(0)
        .allow(null)
        .messages({
            'number.min': 'Lương theo giờ phải lớn hơn hoặc bằng 0'
        }),
    
    status: Joi.string()
        .valid('active', 'inactive')
        .default('active')
});

/**
 * User Update Validation
 */
export const updateUserSchema = Joi.object({
    full_name: Joi.string()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
            'string.max': 'Họ tên không được vượt quá 100 ký tự'
        }),
    
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .allow('', null)
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ'
        }),
    
    avatar_url: Joi.string()
        .uri()
        .allow('', null)
        .messages({
            'string.uri': 'URL avatar không hợp lệ'
        }),
    
    status: Joi.string()
        .valid('active', 'inactive')
        .messages({
            'any.only': 'Trạng thái không hợp lệ'
        }),
    
    hourly_rate: Joi.number()
        .min(0)
        .messages({
            'number.min': 'Lương theo giờ phải lớn hơn hoặc bằng 0'
        }),
    
    center_id: Joi.string()
        .uuid()
        .messages({
            'string.guid': 'Center ID không hợp lệ'
        })
}).min(1);

/**
 * Role Change Validation
 */
export const changeRoleSchema = Joi.object({
    role: Joi.string()
        .valid('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER', 'STUDENT')
        .required()
        .messages({
            'any.only': 'Role không hợp lệ',
            'any.required': 'Role là bắt buộc'
        })
});

/**
 * Search Query Validation
 */
export const searchQuerySchema = Joi.object({
    search: Joi.string()
        .max(100)
        .allow('')
        .messages({
            'string.max': 'Từ khóa tìm kiếm không được vượt quá 100 ký tự'
        }),
    
    role: Joi.string()
        .valid('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER', 'STUDENT')
        .allow('')
        .messages({
            'any.only': 'Role không hợp lệ'
        }),
    
    center_id: Joi.string()
        .uuid()
        .allow('')
        .messages({
            'string.guid': 'Center ID không hợp lệ'
        })
});

