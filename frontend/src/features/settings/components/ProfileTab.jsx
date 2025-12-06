/**
 * ProfileTab Component - Tab Hồ sơ cá nhân
 */

import { useState, useEffect, useRef } from 'react';
import {
    User,
    Mail,
    Phone,
    Camera,
    Loader2,
    Save,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    Building2,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useProfile } from '../hooks';
import { useAuth } from '@/contexts/auth-context';

export function ProfileTab({ onMessage }) {
    const { profile: authProfile } = useAuth();
    const { profile, loading, saving, fetchProfile, updateProfile, changePassword, uploadAvatar } = useProfile();

    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    // Load profile on mount
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Sync form with profile
    useEffect(() => {
        const p = profile || authProfile;
        if (p) {
            setFormData({
                full_name: p.full_name || '',
                phone: p.phone || ''
            });
        }
    }, [profile, authProfile]);

    const currentProfile = profile || authProfile;

    // Handle form change
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle save profile
    const handleSaveProfile = async () => {
        const result = await updateProfile(formData);
        onMessage?.(result.message, result.success ? 'success' : 'error');
    };

    // Handle password change
    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            onMessage?.('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
        if (result.success) {
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
        }
        onMessage?.(result.message, result.success ? 'success' : 'error');
    };

    // Handle avatar upload
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            onMessage?.('Vui lòng chọn file ảnh', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            onMessage?.('Ảnh không được vượt quá 5MB', 'error');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async () => {
            const result = await uploadAvatar(reader.result);
            onMessage?.(result.success ? 'Cập nhật ảnh thành công' : result.message, result.success ? 'success' : 'error');
        };
        reader.readAsDataURL(file);
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Role badge
    const getRoleBadge = () => {
        const roleCode = currentProfile?.roles?.code;
        const config = {
            SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
            CENTER_MANAGER: { label: 'Quản lý', color: 'bg-amber-100 text-amber-700' },
            TEACHER: { label: 'Giáo viên', color: 'bg-blue-100 text-blue-700' },
            STUDENT: { label: 'Học viên', color: 'bg-emerald-100 text-emerald-700' }
        };
        return config[roleCode] || { label: roleCode || 'N/A', color: 'bg-gray-100 text-gray-700' };
    };

    if (loading && !currentProfile) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const roleBadge = getRoleBadge();

    return (
        <div className="space-y-6">
            {/* Profile Header Card */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="relative group">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <div
                            onClick={handleAvatarClick}
                            className="relative w-28 h-28 rounded-full cursor-pointer overflow-hidden
                                     ring-4 ring-indigo-100 group-hover:ring-indigo-200 transition-all"
                        >
                            {currentProfile?.avatar_url ? (
                                <img
                                    src={currentProfile.avatar_url}
                                    alt={currentProfile.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 
                                              flex items-center justify-center text-white text-3xl font-bold">
                                    {getInitials(currentProfile?.full_name)}
                                </div>
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center
                                          opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        {saving && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {currentProfile?.full_name || 'Chưa cập nhật tên'}
                        </h2>
                        <p className="text-gray-500 mt-1">{currentProfile?.email}</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${roleBadge.color}`}>
                                <Shield className="w-3.5 h-3.5" />
                                {roleBadge.label}
                            </span>
                            {currentProfile?.centers?.name && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {currentProfile.centers.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Profile Form */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            Họ và tên
                        </Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            placeholder="Nhập họ và tên"
                        />
                    </div>

                    {/* Email (readonly) */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            value={currentProfile?.email || ''}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            Số điện thoại
                        </Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="Nhập số điện thoại"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Lưu thay đổi
                    </Button>
                </div>
            </Card>

            {/* Password Change */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h3>
                    {!showPasswordForm && (
                        <Button
                            variant="outline"
                            onClick={() => setShowPasswordForm(true)}
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Đổi mật khẩu
                        </Button>
                    )}
                </div>

                {showPasswordForm && (
                    <div className="space-y-4">
                        {/* Current Password */}
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Mật khẩu mới</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwordData.newPassword && passwordData.confirmPassword && (
                                <p className={`text-xs ${passwordData.newPassword === passwordData.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {passwordData.newPassword === passwordData.confirmPassword ? (
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Mật khẩu khớp
                                        </span>
                                    ) : 'Mật khẩu không khớp'}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleChangePassword}
                                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Lock className="w-4 h-4 mr-2" />
                                )}
                                Đổi mật khẩu
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default ProfileTab;
