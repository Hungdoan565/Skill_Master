import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/theme-context';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabaseClient';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Bell,
    Palette,
    Shield,
    Lock,
    Settings,
    Loader2
} from 'lucide-react';

export default function TeacherSettingsPage() {
    const { toast } = useToast();
    
    // Notification toggles
    const [emailNotif, setEmailNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(false);
    const [classReminders, setClassReminders] = useState(true);
    
    // Appearance toggles
    const { isDark, toggleTheme } = useTheme();

    // Password change state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // Load notification preferences from localStorage on mount
    useEffect(() => {
        const storedPrefs = localStorage.getItem('teacherNotificationPrefs');
        if (storedPrefs) {
            try {
                const prefs = JSON.parse(storedPrefs);
                if (prefs.emailNotif !== undefined) setEmailNotif(prefs.emailNotif);
                if (prefs.smsNotif !== undefined) setSmsNotif(prefs.smsNotif);
                if (prefs.classReminders !== undefined) setClassReminders(prefs.classReminders);
            } catch (e) {
                console.error("Error loading preferences", e);
            }
        }
    }, []);

    // Save notification preferences when changed
    const handleNotifChange = (key, value) => {
        const newPrefs = {
            emailNotif: key === 'emailNotif' ? value : emailNotif,
            smsNotif: key === 'smsNotif' ? value : smsNotif,
            classReminders: key === 'classReminders' ? value : classReminders,
        };
        
        if (key === 'emailNotif') setEmailNotif(value);
        if (key === 'smsNotif') setSmsNotif(value);
        if (key === 'classReminders') setClassReminders(value);
        
        localStorage.setItem('teacherNotificationPrefs', JSON.stringify(newPrefs));
        
        toast({
            title: "Đã lưu cài đặt",
            description: "Cài đặt thông báo của bạn đã được cập nhật.",
            type: "success"
        });
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');

        if (newPassword.length < 6) {
            setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Mật khẩu xác nhận không khớp.');
            return;
        }

        try {
            setIsUpdatingPassword(true);
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast({
                title: "Đổi mật khẩu thành công",
                description: "Mật khẩu của bạn đã được cập nhật an toàn.",
                type: "success"
            });
            setIsPasswordModalOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Password reset error:', error);
            setPasswordError(error.message || 'Đã có lỗi xảy ra. Hãy thử lại.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    // Custom Toggle Component to avoid using shadcn Switch
    const Toggle = ({ checked, onChange }) => (
        <button
            type="button"
            className={`${
                checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 hover:opacity-90`}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
        >
            <span
                aria-hidden="true"
                className={`${
                    checked ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );

    return (
        <div className="min-h-screen bg-transparent pb-12">
            <TeacherPageHeader
                title="Cài đặt tài khoản"
                subtitle="Quản lý thông báo, giao diện và bảo mật tài khoản cá nhân"
                icon={Settings}
                breadcrumbs={[
                    { label: 'Cài đặt', active: true }
                ]}
            />

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8 animate-fade-in-up stagger-1">
                
                {/* Notifications Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden hover-card-lift transition-all duration-300">
                    <div className="px-6 py-5 border-b border-border bg-slate-50/50 flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4 shadow-sm border border-blue-100">
                            <Bell className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Cài đặt thông báo</h2>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-6">
                            <li className="flex items-center justify-between pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="pr-4">
                                    <h3 className="text-base font-semibold text-slate-800 mb-1">Thông báo qua Email</h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg">Nhận thông báo về lịch học và lương qua email đăng ký</p>
                                </div>
                                <Toggle checked={emailNotif} onChange={(v) => handleNotifChange('emailNotif', v)} />
                            </li>
                            <li className="flex items-center justify-between pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="pr-4">
                                    <h3 className="text-base font-semibold text-slate-800 mb-1">Thông báo qua SMS</h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg">Nhận tin nhắn SMS cho các thông báo khẩn cấp và quan trọng</p>
                                </div>
                                <Toggle checked={smsNotif} onChange={(v) => handleNotifChange('smsNotif', v)} />
                            </li>
                            <li className="flex items-center justify-between pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="pr-4">
                                    <h3 className="text-base font-semibold text-slate-800 mb-1">Nhắc nhở lớp học</h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg">Nhận thông báo nhắc nhở 30 phút trước khi lớp học bắt đầu</p>
                                </div>
                                <Toggle checked={classReminders} onChange={(v) => handleNotifChange('classReminders', v)} />
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden hover-card-lift transition-all duration-300">
                    <div className="px-6 py-5 border-b border-border bg-slate-50/50 flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mr-4 shadow-sm border border-purple-100">
                            <Palette className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Giao diện</h2>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-6">
                            <li className="flex items-center justify-between pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="pr-4">
                                    <h3 className="text-base font-semibold text-slate-800 mb-1">Chế độ tối (Dark Mode)</h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">Sử dụng giao diện tối màu giúp bảo vệ mắt vào ban đêm</p>
                                </div>
                                <Toggle checked={isDark} onChange={toggleTheme} />
                            </li>
                            <li className="flex items-center justify-between pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="pr-4">
                                    <h3 className="text-base font-semibold text-slate-800 mb-1">Ngôn ngữ hiển thị</h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">Chọn ngôn ngữ cho giao diện người dùng và thông báo</p>
                                </div>
                                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                    <LocaleSwitcher />
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden hover-card-lift transition-all duration-300">
                    <div className="px-6 py-5 border-b border-border bg-slate-50/50 flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4 shadow-sm border border-emerald-100">
                            <Shield className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Bảo mật tài khoản</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-slate-800 mb-1">Đổi mật khẩu</h3>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed">Đổi mật khẩu định kỳ để bảo vệ tài khoản tốt hơn</p>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="px-5 py-2.5 bg-white text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:shadow-sm w-full sm:w-auto text-center border border-slate-200 shadow-sm transition-all btn-tactile"
                            >
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Đổi mật khẩu</DialogTitle>
                        <DialogDescription>
                            Nhập mật khẩu mới của bạn bên dưới. Hãy đảm bảo mật khẩu đủ mạnh.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handlePasswordChange} className="space-y-4 py-4">
                        {passwordError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                {passwordError}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Nhập ít nhất 6 ký tự"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Nhập lại mật khẩu mới"
                                required
                            />
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors mr-2"
                                disabled={isUpdatingPassword}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[120px]"
                                disabled={isUpdatingPassword}
                            >
                                {isUpdatingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    'Lưu mật khẩu'
                                )}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>            
        </div>
    );
}
