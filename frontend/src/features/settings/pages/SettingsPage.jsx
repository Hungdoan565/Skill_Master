/**
 * SettingsPage - Trang cài đặt hệ thống
 * Redesigned: Grouped sidebar navigation with 8 tabs in 3 groups
 * Enterprise-design compliant: touch targets, typography, skeleton, max-width
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    User,
    CreditCard,
    GraduationCap,
    Shield,
    ArrowLeft,
    ChevronRight,
    Building2,
    Mail,
    Bell,
    AlertCircle,
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useAuth } from '@/contexts/auth-context';
import {
    ProfileTab,
    PaymentTab,
    SystemTab,
    SecurityTab,
    GradesConfigTab,
    BankInfoTab,
    EmailConfigTab,
    NotificationPreferencesTab
} from '../components';
import { SETTINGS_TAB_GROUPS } from '../utils/constants';

// Map icon names to components
const iconMap = {
    User,
    CreditCard,
    GraduationCap,
    Settings,
    Shield,
    Building2,
    Mail,
    Bell
};

export function SettingsPage() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [message, setMessage] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    // Role checks
    const isSuperAdmin = profile?.roles?.code === 'SUPER_ADMIN' || profile?.roleCode === 'SUPER_ADMIN';
    const isCenterManager = profile?.roles?.code === 'CENTER_MANAGER' || profile?.roleCode === 'CENTER_MANAGER';
    const isTeacher = profile?.roles?.code === 'TEACHER' || profile?.roleCode === 'TEACHER';
    const isAdmin = isSuperAdmin || isCenterManager;

    // Filter tab groups based on role
    const filteredGroups = SETTINGS_TAB_GROUPS.map(group => ({
        ...group,
        tabs: group.tabs.filter(tab => {
            if (tab.superAdminOnly && !isSuperAdmin) return false;
            if (tab.adminOnly && !isAdmin) return false;
            if (tab.teacherOnly && !isTeacher) return false;
            return true;
        })
    })).filter(group => group.tabs.length > 0);

    // Handle message from tabs
    const handleMessage = useCallback((text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    }, []);

    // Handle tab switch with unsaved changes guard
    const handleTabSwitch = useCallback((tabId) => {
        if (isDirty) {
            const confirmed = window.confirm(
                'Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển tab?'
            );
            if (!confirmed) return;
        }
        setIsDirty(false);
        setActiveTab(tabId);
    }, [isDirty]);

    // Mark form as dirty
    const handleDirtyChange = useCallback((dirty) => {
        setIsDirty(dirty);
    }, []);

    // Skeleton loading for initial render
    const SettingsSkeleton = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Card className="p-6 space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-2/3" />
                </div>
            </Card>
            <Card className="p-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-3/4" />
                </div>
            </Card>
        </div>
    );

    // Get current tab component
    const renderTabContent = () => {
        const tabProps = { onMessage: handleMessage, onDirtyChange: handleDirtyChange };

        switch (activeTab) {
            case 'profile':
                return <ProfileTab {...tabProps} />;
            case 'bank':
                return isTeacher ? <BankInfoTab {...tabProps} /> : null;
            case 'payment':
                return <PaymentTab {...tabProps} />;
            case 'grades':
                return <GradesConfigTab {...tabProps} />;
            case 'email':
                return isSuperAdmin ? <EmailConfigTab {...tabProps} /> : null;
            case 'notifications':
                return <NotificationPreferencesTab {...tabProps} />;
            case 'system':
                return <SystemTab {...tabProps} />;
            case 'security':
                return isSuperAdmin ? <SecurityTab {...tabProps} /> : null;
            default:
                return <ProfileTab {...tabProps} />;
        }
    };

    // Get current tab info
    const allTabs = filteredGroups.flatMap(g => g.tabs);
    const currentTab = allTabs.find(t => t.id === activeTab);
    const currentTabLabel = currentTab?.label || 'Cài đặt';

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
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
                        <div className="flex items-center gap-3">
                            {isDirty && (
                                <div className="flex items-center gap-1.5 text-amber-600 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Chưa lưu</span>
                                </div>
                            )}
                            <LocaleSwitcher />
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

            {/* Mobile Tab Strip (< lg) */}
            <div className="lg:hidden border-b bg-white sticky top-16 z-[4]">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
                        {filteredGroups.flatMap(g => g.tabs).map((tab) => {
                            const IconComponent = iconMap[tab.icon] || Settings;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabSwitch(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-3 min-h-[44px] py-2.5 rounded-lg whitespace-nowrap
                                        text-sm transition-all flex-shrink-0
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                        ${isActive
                                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}
                                    `}
                                >
                                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    {tab.label}
                                    {tab.badge && (
                                        <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-medium">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="flex gap-8">
                    {/* Grouped Sidebar (lg+ only) */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <Card className="sticky top-24 overflow-hidden">
                            <nav className="p-2">
                                {filteredGroups.map((group, groupIndex) => (
                                    <div key={group.id}>
                                        {/* Group separator (not before first group) */}
                                        {groupIndex > 0 && (
                                            <div className="my-2 mx-3 border-t border-gray-100" />
                                        )}

                                        {/* Group header */}
                                        <p className="px-4 pt-3 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {group.label}
                                        </p>

                                        {/* Group tabs */}
                                        {group.tabs.map((tab) => {
                                            const IconComponent = iconMap[tab.icon] || Settings;
                                            const isActive = activeTab === tab.id;

                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => handleTabSwitch(tab.id)}
                                                    className={`
                                                        w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-lg
                                                        text-left transition-all duration-200 group relative
                                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                                        ${isActive
                                                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                                    `}
                                                    title={tab.description}
                                                >
                                                    {/* Active indicator bar */}
                                                    {isActive && (
                                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 rounded-r-full" />
                                                    )}

                                                    <IconComponent className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                                                        }`} />
                                                    <span className="text-sm truncate">{tab.label}</span>

                                                    {/* Badges */}
                                                    {tab.superAdminOnly && (
                                                        <span className="ml-auto text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                                                            SA
                                                        </span>
                                                    )}
                                                    {tab.badge && (
                                                        <span className="ml-auto text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-medium">
                                                            {tab.badge}
                                                        </span>
                                                    )}

                                                    {/* Dirty indicator */}
                                                    {isDirty && isActive && (
                                                        <span className="ml-auto w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
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

                    {/* Tab Content — max-w-3xl per Settings profile */}
                    <main className="flex-1 min-w-0 max-w-3xl">
                        {renderTabContent()}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
