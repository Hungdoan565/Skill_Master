/**
 * Settings Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Setting keys
export const SETTING_KEYS = {
    BANK_CONFIG: 'bank_config',
    GRADE_CONFIG: 'grade_config',
    PAYROLL_CONFIG: 'payroll_config',
    SYSTEM_CONFIG: 'system_config',
    SECURITY_CONFIG: 'security_config',
    DASHBOARD_GOALS: 'dashboard_goals',
    EMAIL_CONFIG: 'email_config',
    NOTIFICATION_PREFS: 'notification_preferences'
};

// Default values
export const DEFAULT_BANK_CONFIG = {
    bankId: 'MB',
    accountNo: '',
    accountName: '',
    template: 'compact2'
};

export const DEFAULT_GRADE_CONFIG = {
    defaultPassScore: 5.0,
    maxTotalScore: 10.0,
    defaultCalculationType: 'weighted',
    defaultTemplate: 'programming'
};

export const DEFAULT_PAYROLL_CONFIG = {
    defaultHourlyRate: 150000,
    paymentMethods: ['cash', 'bank_transfer'],
    quickAmounts: [1000000, 2000000, 5000000]
};

export const DEFAULT_SYSTEM_CONFIG = {
    appName: 'Skill Master',
    dateFormat: 'DD/MM/YYYY',
    currency: 'VND'
};

export const DEFAULT_SECURITY_CONFIG = {
    // Session settings
    sessionTimeoutHours: 24,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,

    // Password policy
    passwordMinLength: 8,
    passwordExpiryDays: 0,
    passwordHistoryCount: 0,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,

    // 2FA settings
    require2FAForAdmin: false,
    allow2FAForStaff: true,
    default2FAMethod: 'email',
    otpExpirySeconds: 300,

    // Access control
    enableActivityLog: true,
    notifyNewDevice: true,
    allowMultipleSessions: true
};

// Dashboard goals default config
export const DEFAULT_DASHBOARD_GOALS = {
    revenueGoal: 200000000,  // 200 million VND
    studentsGoal: 50         // 50 new students
};

// Email config defaults
export const DEFAULT_EMAIL_CONFIG = {
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    senderName: 'Skill Master',
    senderEmail: '',
    provider: 'custom'
};

// Notification preferences defaults (flat format — matches UI component keys)
export const DEFAULT_NOTIFICATION_PREFS = {
    emailNewEnrollment: true,
    emailPaymentReceived: true,
    emailPaymentReminder: true,
    emailClassReminder: true,
    emailLeaveRequest: true,
    emailSystemUpdates: false,
    appNewEnrollment: true,
    appPaymentReceived: true,
    appAttendanceMarked: true,
    appGradeUpdated: true,
    emailDigestFrequency: 'instant'
};

// Bank options
export const BANK_OPTIONS = [
    { value: 'MB', label: 'MB Bank' },
    { value: 'VCB', label: 'Vietcombank' },
    { value: 'TCB', label: 'Techcombank' },
    { value: 'ACB', label: 'ACB' },
    { value: 'TPB', label: 'TPBank' },
    { value: 'BIDV', label: 'BIDV' },
    { value: 'VTB', label: 'VietinBank' },
    { value: 'STB', label: 'Sacombank' },
    { value: 'VPB', label: 'VPBank' },
    { value: 'MSB', label: 'MSB' }
];

// QR Template options
export const QR_TEMPLATE_OPTIONS = [
    { value: 'compact', label: 'Compact' },
    { value: 'compact2', label: 'Compact 2' },
    { value: 'qr_only', label: 'QR Only' },
    { value: 'print', label: 'Print' }
];

// Calculation type options
export const CALCULATION_TYPE_OPTIONS = [
    { value: 'weighted', label: 'Trọng số (%)' },
    { value: 'average', label: 'Trung bình cộng' }
];

// Grade template options
export const GRADE_TEMPLATE_OPTIONS = [
    { value: 'programming', label: 'Lập trình' },
    { value: 'ielts', label: 'IELTS' },
    { value: 'toeic', label: 'TOEIC' },
    { value: 'custom', label: 'Tùy chỉnh' }
];

// Tab groups for grouped sidebar
export const SETTINGS_TAB_GROUPS = [
    {
        id: 'personal',
        label: 'CÁ NHÂN',
        tabs: [
            { id: 'profile', label: 'Hồ sơ cá nhân', icon: 'User', description: 'Thông tin cá nhân và mật khẩu' },
            { id: 'bank', label: 'Tài khoản ngân hàng', icon: 'Building2', description: 'Thông tin ngân hàng nhận lương', teacherOnly: true },
        ]
    },
    {
        id: 'center',
        label: 'TRUNG TÂM',
        tabs: [
            { id: 'payment', label: 'Thanh toán', icon: 'CreditCard', description: 'Cấu hình thanh toán và QR code', adminOnly: true },
            { id: 'grades', label: 'Đánh giá', icon: 'GraduationCap', description: 'Cấu hình điểm số và mẫu đánh giá', adminOnly: true },
        ]
    },
    {
        id: 'system',
        label: 'HỆ THỐNG',
        tabs: [
            { id: 'email', label: 'Cấu hình Email', icon: 'Mail', description: 'SMTP server và gửi email', superAdminOnly: true, badge: 'Mới' },
            { id: 'notifications', label: 'Thông báo', icon: 'Bell', description: 'Tùy chỉnh nhận thông báo', badge: 'Mới' },
            { id: 'system', label: 'Cài đặt chung', icon: 'Settings', description: 'Tên ứng dụng, định dạng, tiền tệ', adminOnly: true },
            { id: 'security', label: 'Bảo mật', icon: 'Shield', description: 'Chính sách bảo mật hệ thống', superAdminOnly: true },
        ]
    }
];

// Flat tab list (derived from groups) for backward compat
export const SETTINGS_TABS = SETTINGS_TAB_GROUPS.flatMap(g => g.tabs);
