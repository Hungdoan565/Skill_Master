/**
 * SettingsPage - Trang cài đặt hệ thống
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    User,
    CreditCard,
    GraduationCap,
    Shield,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { ProfileTab, PaymentTab, SystemTab, SecurityTab, GradesConfigTab } from '../components';
import { SETTINGS_TABS } from '../utils/constants';

// Map icon names to components
const iconMap = {
    User: User,
    CreditCard: CreditCard,
    GraduationCap: GraduationCap,
    Settings: Settings,
    Shield: Shield
};

export function SettingsPage() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [message, setMessage] = useState(null);

    // Check SUPER_ADMIN role from roles.code or roleCode
    const isSuperAdmin = profile?.roles?.code === 'SUPER_ADMIN' || profile?.roleCode === 'SUPER_ADMIN';

    // Filter tabs based on role
    const availableTabs = SETTINGS_TABS.filter(
        tab => !tab.superAdminOnly || isSuperAdmin
    );

    // Handle message from tabs
    const handleMessage = (text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    // Get current tab component
    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileTab onMessage={handleMessage} />;
            case 'payment':
                return <PaymentTab onMessage={handleMessage} />;
            case 'grades':
                return <GradesConfigTab onMessage={handleMessage} />;
            case 'system':
                return <SystemTab onMessage={handleMessage} />;
            case 'security':
                return isSuperAdmin ? <SecurityTab onMessage={handleMessage} /> : null;
            default:
                return <ProfileTab onMessage={handleMessage} />;
        }
    };

    // Get current tab label
    const currentTabLabel = availableTabs.find(t => t.id === activeTab)?.label || 'Cài đặt';

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header - z-index lower than dropdown */}
            <div className="bg-white border-b sticky top-0 z-[5]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(-1)}
                                className="text-gray-600"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                            <div className="flex items-center gap-2 text-gray-500">
                                <Settings className="w-5 h-5" />
                                <span className="font-medium text-gray-900">Cài đặt</span>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-gray-900">{currentTabLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right">
                    <div
                        className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : message.type === 'error'
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                    >
                        {message.text}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-64 flex-shrink-0">
                        <Card className="sticky top-24 overflow-hidden">
                            <nav className="p-2">
                                {availableTabs.map((tab) => {
                                    const IconComponent = iconMap[tab.icon] || Settings;
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                                text-left transition-all duration-200
                                                ${isActive
                                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                            `}
                                        >
                                            <IconComponent className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'
                                                }`} />
                                            <span>{tab.label}</span>
                                            {tab.superAdminOnly && (
                                                <span className="ml-auto text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                                                    SA
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Help Section */}
                            <div className="p-4 bg-gray-50 border-t">
                                <p className="text-xs text-gray-500 text-center">
                                    Cần hỗ trợ? Liên hệ{' '}
                                    <a href="mailto:support@skillmaster.vn" className="text-indigo-600 hover:underline">
                                        support@skillmaster.vn
                                    </a>
                                </p>
                            </div>
                        </Card>
                    </aside>

                    {/* Tab Content */}
                    <main className="flex-1 min-w-0">
                        {renderTabContent()}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
