/**
 * GradesConfigTab Component - Tab cấu hình đánh giá điểm
 */

import { useState, useEffect } from 'react';
import {
    GraduationCap,
    Calculator,
    Loader2,
    Save,
    Info,
    Plus,
    Trash2,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '../hooks';
import {
    SETTING_KEYS,
    DEFAULT_GRADE_CONFIG,
    CALCULATION_TYPE_OPTIONS,
    GRADE_TEMPLATE_OPTIONS
} from '../utils/constants';

// Default grade columns templates
const GRADE_TEMPLATES = {
    programming: [
        { id: 'attendance', name: 'Chuyên cần', weight: 10, maxScore: 10 },
        { id: 'homework', name: 'Bài tập', weight: 20, maxScore: 10 },
        { id: 'project', name: 'Dự án', weight: 30, maxScore: 10 },
        { id: 'exam', name: 'Thi cuối kỳ', weight: 40, maxScore: 10 }
    ],
    ielts: [
        { id: 'listening', name: 'Listening', weight: 25, maxScore: 9 },
        { id: 'reading', name: 'Reading', weight: 25, maxScore: 9 },
        { id: 'writing', name: 'Writing', weight: 25, maxScore: 9 },
        { id: 'speaking', name: 'Speaking', weight: 25, maxScore: 9 }
    ],
    toeic: [
        { id: 'listening', name: 'Listening', weight: 50, maxScore: 495 },
        { id: 'reading', name: 'Reading', weight: 50, maxScore: 495 }
    ],
    custom: [
        { id: 'col1', name: 'Điểm 1', weight: 50, maxScore: 10 },
        { id: 'col2', name: 'Điểm 2', weight: 50, maxScore: 10 }
    ]
};

export function GradesConfigTab({ onMessage }) {
    const { fetchSettings, updateSetting, saving } = useSettings();
    const [loading, setLoading] = useState(true);
    const [gradeConfig, setGradeConfig] = useState(DEFAULT_GRADE_CONFIG);
    const [gradeColumns, setGradeColumns] = useState(GRADE_TEMPLATES.programming);

    // Load config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        const settings = await fetchSettings();
        if (settings) {
            if (settings[SETTING_KEYS.GRADE_CONFIG]) {
                const config = { ...DEFAULT_GRADE_CONFIG, ...settings[SETTING_KEYS.GRADE_CONFIG] };
                setGradeConfig(config);
                // Load columns from template or saved
                if (config.columns) {
                    setGradeColumns(config.columns);
                } else if (config.defaultTemplate && GRADE_TEMPLATES[config.defaultTemplate]) {
                    setGradeColumns(GRADE_TEMPLATES[config.defaultTemplate]);
                }
            }
        }
        setLoading(false);
    };

    // Handle template change
    const handleTemplateChange = (template) => {
        setGradeConfig(prev => ({ ...prev, defaultTemplate: template }));
        if (GRADE_TEMPLATES[template]) {
            setGradeColumns([...GRADE_TEMPLATES[template]]);
        }
    };

    // Add new column
    const addColumn = () => {
        const newCol = {
            id: `col_${Date.now()}`,
            name: 'Cột mới',
            weight: 0,
            maxScore: 10
        };
        setGradeColumns(prev => [...prev, newCol]);
    };

    // Remove column
    const removeColumn = (id) => {
        if (gradeColumns.length <= 1) {
            onMessage?.('Phải có ít nhất 1 cột điểm', 'error');
            return;
        }
        setGradeColumns(prev => prev.filter(col => col.id !== id));
    };

    // Update column
    const updateColumn = (id, field, value) => {
        setGradeColumns(prev => prev.map(col =>
            col.id === id ? { ...col, [field]: value } : col
        ));
    };

    // Calculate total weight
    const totalWeight = gradeColumns.reduce((sum, col) => sum + (parseFloat(col.weight) || 0), 0);
    const isValidWeight = Math.abs(totalWeight - 100) < 0.01;

    // Handle save
    const handleSave = async () => {
        if (gradeConfig.defaultCalculationType === 'weighted' && !isValidWeight) {
            onMessage?.('Tổng trọng số phải bằng 100%', 'error');
            return;
        }

        const configToSave = {
            ...gradeConfig,
            columns: gradeColumns
        };

        const result = await updateSetting(SETTING_KEYS.GRADE_CONFIG, configToSave);
        onMessage?.(
            result.success ? 'Đã lưu cấu hình đánh giá' : 'Không thể lưu cấu hình',
            result.success ? 'success' : 'error'
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Đánh giá</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-300">Cấu hình thang điểm, cách tính và các cột đánh giá</p>
                </div>
            </div>

            {/* Basic Config */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    Cấu hình chung
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Pass Score */}
                    <div className="space-y-2">
                        <Label htmlFor="passScore">Điểm đạt (Pass)</Label>
                        <Input
                            id="passScore"
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            value={gradeConfig.defaultPassScore}
                            onChange={(e) => setGradeConfig(prev => ({
                                ...prev,
                                defaultPassScore: parseFloat(e.target.value) || 5.0
                            }))}
                        />
                    </div>

                    {/* Max Score */}
                    <div className="space-y-2">
                        <Label htmlFor="maxScore">Thang điểm tối đa</Label>
                        <Input
                            id="maxScore"
                            type="number"
                            step="1"
                            min="1"
                            value={gradeConfig.maxTotalScore}
                            onChange={(e) => setGradeConfig(prev => ({
                                ...prev,
                                maxTotalScore: parseFloat(e.target.value) || 10.0
                            }))}
                        />
                    </div>

                    {/* Calculation Type */}
                    <div className="space-y-2">
                        <Label htmlFor="calcType">Cách tính điểm</Label>
                        <Select value={gradeConfig.defaultCalculationType} onValueChange={(val) => setGradeConfig(prev => ({ ...prev, defaultCalculationType: val }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn cách tính" />
                            </SelectTrigger>
                            <SelectContent>
                                {CALCULATION_TYPE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Default Template */}
                    <div className="space-y-2">
                        <Label htmlFor="gradeTemplate">Template mặc định</Label>
                        <Select value={gradeConfig.defaultTemplate} onValueChange={(val) => handleTemplateChange(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn template" />
                            </SelectTrigger>
                            <SelectContent>
                                {GRADE_TEMPLATE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Grade Columns Config */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-indigo-600" />
                        Cột điểm mặc định
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addColumn}
                        className="text-indigo-600"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Thêm cột
                    </Button>
                </div>

                {/* Weight indicator */}
                {gradeConfig.defaultCalculationType === 'weighted' && (
                    <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${isValidWeight
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                        Tổng trọng số: <strong>{totalWeight.toFixed(1)}%</strong>
                        {!isValidWeight && ' (phải bằng 100%)'}
                    </div>
                )}

                {/* Columns Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-slate-300 border-b dark:border-slate-700">
                                <th className="pb-2 font-medium">Tên cột</th>
                                {gradeConfig.defaultCalculationType === 'weighted' && (
                                    <th className="pb-2 font-medium w-28">Trọng số (%)</th>
                                )}
                                <th className="pb-2 font-medium w-28">Điểm tối đa</th>
                                <th className="pb-2 w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {gradeColumns.map((col, idx) => (
                                <tr key={col.id} className="border-b border-gray-100 dark:border-slate-700">
                                    <td className="py-3 pr-3">
                                        <Input
                                            value={col.name}
                                            onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                                            placeholder="Tên cột điểm"
                                        />
                                    </td>
                                    {gradeConfig.defaultCalculationType === 'weighted' && (
                                        <td className="py-3 pr-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={col.weight}
                                                onChange={(e) => updateColumn(col.id, 'weight', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                    )}
                                    <td className="py-3 pr-3">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={col.maxScore}
                                            onChange={(e) => updateColumn(col.id, 'maxScore', parseFloat(e.target.value) || 10)}
                                        />
                                    </td>
                                    <td className="py-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeColumn(col.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {gradeColumns.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-slate-300">
                        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Chưa có cột điểm nào</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addColumn}
                            className="mt-2"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Thêm cột đầu tiên
                        </Button>
                    </div>
                )}
            </Card>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Hướng dẫn</p>
                    <ul className="list-disc list-inside text-blue-600 dark:text-blue-200 space-y-1">
                        <li>Chọn template phù hợp hoặc tùy chỉnh các cột điểm</li>
                        <li>Với cách tính "Trọng số", tổng % phải bằng 100</li>
                        <li>Cấu hình này áp dụng làm mặc định khi tạo khóa học mới</li>
                        <li>Mỗi khóa học có thể tùy chỉnh riêng sau khi tạo</li>
                    </ul>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => {
                        handleTemplateChange(gradeConfig.defaultTemplate);
                    }}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset theo template
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5 mr-2" />
                    )}
                    Lưu cấu hình
                </Button>
            </div>
        </div>
    );
}

export default GradesConfigTab;
