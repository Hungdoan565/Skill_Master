import { useRef, useState } from 'react';
import { useTeacherProfile } from '../hooks/useTeacherProfile';
import {
    Mail,
    Phone,
    DollarSign,
    Calendar,
    Building2,
    BookOpen,
    GraduationCap,
    Clock,
    AlertTriangle,
    RefreshCw,
    Pencil,
    X,
    Save,
    Check,
    Loader2,
    Camera,
} from 'lucide-react';

export default function TeacherProfilePage() {
    const { profile, loading, saving, error, refetch, updateProfile, uploadAvatar } = useTeacherProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ phone: '' });
    const [editError, setEditError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [avatarError, setAvatarError] = useState(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const avatarInputRef = useRef(null);

    const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md shadow-sm">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Safely extract profile details
    const {
        email = '',
        full_name = 'Giáo viên',
        phone = 'Chưa cập nhật',
        avatar_url = null,
        hourly_rate = 0,
        status = 'ACTIVE',
        created_at = new Date().toISOString(),
        centers = [],
        stats = {}
    } = profile || {};

    // Get initials for avatar fallback
    const getInitials = (name) => {
        if (!name) return 'GV';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Primary center
    const primaryCenter = centers.length > 0 ? centers[0] : null;

    // Start editing
    const handleStartEdit = () => {
        setEditForm({
            phone: phone === 'Chưa cập nhật' ? '' : (phone || ''),
        });
        setEditError(null);
        setSuccessMessage(null);
        setIsEditing(true);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({ phone: '' });
        setEditError(null);
    };

    // Save profile
    const handleSave = async () => {
        setEditError(null);
        setSuccessMessage(null);

        // Validate phone
        const phoneClean = editForm.phone.replace(/\s/g, '');
        if (phoneClean && !/^0\d{9}$/.test(phoneClean)) {
            setEditError('Số điện thoại phải có 10 số, bắt đầu bằng 0');
            return;
        }

        const result = await updateProfile({
            phone: phoneClean || null,
        });

        if (result.success) {
            setIsEditing(false);
            setSuccessMessage(result.message);
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            setEditError(result.message);
        }
    };

    const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
        reader.readAsDataURL(file);
    });

    const handleAvatarPickClick = () => {
        avatarInputRef.current?.click();
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setAvatarError(null);
        setSuccessMessage(null);

        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            setAvatarError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
            setAvatarError('Dung lượng ảnh tối đa là 2MB');
            event.target.value = '';
            return;
        }

        try {
            setAvatarUploading(true);
            const base64Image = await readFileAsDataURL(file);
            setAvatarPreview(base64Image);

            const result = await uploadAvatar(base64Image);
            if (!result.success) {
                setAvatarError(result.message || 'Không thể cập nhật ảnh đại diện');
                setAvatarPreview(null);
                return;
            }

            setSuccessMessage(result.message || 'Cập nhật ảnh đại diện thành công');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setAvatarError(err.message || 'Không thể xử lý ảnh đại diện');
            setAvatarPreview(null);
        } finally {
            setAvatarUploading(false);
            event.target.value = '';
        }
    };

    const displayAvatarUrl = avatarPreview || avatar_url;

    return (
        <div className="min-h-screen bg-transparent pb-12">
            {/* Profile Hero Section */}
            <div className="bg-card border-b border-border shadow-sm mb-8 pt-8 pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 animate-fade-in-up">
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative group">
                            {displayAvatarUrl ? (
                                <img
                                    src={displayAvatarUrl}
                                    alt={full_name}
                                    className="h-32 w-32 rounded-3xl border border-border object-cover shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1"
                                />
                            ) : (
                                <div className="h-32 w-32 rounded-3xl border border-blue-200 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white transition-all duration-300 group-hover:-translate-y-1 hover:shadow-lg">
                                    {getInitials(full_name)}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-card shadow-sm" title="Đang hoạt động"></div>
                            <button
                                type="button"
                                onClick={handleAvatarPickClick}
                                disabled={avatarUploading || saving}
                                className="absolute -top-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/30 bg-card text-blue-600 shadow-sm hover:bg-blue-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                title="Cập nhật ảnh đại diện"
                            >
                                {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        {/* Name & Role */}
                        <div className="flex-1 text-center md:text-left mt-2 md:mt-2">
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">{full_name}</h1>
                            <div className="mt-3 flex flex-col md:flex-row items-center gap-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${status === 'ACTIVE' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                                    {status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm nghỉ'}
                                </span>
                                <div className="flex items-center text-muted-foreground font-medium text-sm bg-muted px-3 py-1 rounded-lg border border-border">
                                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {email}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-center md:self-start mt-6 md:mt-2">
                            <button
                                onClick={refetch}
                                className="p-2.5 rounded-xl bg-card shadow-sm border border-border hover:bg-muted transition-all hover-card-lift text-muted-foreground"
                                title="Làm mới dữ liệu"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                            {!isEditing && (
                                <button
                                    onClick={handleStartEdit}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 btn-tactile hover-card-lift"
                                    title="Chỉnh sửa hồ sơ"
                                >
                                    <Pencil className="h-4 w-4" />
                                    <span className="hidden sm:inline">Chỉnh sửa</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 animate-fade-in-up">
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 font-medium shadow-sm">
                        <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                        <span>{successMessage}</span>
                    </div>
                </div>
            )}

            {avatarError && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 animate-fade-in-up">
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 font-medium shadow-sm">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
                        <span>{avatarError}</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-fade-in-up stagger-1">

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Classes Stat */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center hover-card-lift transition-all">
                        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mr-5">
                            <BookOpen className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Tổng lớp dạy</p>
                            <p className="text-3xl font-bold text-foreground tracking-tight">{stats.totalClasses || 0}</p>
                        </div>
                    </div>

                    {/* Sessions Stat */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center hover-card-lift transition-all">
                        <div className="p-4 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 mr-5">
                            <GraduationCap className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Tổng buổi dạy</p>
                            <p className="text-3xl font-bold text-foreground tracking-tight">{stats.totalSessions || 0}</p>
                        </div>
                    </div>

                    {/* Hours Stat */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center hover-card-lift transition-all">
                        <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mr-5">
                            <Clock className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Số giờ năm nay</p>
                            <p className="text-3xl font-bold text-foreground tracking-tight">{stats.totalHoursThisYear || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                    {/* Left Column: Personal Info */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover-card-lift transition-all duration-300">
                        <div className="px-6 py-5 border-b border-border bg-muted/50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">Thông tin cá nhân</h2>
                            {isEditing && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-xl hover:bg-muted transition-all btn-tactile"
                                        disabled={saving}
                                    >
                                        <X className="h-4 w-4" />
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 btn-tactile shadow-sm shadow-blue-600/20"
                                        disabled={saving}
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Lưu thay đổi
                                    </button>
                                </div>
                            )}
                        </div>

                        {editError && (
                            <div className="mx-6 mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2 font-medium">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                {editError}
                            </div>
                        )}

                        <div className="p-6">
                            <ul className="space-y-6">
                                {/* Email — read only always */}
                                <li className="flex items-start">
                                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mr-5 border border-border shadow-sm shrink-0">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                                        <p className="text-base font-medium text-foreground">{email}</p>
                                    </div>
                                </li>

                                {/* Phone — editable */}
                                <li className="flex items-start">
                                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0 mr-5 border border-blue-500/20 shadow-sm shrink-0">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Số điện thoại</p>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                placeholder="0912345678"
                                                className="mt-1 w-full px-4 py-2.5 text-base border border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-card text-foreground shadow-inner"
                                                maxLength={11}
                                                autoFocus
                                            />
                                        ) : (
                                            <p className="text-base font-medium text-foreground">{phone}</p>
                                        )}
                                    </div>
                                </li>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Hourly rate — read only */}
                                    <li className="flex items-start bg-muted p-4 rounded-xl border border-border">
                                        <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 mr-4 shrink-0">
                                            <DollarSign className="h-5 w-5" />
                                        </div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-medium text-muted-foreground mb-0.5">Lương / giờ</p>
                                            <p className="text-base font-bold text-foreground">{formatCurrency(hourly_rate)}</p>
                                        </div>
                                    </li>

                                    {/* Join date — read only */}
                                    <li className="flex items-start bg-muted p-4 rounded-xl border border-border">
                                        <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 mr-4 shrink-0">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-medium text-muted-foreground mb-0.5">Ngày tham gia</p>
                                            <p className="text-base font-bold text-foreground">{formatDate(created_at)}</p>
                                        </div>
                                    </li>
                                </div>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Center Info */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover-card-lift transition-all duration-300">
                        <div className="px-6 py-5 border-b border-border bg-muted/50">
                            <h2 className="text-lg font-bold text-foreground">Trung tâm trực thuộc</h2>
                        </div>
                        <div className="p-6">
                            {primaryCenter ? (
                                <ul className="space-y-6">
                                    <li className="flex items-start bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 mr-5 shrink-0 shadow-sm">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Tên trung tâm</p>
                                            <p className="text-lg font-bold text-foreground">{primaryCenter.name || 'Chưa cập nhật'}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start px-2">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-5 shrink-0">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-sm font-medium text-muted-foreground mb-0.5">Địa chỉ</p>
                                            <p className="text-base font-medium text-foreground leading-relaxed">{primaryCenter.address || 'Chưa cập nhật'}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start px-2">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-5 shrink-0">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-sm font-medium text-muted-foreground mb-0.5">Hotline</p>
                                            <p className="text-base font-medium text-foreground">{primaryCenter.phone || primaryCenter.hotline || 'Chưa cập nhật'}</p>
                                        </div>
                                    </li>
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
                                        <Building2 className="h-10 w-10 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-foreground font-semibold text-lg">Chưa liên kết trung tâm</p>
                                    <p className="text-muted-foreground mt-2 max-w-xs">Tài khoản của bạn hiện tại chưa được phân công giảng dạy tại trung tâm nào.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
