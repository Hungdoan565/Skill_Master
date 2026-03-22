import { useEffect, useState } from 'react';
import {
    BookOpen, X, DollarSign, Clock, Download, Upload,
    Image as ImageIcon, AlertCircle, Loader2, CheckCircle2,
    Sparkles, Target, Star, HelpCircle, Info, LayoutTemplate,
    ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CATEGORIES, LEVELS, COURSE_STATUS } from '../utils';
import { exportCourseToJson, importCourseFromJson } from '../utils/importExport';
import { useCourseForm } from '../hooks/useCourseForm';
import CourseTemplateSelector from './CourseTemplateSelector';
import SyllabusBuilder from './SyllabusBuilder';
import FaqBuilder from './FaqBuilder';
import JsonArrayInput from './JsonArrayInput';
import { gooeyToast } from 'goey-toast';

const STEPS = [
    { id: 1, title: 'Chọn mẫu', icon: LayoutTemplate },
    { id: 2, title: 'Cơ bản', icon: Info },
    { id: 3, title: 'Giáo trình', icon: BookOpen },
    { id: 4, title: 'Kết quả', icon: Target },
    { id: 5, title: 'Hoàn tất', icon: CheckCircle2 }
];

const Step2BasicInfo = ({ formData, handleChange, setFieldValue, imagePreview, clearImage, handleImageChange }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border">
            {/* CỘT TRÁI - Thông tin định danh */}
            <div className="space-y-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                    <BookOpen className="w-5 h-5 text-red-500" />
                    Thông tin định danh
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-semibold text-foreground/80">
                        Mã khóa học <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="VD: IELTS-FOUNDATION"
                        className="font-mono uppercase h-11 bg-muted/50 border-border focus:border-red-400 focus:ring-red-400/20"
                    />
                    <p className="text-[13px] text-muted-foreground">Mã duy nhất, tự động chuyển UPPERCASE</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-zinc-700">
                        Tên khóa học <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="VD: IELTS Foundation - Cơ bản"
                        className="h-11 bg-muted/50 border-border focus:border-red-400 focus:ring-red-400/20"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold text-zinc-700">
                        Danh mục <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => setFieldValue('category', value)}>
                        <SelectTrigger className="w-full h-11 bg-muted/50 border-border focus:ring-red-400/20">
                            <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="level" className="text-sm font-semibold text-zinc-700">
                        Trình độ
                    </Label>
                    <Select value={formData.level} onValueChange={(value) => setFieldValue('level', value)}>
                        <SelectTrigger className="w-full h-11 bg-muted/50 border-border focus:ring-red-400/20">
                            <SelectValue placeholder="Chọn trình độ" />
                        </SelectTrigger>
                        <SelectContent>
                            {LEVELS.map(lv => (
                                <SelectItem key={lv.value} value={lv.value}>{lv.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-semibold text-zinc-700">
                        Học phí <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="5.000.000"
                            className="pl-9 pr-12 font-mono text-right h-11 bg-muted/50 border-border focus:border-red-400 focus:ring-red-400/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">VNĐ</span>
                    </div>
                </div>
            </div>

            {/* CỘT PHẢI - Chi tiết */}
            <div className="space-y-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Thông số đào tạo
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="total_sessions" className="text-sm font-semibold text-zinc-700">
                            Số buổi
                        </Label>
                        <div className="relative">
                            <Input
                                id="total_sessions"
                                name="total_sessions"
                                type="number"
                                min="1"
                                value={formData.total_sessions}
                                onChange={handleChange}
                                className="pr-14 h-11 bg-muted/50 border-border focus:border-orange-400 focus:ring-orange-400/20"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">buổi</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration_weeks" className="text-sm font-semibold text-zinc-700">
                            Thời lượng
                        </Label>
                        <div className="relative">
                            <Input
                                id="duration_weeks"
                                name="duration_weeks"
                                type="number"
                                min="1"
                                value={formData.duration_weeks}
                                onChange={handleChange}
                                className="pr-14 h-11 bg-muted/50 border-border focus:border-orange-400 focus:ring-orange-400/20"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">tuần</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground/80">Ảnh bìa</Label>
                    <div className="border-2 border-dashed border-border bg-muted/50 rounded-xl p-4 text-center hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors">
                        {imagePreview ? (
                            <div className="relative group">
                                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg shadow-sm" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-transform"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="cursor-pointer block py-6">
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-4 bg-card shadow-sm border border-border rounded-full text-orange-500">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Chọn ảnh hoặc kéo thả</p>
                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG tối đa 5MB</p>
                                    </div>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-zinc-700">
                        Mô tả ngắn
                    </Label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Mô tả về khóa học, đối tượng học viên phù hợp..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground/80">Trạng thái phát hành</Label>
                    <div className="flex flex-wrap gap-2">
                        {COURSE_STATUS.map((status) => {
                            const isSelected = formData.status === status.value;
                            return (
                                <button
                                    key={status.value}
                                    type="button"
                                    onClick={() => setFieldValue('status', status.value)}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                                        isSelected 
                                        ? status.color + ' ring-2 ring-offset-2 ring-orange-500/30 scale-[1.02] shadow-sm' 
                                        : 'bg-muted text-muted-foreground border-border hover:border-border hover:bg-muted/80'
                                    }`}
                                >
                                    {status.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Step4OutcomesFeatures = ({ formData, addOutcome, updateOutcome, removeOutcome, addFeature, updateFeature, removeFeature }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border">
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <Target className="w-5 h-5 text-blue-500" />
                Kết quả đạt được (Outcomes)
            </h3>
            <div className="pt-2">
                <JsonArrayInput
                    items={formData.outcomes}
                    onAdd={addOutcome}
                    onUpdate={updateOutcome}
                    onRemove={removeOutcome}
                    placeholder="VD: Đạt band điểm IELTS 6.5+"
                    emptyMessage="Chưa có mục tiêu nào. Thêm các kỹ năng học viên sẽ đạt được."
                    label="Kết quả"
                />
            </div>
        </div>
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <Star className="w-5 h-5 text-amber-500" />
                Tính năng nổi bật (Features)
            </h3>
            <div className="pt-2">
                <JsonArrayInput
                    items={formData.features}
                    onAdd={addFeature}
                    onUpdate={updateFeature}
                    onRemove={removeFeature}
                    placeholder="VD: Chữa bài 1:1 với giáo viên bản xứ"
                    emptyMessage="Chưa có đặc điểm nào. Thêm các ưu điểm của khóa học."
                    label="Tính năng"
                />
            </div>
        </div>
    </div>
);

const Step5FaqReview = ({ formData, addFaq, updateFaq, removeFaq }) => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border">
        {/* Review Column (Left - 5 cols) */}
        <div className="xl:col-span-5 space-y-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border text-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Kiểm tra thông tin
            </h3>
            
            <div className="bg-muted/50 rounded-xl border border-border overflow-hidden shadow-inner">
                {formData.cover_image ? (
                    <img src={formData.cover_image} alt="Cover" className="w-full h-32 md:h-40 object-cover" />
                ) : (
                    <div className="w-full h-32 md:h-40 bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-10 h-10 opacity-50" />
                    </div>
                )}
                
                <div className="p-5 space-y-4">
                    <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {formData.code || 'CHƯA CÓ MÃ'}
                        </span>
                        <h4 className="text-xl font-bold text-foreground leading-tight">
                            {formData.title || 'Chưa nhập tên khóa học'}
                        </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Danh mục</p>
                            <p className="font-medium text-foreground">{CATEGORIES.find(c => c.value === formData.category)?.label || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Học phí</p>
                            <p className="font-bold text-red-600 dark:text-red-400">{formData.price || '0'} đ</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Thời lượng</p>
                            <p className="font-medium text-foreground">{formData.total_sessions || 0} buổi / {formData.duration_weeks || 0} tuần</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Trạng thái</p>
                            <p className="font-medium text-foreground">{COURSE_STATUS.find(s => s.value === formData.status)?.label || '—'}</p>
                        </div>
                    </div>
                    
                    <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <BookOpen className="w-4 h-4" />
                            <span>{formData.syllabus?.length || 0} module</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Target className="w-4 h-4" />
                            <span>{formData.outcomes?.length || 0} kết quả</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Star className="w-4 h-4" />
                            <span>{formData.features?.length || 0} tính năng</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* FAQ Column (Right - 7 cols) */}
        <div className="xl:col-span-7 space-y-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border text-lg">
                <HelpCircle className="w-5 h-5 text-purple-500" />
                Câu hỏi thường gặp (FAQ)
            </h3>
            <div className="bg-muted/50 rounded-xl shadow-inner border border-border p-4 md:p-6">
                <FaqBuilder faq={formData.faq} onAdd={addFaq} onUpdate={updateFaq} onRemove={removeFaq} />
            </div>
        </div>
    </div>
);

export function CreateCourseModal({ isOpen, onClose, onSuccess, accessToken, initialData }) {
    const [currentStep, setCurrentStep] = useState(initialData ? 2 : 1);
    
    const {
        formData,
        loading,
        error,
        imagePreview,
        handleChange,
        setFieldValue,
        setFormData,
        handleImageChange,
        clearImage,
        createCourse,
        resetForm,
        setError,
        addSyllabusModule,
        updateSyllabusModule,
        removeSyllabusModule,
        addSyllabusTopic,
        updateSyllabusTopic,
        removeSyllabusTopic,
        addOutcome,
        updateOutcome,
        removeOutcome,
        addFeature,
        updateFeature,
        removeFeature,
        addFaq,
        updateFaq,
        removeFaq,
        generateAIContent
    } = useCourseForm(accessToken);

    const activeSteps = initialData ? STEPS.slice(1) : STEPS;

    useEffect(() => {
        if (!isOpen) {
            resetForm();
            setCurrentStep(initialData ? 2 : 1);
        }
    }, [isOpen, resetForm, initialData]);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData(initialData);
            setCurrentStep(2);
        }
    }, [isOpen, initialData, setFormData]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose, loading]);

    const handleSelectTemplate = (templateData) => {
        setFormData(prev => ({ ...prev, ...templateData }));
        setCurrentStep(2);
    };

    const handleNext = () => {
        if (currentStep === 2) {
            if (!formData.code?.trim() || !formData.title?.trim() || !formData.category || !formData.price) {
                setError('Vui lòng điền đầy đủ Mã khóa học, Tên khóa học, Danh mục và Học phí');
                return;
            }
        }
        
        if (currentStep < 5) {
            setCurrentStep(prev => prev + 1);
            setError('');
        }
    };

    const handleBack = () => {
        const minStep = initialData ? 2 : 1;
        if (currentStep > minStep) {
            setCurrentStep(prev => prev - 1);
            setError('');
        }
    };

    const handleSkip = () => {
        if (currentStep < 5) {
            setCurrentStep(prev => prev + 1);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (currentStep !== 5) return;
        
        const success = await createCourse();
        if (success) {
            gooeyToast.success(initialData ? 'Nhân bản khóa học thành công!' : 'Tạo khóa học thành công!');
            onSuccess?.();
            onClose();
        } else {
            gooeyToast.error('Lỗi khi tạo khóa học');
        }
    };

    const handleExport = () => {
        const filename = `${formData.code || 'course'}-data.json`;
        const result = exportCourseToJson(formData, filename);
        if (!result.success) {
            setError(result.error);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await importCourseFromJson(file);
            if (result.success) {
                setFormData(prev => ({
                    ...prev,
                    ...result.data
                }));
                setError('');
            }
        } catch (error) {
            setError(error.message);
        }
        e.target.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-5xl mx-4 bg-background rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg shadow-inner">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-wide">
                                    {initialData ? 'Nhân bản khóa học' : 'Tạo khóa học mới'}
                                </h2>
                                <p className="text-sm text-red-50 font-medium">
                                    {initialData ? 'Chỉnh sửa và lưu thành khóa học mới' : 'Điền thông tin theo từng bước để hoàn thiện khóa học'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-lg transition-colors group">
                            <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Progress Stepper */}
                <div className="flex items-center justify-center w-full px-6 md:px-12 lg:px-16 py-6 pb-10 border-b border-border bg-card shadow-sm z-10 shrink-0">
                    {activeSteps.map((step, index) => {
                        const isCompleted = currentStep > step.id;
                        const isActive = currentStep === step.id;
                        const isLast = index === activeSteps.length - 1;

                        return (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                                        isActive ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-500 text-orange-600 dark:text-orange-400 shadow-md scale-110' :
                                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                        'bg-muted border-border text-muted-foreground'
                                    }`}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : (index + 1)}
                                    </div>
                                    <span className={`absolute top-12 text-xs md:text-sm whitespace-nowrap font-semibold transition-colors ${
                                        isActive ? 'text-orange-600 dark:text-orange-400' :
                                        isCompleted ? 'text-green-600 dark:text-green-400' :
                                        'text-muted-foreground'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className={`h-[2px] flex-1 min-w-6 mx-3 md:mx-4 transition-colors duration-300 ${
                                        isCompleted ? 'bg-green-500' : 'bg-border'
                                    }`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Body Content */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-8 custom-scrollbar">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300 shadow-sm animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            {currentStep === 1 && !initialData && (
                                <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
                                    <CourseTemplateSelector
                                        onSelectTemplate={handleSelectTemplate}
                                        onSkip={handleSkip}
                                    />
                                </div>
                            )}

                            {currentStep === 2 && (
                                <Step2BasicInfo
                                    formData={formData}
                                    handleChange={handleChange}
                                    setFieldValue={setFieldValue}
                                    imagePreview={imagePreview}
                                    clearImage={clearImage}
                                    handleImageChange={handleImageChange}
                                />
                            )}

                            {currentStep === 3 && (
                                <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
                                    <SyllabusBuilder
                                        syllabus={formData.syllabus}
                                        onAddModule={addSyllabusModule}
                                        onUpdateModule={updateSyllabusModule}
                                        onRemoveModule={removeSyllabusModule}
                                        onAddTopic={addSyllabusTopic}
                                        onUpdateTopic={updateSyllabusTopic}
                                        onRemoveTopic={removeSyllabusTopic}
                                    />
                                </div>
                            )}

                            {currentStep === 4 && (
                                <Step4OutcomesFeatures
                                    formData={formData}
                                    addOutcome={addOutcome}
                                    updateOutcome={updateOutcome}
                                    removeOutcome={removeOutcome}
                                    addFeature={addFeature}
                                    updateFeature={updateFeature}
                                    removeFeature={removeFeature}
                                />
                            )}

                            {currentStep === 5 && (
                                <Step5FaqReview
                                    formData={formData}
                                    addFaq={addFaq}
                                    updateFaq={updateFaq}
                                    removeFaq={removeFaq}
                                />
                            )}
                        </div>
                    </div>

                    {/* Footer Toolbar & Navigation */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-card shadow-[0_-4px_10px_rgba(0,0,0,0.02)] shrink-0">
                        {/* Left tools */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <Button type="button" variant="outline" size="sm" onClick={handleExport} className="text-xs font-medium bg-muted hover:bg-muted/80 border-border text-foreground">
                                <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                            </Button>
                            <label>
                                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                <Button type="button" variant="outline" size="sm" className="text-xs font-medium bg-muted hover:bg-muted/80 border-border text-foreground" onClick={() => document.querySelector('input[type="file"]')?.click()}>
                                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Import
                                </Button>
                            </label>
                            <Button type="button" variant="outline" size="sm" onClick={generateAIContent} disabled={loading} className="text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 border-orange-200 text-orange-800 hover:from-amber-200 hover:to-orange-200 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-orange-600" /> AI Magic Fill
                            </Button>
                        </div>
                        
                        {/* Right navigation */}
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                            {currentStep > (initialData ? 2 : 1) && (
                                <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="bg-card font-medium border-border text-foreground hover:bg-muted">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
                                </Button>
                            )}
                            
                            {currentStep !== 1 && currentStep < 5 && (
                                <>
                                    {[3, 4].includes(currentStep) && (
                                        <Button type="button" variant="ghost" onClick={handleSkip} className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                                            Bỏ qua
                                        </Button>
                                    )}
                                    <Button type="button" onClick={handleNext} className="font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all active:scale-95">
                                        Tiếp theo <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </>
                            )}

                            {currentStep === 5 && (
                                <Button type="submit" disabled={loading} className="font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white min-w-[140px] shadow-lg shadow-orange-500/30 transition-all active:scale-95">
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử lý...</>
                                    ) : (
                                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Tạo khóa học</>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateCourseModal;
