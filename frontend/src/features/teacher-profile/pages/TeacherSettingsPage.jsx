import { useState } from 'react';
import { useTheme } from '@/contexts/theme-context';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import {
    Bell,
    Palette,
    Shield,
    Lock
} from 'lucide-react';

export default function TeacherSettingsPage() {
    // Notification toggles
    const [emailNotif, setEmailNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(false);
    const [classReminders, setClassReminders] = useState(true);
    
    // Appearance toggles
    const { isDark, toggleTheme } = useTheme();

    // Custom Toggle Component to avoid using shadcn Switch
    const Toggle = ({ checked, onChange }) => (
        <button
            type="button"
            className={`${
                checked ? 'bg-blue-600' : 'bg-muted'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
        >
            <span
                aria-hidden="true"
                className={`${
                    checked ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header / Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-16 pt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div>
                        <h1 className="text-3xl font-bold">Cài đặt tài khoản</h1>
                        <p className="mt-2 text-blue-100">
                            Quản lý thông báo, giao diện và bảo mật tài khoản của bạn
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-6">
                
                {/* Notifications Section */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center">
                        <Bell className="h-5 w-5 text-muted-foreground mr-2" />
                        <h2 className="text-lg font-semibold text-foreground">Thông báo</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-foreground">Thông báo qua Email</h3>
                                <p className="text-sm text-muted-foreground">Nhận thông báo về lịch học và lương qua email</p>
                            </div>
                            <Toggle checked={emailNotif} onChange={setEmailNotif} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-foreground">Thông báo qua SMS</h3>
                                <p className="text-sm text-muted-foreground">Nhận tin nhắn SMS cho các thông báo quan trọng</p>
                            </div>
                            <Toggle checked={smsNotif} onChange={setSmsNotif} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-foreground">Nhắc nhở lớp học</h3>
                                <p className="text-sm text-muted-foreground">Nhận nhắc nhở 30 phút trước khi lớp bắt đầu</p>
                            </div>
                            <Toggle checked={classReminders} onChange={setClassReminders} />
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center">
                        <Palette className="h-5 w-5 text-muted-foreground mr-2" />
                        <h2 className="text-lg font-semibold text-foreground">Giao diện</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-foreground">Chế độ tối (Dark Mode)</h3>
                                <p className="text-sm text-muted-foreground">Sử dụng giao diện tối màu giúp bảo vệ mắt</p>
                            </div>
                            <Toggle checked={isDark} onChange={toggleTheme} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-foreground">Ngôn ngữ hiển thị</h3>
                                <p className="text-sm text-muted-foreground">Chọn ngôn ngữ cho giao diện người dùng</p>
                            </div>
                            <LocaleSwitcher />
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center">
                        <Shield className="h-5 w-5 text-muted-foreground mr-2" />
                        <h2 className="text-lg font-semibold text-foreground">Bảo mật</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-foreground">Mật khẩu đăng nhập</h3>
                                <p className="text-sm text-muted-foreground">Đổi mật khẩu định kỳ để bảo vệ tài khoản tốt hơn</p>
                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center">
                                    <Lock className="h-4 w-4 mr-1" />
                                    Liên hệ quản lý trung tâm để đổi mật khẩu
                                </p>
                            </div>
                            <button
                                disabled
                                className="px-4 py-2 bg-muted text-muted-foreground font-medium rounded-lg cursor-not-allowed w-full md:w-auto text-center"
                            >
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
