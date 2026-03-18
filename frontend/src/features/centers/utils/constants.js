/**
 * Centers Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Status configuration
export const STATUS_CONFIG = {
    active: {
        label: 'Hoạt động',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500'
    },
    inactive: {
        label: 'Tạm đóng',
        color: 'bg-slate-100 text-slate-600 border-slate-200',
        dotColor: 'bg-slate-400'
    }
};

// Status options for filters/forms
export const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Tạm đóng' }
];

// Default working hours
export const DEFAULT_WORKING_HOURS = {
    monday: { open: '08:00', close: '21:00', closed: false },
    tuesday: { open: '08:00', close: '21:00', closed: false },
    wednesday: { open: '08:00', close: '21:00', closed: false },
    thursday: { open: '08:00', close: '21:00', closed: false },
    friday: { open: '08:00', close: '21:00', closed: false },
    saturday: { open: '08:00', close: '17:00', closed: false },
    sunday: { open: null, close: null, closed: true }
};

// Day labels (Vietnamese)
export const DAY_LABELS = {
    monday: 'Thứ 2',
    tuesday: 'Thứ 3',
    wednesday: 'Thứ 4',
    thursday: 'Thứ 5',
    friday: 'Thứ 6',
    saturday: 'Thứ 7',
    sunday: 'Chủ nhật'
};

// Default form data
export const DEFAULT_CENTER_FORM = {
    code: '',
    name: '',
    address: '',
    hotline: '',
    email: '',
    logo_url: '',
    description: '',
    working_hours: DEFAULT_WORKING_HOURS,
    manager_id: ''
};
