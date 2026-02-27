import { Globe, FileText, Code2, Users, HelpCircle, CheckCircle, XCircle, Clock, AlertTriangle, Ban } from 'lucide-react';

// ============================================================
// CATEGORY CONFIG — Single source of truth
// ============================================================
export const CATEGORY_CONFIG = {
  language: {
    icon: Globe,
    color: '#3B82F6',
    borderColor: 'border-blue-400',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    label: 'Ngoại ngữ',
    template: 'classic-gold',
  },
  office: {
    icon: FileText,
    color: '#10B981',
    borderColor: 'border-emerald-400',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    label: 'Tin học văn phòng',
    template: 'modern-blue',
  },
  programming: {
    icon: Code2,
    color: '#8B5CF6',
    borderColor: 'border-violet-400',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-700',
    label: 'Lập trình',
    template: 'professional-purple',
  },
  soft_skill: {
    icon: Users,
    color: '#F59E0B',
    borderColor: 'border-amber-400',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    label: 'Kỹ năng mềm',
    template: 'elegant-warm',
  },
  other: {
    icon: HelpCircle,
    color: '#6B7280',
    borderColor: 'border-gray-400',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-700',
    label: 'Khác',
    template: 'classic-gold',
  },
};

// ============================================================
// STATUS CONFIG
// ============================================================
export const STATUS_CONFIG = {
  issued: {
    label: 'Còn hiệu lực',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    dotColor: 'bg-green-500',
  },
  pending_approval: {
    label: 'Chờ duyệt',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    dotColor: 'bg-blue-500',
  },
  expiring: {
    label: 'Sắp hết hạn',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: AlertTriangle,
    dotColor: 'bg-amber-500',
  },
  expired: {
    label: 'Hết hạn',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Clock,
    dotColor: 'bg-gray-400',
  },
  revoked: {
    label: 'Đã thu hồi',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    dotColor: 'bg-red-500',
  },
  rejected: {
    label: 'Từ chối',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Ban,
    dotColor: 'bg-red-500',
  },
};

// ============================================================
// GRADE CONFIG — Vietnamese + English mapping
// ============================================================
export const GRADE_CONFIG = {
  'Xuất sắc': { en: 'DISTINCTION', color: 'text-yellow-600', bgColor: 'bg-yellow-50', order: 1 },
  'Giỏi': { en: 'MERIT', color: 'text-blue-600', bgColor: 'bg-blue-50', order: 2 },
  'Khá': { en: 'CREDIT', color: 'text-green-600', bgColor: 'bg-green-50', order: 3 },
  'Đạt': { en: 'PASS', color: 'text-gray-600', bgColor: 'bg-gray-50', order: 4 },
};

export const GRADE_OPTIONS = Object.entries(GRADE_CONFIG).map(([vi, config]) => ({
  value: vi,
  label: `${vi} (${config.en})`,
}));

// ============================================================
// TEMPLATE CONFIG — Maps to React-PDF template components
// ============================================================
export const TEMPLATE_CONFIG = {
  'classic-gold': {
    id: 'classic-gold',
    name: 'Classic Gold',
    description: 'Phong cách cổ điển, viền vàng sang trọng. Phù hợp chứng chỉ ngoại ngữ.',
    category: 'language',
    previewColor: '#D97706',
  },
  'modern-blue': {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Phong cách hiện đại, tông xanh chuyên nghiệp. Phù hợp tin học văn phòng.',
    category: 'office',
    previewColor: '#3B82F6',
  },
  'professional-purple': {
    id: 'professional-purple',
    name: 'Professional Purple',
    description: 'Phong cách công nghệ, tông tím nổi bật. Phù hợp lập trình.',
    category: 'programming',
    previewColor: '#8B5CF6',
  },
  'elegant-warm': {
    id: 'elegant-warm',
    name: 'Elegant Warm',
    description: 'Phong cách ấm áp, tinh tế. Phù hợp kỹ năng mềm.',
    category: 'soft_skill',
    previewColor: '#F59E0B',
  },
};

// ============================================================
// APPROVAL STATUS CONFIG
// ============================================================
export const APPROVAL_STATUS_CONFIG = {
  pending: { label: 'Đang chờ duyệt', color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
  auto_approved: { label: 'Tự động duyệt', color: 'bg-gray-100 text-gray-600' },
};

// ============================================================
// PAGE SIZE OPTIONS
// ============================================================
export const PAGE_SIZE_OPTIONS = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 20;

// ============================================================
// EXPIRY WARNING DAYS
// ============================================================
export const EXPIRY_WARNING_DAYS = 30;

// ============================================================
// HELPER: Get certificate display status (considers expiry)
// ============================================================
export function getCertificateDisplayStatus(certificate) {
  if (certificate.status === 'revoked') return 'revoked';
  if (certificate.approval_status === 'pending_approval') return 'pending_approval';
  if (certificate.approval_status === 'rejected') return 'rejected';
  
  if (certificate.expires_at) {
    const expiresAt = new Date(certificate.expires_at);
    const now = new Date();
    if (expiresAt < now) return 'expired';
    
    const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) return 'expiring';
  }
  
  return 'issued';
}

// ============================================================
// HELPER: Get category for template selection
// ============================================================
export function getTemplateForCategory(category) {
  return CATEGORY_CONFIG[category]?.template || 'classic-gold';
}
