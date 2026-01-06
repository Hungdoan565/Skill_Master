/**
 * NotificationWizardSteps - Progress indicator component
 */

export function NotificationWizardSteps({ currentStep }) {
    const steps = [
        { num: 1, label: 'Chọn đối tượng' },
        { num: 2, label: 'Soạn thông báo' },
        { num: 3, label: 'Xem trước' },
        { num: 4, label: 'Hoàn thành' }
    ];

    return (
        <div className="flex items-center justify-center gap-2">
            {steps.map((s, i) => (
                <div key={s.num} className="flex items-center">
                    <div className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                        ${currentStep >= s.num
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }
                    `}>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                            {currentStep > s.num ? '✓' : s.num}
                        </span>
                        <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {i < 3 && (
                        <div className={`w-8 h-0.5 mx-1 ${currentStep > s.num ? 'bg-orange-500' : 'bg-slate-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default NotificationWizardSteps;
