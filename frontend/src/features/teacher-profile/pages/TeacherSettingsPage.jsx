import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
    Bell,
    Palette,
    Shield,
    Globe,
    Lock
} from 'lucide-react';

export default function TeacherSettingsPage() {
    const { profile } = useAuth();
    
    // Notification toggles
    const [emailNotif, setEmailNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(false);
    const [classReminders, setClassReminders] = useState(true);
    
    // Appearance toggles
    const [darkMode, setDarkMode] = useState(false);

    // Custom Toggle Component to avoid using shadcn Switch
    const Toggle = ({ checked, onChange }) => (
        <button
            type="button"
            className={`${
                checked ? 'bg-blue-600' : 'bg-gray-200'
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
        <div className="min-h-screen bg-gray-50 pb-12">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
                        <Bell className="h-5 w-5 text-gray-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Thông báo</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Thông báo qua Email</h3>
                                <p className="text-sm text-gray-500">Nhận thông báo về lịch học và lương qua email</p>
                            </div>
                            <Toggle checked={emailNotif} onChange={setEmailNotif} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Thông báo qua SMS</h3>
                                <p className="text-sm text-gray-500">Nhận tin nhắn SMS cho các thông báo quan trọng</p>
                            </div>
                            <Toggle checked={smsNotif} onChange={setSmsNotif} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Nhắc nhở lớp học</h3>
                                <p className="text-sm text-gray-500">Nhận nhắc nhở 30 phút trước khi lớp bắt đầu</p>
                            </div>
                            <Toggle checked={classReminders} onChange={setClassReminders} />
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
                        <Palette className="h-5 w-5 text-gray-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Giao diện</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Chế độ tối (Dark Mode)</h3>
                                <p className="text-sm text-gray-500">Sử dụng giao diện tối màu giúp bảo vệ mắt</p>
                            </div>
                            <Toggle checked={darkMode} onChange={setDarkMode} />
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
                        <Shield className="h-5 w-5 text-gray-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Bảo mật</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Mật khẩu đăng nhập</h3>
                                <p className="text-sm text-gray-500">Đổi mật khẩu định kỳ để bảo vệ tài khoản tốt hơn</p>
                                <p className="text-sm text-amber-600 mt-2 flex items-center">
                                    <Lock className="h-4 w-4 mr-1" />
                                    Liên hệ quản lý trung tâm để đổi mật khẩu
                                </p>
                            </div>
                            <button
                                disabled
                                className="px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed w-full md:w-auto text-center"
                            >
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Language Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
                        <Globe className="h-5 w-5 text-gray-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Ngôn ngữ</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Ngôn ngữ hiển thị</h3>
                                <p className="text-sm text-gray-500">Chọn ngôn ngữ cho giao diện người dùng</p>
                            </div>
                            <select
                                disabled
                                className="block w-full md:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-50 cursor-not-allowed"
                                defaultValue="vi"
                            >
                                <option value="vi">Tiếng Việt</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
