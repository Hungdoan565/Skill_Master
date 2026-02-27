/**
 * CenterSelector Component
 * Dropdown chọn trung tâm cho SUPER_ADMIN
 */

import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { API_URL } from '../utils';

export function CenterSelector({
    selectedCenterId,
    onCenterChange,
    accessToken,
    showAllOption = true
}) {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch centers on mount
    useEffect(() => {
        const fetchCenters = async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/centers`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                const data = await res.json();
                if (data.success) {
                    setCenters(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching centers:', error);
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchCenters();
        }
    }, [accessToken]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCenter = centers.find(c => c.id === selectedCenterId);
    const displayName = selectedCenter?.name || 'Tất cả trung tâm';

    if (loading) {
        return (
            <div className="animate-pulse h-10 w-48 bg-muted rounded-lg" />
        );
    }

    if (centers.length === 0) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted hover:border-border transition-colors min-w-[180px]"
            >
                <Building2 size={16} className="text-muted-foreground" />
                <span className="flex-1 text-left truncate">{displayName}</span>
                <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-64 bg-card border border-border rounded-xl shadow-lg py-1 max-h-64 overflow-auto">
                    {showAllOption && (
                        <button
                            onClick={() => {
                                onCenterChange(null);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${!selectedCenterId ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'text-foreground'
                                }`}
                        >
                            <Building2 size={16} className={!selectedCenterId ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'} />
                            <span className="flex-1 text-left">Tất cả trung tâm</span>
                            {!selectedCenterId && <Check size={16} className="text-orange-500 dark:text-orange-400" />}
                        </button>
                    )}

                    <div className="border-t border-border my-1" />

                    {centers.map((center) => (
                        <button
                            key={center.id}
                            onClick={() => {
                                onCenterChange(center.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${selectedCenterId === center.id ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'text-foreground'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${selectedCenterId === center.id ? 'bg-orange-500 dark:bg-orange-400' : 'bg-muted-foreground/30'
                                }`} />
                            <span className="flex-1 text-left truncate">{center.name}</span>
                            {selectedCenterId === center.id && <Check size={16} className="text-orange-500 dark:text-orange-400" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CenterSelector;
