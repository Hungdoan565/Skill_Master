/**
 * Payment Utility Functions
 * Tính toán và kiểm tra tình trạng thanh toán của enrollment
 */

/**
 * Tính toán số tiền còn nợ
 * @param {number} tuitionFee - Học phí
 * @param {number} discountAmount - Tiền giảm giá
 * @param {number} paidAmount - Tiền đã đóng
 * @returns {number} Số tiền còn nợ
 */
export const calculateRemaining = (tuitionFee, discountAmount, paidAmount) => {
    const tuition = tuitionFee || 0;
    const discount = discountAmount || 0;
    const paid = paidAmount || 0;
    return Math.max(0, tuition - discount - paid);
};

/**
 * Xác định trạng thái thanh toán
 * @param {number} tuitionFee - Học phí
 * @param {number} discountAmount - Tiền giảm giá
 * @param {number} paidAmount - Tiền đã đóng
 * @returns {string} Trạng thái: 'paid', 'partial', 'unpaid'
 */
export const getPaymentStatusType = (tuitionFee, discountAmount, paidAmount) => {
    const remaining = calculateRemaining(tuitionFee, discountAmount, paidAmount);
    const paid = paidAmount || 0;

    if (remaining <= 0) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
};

/**
 * Lấy cấu hình badge cho payment status
 * @param {string} statusType - Loại trạng thái ('paid', 'partial', 'unpaid')
 * @returns {Object} Config object với label và color
 */
export const getPaymentStatusConfig = (statusType) => {
    const configs = {
        paid: {
            label: 'Đã đóng',
            color: 'bg-green-100 text-green-700',
            icon: 'CheckCircle'
        },
        partial: {
            label: 'Nợ một phần',
            color: 'bg-yellow-100 text-yellow-700',
            icon: 'Clock'
        },
        unpaid: {
            label: 'Chưa đóng',
            color: 'bg-red-100 text-red-700',
            icon: 'XCircle'
        }
    };

    return configs[statusType] || configs.unpaid;
};

/**
 * Format tiền tệ theo định dạng Việt Nam
 * @param {number} amount - Số tiền
 * @returns {string} Chuỗi định dạng tiền tệ
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

/**
 * Tính phần trăm thanh toán
 * @param {number} tuitionFee - Học phí
 * @param {number} discountAmount - Tiền giảm giá
 * @param {number} paidAmount - Tiền đã đóng
 * @returns {number} Phần trăm (0-100)
 */
export const calculatePaymentPercentage = (tuitionFee, discountAmount, paidAmount) => {
    const tuition = tuitionFee || 0;
    const discount = discountAmount || 0;
    const paid = paidAmount || 0;

    if (tuition === 0) return 0;

    const netTuition = tuition - discount;
    if (netTuition === 0) return 100;

    return Math.min(100, Math.round((paid / netTuition) * 100));
};

/**
 * Kiểm tra xem enrollment đã thanh toán đủ chưa
 * @param {number} tuitionFee - Học phí
 * @param {number} discountAmount - Tiền giảm giá
 * @param {number} paidAmount - Tiền đã đóng
 * @returns {boolean} True nếu đã đóng đủ
 */
export const isFullyPaid = (tuitionFee, discountAmount, paidAmount) => {
    const remaining = calculateRemaining(tuitionFee, discountAmount, paidAmount);
    return remaining <= 0;
};

/**
 * Kiểm tra xem enrollment có nợ tiền không
 * @param {number} tuitionFee - Học phí
 * @param {number} discountAmount - Tiền giảm giá
 * @param {number} paidAmount - Tiền đã đóng
 * @returns {boolean} True nếu có nợ
 */
export const hasOutstanding = (tuitionFee, discountAmount, paidAmount) => {
    const remaining = calculateRemaining(tuitionFee, discountAmount, paidAmount);
    return remaining > 0;
};

/**
 * Tính số tiền còn phải đóng sau khi áp dụng giảm giá
 * @param {number} tuitionFee - Học phí gốc
 * @param {number} discountAmount - Tiền giảm giá
 * @returns {number} Học phí sau giảm
 */
export const calculateNetTuition = (tuitionFee, discountAmount) => {
    const tuition = tuitionFee || 0;
    const discount = discountAmount || 0;
    return Math.max(0, tuition - discount);
};

/**
 * Get payment status badge config dựa trên enrollment object
 * @param {Object} enrollment - Enrollment object
 * @returns {Object} Config object với label và color
 */
export const getEnrollmentPaymentStatus = (enrollment) => {
    if (!enrollment) {
        return getPaymentStatusConfig('unpaid');
    }

    const statusType = getPaymentStatusType(
        enrollment.tuition_fee,
        enrollment.discount_amount,
        enrollment.paid_amount
    );

    return getPaymentStatusConfig(statusType);
};
