/**
 * Verification constants - for PublicCertificateVerification page
 */

import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    WifiOff,
    ServerCrash,
    Globe,
    Building2,
    BookOpen,
    User,
} from 'lucide-react';

// Status config for verification results
export const VERIFICATION_STATUS_CONFIG = {
    valid: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Chứng chỉ hợp lệ',
        description: 'Chứng chỉ này được cấp bởi Skill Master và đang còn hiệu lực'
    },
    expired: {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Chứng chỉ đã hết hạn',
        description: 'Chứng chỉ này đã hết thời hạn hiệu lực'
    },
    revoked: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Chứng chỉ đã bị thu hồi',
        description: 'Chứng chỉ này đã bị thu hồi và không còn giá trị'
    },
    invalid: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Không tìm thấy',
        description: 'Không tìm thấy chứng chỉ với mã số này trong hệ thống'
    },
    network_error: {
        icon: WifiOff,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Lỗi kết nối',
        description: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.'
    },
    server_error: {
        icon: ServerCrash,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Lỗi máy chủ',
        description: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.'
    }
};

// Category config for certificate display
export const VERIFICATION_CATEGORY_CONFIG = {
    language: {
        icon: Globe,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        label: 'Ngoại ngữ'
    },
    office: {
        icon: Building2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'Tin học Văn phòng'
    },
    programming: {
        icon: BookOpen,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        label: 'Lập trình'
    },
    soft_skill: {
        icon: User,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        label: 'Kỹ năng mềm'
    }
};

// Format date helper
export const formatVerificationDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
