/**
 * GettingStartedCard Component
 * Card hướng dẫn cho admin mới
 * - Checklist các bước setup
 * - Progress tracking
 * - Links đến các section
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    Circle,
    Sparkles,
    ChevronRight,
    X,
    Building2,
    Users,
    BookOpen,
    GraduationCap,
    Settings
} from 'lucide-react';

// Setup steps configuration
const SETUP_STEPS = [
    {
        id: 'center',
        title: 'Thiết lập trung tâm',
        description: 'Cấu hình thông tin trung tâm của bạn',
        icon: Building2,
        link: '/admin/centers',
        checkKey: 'hasCenter'
    },
    {
        id: 'staff',
        title: 'Thêm nhân viên',
        description: 'Tạo tài khoản cho giáo viên và nhân viên',
        icon: Users,
        link: '/admin/staff',
        checkKey: 'hasStaff'
    },
    {
        id: 'courses',
        title: 'Tạo khóa học',
        description: 'Thiết lập các khóa học và chương trình',
        icon: BookOpen,
        link: '/admin/courses',
        checkKey: 'hasCourses'
    },
    {
        id: 'classes',
        title: 'Mở lớp học',
        description: 'Tạo lớp học và phân công giáo viên',
        icon: GraduationCap,
        link: '/admin/classes',
        checkKey: 'hasClasses'
    },
    {
        id: 'settings',
        title: 'Cấu hình hệ thống',
        description: 'Thiết lập cài đặt chung và bảo mật',
        icon: Settings,
        link: '/admin/settings',
        checkKey: 'hasSettings'
    }
];

const STORAGE_KEY = 'dashboard_getting_started_dismissed';

export function GettingStartedCard({
    completedSteps = {},
    onDismiss,
    showDismiss = true
}) {
    const [isDismissed, setIsDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    // Check if dismissed from localStorage
    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed === 'true') {
            setIsDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsDismissed(true);
        onDismiss?.();
    };

    // Calculate progress
    const completedCount = SETUP_STEPS.filter(
        step => completedSteps[step.checkKey]
    ).length;
    const progress = (completedCount / SETUP_STEPS.length) * 100;

    // Don't render if all steps complete or dismissed
    if (isDismissed || !isVisible || completedCount === SETUP_STEPS.length) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Bắt đầu với Skill Master</h3>
                        <p className="text-white/70 text-sm">
                            Hoàn thành {completedCount}/{SETUP_STEPS.length} bước
                        </p>
                    </div>
                </div>

                {showDismiss && (
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Ẩn hướng dẫn"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Steps list */}
            <div className="space-y-3">
                {SETUP_STEPS.map((step) => {
                    const isCompleted = completedSteps[step.checkKey];
                    const Icon = step.icon;

                    return (
                        <Link
                            key={step.id}
                            to={step.link}
                            className={`
                flex items-center gap-4 p-3 rounded-xl transition-all
                ${isCompleted
                                    ? 'bg-white/10'
                                    : 'bg-white/5 hover:bg-white/15'
                                }
              `}
                        >
                            {/* Status icon */}
                            {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0" />
                            ) : (
                                <Circle className="h-5 w-5 text-white/40 flex-shrink-0" />
                            )}

                            {/* Step icon */}
                            <div className={`
                p-2 rounded-lg flex-shrink-0
                ${isCompleted ? 'bg-green-500/30' : 'bg-white/10'}
              `}>
                                <Icon size={16} className={isCompleted ? 'text-green-200' : 'text-white/70'} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`
                  font-medium text-sm
                  ${isCompleted ? 'text-white/70 line-through' : 'text-white'}
                `}>
                                    {step.title}
                                </p>
                                <p className="text-white/50 text-xs truncate">
                                    {step.description}
                                </p>
                            </div>

                            {/* Arrow */}
                            {!isCompleted && (
                                <ChevronRight size={18} className="text-white/40" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default GettingStartedCard;
