/**
 * CreateCourseModal Component - Modal tạo khóa học mới với Tab UI
 */

import { useEffect, useState } from 'react';
import {
    BookOpen, X, DollarSign, Clock, Download, Upload,
    Image as ImageIcon, AlertCircle, Loader2, CheckCircle2,
    Sparkles, Target, Star, HelpCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCourseForm } from '../hooks';
import { CATEGORIES, LEVELS, COURSE_STATUS } from '../utils';
import { exportCourseToJson, importCourseFromJson } from '../utils/importExport';
import { CourseTemplateSelector } from './CourseTemplateSelector';
import { JsonArrayInput } from './JsonArrayInput';
import { SyllabusBuilder } from './SyllabusBuilder';
import { FaqBuilder } from './FaqBuilder';

export function CreateCourseModal({ isOpen, onClose, onSuccess, accessToken, initialData }) {
    const [showTemplates, setShowTemplates] = useState(true);
    const [activeTab, setActiveTab] = useState('basic');

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
        // JSON Array handlers
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

    // Reset form khi đóng modal
    useEffect(() => {
        if (!isOpen) {
            resetForm();
            setShowTemplates(true);
            setActiveTab('basic');
        }
    }, [isOpen, resetForm]);

    // Load initialData (for clone)
    useEffect(() => {
        if (isOpen && initialData) {
            setFormData(initialData);
            setShowTemplates(false);
        }
    }, [isOpen, initialData, setFormData]);

    // Handle template selection
    const handleSelectTemplate = (templateData) => {
        setFormData(prev => ({
            ...prev,
            ...templateData
        }));
        setShowTemplates(false);
    };

    // ESC key handler
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

    // Export JSON
    const handleExport = () => {
        const filename = `${formData.code || 'course'}-data.json`;
        const result = exportCourseToJson(formData, filename);
        if (!result.success) {
            setError(result.error);
        }
    };

    // Import JSON
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
        e.target.value = ''; // Reset file input
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await createCourse();
        if (success) {
            onSuccess?.();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-course-modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 id="create-course-modal-title" className="text-lg font-semibold text-white">
                                    {initialData ? 'Nhân bản khóa học' : 'Tạo khóa học mới'}
                                </h2>
                                <p className="text-sm text-white/80">
                                    {initialData ? 'Chỉnh sửa và lưu khóa học mới' : 'Điền thông tin để tạo khóa học'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Đóng modal"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Template Selector (only show if no initialData) */}
                {showTemplates && !initialData && (
                    <div className="p-6 border-b bg-amber-50/50">
                        <CourseTemplateSelector
                            onSelectTemplate={handleSelectTemplate}
                            onSkip={() => setShowTemplates(false)}
                        />
                    </div>
                )}

                {/* Body with Tabs */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* Error message */}
                    {error && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 pt-4 border-b">
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="basic" className="flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Cơ bản
                                </TabsTrigger>
                                <TabsTrigger value="syllabus" className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Chương trình
                                </TabsTrigger>
                                <TabsTrigger value="outcomes" className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Mục tiêu
                                </TabsTrigger>
                                <TabsTrigger value="features" className="flex items-center gap-2">
                                    <Star className="w-4 h-4" />
                                    Đặc điểm
                                </TabsTrigger>
                                <TabsTrigger value="faq" className="flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" />
                                    FAQ
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* TAB 1: Basic Info */}
                            <TabsContent value="basic" className="p-6 m-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* CỘT TRÁI - Thông tin định danh */}
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-zinc-900 flex items-center gap-2 pb-2 border-b">
                                            <BookOpen className="w-4 h-4 text-red-500" />
                                            Thông tin định danh
                                        </h3>

                                        {/* Mã khóa học */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="code" className="text-sm font-medium">
                                                Mã khóa học <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="code"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleChange}
                                                placeholder="VD: IELTS-FOUNDATION"
                                                className="font-mono uppercase"
                                            />
                                            <p className="text-xs text-zinc-500">Mã duy nhất, tự động chuyển UPPERCASE</p>
                                        </div>

                                        {/* Tên khóa học */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="title" className="text-sm font-medium">
                                                Tên khóa học <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                placeholder="VD: IELTS Foundation - Cơ bản"
                                            />
                                        </div>

                                        {/* Danh mục */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="category" className="text-sm font-medium">
                                                Danh mục <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Select
                                                    value={formData.category}
                                                    onValueChange={(value) => setFieldValue('category', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Chọn danh mục" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CATEGORIES.map(cat => (
                                                            <SelectItem key={cat.value} value={cat.value}>
                                                                {cat.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Trình độ */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="level" className="text-sm font-medium">
                                                Trình độ
                                            </Label>
                                            <div className="relative">
                                                <Select
                                                    value={formData.level}
                                                    onValueChange={(value) => setFieldValue('level', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Chọn trình độ" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {LEVELS.map(lv => (
                                                            <SelectItem key={lv.value} value={lv.value}>
                                                                {lv.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Học phí */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="price" className="text-sm font-medium">
                                                Học phí <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                <Input
                                                    id="price"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    placeholder="5.000.000"
                                                    className="pl-9 pr-12 font-mono text-right"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">đ</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CỘT PHẢI - Chi tiết */}
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-zinc-900 flex items-center gap-2 pb-2 border-b">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            Thông số đào tạo
                                        </h3>

                                        {/* Số buổi học */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="total_sessions" className="text-sm font-medium">
                                                Số buổi học
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="total_sessions"
                                                    name="total_sessions"
                                                    type="number"
                                                    min="1"
                                                    value={formData.total_sessions}
                                                    onChange={handleChange}
                                                    className="pr-12"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">buổi</span>
                                            </div>
                                        </div>

                                        {/* Thời lượng */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="duration_weeks" className="text-sm font-medium">
                                                Thời lượng khóa học
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="duration_weeks"
                                                    name="duration_weeks"
                                                    type="number"
                                                    min="1"
                                                    value={formData.duration_weeks}
                                                    onChange={handleChange}
                                                    className="pr-12"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">tuần</span>
                                            </div>
                                        </div>

                                        {/* Ảnh bìa */}
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium">Ảnh bìa</Label>
                                            <div className="border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center hover:border-red-300 transition-colors">
                                                {imagePreview ? (
                                                    <div className="relative">
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            className="w-full h-32 object-cover rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={clearImage}
                                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                            className="hidden"
                                                        />
                                                        <div className="flex flex-col items-center gap-2 py-4">
                                                            <div className="p-3 bg-zinc-100 rounded-full">
                                                                <ImageIcon className="w-6 h-6 text-zinc-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-zinc-700">Chọn ảnh hoặc kéo thả</p>
                                                                <p className="text-xs text-zinc-500">PNG, JPG tối đa 5MB</p>
                                                            </div>
                                                        </div>
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mô tả */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="description" className="text-sm font-medium">
                                                Mô tả ngắn
                                            </Label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                placeholder="Mô tả về khóa học, đối tượng học viên phù hợp, mục tiêu đầu ra..."
                                                rows={4}
                                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                            />
                                        </div>

                                        {/* Trạng thái */}
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium">Trạng thái</Label>
                                            <div className="flex gap-2">
                                                {COURSE_STATUS.map((status) => (
                                                    <button
                                                        key={status.value}
                                                        type="button"
                                                        onClick={() => setFieldValue('status', status.value)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${formData.status === status.value
                                                            ? status.color + ' ring-2 ring-offset-1 ring-red-400'
                                                            : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                                                            }`}
                                                    >
                                                        {status.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 2: Syllabus */}
                            <TabsContent value="syllabus" className="p-6 m-0">
                                <SyllabusBuilder
                                    syllabus={formData.syllabus}
                                    onAddModule={addSyllabusModule}
                                    onUpdateModule={updateSyllabusModule}
                                    onRemoveModule={removeSyllabusModule}
                                    onAddTopic={addSyllabusTopic}
                                    onUpdateTopic={updateSyllabusTopic}
                                    onRemoveTopic={removeSyllabusTopic}
                                />
                            </TabsContent>

                            {/* TAB 3: Outcomes */}
                            <TabsContent value="outcomes" className="p-6 m-0">
                                <JsonArrayInput
                                    items={formData.outcomes}
                                    onAdd={addOutcome}
                                    onUpdate={updateOutcome}
                                    onRemove={removeOutcome}
                                    placeholder="Mục tiêu đầu ra (VD: Achieve IELTS band 5.0-5.5)"
                                    emptyMessage="Chưa có mục tiêu nào. Thêm các kỹ năng hoặc kết quả học viên sẽ đạt được."
                                    label="Mục tiêu"
                                />
                            </TabsContent>

                            {/* TAB 4: Features */}
                            <TabsContent value="features" className="p-6 m-0">
                                <JsonArrayInput
                                    items={formData.features}
                                    onAdd={addFeature}
                                    onUpdate={updateFeature}
                                    onRemove={removeFeature}
                                    placeholder="Đặc điểm nổi bật (VD: 100% mock tests chuẩn Cambridge)"
                                    emptyMessage="Chưa có đặc điểm nào. Thêm các ưu điểm, cam kết của khóa học."
                                    label="Đặc điểm"
                                />
                            </TabsContent>

                            {/* TAB 5: FAQ */}
                            <TabsContent value="faq" className="p-6 m-0">
                                <FaqBuilder
                                    faq={formData.faq}
                                    onAdd={addFaq}
                                    onUpdate={updateFaq}
                                    onRemove={removeFaq}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-neutral-50">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                className="text-xs"
                            >
                                <Download className="w-3 h-3 mr-1.5" />
                                Export JSON
                            </Button>
                            <label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => document.querySelector('input[type="file"]')?.click()}
                                >
                                    <Upload className="w-3 h-3 mr-1.5" />
                                    Import JSON
                                </Button>
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={generateAIContent}
                                disabled={loading}
                                className="text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300"
                            >
                                <Sparkles className="w-3 h-3 mr-1.5" />
                                AI Magic Fill
                            </Button>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white min-w-[120px]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Tạo khóa học
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateCourseModal;
