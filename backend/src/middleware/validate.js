/**
 * Validation Middleware
 * Validates request data against Joi schemas
 */

/**
 * Middleware factory to validate request data
 * @param {Object} schema - Joi schema
 * @param {String} property - Request property to validate (body, query, params)
 */
export const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }

        // Replace request property with validated value
        req[property] = value;
        next();
    };
};

