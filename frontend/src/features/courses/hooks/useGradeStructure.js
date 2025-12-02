/**
 * useGradeStructure Hook - Quản lý cấu hình cột điểm
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  API_URL, 
  GRADE_TEMPLATES, 
  DEFAULT_GRADE_CONFIG,
  getTemplateByCategory 
} from '../utils';

/**
 * Hook quản lý cấu trúc điểm của khóa học
 * @param {string} accessToken - Token xác thực
 */
export function useGradeStructure(accessToken) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [structures, setStructures] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('programming');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState({ ...DEFAULT_GRADE_CONFIG });

  // Tính tổng trọng số
  const totalWeight = structures.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
  const totalWeightPercent = Math.round(totalWeight * 100);
  const isWeightValid = config.calculationType === 'sum' || totalWeightPercent === 100;

  // Áp dụng template
  const applyTemplate = useCallback((templateKey) => {
    const template = GRADE_TEMPLATES[templateKey];
    if (!template) return;
    
    setSelectedTemplate(templateKey);
    if (templateKey !== 'custom') {
      setConfig({ ...template.config });
      setStructures(template.structures.map(t => ({ ...t })));
      setShowAdvanced(false);
    } else {
      setShowAdvanced(true);
    }
    setError('');
  }, []);

  // Fetch cấu trúc điểm từ API
  const fetchStructures = useCallback(async (courseId, category) => {
    if (!courseId) return;

    const defaultTemplate = getTemplateByCategory(category);
    setSelectedTemplate(defaultTemplate);

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(
        `${API_URL}/api/courses/${courseId}/grade-structures`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      if (response.data?.success && response.data.data.length > 0) {
        // Đã có cấu hình -> Load từ DB
        setStructures(response.data.data.map(s => ({
          ...s,
          weight: parseFloat(s.weight) || 0
        })));
        
        if (response.data.config) {
          setConfig({
            calculationType: response.data.config.calculationType || 'weighted',
            passScore: response.data.config.passScore || 5.0,
            maxTotalScore: response.data.config.maxTotalScore || 10.0
          });
        }
        setSelectedTemplate('custom'); // Đã có data -> hiện custom
      } else {
        // Chưa có -> Áp dụng template gợi ý
        applyTemplate(defaultTemplate);
      }
    } catch (err) {
      console.error('Error fetching grade structures:', err);
      // Nếu lỗi -> Áp dụng template mặc định
      applyTemplate(defaultTemplate);
    } finally {
      setLoading(false);
    }
  }, [accessToken, applyTemplate]);

  // Thêm cột điểm mới
  const addColumn = useCallback(() => {
    setStructures(prev => [
      ...prev,
      { name: '', weight: 0, max_score: 10, isNew: true }
    ]);
    setSelectedTemplate('custom');
  }, []);

  // Xóa cột điểm
  const removeColumn = useCallback((index) => {
    setStructures(prev => prev.filter((_, i) => i !== index));
    setSelectedTemplate('custom');
  }, []);

  // Cập nhật cột điểm
  const updateColumn = useCallback((index, field, value) => {
    setStructures(prev => {
      const updated = [...prev];
      if (field === 'weight') {
        updated[index][field] = parseFloat(value) / 100 || 0;
      } else if (field === 'max_score') {
        updated[index][field] = parseFloat(value) || 10;
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
    setSelectedTemplate('custom');
  }, []);

  // Cập nhật config
  const updateConfig = useCallback((field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSelectedTemplate('custom');
  }, []);

  // Lưu cấu trúc
  const saveStructures = useCallback(async (courseId) => {
    // Validate
    if (structures.length === 0) {
      setError('Vui lòng thêm ít nhất 1 cột điểm');
      return false;
    }

    const emptyNames = structures.some(s => !s.name.trim());
    if (emptyNames) {
      setError('Tên cột điểm không được để trống');
      return false;
    }

    if (config.calculationType === 'weighted' && Math.abs(totalWeight - 1) > 0.01) {
      setError(`Tổng trọng số phải bằng 100%. Hiện tại: ${totalWeightPercent}%`);
      return false;
    }

    try {
      setSaving(true);
      setError('');

      const response = await axios.put(
        `${API_URL}/api/courses/${courseId}/grade-structures`,
        { structures, config },
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      return response.data?.success || false;
    } catch (err) {
      console.error('Error saving grade structures:', err);
      setError(err.response?.data?.message || 'Không thể lưu cấu trúc điểm');
      return false;
    } finally {
      setSaving(false);
    }
  }, [accessToken, structures, config, totalWeight, totalWeightPercent]);

  // Reset state
  const reset = useCallback(() => {
    setStructures([]);
    setSelectedTemplate('programming');
    setConfig({ ...DEFAULT_GRADE_CONFIG });
    setShowAdvanced(false);
    setError('');
  }, []);

  return {
    // State
    loading,
    saving,
    error,
    structures,
    selectedTemplate,
    showAdvanced,
    config,
    totalWeight,
    totalWeightPercent,
    isWeightValid,
    
    // Actions
    fetchStructures,
    applyTemplate,
    addColumn,
    removeColumn,
    updateColumn,
    updateConfig,
    saveStructures,
    setShowAdvanced,
    setError,
    reset
  };
}

export default useGradeStructure;
