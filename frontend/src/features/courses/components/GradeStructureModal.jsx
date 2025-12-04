/**
 * GradeStructureModal Component - Modal cấu hình cột điểm
 */

import { useEffect } from 'react';
import { 
  X, Plus, Trash2, Loader2, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGradeStructure } from '../hooks';
import { GRADE_TEMPLATES } from '../utils';

export function GradeStructureModal({ isOpen, onClose, course, accessToken }) {
  const {
    loading,
    saving,
    error,
    structures,
    selectedTemplate,
    showAdvanced,
    config,
    totalWeightPercent,
    isWeightValid,
    fetchStructures,
    applyTemplate,
    addColumn,
    removeColumn,
    updateColumn,
    updateConfig,
    saveStructures,
    setShowAdvanced,
    reset
  } = useGradeStructure(accessToken);

  // Khi mở modal -> Tự động chọn template dựa trên category
  useEffect(() => {
    if (isOpen && course?.id) {
      fetchStructures(course.id, course.category);
    } else if (!isOpen) {
      reset();
    }
  }, [isOpen, course?.id, course?.category, fetchStructures, reset]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, saving]);

  // Handle save
  const handleSave = async () => {
    const success = await saveStructures(course.id);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grade-structure-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="grade-structure-modal-title" className="text-lg font-bold text-zinc-900">Cấu hình đánh giá</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                {course?.code} • {course?.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              aria-label="Đóng modal"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-160px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Template Selection */}
              <TemplateSelector 
                selectedTemplate={selectedTemplate}
                onSelect={applyTemplate}
              />

              {/* Config Section */}
              <ConfigSection 
                config={config}
                showAdvanced={showAdvanced}
                onUpdateConfig={updateConfig}
                onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
              />

              {/* Grade Columns List */}
              <GradeColumnsList
                structures={structures}
                config={config}
                onUpdateColumn={updateColumn}
                onRemoveColumn={removeColumn}
                onAddColumn={addColumn}
              />

              {/* Weight Summary */}
              <WeightSummary 
                structures={structures}
                config={config}
                totalWeightPercent={totalWeightPercent}
                isWeightValid={isWeightValid}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-zinc-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || !isWeightValid || structures.length === 0}
            className="bg-linear-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white min-w-[120px] disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Lưu cấu hình
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

/**
 * Template Selector - Chọn loại hình đánh giá
 */
function TemplateSelector({ selectedTemplate, onSelect }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-zinc-800 mb-3">
        Chọn loại hình đánh giá
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {Object.values(GRADE_TEMPLATES).map((template) => {
          const IconComponent = template.Icon;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                selectedTemplate === template.id
                  ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${template.bgColor} flex items-center justify-center mb-2`}>
                <IconComponent className={`w-4 h-4 ${template.iconColor}`} />
              </div>
              <div className={`text-xs font-semibold ${
                selectedTemplate === template.id ? 'text-red-700' : 'text-zinc-700'
              }`}>
                {template.name}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                {template.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Config Section - Thông số đánh giá
 */
function ConfigSection({ config, showAdvanced, onUpdateConfig, onToggleAdvanced }) {
  return (
    <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-700">Thông số đánh giá</h3>
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="text-xs text-zinc-500 hover:text-red-600 transition-colors"
        >
          {showAdvanced ? 'Ẩn nâng cao' : 'Hiện nâng cao'}
        </button>
      </div>
      
      <div className={`grid gap-4 ${showAdvanced ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {/* Thang điểm */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-600">Thang điểm tối đa</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={config.maxTotalScore}
            onChange={(e) => onUpdateConfig('maxTotalScore', parseFloat(e.target.value) || 10)}
            className="text-sm text-center h-9"
          />
        </div>

        {/* Điểm đạt */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-600">Điểm đạt (Pass)</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={config.passScore}
            onChange={(e) => onUpdateConfig('passScore', parseFloat(e.target.value) || 5)}
            className="text-sm text-center h-9"
          />
        </div>

        {/* Cách tính (chỉ hiện khi Advanced) */}
        {showAdvanced && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-600">Cách tính điểm</Label>
            <div className="flex rounded-lg border border-zinc-300 overflow-hidden h-9">
              <button
                type="button"
                onClick={() => onUpdateConfig('calculationType', 'weighted')}
                className={`flex-1 text-xs font-medium transition-colors ${
                  config.calculationType === 'weighted'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Trọng số %
              </button>
              <button
                type="button"
                onClick={() => onUpdateConfig('calculationType', 'sum')}
                className={`flex-1 text-xs font-medium transition-colors border-l ${
                  config.calculationType === 'sum'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Cộng tổng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Grade Columns List - Danh sách cột điểm
 */
function GradeColumnsList({ structures, config, onUpdateColumn, onRemoveColumn, onAddColumn }) {
  const isWeighted = config.calculationType === 'weighted';

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-zinc-700 mb-3">Danh sách cột điểm</h3>

      {/* Table Header */}
      <div className={`grid gap-3 mb-2 px-3 ${isWeighted ? 'grid-cols-12' : 'grid-cols-10'}`}>
        <div className={isWeighted ? 'col-span-5' : 'col-span-5'}>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Tên cột</span>
        </div>
        {isWeighted && (
          <div className="col-span-3 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Trọng số</span>
          </div>
        )}
        <div className={`${isWeighted ? 'col-span-3' : 'col-span-4'} text-center`}>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Điểm max</span>
        </div>
        <div className="col-span-1"></div>
      </div>

      {/* Grade Columns */}
      <div className="space-y-2">
        {structures.map((structure, index) => (
          <div 
            key={index} 
            className={`grid gap-3 items-center p-2.5 bg-white rounded-lg border border-zinc-200 hover:border-red-300 transition-all ${isWeighted ? 'grid-cols-12' : 'grid-cols-10'}`}
          >
            <div className={isWeighted ? 'col-span-5' : 'col-span-5'}>
              <Input
                value={structure.name}
                onChange={(e) => onUpdateColumn(index, 'name', e.target.value)}
                placeholder="VD: Giữa kỳ..."
                className="text-sm h-9"
              />
            </div>
            {isWeighted && (
              <div className="col-span-3">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round((structure.weight || 0) * 100)}
                    onChange={(e) => onUpdateColumn(index, 'weight', e.target.value)}
                    className="text-sm text-center pr-7 h-9"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
                </div>
              </div>
            )}
            <div className={isWeighted ? 'col-span-3' : 'col-span-4'}>
              <Input
                type="number"
                min="0"
                value={structure.max_score}
                onChange={(e) => onUpdateColumn(index, 'max_score', e.target.value)}
                className="text-sm text-center h-9"
              />
            </div>
            <div className="col-span-1 flex justify-center">
              <button
                type="button"
                onClick={() => onRemoveColumn(index)}
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {structures.length === 0 && (
          <div className="text-center py-6 text-zinc-400 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
            <p className="text-sm">Chọn loại hình đánh giá ở trên để tự động điền</p>
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={onAddColumn}
        className="w-full mt-3 py-2 border-2 border-dashed border-zinc-300 rounded-lg text-sm font-medium text-zinc-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Thêm cột điểm
      </button>
    </div>
  );
}

/**
 * Weight Summary - Tổng kết trọng số
 */
function WeightSummary({ structures, config, totalWeightPercent, isWeightValid }) {
  if (structures.length === 0) return null;

  // Mode Weighted
  if (config.calculationType === 'weighted') {
    return (
      <div className={`p-3 rounded-lg flex items-center justify-between ${
        isWeightValid 
          ? 'bg-emerald-50 border border-emerald-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            isWeightValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {totalWeightPercent}%
          </div>
          <span className={`text-sm font-medium ${isWeightValid ? 'text-emerald-700' : 'text-red-700'}`}>
            {isWeightValid ? 'Tổng trọng số hợp lệ' : `Thiếu ${100 - totalWeightPercent}% nữa`}
          </span>
        </div>
        {isWeightValid ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
      </div>
    );
  }

  // Mode Sum
  const totalMaxScore = structures.reduce((sum, s) => sum + (parseFloat(s.max_score) || 0), 0);
  
  return (
    <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-orange-100 text-orange-700">
          Σ
        </div>
        <div>
          <span className="text-sm font-medium text-orange-700">
            Tổng điểm: {totalMaxScore}
          </span>
          <p className="text-xs text-orange-600">
            {structures.map(s => s.name || '?').join(' + ')}
          </p>
        </div>
      </div>
      <CheckCircle2 className="w-5 h-5 text-orange-500" />
    </div>
  );
}

export default GradeStructureModal;
