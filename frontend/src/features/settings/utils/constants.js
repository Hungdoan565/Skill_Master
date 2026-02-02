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
    DASHBOARD_GOALS: 'dashboard_goals'
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
    defaultPassword: 'SkillMaster@123',
    paymentMethods: ['cash', 'bank_transfer'],
    quickAmounts: [1000000, 2000000, 5000000]
};

export const DEFAULT_SYSTEM_CONFIG = {
    appName: 'Skill Master',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY',
    currency: 'VND',
    language: 'vi'
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

// Tab configuration
export const SETTINGS_TABS = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: 'User' },
    { id: 'bank', label: 'Tài khoản ngân hàng', icon: 'Building2', teacherOnly: true },
    { id: 'payment', label: 'Thanh toán', icon: 'CreditCard' },
    { id: 'grades', label: 'Đánh giá', icon: 'GraduationCap' },
    { id: 'system', label: 'Hệ thống', icon: 'Settings' },
    { id: 'security', label: 'Bảo mật', icon: 'Shield', superAdminOnly: true }
];
