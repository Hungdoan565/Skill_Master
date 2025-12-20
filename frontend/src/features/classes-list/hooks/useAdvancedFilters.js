/**
 * useAdvancedFilters Hook
 * Manages advanced filter state, presets, and localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'skill_master_class_filters';
const SAVED_FILTERS_KEY = 'skill_master_saved_class_filters';

// Default filter state
const DEFAULT_FILTERS = {
    search: '',
    status: '',
    courseId: '',
    teacherId: '',
    centerId: '',
    dateStart: '',
    dateEnd: '',
    capacity: 'all',
    smartFilter: ''
};

/**
 * Hook to manage advanced filters with localStorage persistence
 */
export function useAdvancedFilters() {
    // Initialize from localStorage if available
    const [filters, setFilters] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? { ...DEFAULT_FILTERS, ...JSON.parse(stored) } : DEFAULT_FILTERS;
        } catch {
            return DEFAULT_FILTERS;
        }
    });

    // Saved filter presets
    const [savedFilters, setSavedFilters] = useState(() => {
        try {
            const stored = localStorage.getItem(SAVED_FILTERS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist filters to localStorage when changed
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
        } catch (error) {
            console.error('Error saving filters to localStorage:', error);
        }
    }, [filters]);

    // Persist saved filters to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters));
        } catch (error) {
            console.error('Error saving filter presets to localStorage:', error);
        }
    }, [savedFilters]);

    // Update a single filter
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Update multiple filters at once
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Reset all filters
    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    // Remove a specific filter
    const removeFilter = useCallback((key) => {
        setFilters(prev => ({
            ...prev,
            [key]: key === 'capacity' ? 'all' : ''
        }));
    }, []);

    // Save current filters as a preset
    const saveFilterPreset = useCallback((name, filtersToSave = filters) => {
        setSavedFilters(prev => {
            // Remove existing preset with same name
            const filtered = prev.filter(f => f.name !== name);
            return [...filtered, { name, filters: filtersToSave, createdAt: new Date().toISOString() }];
        });
    }, [filters]);

    // Load a saved filter preset
    const loadFilterPreset = useCallback((presetFilters) => {
        setFilters(prev => ({ ...prev, ...presetFilters }));
    }, []);

    // Delete a saved filter preset
    const deleteFilterPreset = useCallback((index) => {
        setSavedFilters(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Count active filters (excluding search and default values)
    const getActiveFilterCount = useCallback(() => {
        let count = 0;
        if (filters.status) count++;
        if (filters.courseId) count++;
        if (filters.teacherId) count++;
        if (filters.centerId) count++;
        if (filters.dateStart) count++;
        if (filters.dateEnd) count++;
        if (filters.capacity && filters.capacity !== 'all') count++;
        return count;
    }, [filters]);

    // Check if any filter is active
    const hasActiveFilters = useCallback(() => {
        return getActiveFilterCount() > 0;
    }, [getActiveFilterCount]);

    return {
        filters,
        savedFilters,
        updateFilter,
        updateFilters,
        resetFilters,
        removeFilter,
        saveFilterPreset,
        loadFilterPreset,
        deleteFilterPreset,
        getActiveFilterCount,
        hasActiveFilters
    };
}

export default useAdvancedFilters;
